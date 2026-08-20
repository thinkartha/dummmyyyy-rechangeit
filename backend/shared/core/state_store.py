"""ETL runtime-state persistence — DynamoDB-backed, with in-memory fallback.

Persists the two things that don't self-heal on restart:
  * seen-execution dedup keys — so already-ingested runs aren't re-emitted as new incidents.
  * per-platform health/status — so status survives a restart instead of blanking until the
    next poll.

Run history itself is NOT stored here — the pollers re-fetch recent runs each cycle.

Env-gated on PINGHOLD_ETL_STATE_TABLE (PK `pk`, SK `sk`). Seen keys are written with a `ttl`
epoch so the table self-prunes past the poll lookback window — configure DynamoDB TTL on the
`ttl` attribute. Without the table (local/tests) state lives in a dict.
"""

from __future__ import annotations

import logging
import os
import time

log = logging.getLogger("pinghold.state_store")

_TABLE_NAME = os.getenv("PINGHOLD_ETL_STATE_TABLE")
_disabled = _TABLE_NAME is None
_mem: dict[tuple[str, str], str] = {}  # (pk, sk) -> value (seen marker "1" or health json)
_table = None

SEEN_TTL_SECONDS = 2 * 24 * 3600  # > the poll lookback window (Talend ~1d / Boomi ~24h)


def _get_table():
    global _disabled, _table
    if _disabled:
        return None
    if _table is not None:
        return _table
    try:
        import boto3

        _table = boto3.resource("dynamodb").Table(_TABLE_NAME)
        log.info("DynamoDB ETL state store enabled (table=%s)", _TABLE_NAME)
        return _table
    except Exception as exc:  # pragma: no cover - depends on AWS
        log.warning("DynamoDB unavailable (%s); ETL state store falling back to in-memory", exc)
        _disabled = True
        return None


# --- seen-execution dedup ---------------------------------------------------

def _seen_sk(platform: str, execution_id: str) -> str:
    return f"seen#{platform}#{execution_id}"


def is_seen(tenant_id: str, platform: str, execution_id: str) -> bool:
    sk = _seen_sk(platform, execution_id)
    table = _get_table()
    if not table:
        return (tenant_id, sk) in _mem
    try:
        return "Item" in table.get_item(Key={"pk": tenant_id, "sk": sk})
    except Exception as exc:  # pragma: no cover
        log.warning("is_seen failed: %s", exc)
        return False


def mark_seen(tenant_id: str, platform: str, execution_id: str) -> None:
    sk = _seen_sk(platform, execution_id)
    table = _get_table()
    if not table:
        _mem[(tenant_id, sk)] = "1"
        return
    try:
        table.put_item(Item={"pk": tenant_id, "sk": sk, "ttl": int(time.time()) + SEEN_TTL_SECONDS})
    except Exception as exc:  # pragma: no cover
        log.warning("mark_seen failed: %s", exc)


# --- per-platform health ----------------------------------------------------

def save_health(tenant_id: str, platform: str, health_json: str) -> None:
    table = _get_table()
    if not table:
        _mem[(tenant_id, f"health#{platform}")] = health_json
        return
    try:
        table.put_item(Item={"pk": tenant_id, "sk": f"health#{platform}", "health": health_json})
    except Exception as exc:  # pragma: no cover
        log.warning("save_health failed: %s", exc)


def load_health(tenant_id: str) -> dict[str, str]:
    """Return {platform: health_json} for a tenant. Used to hydrate memory on first access."""
    table = _get_table()
    if not table:
        return {
            k[1].removeprefix("health#"): v
            for k, v in _mem.items()
            if k[0] == tenant_id and k[1].startswith("health#")
        }
    try:
        from boto3.dynamodb.conditions import Key

        resp = table.query(
            KeyConditionExpression=Key("pk").eq(tenant_id) & Key("sk").begins_with("health#")
        )
        return {i["sk"].removeprefix("health#"): i["health"] for i in resp.get("Items", [])}
    except Exception as exc:  # pragma: no cover
        log.warning("load_health failed: %s", exc)
        return {}


# --- executions / re-runs (user-triggered launches; not re-fetched by pollers) -----

def save_execution(tenant_id: str, created_at: str, execution_id: str, exec_json: str) -> None:
    # SK sorts by created_at so a descending query returns newest-first.
    sk = f"exec#{created_at}#{execution_id}"
    table = _get_table()
    if not table:
        _mem[(tenant_id, sk)] = exec_json
        return
    try:
        table.put_item(Item={"pk": tenant_id, "sk": sk, "data": exec_json})
    except Exception as exc:  # pragma: no cover
        log.warning("save_execution failed: %s", exc)


def load_executions(tenant_id: str, limit: int = 50) -> list[str]:
    """Return up to `limit` execution JSON strings, newest first."""
    table = _get_table()
    if not table:
        rows = sorted(
            (k[1], v) for k, v in _mem.items() if k[0] == tenant_id and k[1].startswith("exec#")
        )
        return [v for _, v in rows[::-1][:limit]]
    try:
        from boto3.dynamodb.conditions import Key

        resp = table.query(
            KeyConditionExpression=Key("pk").eq(tenant_id) & Key("sk").begins_with("exec#"),
            ScanIndexForward=False,
            Limit=limit,
        )
        return [i["data"] for i in resp.get("Items", [])]
    except Exception as exc:  # pragma: no cover
        log.warning("load_executions failed: %s", exc)
        return []

"""Integration-config persistence — DynamoDB-backed, with in-memory fallback.

Stores per-tenant connector configs (Talend, Dell Boomi, ...) so credentials survive restarts.
Env-gated on PINGHOLD_INTEGRATIONS_TABLE; AWS creds via boto3's default chain. Without the table
(local dev / tests) it keeps configs in a dict, matching the previous in-memory-only behavior.

Configs are stored as JSON strings (the callers own the schema via their pydantic models).
DynamoDB encrypts items at rest by default; for field-level secret encryption add KMS/Secrets
Manager — ponytail: not built until plaintext-at-rest is ruled insufficient.
"""

from __future__ import annotations

import logging
import os

log = logging.getLogger("pinghold.config_store")

_TABLE_NAME = os.getenv("PINGHOLD_INTEGRATIONS_TABLE")
_disabled = _TABLE_NAME is None
_mem: dict[tuple[str, str], str] = {}  # (tenant_id, integration) -> config json
_table = None


def _get_table():
    global _disabled, _table
    if _disabled:
        return None
    if _table is not None:
        return _table
    try:
        import boto3

        _table = boto3.resource("dynamodb").Table(_TABLE_NAME)
        log.info("DynamoDB integration store enabled (table=%s)", _TABLE_NAME)
        return _table
    except Exception as exc:  # pragma: no cover - depends on AWS
        log.warning("DynamoDB unavailable (%s); integration store falling back to in-memory", exc)
        _disabled = True
        return None


def save_config(tenant_id: str, integration: str, config_json: str) -> bool:
    table = _get_table()
    if not table:
        _mem[(tenant_id, integration)] = config_json
        return True
    try:
        table.put_item(Item={"tenant_id": tenant_id, "integration": integration, "config": config_json})
        return True
    except Exception as exc:  # pragma: no cover
        log.warning("save_config failed (%s/%s): %s", tenant_id, integration, exc)
        return False


def list_tenants() -> list[str]:
    """Distinct tenant_ids that have any saved integration config — used to auto-start pollers."""
    table = _get_table()
    if not table:
        return sorted({tenant for tenant, _ in _mem})
    try:
        # ponytail: full scan; fine at expected tenant counts. Add a GSI if the table grows large.
        tenants: set[str] = set()
        kwargs: dict = {"ProjectionExpression": "tenant_id"}
        while True:
            resp = table.scan(**kwargs)
            tenants.update(i["tenant_id"] for i in resp.get("Items", []))
            if "LastEvaluatedKey" not in resp:
                break
            kwargs["ExclusiveStartKey"] = resp["LastEvaluatedKey"]
        return sorted(tenants)
    except Exception as exc:  # pragma: no cover
        log.warning("list_tenants failed: %s", exc)
        return []


def get_config(tenant_id: str, integration: str) -> str | None:
    table = _get_table()
    if not table:
        return _mem.get((tenant_id, integration))
    try:
        item = table.get_item(Key={"tenant_id": tenant_id, "integration": integration}).get("Item")
        return item.get("config") if item else None
    except Exception as exc:  # pragma: no cover
        log.warning("get_config failed (%s/%s): %s", tenant_id, integration, exc)
        return None

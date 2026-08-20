"""Append-only, tenant-scoped, time-ordered record streams — DynamoDB with an in-memory
fallback, mirroring config_store's shape.

This exists because two stores that the product depends on were process-local deques:
custom AI model inferences (core/ai_models) and the recent-events buffer that alert
clustering reads (collector/ingest). On Lambda a deque is per-execution-environment, so
history vanished at every cold start and two concurrent invocations disagreed about what
had happened. Neither is a cache — they are the data.

Key design: hash on tenant_id, range on "<stream>#<iso timestamp>#<uuid>". That makes
"the last N of a stream" and "everything in a stream since T" both single range queries
rather than a scan-and-filter, which is what keeps the 7-day window on a busy tenant from
reading the whole table. Records expire via DynamoDB TTL; nothing prunes them by hand.
"""

from __future__ import annotations

import hashlib
import json
import logging
import os
import time
import uuid
from collections import defaultdict, deque
from datetime import datetime, timezone
from typing import Any, Deque

log = logging.getLogger("pinghold.record_store")

_TABLE_NAME = os.getenv("PINGHOLD_RECORDS_TABLE")
_disabled = _TABLE_NAME is None
_table = None

# Retention for anything written here. Long enough for the 30-day windows the UI offers,
# short enough that the table does not grow without bound.
RETENTION_SECONDS = 30 * 24 * 3600

# Cap on a single read, so one enormous tenant cannot turn a dashboard request into a
# multi-megabyte query.
MAX_READ = 5000

# Fallback store: same per-(tenant, stream) shape, bounded so a long-running local
# process cannot exhaust memory.
_MEM_MAX = 5000
_mem: dict[tuple[str, str], Deque[tuple[str, dict[str, Any]]]] = defaultdict(
    lambda: deque(maxlen=_MEM_MAX)
)


class StorageUnavailable(RuntimeError):
    """A write that required DynamoDB could not be persisted durably."""


def configured() -> bool:
    """Whether this process was configured with the deployed DynamoDB table."""
    return bool(_TABLE_NAME)


def health() -> tuple[bool, str | None]:
    """Probe the configured DynamoDB table; local memory mode is always available."""
    if not configured():
        return True, None
    table = _get_table()
    if table is None:
        return False, f"DynamoDB record table {_TABLE_NAME!r} is unavailable"
    try:
        table.load()
        return True, None
    except Exception as exc:  # pragma: no cover - depends on AWS
        log.warning("DynamoDB health probe failed: %s", exc)
        return False, str(exc)


def _get_table():
    global _disabled, _table
    if _disabled:
        return None
    if _table is not None:
        return _table
    try:
        import boto3

        _table = boto3.resource("dynamodb").Table(_TABLE_NAME)
        log.info("DynamoDB record store enabled (table=%s)", _TABLE_NAME)
        return _table
    except Exception as exc:  # pragma: no cover - depends on AWS
        log.warning("DynamoDB unavailable (%s); record store falling back to in-memory", exc)
        _disabled = True
        return None


def _iso(moment: datetime) -> str:
    """Sortable, fixed-width, UTC. The range key is compared as a string, so the format
    has to sort the same way the instants do."""
    return moment.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%fZ")


def _sort_key(stream: str, moment: datetime, record_id: str | None = None) -> str:
    # A caller-supplied id makes retries idempotent. Generic records retain a random
    # suffix so two writes in the same microsecond cannot collide.
    suffix = (
        hashlib.sha256(record_id.encode("utf-8")).hexdigest()[:16]
        if record_id
        else uuid.uuid4().hex[:8]
    )
    return f"{stream}#{_iso(moment)}#{suffix}"


def append(
    tenant_id: str,
    stream: str,
    payload: dict[str, Any],
    moment: datetime | None = None,
    *,
    record_id: str | None = None,
    require_durable: bool = False,
) -> bool:
    """Add one record.

    Ordinary callers keep the historical best-effort behavior. Telemetry ingestion sets
    ``require_durable`` so an AWS request is acknowledged only after DynamoDB accepts it;
    there is no reliable Lambda shutdown hook where buffered data could be flushed later.
    """
    moment = moment or datetime.now(timezone.utc)
    key = _sort_key(stream, moment, record_id)

    table = _get_table()
    if not table:
        if require_durable and configured():
            raise StorageUnavailable(f"DynamoDB record table {_TABLE_NAME!r} is unavailable")
        _mem[(tenant_id, stream)].append((key, payload))
        return True
    try:
        table.put_item(Item={
            "tenant_id": tenant_id,
            "sk": key,
            "stream": stream,
            # One JSON blob rather than mapped attributes: callers own their schema, and
            # DynamoDB has no float type (it would reject latency_ms as a Python float).
            "payload": json.dumps(payload, default=str),
            "expires_at": int(time.time()) + RETENTION_SECONDS,
        })
        return True
    except Exception as exc:  # pragma: no cover - depends on AWS
        log.warning("record append failed (%s/%s): %s", tenant_id, stream, exc)
        if require_durable:
            raise StorageUnavailable("DynamoDB rejected the telemetry write") from exc
        return False


def append_many(tenant_id: str, stream: str, payloads: list[dict[str, Any]]) -> int:
    table = _get_table()
    if not table:
        for payload in payloads:
            append(tenant_id, stream, payload)
        return len(payloads)
    try:
        now = datetime.now(timezone.utc)
        expires = int(time.time()) + RETENTION_SECONDS
        with table.batch_writer() as batch:
            for payload in payloads:
                batch.put_item(Item={
                    "tenant_id": tenant_id,
                    "sk": _sort_key(stream, now),
                    "stream": stream,
                    "payload": json.dumps(payload, default=str),
                    "expires_at": expires,
                })
    except Exception as exc:  # pragma: no cover - depends on AWS
        log.warning("record batch append failed (%s/%s): %s", tenant_id, stream, exc)
    return len(payloads)


def _query(
    tenant_id: str,
    stream: str,
    since: datetime | None,
    limit: int,
    newest_first: bool,
    require_durable: bool,
):
    table = _get_table()
    if not table:
        if require_durable and configured():
            raise StorageUnavailable(f"DynamoDB record table {_TABLE_NAME!r} is unavailable")
        items = [payload for key, payload in _mem.get((tenant_id, stream), ())
                 if since is None or key >= f"{stream}#{_iso(since)}"]
        if newest_first:
            items = list(reversed(items))
        return items[:limit]

    # "#" is the separator and sorts below every character the timestamp can contain, so
    # the upper bound "<stream>#~" is past every key in this stream and short of the next.
    low = f"{stream}#{_iso(since)}" if since else f"{stream}#"
    try:
        from boto3.dynamodb.conditions import Key

        results: list[dict[str, Any]] = []
        kwargs: dict[str, Any] = {
            "KeyConditionExpression": Key("tenant_id").eq(tenant_id) & Key("sk").between(low, f"{stream}#~"),
            "ScanIndexForward": not newest_first,
            "Limit": min(limit, MAX_READ),
        }
        while True:
            resp = table.query(**kwargs)
            results.extend(json.loads(i["payload"]) for i in resp.get("Items", []))
            if "LastEvaluatedKey" not in resp or len(results) >= min(limit, MAX_READ):
                break
            kwargs["ExclusiveStartKey"] = resp["LastEvaluatedKey"]
        return results[:limit]
    except Exception as exc:  # pragma: no cover - depends on AWS
        log.warning("record query failed (%s/%s): %s", tenant_id, stream, exc)
        if require_durable:
            raise StorageUnavailable("DynamoDB rejected the telemetry query") from exc
        return []


def recent(
    tenant_id: str,
    stream: str,
    limit: int = 50,
    *,
    require_durable: bool = False,
) -> list[dict[str, Any]]:
    """The most recent records, newest first."""
    return _query(
        tenant_id,
        stream,
        None,
        limit,
        newest_first=True,
        require_durable=require_durable,
    )


def window(tenant_id: str, stream: str, since: datetime | None = None,
           limit: int = MAX_READ, *, require_durable: bool = False) -> list[dict[str, Any]]:
    """Everything in the stream since `since`, oldest first — the shape aggregations want."""
    return _query(
        tenant_id,
        stream,
        since,
        limit,
        newest_first=False,
        require_durable=require_durable,
    )


def clear(tenant_id: str, stream: str) -> int:
    """Drop a tenant's stream. Used by tests and by the ai-models reset path."""
    table = _get_table()
    if not table:
        existing = _mem.pop((tenant_id, stream), None)
        return len(existing or ())
    try:
        from boto3.dynamodb.conditions import Key

        deleted = 0
        resp = table.query(
            KeyConditionExpression=Key("tenant_id").eq(tenant_id) & Key("sk").between(f"{stream}#", f"{stream}#~"),
            ProjectionExpression="tenant_id, sk",
        )
        with table.batch_writer() as batch:
            for item in resp.get("Items", []):
                batch.delete_item(Key={"tenant_id": item["tenant_id"], "sk": item["sk"]})
                deleted += 1
        return deleted
    except Exception as exc:  # pragma: no cover - depends on AWS
        log.warning("record clear failed (%s/%s): %s", tenant_id, stream, exc)
        return 0

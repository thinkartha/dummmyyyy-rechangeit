"""Join request store.

When a user signs up to join an existing org, a pending join request is created.
Org admins (and platform admins) can list/approve/deny these requests. When approved,
the user record is updated with the org and role and the request is removed.
"""

from __future__ import annotations

import logging
import os
import time

log = logging.getLogger("pinghold.join_requests")

_TABLE_NAME = os.getenv("PINGHOLD_JOIN_REQUESTS_TABLE")
_disabled = _TABLE_NAME is None
_mem: dict[str, dict] = {}
_table = None


def _key(email: str, org_id: str) -> str:
    return f"{email}#{org_id}"


def _get_table():
    """Return a cached boto3 Table, or None if disabled/unreachable."""
    global _disabled, _table
    if _disabled:
        return None
    if _table is not None:
        return _table
    try:
        import boto3

        _table = boto3.resource("dynamodb").Table(_TABLE_NAME)
        log.info("DynamoDB join request store enabled (table=%s)", _TABLE_NAME)
        return _table
    except Exception as exc:  # pragma: no cover - depends on AWS
        log.warning("DynamoDB unavailable (%s); join request store falling back to in-memory", exc)
        _disabled = True
        return None


def create_join_request(email: str, org_id: str, name: str | None = None) -> dict:
    requested_at = str(time.time())
    item = {
        "email": email,
        "org_id": org_id,
        "name": name or email,
        "status": "pending",
        "requested_at": requested_at,
        "created_at": requested_at,
    }
    table = _get_table()
    if not table:
        _mem[_key(email, org_id)] = item
        return item
    try:
        table.put_item(Item=item)
        return item
    except Exception:
        # The caller tells the user "request submitted, await approval" and ignores this
        # return, so swallowing the failure means the admin never sees the request.
        log.exception("create_join_request failed for %s/%s", email, org_id)
        raise


def get_join_request(email: str, org_id: str) -> dict | None:
    table = _get_table()
    if not table:
        return _mem.get(_key(email, org_id))
    try:
        return table.get_item(Key={"email": email, "org_id": org_id}).get("Item")
    except Exception as exc:  # pragma: no cover
        log.warning("get_join_request failed: %s", exc)
        return None


def list_join_requests_for_org(org_id: str) -> list[dict]:
    table = _get_table()
    if not table:
        return [r for r in _mem.values() if r.get("org_id") == org_id and r.get("status") == "pending"]
    try:
        result = table.query(
            IndexName="org-index",
            KeyConditionExpression="org_id = :o",
            FilterExpression="#status = :s",
            ExpressionAttributeNames={"#status": "status"},
            ExpressionAttributeValues={":o": org_id, ":s": "pending"},
        )
        return result.get("Items", [])
    except Exception as exc:  # pragma: no cover
        log.warning("list_join_requests_for_org failed: %s", exc)
        return []


def list_all_join_requests() -> list[dict]:
    """Return every pending join request."""
    table = _get_table()
    if not table:
        return [r for r in _mem.values() if r.get("status") == "pending"]
    try:
        result = table.scan(FilterExpression="#status = :s", ExpressionAttributeNames={"#status": "status"}, ExpressionAttributeValues={":s": "pending"})
        return result.get("Items", [])
    except Exception as exc:  # pragma: no cover
        log.warning("list_all_join_requests failed: %s", exc)
        return []


def update_status(email: str, org_id: str, status: str) -> bool:
    if status not in {"pending", "approved", "denied"}:
        return False
    table = _get_table()
    if not table:
        key = _key(email, org_id)
        if key in _mem:
            _mem[key]["status"] = status
            return True
        return False
    try:
        table.update_item(
            Key={"email": email, "org_id": org_id},
            UpdateExpression="SET #status = :s",
            ExpressionAttributeNames={"#status": "status"},
            ExpressionAttributeValues={":s": status},
        )
        return True
    except Exception as exc:  # pragma: no cover
        log.warning("update_status failed: %s", exc)
        return False


def delete_join_request(email: str, org_id: str) -> bool:
    table = _get_table()
    if not table:
        key = _key(email, org_id)
        return _mem.pop(key, None) is not None
    try:
        table.delete_item(Key={"email": email, "org_id": org_id})
        return True
    except Exception as exc:  # pragma: no cover
        log.warning("delete_join_request failed: %s", exc)
        return False

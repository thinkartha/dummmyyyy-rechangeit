"""Invite token store.

Invite tokens are short signed JWTs (default 24 hours). They are also persisted to
DynamoDB (InvitesTable) with an email/org_id key so an admin can see outstanding
invites and so a token can be revoked before expiration.
"""

from __future__ import annotations

import logging
import os
import time
import uuid

import jwt

log = logging.getLogger("pinghold.invites")

_INVITE_SECRET = os.getenv("PINGHOLD_INVITE_SECRET") or os.getenv("PINGHOLD_JWT_SECRET") or "dev-insecure-secret"
_INVITE_ALG = "HS256"
_INVITE_TTL_SECONDS = int(os.getenv("PINGHOLD_INVITE_TTL_SECONDS", "86400"))

_TABLE_NAME = os.getenv("PINGHOLD_INVITES_TABLE")
_disabled = _TABLE_NAME is None
_mem: dict[str, dict] = {}
_table = None


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
        log.info("DynamoDB invites store enabled (table=%s)", _TABLE_NAME)
        return _table
    except Exception as exc:  # pragma: no cover - depends on AWS
        log.warning("DynamoDB unavailable (%s); invites store falling back to in-memory", exc)
        _disabled = True
        return None


def create_invite(email: str, org_id: str, role: str = "user", ttl_seconds: int | None = None) -> str:
    """Create and return an invite token. The token is a signed JWT with 24h expiry."""
    ttl = ttl_seconds or _INVITE_TTL_SECONDS
    now = int(time.time())
    payload = {
        "sub": email,
        "email": email,
        "org_id": org_id,
        "role": role,
        "jti": uuid.uuid4().hex,
        "iat": now,
        "exp": now + ttl,
    }
    token = jwt.encode(payload, _INVITE_SECRET, algorithm=_INVITE_ALG)
    item = {
        "email": email,
        "org_id": org_id,
        "role": role,
        "token": token,
        "status": "pending",
        "created_at": str(now),
        "expires_at": str(now + ttl),
        "jti": payload["jti"],
    }
    table = _get_table()
    if not table:
        _mem[email] = item
    else:
        try:
            table.put_item(Item=item)
        except Exception:
            # Returning the token anyway hands out an invite with no stored record —
            # it looks valid to the recipient and can never be redeemed.
            log.exception("create_invite failed for %s", email)
            raise
    return token


def get_invite(token: str) -> dict | None:
    """Validate the invite JWT and return the stored invite record."""
    try:
        payload = jwt.decode(token, _INVITE_SECRET, algorithms=[_INVITE_ALG])
    except jwt.PyJWTError:
        return None

    email = payload.get("email") or payload.get("sub")
    org_id = payload.get("org_id")
    if not email or not org_id:
        return None

    table = _get_table()
    if not table:
        item = _mem.get(email)
        if item and item.get("token") == token and item.get("status") == "pending":
            return item
        return None
    try:
        item = table.get_item(Key={"email": email}).get("Item")
        if item and item.get("token") == token and item.get("status") == "pending":
            return item
        return None
    except Exception as exc:  # pragma: no cover
        log.warning("get_invite failed: %s", exc)
        return None


def mark_used(token: str) -> bool:
    """Mark an invite as used so it cannot be reused."""
    invite = get_invite(token)
    if not invite:
        return False
    email = invite["email"]
    table = _get_table()
    if not table:
        if email in _mem:
            _mem[email]["status"] = "used"
            return True
        return False
    try:
        table.update_item(
            Key={"email": email},
            UpdateExpression="SET #status = :s",
            ExpressionAttributeNames={"#status": "status"},
            ExpressionAttributeValues={":s": "used"},
        )
        return True
    except Exception:
        # Callers ignore this return, so a swallowed failure leaves a single-use
        # invite redeemable forever.
        log.exception("mark_used failed for %s", email)
        raise


def list_invites_by_org(org_id: str) -> list[dict]:
    table = _get_table()
    if not table:
        return [i for i in _mem.values() if i.get("org_id") == org_id and i.get("status") == "pending"]
    try:
        result = table.scan(
            FilterExpression="org_id = :o AND #status = :s",
            ExpressionAttributeNames={"#status": "status"},
            ExpressionAttributeValues={":o": org_id, ":s": "pending"},
        )
        return result.get("Items", [])
    except Exception as exc:  # pragma: no cover
        log.warning("list_invites_by_org failed: %s", exc)
        return []

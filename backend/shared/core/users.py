"""User store — DynamoDB-backed (per the Loveheartbeat architecture), with in-memory fallback.

Env-gated on PINGHOLD_USERS_TABLE; AWS creds come from boto3's default chain (env/role/profile).
If the table is unset or DynamoDB is unreachable, falls back to an in-memory dict so local dev
and tests run without AWS. Passwords are hashed with stdlib scrypt — no external hashing dep.

ponytail: single-table, email as partition key. Add a GSI / user_id only if lookups by other
keys become a real requirement.
"""

from __future__ import annotations

import hashlib
import hmac
import logging
import os
import time
from typing import Any

log = logging.getLogger("pinghold.users")

_TABLE_NAME = os.getenv("PINGHOLD_USERS_TABLE")
_disabled = _TABLE_NAME is None
_mem: dict[str, dict] = {}  # email -> item, used only when DynamoDB is disabled
_table = None


def _get_table():
    """Return a cached boto3 Table, or None if disabled/unreachable (then _mem is used)."""
    global _disabled, _table
    if _disabled:
        return None
    if _table is not None:
        return _table
    try:
        import boto3

        _table = boto3.resource("dynamodb").Table(_TABLE_NAME)
        log.info("DynamoDB user store enabled (table=%s)", _TABLE_NAME)
        return _table
    except Exception as exc:  # pragma: no cover - depends on AWS
        log.warning("DynamoDB unavailable (%s); user store falling back to in-memory", exc)
        _disabled = True
        return None


# --- password hashing (stdlib scrypt) ---------------------------------------

def hash_password(password: str) -> str:
    salt = os.urandom(16)
    dk = hashlib.scrypt(password.encode(), salt=salt, n=2**14, r=8, p=1)
    return f"scrypt${salt.hex()}${dk.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        scheme, salt_hex, hash_hex = stored.split("$")
        if scheme != "scrypt":
            return False
        dk = hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt_hex), n=2**14, r=8, p=1)
        return hmac.compare_digest(dk.hex(), hash_hex)
    except (ValueError, AttributeError):
        return False


# --- store ------------------------------------------------------------------

# org_id is the partition key of the org-index GSI, and DynamoDB rejects an empty
# string for any key attribute — a solo signup (org_id="") fails the whole write with
# ValidationException. Absent is fine: the item is simply not indexed, which is what
# an org-less user should be. Readers all use .get("org_id", "") already.
_GSI_KEYS = ("org_id",)


def _strip_empty_gsi_keys(item: dict) -> dict:
    return {k: v for k, v in item.items() if not (k in _GSI_KEYS and v == "")}


def get_user(email: str) -> dict | None:
    table = _get_table()
    if not table:
        return _mem.get(email)
    try:
        return table.get_item(Key={"email": email}).get("Item")
    except Exception as exc:  # pragma: no cover
        log.warning("get_user failed: %s", exc)
        return None


def list_users_by_org(org_id: str) -> list[dict]:
    """Return users whose org_id matches."""
    table = _get_table()
    if not table:
        return [u for u in _mem.values() if u.get("org_id") == org_id]
    try:
        result = table.query(
            IndexName="org-index",
            KeyConditionExpression="org_id = :o",
            ExpressionAttributeValues={":o": org_id},
        )
        return result.get("Items", [])
    except Exception as exc:  # pragma: no cover
        log.warning("list_users_by_org failed: %s", exc)
        return []


def list_all_users() -> list[dict]:
    """Return every user in the store."""
    table = _get_table()
    if not table:
        return list(_mem.values())
    try:
        return table.scan().get("Items", [])
    except Exception as exc:  # pragma: no cover
        log.warning("list_all_users failed: %s", exc)
        return []


def delete_user(email: str) -> bool:
    """Permanently delete a user."""
    if not get_user(email):
        return False
    table = _get_table()
    if not table:
        _mem.pop(email, None)
        return True
    try:
        table.delete_item(Key={"email": email})
        return True
    except Exception as exc:  # pragma: no cover
        log.warning("delete_user failed: %s", exc)
        return False


def update_user(email: str, **fields) -> bool:
    """Update arbitrary user fields. Returns False if the user does not exist.

    Hashes a password if provided and allows codes to be cleared with None.
    """
    if not get_user(email):
        return False
    if "password" in fields and fields["password"] is not None:
        fields["password"] = hash_password(fields["password"])
    table = _get_table()
    if not table:
        user = _mem.get(email)
        if user:
            user.update(fields)
            return True
        return False
    try:
        if not fields:
            return True
        # Clearing a GSI key means removing the attribute; SET-ing "" is rejected
        # outright and would fail the whole update (e.g. admin removing a user from
        # an org). See _strip_empty_gsi_keys.
        sets = _strip_empty_gsi_keys(fields)
        removes = [k for k in fields if k not in sets]
        parts = []
        if sets:
            parts.append("SET " + ", ".join(f"#{k} = :{k}" for k in sets))
        if removes:
            parts.append("REMOVE " + ", ".join(f"#{k}" for k in removes))
        kwargs: dict[str, Any] = {
            "Key": {"email": email},
            "UpdateExpression": " ".join(parts),
            "ExpressionAttributeNames": {f"#{k}": k for k in fields},
        }
        if sets:
            kwargs["ExpressionAttributeValues"] = {f":{k}": v for k, v in sets.items()}
        table.update_item(**kwargs)
        return True
    except Exception:
        # False means "no such user" to callers; a write failure must not look like one.
        log.exception("update_user failed for %s", email)
        raise


def create_user(
    email: str,
    password: str,
    roles: list[str],
    name: str | None = None,
    org_id: str = "",
    status: str = "active",
    confirmation_code: str | None = None,
    reset_code: str | None = None,
    intent: str | None = None,
) -> bool:
    """Create a user. Returns False if the email already exists."""
    if get_user(email):
        return False
    item: dict[str, Any] = {
        "email": email,
        "password": hash_password(password),
        "roles": roles,
        "name": name or email,
        "org_id": org_id,
        "status": status,
        "created_at": str(time.time()),
    }
    if intent:
        item["intent"] = intent
    if confirmation_code:
        item["confirmation_code"] = confirmation_code
    if reset_code:
        item["reset_code"] = reset_code
    table = _get_table()
    if not table:
        _mem[email] = item
        return True
    try:
        # ponytail: condition guards against a race past the get_user check above.
        table.put_item(
            Item=_strip_empty_gsi_keys(item), ConditionExpression="attribute_not_exists(email)"
        )
        return True
    except table.meta.client.exceptions.ConditionalCheckFailedException:
        return False
    except Exception:
        # Only "already exists" may return False — callers turn that into a 409, so
        # swallowing a write failure here reports AccessDenied or ValidationException
        # to the user as "Email already registered".
        log.exception("create_user failed for %s", email)
        raise


def authenticate(email: str, password: str) -> dict | None:
    """Return the user item on valid credentials, else None."""
    user = get_user(email)
    if user and verify_password(password, user.get("password", "")):
        return user
    return None


if __name__ == "__main__":  # smallest check for the security path
    h = hash_password("hunter2")
    assert verify_password("hunter2", h)
    assert not verify_password("wrong", h)
    assert not verify_password("hunter2", "garbage")
    assert create_user("a@b.com", "pw", ["viewer"])
    assert not create_user("a@b.com", "pw", ["viewer"])  # duplicate
    assert authenticate("a@b.com", "pw")
    assert authenticate("a@b.com", "bad") is None
    print("ok")

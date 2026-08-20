"""Organization store — DynamoDB-backed (OrganizationsTable), with in-memory fallback.

Env-gated on PINGHOLD_ORGANIZATIONS_TABLE. If the table is unset or DynamoDB is
unreachable, falls back to an in-memory dict so local dev and tests run without AWS.
"""

from __future__ import annotations

import logging
import os
import time
import uuid

log = logging.getLogger("pinghold.orgs")

_TABLE_NAME = os.getenv("PINGHOLD_ORGANIZATIONS_TABLE")
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
        log.info("DynamoDB org store enabled (table=%s)", _TABLE_NAME)
        return _table
    except Exception as exc:  # pragma: no cover - depends on AWS
        log.warning("DynamoDB unavailable (%s); org store falling back to in-memory", exc)
        _disabled = True
        return None


def generate_org_id() -> str:
    return f"org-{uuid.uuid4().hex[:12]}"


def _slugify(name: str) -> str:
    """Create a URL-friendly slug from an org name."""
    return "".join(c if c.isalnum() else "-" for c in name.lower()).strip("-")


def create_org(
    name: str,
    owner_email: str,
    status: str = "active",
    plan: str = "free",
    seats: int = 5,
    industry: str = "",
    environments: list[dict] | None = None,
) -> dict:
    org_id = generate_org_id()
    slug = _slugify(name)
    # guarantee uniqueness in the unlikely event of a collision
    while get_org(org_id) or get_org_by_identifier(slug):
        org_id = generate_org_id()
        slug = _slugify(f"{name}-{uuid.uuid4().hex[:6]}")
    item = {
        "org_id": org_id,
        "name": name,
        "slug": slug,
        "owner_email": owner_email,
        "status": status,
        "plan": plan,
        "seats": seats,
        "industry": industry,
        "environments": environments or [],
        "created_at": str(time.time()),
    }
    table = _get_table()
    if not table:
        _mem[org_id] = item
        return item
    try:
        table.put_item(Item=item)
        return item
    except Exception as exc:  # pragma: no cover
        log.warning("create_org failed: %s", exc)
        return {}


def get_org(org_id: str) -> dict | None:
    table = _get_table()
    if not table:
        return _mem.get(org_id)
    try:
        return table.get_item(Key={"org_id": org_id}).get("Item")
    except Exception as exc:  # pragma: no cover
        log.warning("get_org failed: %s", exc)
        return None


def get_org_by_identifier(identifier: str) -> dict | None:
    """Look up an org by org_id, slug, or exact name."""
    identifier = identifier.strip().lower()
    # in-memory scan
    table = _get_table()
    if not table:
        for org in _mem.values():
            if identifier in {org.get("org_id", "").lower(), org.get("slug", "").lower(), org.get("name", "").lower()}:
                return org
        return None
    try:
        # Try exact org_id first
        by_id = table.get_item(Key={"org_id": identifier}).get("Item")
        if by_id:
            return by_id
        # Fall back to scan; acceptable for small tables and rare operation.
        result = table.scan(
            FilterExpression="slug = :i OR #name = :i",
            ExpressionAttributeNames={"#name": "name"},
            ExpressionAttributeValues={":i": identifier},
        )
        items = result.get("Items", [])
        return items[0] if items else None
    except Exception as exc:  # pragma: no cover
        log.warning("get_org_by_identifier failed: %s", exc)
        return None


def list_orgs() -> list[dict]:
    table = _get_table()
    if not table:
        return list(_mem.values())
    try:
        return table.scan().get("Items", [])
    except Exception as exc:  # pragma: no cover
        log.warning("list_orgs failed: %s", exc)
        return []


def update_org(org_id: str, **fields) -> bool:
    """Update arbitrary organization fields. Returns False if the org does not exist."""
    if not get_org(org_id):
        return False
    table = _get_table()
    if not table:
        org = _mem.get(org_id)
        if org:
            org.update(fields)
            return True
        return False
    try:
        clauses = [f"#{k} = :{k}" for k in fields]
        if not clauses:
            return True
        expression = "SET " + ", ".join(clauses)
        names = {f"#{k}": k for k in fields}
        values = {f":{k}": fields[k] for k in fields}
        table.update_item(
            Key={"org_id": org_id},
            UpdateExpression=expression,
            ExpressionAttributeNames=names,
            ExpressionAttributeValues=values,
        )
        return True
    except Exception as exc:  # pragma: no cover
        log.warning("update_org failed: %s", exc)
        return False


def delete_org(org_id: str) -> bool:
    """Permanently delete an organization."""
    if not get_org(org_id):
        return False
    table = _get_table()
    if not table:
        _mem.pop(org_id, None)
        return True
    try:
        table.delete_item(Key={"org_id": org_id})
        return True
    except Exception as exc:  # pragma: no cover
        log.warning("delete_org failed: %s", exc)
        return False

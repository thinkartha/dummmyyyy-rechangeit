"""Organization / multi-tenant Lambda handlers."""

from __future__ import annotations

from typing import Any

from shared.core import orgs
from shared.response import ok
from shared.tenant import require_tenant


def tenant_context_handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    tenant = require_tenant(event)
    if isinstance(tenant, dict) and "statusCode" in tenant:
        return tenant
    return ok({"tenant": tenant.to_dict(), "message": "Resolved from slug subdomain / header"})


def list_organizations_handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    """The caller's own organization, resolved from the slug.

    Listing every tenant is a platform-admin action and lives behind auth in the
    FastAPI router; this unauthenticated handler answers only for the org in the host.
    """
    tenant = require_tenant(event)
    if isinstance(tenant, dict) and "statusCode" in tenant:
        return tenant
    org = orgs.get_org(tenant.org_id) or {}
    return ok(
        {
            "organizations": [
                {
                    "org_id": tenant.org_id,
                    "slug": tenant.slug,
                    "name": tenant.name,
                    "plan": tenant.plan,
                    "status": org.get("status", "active"),
                    "url": f"https://{tenant.slug}.loveheartbeat.com",
                }
            ],
            "design_capacity": 30000,
        }
    )

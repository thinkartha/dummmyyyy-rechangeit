"""Organization / multi-tenant Lambda handlers."""

from __future__ import annotations

from typing import Any

from shared.response import created, ok
from shared.tenant import _DEMO_TENANTS, require_tenant


def tenant_context_handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    tenant = require_tenant(event)
    if isinstance(tenant, dict) and "statusCode" in tenant:
        return tenant
    return ok({"tenant": tenant.to_dict(), "message": "Resolved from slug subdomain / header"})


def list_organizations_handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    items = [
        {
            "org_id": meta["org_id"],
            "slug": slug,
            "name": meta["name"],
            "plan": meta["plan"],
            "url": f"https://{slug}.loveheartbeat.com",
        }
        for slug, meta in _DEMO_TENANTS.items()
    ]
    return ok({"organizations": items, "design_capacity": 30000})


def onboard_organization_handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    # Placeholder create — production writes org + slug reservation atomically.
    return created(
        {
            "status": "pending",
            "next": [
                "reserve slug",
                "choose Okta/SSO or native login",
                "invite members",
                "connect cloud / AI / ETL sources",
            ],
            "url_template": "https://<slug>.loveheartbeat.com",
        }
    )

"""Tenant + organization directory routes.

The slug model (`https://<slug>.loveheartbeat.com`) is this repo's tenant boundary, so
it needs to be readable over the API and not only inside `shared.tenant`: the frontend
resolves "which organization am I looking at" before it renders anything, and local
clients that have no wildcard DNS need a way to confirm the `X-Tenant-Slug` they sent
was understood. Both are what `GET /tenant` answers.

Backed by `shared.tenant`, so these routes and the standalone
`handlers/organizations.py` Lambda cannot drift apart.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request, status

from shared.tenant import _DEMO_TENANTS, resolve_tenant

router = APIRouter(prefix="/api/v1", tags=["tenant"])

# Design target for the shared platform — surfaced so the UI can show headroom.
DESIGN_CAPACITY = 30_000


@router.get("/tenant")
def tenant_context(request: Request) -> dict[str, object]:
    """Resolve the caller's organization from the Host subdomain or X-Tenant-Slug."""
    resolved = resolve_tenant({"headers": dict(request.headers)})
    if isinstance(resolved, dict):
        # resolve_tenant hands back an API Gateway error envelope; re-raise it as HTTP.
        raise HTTPException(
            status_code=resolved["statusCode"],
            detail=resolved["body"],
        )
    return {
        "tenant": resolved.to_dict(),
        "url": f"https://{resolved.slug}.loveheartbeat.com",
    }


@router.get("/organizations")
def list_organizations() -> dict[str, object]:
    """Directory of organizations on the platform."""
    return {
        "organizations": [
            {
                "org_id": meta["org_id"],
                "slug": slug,
                "name": meta["name"],
                "plan": meta["plan"],
                "url": f"https://{slug}.loveheartbeat.com",
            }
            for slug, meta in _DEMO_TENANTS.items()
        ],
        "design_capacity": DESIGN_CAPACITY,
    }


@router.post("/organizations", status_code=status.HTTP_201_CREATED)
def onboard_organization() -> dict[str, object]:
    """Onboarding stub — production reserves the slug and writes the org atomically."""
    return {
        "status": "pending",
        "next": [
            "reserve slug",
            "choose Okta/SSO or native login",
            "invite members",
            "connect cloud / AI / ETL sources",
        ],
        "url_template": "https://<slug>.loveheartbeat.com",
    }

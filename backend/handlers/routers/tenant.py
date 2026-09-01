"""Tenant + organization directory routes.

The slug model (`https://<slug>.loveheartbeat.com`) is this repo's tenant boundary, so
it needs to be readable over the API and not only inside `shared.tenant`: the frontend
resolves "which organization am I looking at" before it renders anything, and local
clients that have no wildcard DNS need a way to confirm the `X-Tenant-Slug` they sent
was understood. Both are what `GET /tenant` answers.

Signed in, the answer comes from the token's own `org_id` rather than the host: a
member of one org must not be handed another org's context by pointing a browser at a
different slug. The host is the fallback for anonymous callers only.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, status

from shared.core import orgs
from shared.core.auth import ROLE_PLATFORM_ADMIN, Principal, get_optional_principal
from shared.tenant import resolve_tenant

router = APIRouter(prefix="/api/v1", tags=["tenant"])

# Design target for the shared platform — surfaced so the UI can show headroom.
DESIGN_CAPACITY = 30_000


def _public(org: dict) -> dict:
    slug = org.get("slug") or org.get("org_id", "")
    return {
        "org_id": org.get("org_id"),
        "id": org.get("org_id"),
        "slug": slug,
        "name": org.get("name"),
        "plan": org.get("plan", "free"),
        "status": org.get("status", "active"),
        "seats": org.get("seats"),
        "owner_email": org.get("owner_email", ""),
        "url": f"https://{slug}.loveheartbeat.com",
    }


@router.get("/tenant")
def tenant_context(
    request: Request,
    principal: Principal | None = Depends(get_optional_principal),
) -> dict[str, object]:
    """The caller's organization: from their token when signed in, else from the host."""
    if principal and principal.org_id:
        org = orgs.get_org(principal.org_id)
        if org:
            return {"tenant": _public(org), "url": _public(org)["url"]}
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")

    resolved = resolve_tenant({"headers": dict(request.headers)})
    if isinstance(resolved, dict):
        # resolve_tenant hands back an API Gateway error envelope; re-raise it as HTTP.
        raise HTTPException(status_code=resolved["statusCode"], detail=resolved["body"])
    return {
        "tenant": resolved.to_dict(),
        "url": f"https://{resolved.slug}.loveheartbeat.com",
    }


@router.get("/organizations")
def list_organizations(
    principal: Principal | None = Depends(get_optional_principal),
) -> dict[str, object]:
    """Organizations the caller may see.

    Only a platform admin sees the directory. Everyone else — org admins included —
    sees the one organization they belong to, because "which orgs exist on this
    platform" is not a tenant's business.
    """
    if not principal:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    if ROLE_PLATFORM_ADMIN in principal.roles:
        visible = orgs.list_orgs()
    else:
        own = orgs.get_org(principal.org_id) if principal.org_id else None
        visible = [own] if own else []
    return {
        "organizations": [_public(o) for o in visible],
        "design_capacity": DESIGN_CAPACITY,
    }

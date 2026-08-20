"""Tenant resolution.

For authenticated requests the tenant is derived from the verified JWT/Cognito claim
`org_id`. Solo users get their own `solo-<sub>` tenant so their data is isolated even
without an org.

Unauthenticated / local calls fall back to this repo's slug model — the same one
`shared.tenant` implements for the standalone Lambda handlers:

1. `Host: <slug>.loveheartbeat.com`  → org_id
2. `X-Tenant-Slug: <slug>`           → org_id
3. `X-Tenant-Id: <id>`               → used as-is (dev/test override)

Keeping all three in one dependency is what lets the FastAPI routes and the
standalone handlers agree on which organization a request belongs to.
"""

from __future__ import annotations

from fastapi import Depends, Header, HTTPException, Request, status

from shared.tenant import resolve_tenant

from .auth import ROLE_PLATFORM_ADMIN, Principal, get_optional_principal


def _slug_org_id(request: Request) -> str | None:
    """org_id from the Host subdomain or X-Tenant-Slug, or None when neither resolves."""
    tenant = resolve_tenant({"headers": dict(request.headers)})
    # resolve_tenant returns an API-Gateway error dict when the slug is missing/unknown.
    return None if isinstance(tenant, dict) else tenant.org_id


def get_tenant_id(
    request: Request,
    x_tenant_id: str = Header(default="acme", alias="X-Tenant-Id"),
    principal: Principal | None = Depends(get_optional_principal),
) -> str:
    """Resolve tenant id from authenticated claims, then slug, then X-Tenant-Id."""
    if principal and principal.org_id:
        return principal.org_id
    if principal and principal.sub:
        return f"solo-{principal.sub}"
    return _slug_org_id(request) or x_tenant_id


def require_tenant(tenant_id: str):
    """Dependency factory that ensures the caller belongs to tenant_id (admins exempt)."""
    def _dep(principal: Principal = Depends(get_optional_principal)) -> None:
        if not principal:
            return
        if ROLE_PLATFORM_ADMIN in principal.roles:
            return
        if tenant_id == principal.org_id:
            return
        if tenant_id == f"solo-{principal.sub}":
            return
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this tenant",
        )

    return _dep

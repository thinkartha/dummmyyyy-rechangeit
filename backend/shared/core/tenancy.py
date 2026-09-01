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
    x_tenant_id: str = Header(default="", alias="X-Tenant-Id"),
    principal: Principal | None = Depends(get_optional_principal),
) -> str:
    """Resolve tenant id from authenticated claims, then slug, then X-Tenant-Id."""
    # One exit, because the answer is now also published on the request (below) and a
    # branch that returns early is a branch that silently skips doing so.
    if principal and principal.org_id:
        tenant_id = principal.org_id
    elif principal and principal.sub:
        tenant_id = f"solo-{principal.sub}"
    else:
        tenant_id = _slug_org_id(request) or x_tenant_id.strip()
    if not tenant_id:
        # This used to default to "acme" — a real tenant. Every request we could not place
        # was therefore reading, and writing, that organization's data under its name. An
        # unresolved tenant is a failed request, not somebody else's.
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant not resolved. Sign in, use https://<slug>.loveheartbeat.com, "
                   "or send X-Tenant-Slug.",
        )
    # Published for request_spans: the middleware runs outside the dependency system and
    # cannot call this, and re-deriving the tenant there would be a second implementation
    # of exactly the rule above — free to disagree with it, and misfile a request into the
    # wrong organization's traffic. Reading back what the request itself resolved cannot.
    request.state.tenant_id = tenant_id
    return tenant_id


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

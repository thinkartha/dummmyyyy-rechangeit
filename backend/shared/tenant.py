"""Resolve multi-tenant organization context from API Gateway events.

Production model:
  https://<slug>.loveheartbeat.com  →  Host header → organization slug → org_id

Designed for tens of thousands of orgs: shared compute, per-org data isolation.
"""

from __future__ import annotations

import re
from dataclasses import asdict, dataclass
from typing import Any

from shared.response import bad_request, not_found

_SLUG_RE = re.compile(r"^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$")
_ROOT_HOSTS = {"loveheartbeat.com", "www.loveheartbeat.com", "localhost", "127.0.0.1"}


@dataclass(frozen=True)
class TenantContext:
    org_id: str
    slug: str
    name: str
    plan: str
    host: str

    def to_dict(self) -> dict[str, str]:
        return asdict(self)


# Demo registry — replace with DynamoDB / Postgres lookup keyed by slug.
_DEMO_TENANTS: dict[str, dict[str, str]] = {
    "rootvyana": {
        "org_id": "org_rootvyana",
        "name": "RootVyana",
        "plan": "enterprise",
    },
    "acme": {"org_id": "org_acme", "name": "Acme Corp", "plan": "business"},
    "contoso": {"org_id": "org_contoso", "name": "Contoso", "plan": "enterprise"},
    "demo": {"org_id": "org_demo", "name": "LoveHeartBeat Demo", "plan": "trial"},
}


def extract_host(event: dict[str, Any]) -> str:
    headers = event.get("headers") or {}
    # API Gateway may lowercase header names
    host = headers.get("Host") or headers.get("host") or ""
    return host.split(":")[0].strip().lower()


def slug_from_host(host: str, *, base_domain: str = "loveheartbeat.com") -> str | None:
    if not host or host in _ROOT_HOSTS:
        return None
    suffix = f".{base_domain}"
    if host.endswith(suffix):
        slug = host[: -len(suffix)]
        if "." in slug:
            return None  # reject nested subdomains for now
        return slug if _SLUG_RE.match(slug) else None
    # Local / preview: allow slug.localhost
    if host.endswith(".localhost"):
        slug = host[: -len(".localhost")]
        return slug if _SLUG_RE.match(slug) else None
    return None


def resolve_tenant(event: dict[str, Any]) -> TenantContext | dict[str, Any]:
    """Return TenantContext or an API error response dict."""
    host = extract_host(event)
    headers = event.get("headers") or {}

    slug = slug_from_host(host)
    if not slug:
        # Explicit override for local API testing without DNS
        slug = (headers.get("X-Tenant-Slug") or headers.get("x-tenant-slug") or "").strip().lower()

    if not slug:
        return bad_request(
            "Tenant not resolved. Use https://<slug>.loveheartbeat.com or X-Tenant-Slug header."
        )

    if not _SLUG_RE.match(slug):
        return bad_request("Invalid organization slug")

    record = _DEMO_TENANTS.get(slug)
    if not record:
        return not_found(f"Unknown organization slug: {slug}")

    return TenantContext(
        org_id=record["org_id"],
        slug=slug,
        name=record["name"],
        plan=record["plan"],
        host=host or f"{slug}.loveheartbeat.com",
    )


def require_tenant(event: dict[str, Any]) -> TenantContext | dict[str, Any]:
    return resolve_tenant(event)

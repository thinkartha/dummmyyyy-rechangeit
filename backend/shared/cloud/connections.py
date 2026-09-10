"""GCP and Azure account connections.

Credential storage only. There is no subscription-wide collector for either provider
yet, so a saved connection is what feeds the API-gateway readers (Apigee, Azure API
Management) and what a later collector will pick up — the integrations page reports it
as connected because the credential is stored and nothing more is claimed.

ponytail: one module, no per-provider service classes — both providers are a pydantic
model plus the same config_store round-trip AWS already uses.
"""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field

from shared.core import config_store


class GcpConfig(BaseModel):
    project_id: str = Field(alias="projectId")
    auth_method: Literal["service-account", "workload-identity"] = Field(
        default="service-account", alias="authMethod"
    )
    service_account_json: str | None = Field(default=None, alias="serviceAccountJson", repr=False)
    workload_identity_pool: str | None = Field(default=None, alias="workloadIdentityPool")
    regions: list[str] = Field(default_factory=list)
    collection_interval_seconds: int = Field(default=300, alias="collectionIntervalSeconds")

    model_config = {"populate_by_name": True}


class AzureConfig(BaseModel):
    subscription_id: str = Field(alias="subscriptionId")
    tenant_id: str = Field(alias="azureTenantId")
    client_id: str | None = Field(default=None, alias="clientId")
    client_secret: str | None = Field(default=None, alias="clientSecret", repr=False)
    resource_groups: list[str] = Field(default_factory=list, alias="resourceGroups")
    collection_interval_seconds: int = Field(default=300, alias="collectionIntervalSeconds")

    model_config = {"populate_by_name": True}


PROVIDERS: dict[str, type[BaseModel]] = {"gcp": GcpConfig, "azure": AzureConfig}

_MEM: dict[tuple[str, str], BaseModel] = {}


def _mask(value: str | None) -> str | None:
    if not value:
        return None
    if len(value) <= 6:
        return "***"
    return f"{value[:3]}...{value[-3:]}"


def _integration(provider: str) -> str:
    return f"cloud-{provider}"


def save_config(tenant_id: str, provider: str, config: BaseModel) -> dict[str, Any]:
    _MEM[(tenant_id, provider)] = config
    config_store.save_config(tenant_id, _integration(provider), config.model_dump_json(by_alias=True))
    return config_status(tenant_id, provider)


def get_config(tenant_id: str, provider: str) -> BaseModel | None:
    cfg = _MEM.get((tenant_id, provider))
    if cfg:
        return cfg
    raw = config_store.get_config(tenant_id, _integration(provider))
    if not raw:
        return None
    cfg = PROVIDERS[provider].model_validate_json(raw)
    _MEM[(tenant_id, provider)] = cfg
    return cfg


def config_status(tenant_id: str, provider: str) -> dict[str, Any]:
    cfg = get_config(tenant_id, provider)
    return {
        "id": _integration(provider),
        "configured": cfg is not None,
        "source": "frontend" if cfg else "unset",
        "fields": _fields(provider, cfg),
    }


def _fields(provider: str, cfg: BaseModel | None) -> dict[str, Any]:
    """Secrets are masked — this is what prefills the connect form, and a round-tripped
    mask would be saved back over the real credential."""
    if provider == "gcp":
        return {
            "project_id": cfg.project_id if cfg else None,
            "auth_method": cfg.auth_method if cfg else None,
            "service_account_json": "***" if cfg and cfg.service_account_json else None,
            "workload_identity_pool": cfg.workload_identity_pool if cfg else None,
            "regions": ",".join(cfg.regions) if cfg else None,
            "collection_interval_seconds": str(cfg.collection_interval_seconds) if cfg else None,
        }
    return {
        "subscription_id": cfg.subscription_id if cfg else None,
        "azure_tenant_id": cfg.tenant_id if cfg else None,
        "client_id": cfg.client_id if cfg else None,
        "client_secret": _mask(cfg.client_secret) if cfg else None,
        "resource_groups": ",".join(cfg.resource_groups) if cfg else None,
        "collection_interval_seconds": str(cfg.collection_interval_seconds) if cfg else None,
    }

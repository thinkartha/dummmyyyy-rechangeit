"""ETL connector catalog — the connection form each platform needs, plus a generic
save/status pair, mirroring shared/core/gateways.py's CATALOG for API gateways.

Adding a connector: add a CATALOG entry here (fields the UI should render) and, if it
needs typed/aliased values, a model in dto.py. save_config/config_status below already
handle validation, masking and persistence generically — no new route, and no new
hardcoded form in the frontend. Launching a job and polling runs stay platform-specific
(see client.py, pollers/) — that part genuinely differs per vendor API.
"""

from __future__ import annotations

from typing import Any

from pydantic import ValidationError

from . import store
from .dto import BoomiConfig, IntegrationConfigStatus, TalendConfig

CATALOG: dict[str, dict[str, Any]] = {
    "talend": {
        "label": "Talend",
        "help": "Talend Cloud — environment or workspace scope.",
        "model": TalendConfig,
        "fields": [
            {"name": "base_url", "label": "API base URL", "value": "https://api.us.cloud.talend.com"},
            {"name": "environment_id", "label": "Environment ID"},
            {"name": "workspace_id", "label": "Workspace ID"},
            {"name": "last_days", "label": "Look back (days)", "value": "1"},
            {"name": "bearer_token", "label": "Bearer token", "secret": True,
             "help": "Optional here — the backend can supply it from its secret store instead."},
        ],
    },
    "boomi": {
        "label": "Boomi",
        "help": "AtomSphere account, username and API token.",
        "model": BoomiConfig,
        "fields": [
            {"name": "account_id", "label": "Account ID", "required": True},
            {"name": "username", "label": "Username", "required": True},
            {"name": "token", "label": "API token", "required": True, "secret": True},
            {"name": "base_url", "label": "API base URL", "value": "https://api.boomi.com/api/rest/v1"},
            {"name": "atom_id", "label": "Atom ID"},
            {"name": "environment_id", "label": "Environment ID"},
            {"name": "hours_back", "label": "Look back (hours)", "value": 24},
        ],
    },
}


def catalog() -> list[dict[str, Any]]:
    """Supported ETL connectors and the connection form each needs."""
    return [{"id": key, **{k: v for k, v in spec.items() if k != "model"}} for key, spec in CATALOG.items()]


def _secret_fields(platform: str) -> frozenset[str]:
    return frozenset(f["name"] for f in CATALOG[platform]["fields"] if f.get("secret"))


def _require_known(platform: str) -> None:
    if platform not in CATALOG:
        raise ValueError(f"Unsupported ETL connector '{platform}'. Supported: {', '.join(sorted(CATALOG))}")


def save_config(tenant_id: str, platform: str, fields: dict[str, Any]) -> IntegrationConfigStatus:
    """Validate `fields` against the connector's model and persist it. Raises ValueError
    on an unknown platform or a missing/invalid required field."""
    _require_known(platform)
    try:
        config = CATALOG[platform]["model"](**fields)
    except ValidationError as exc:
        missing = ", ".join(sorted({str(err["loc"][-1]) for err in exc.errors()}))
        raise ValueError(f"Missing or invalid field(s): {missing}") from exc
    return store.save_platform_config(
        tenant_id, platform, CATALOG[platform]["label"], config, _secret_fields(platform)
    )


def config_status(tenant_id: str, platform: str) -> IntegrationConfigStatus:
    _require_known(platform)
    return store.platform_config_status(tenant_id, platform, _secret_fields(platform))

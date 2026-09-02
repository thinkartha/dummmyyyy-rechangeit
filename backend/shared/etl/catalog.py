"""ETL connector catalog — the connection form each platform needs, plus a generic
save/status pair, mirroring shared/core/gateways.py's CATALOG for API gateways.

Adding a *named* connector: add a CATALOG entry here (fields the UI should render) and,
if it needs typed/aliased values, a model in dto.py. save_config/config_status below
already handle validation, masking and persistence generically — no new route, and no
new hardcoded form in the frontend.

Adding an *unlisted* one needs no code at all: the catalog always carries one more
entry, "custom" — a generic REST connector (auth type + credentials + a field mapping,
see CustomConnectorConfig in dto.py). Saving it under an id of the form "custom-<slug>"
registers a brand new connector; any such id polls through GenericRestClient
(client.py) / shared/etl/pollers/custom.py instead of a hand-written client.

Launching a job stays platform-specific (see client.py's launch_* methods) — that part
genuinely differs per vendor API and generic connectors are monitor-only.
"""

from __future__ import annotations

from typing import Any

from pydantic import ValidationError

from . import store
from .dto import BoomiConfig, CustomConnectorConfig, IntegrationConfigStatus, TalendConfig

CUSTOM_PREFIX = "custom-"

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
    # Not a real connector — picking it and saving under a generated "custom-<slug>" id
    # is how a tool with no dedicated entry above gets connected. See module docstring.
    "custom": {
        "label": "Custom connector (generic REST)",
        "help": "Any other ETL/ELT tool — point this at its runs API and say how to read a run.",
        "template": True,
        "model": CustomConnectorConfig,
        "fields": [
            {"name": "name", "label": "Connector name", "required": True,
             "help": 'Shown on the ETL page, e.g. "Fivetran" or "Airbyte prod".'},
            {"name": "base_url", "label": "Runs/executions API URL", "required": True,
             "help": "A GET to this URL should return the job runs to monitor."},
            {"name": "auth_type", "label": "Authentication", "type": "select", "value": "none",
             "options": [
                 {"value": "none", "label": "None"},
                 {"value": "api_key", "label": "API key (header)"},
                 {"value": "bearer", "label": "Bearer token"},
                 {"value": "basic", "label": "Basic auth (username + password)"},
                 {"value": "access_key", "label": "Access key + secret"},
             ]},
            {"name": "api_key", "label": "API key", "secret": True},
            {"name": "api_key_header", "label": "API key header name", "value": "X-API-Key"},
            {"name": "bearer_token", "label": "Bearer token", "secret": True},
            {"name": "username", "label": "Username"},
            {"name": "password", "label": "Password", "secret": True},
            {"name": "access_key_id", "label": "Access key ID"},
            {"name": "secret_access_key", "label": "Secret access key", "secret": True},
            {"name": "list_path", "label": "List path (optional)",
             "help": 'Dotted path to the run list, e.g. "data.runs". Blank works if the '
                     'response is the list itself, or has a top-level items/data/results/'
                     'runs/executions field.'},
            {"name": "id_field", "label": "Run ID field", "value": "id"},
            {"name": "name_field", "label": "Job name field", "value": "name"},
            {"name": "status_field", "label": "Status field", "value": "status"},
            {"name": "error_field", "label": "Error message field (optional)"},
            {"name": "records_field", "label": "Records processed field (optional)"},
            {"name": "success_values", "label": "Status values meaning success",
             "value": "success,succeeded,complete,completed,ok"},
            {"name": "failure_values", "label": "Status values meaning failure",
             "value": "failed,error,failure"},
        ],
    },
}


def catalog() -> list[dict[str, Any]]:
    """Supported ETL connectors and the connection form each needs."""
    return [{"id": key, **{k: v for k, v in spec.items() if k != "model"}} for key, spec in CATALOG.items()]


def _spec_for(platform: str) -> dict[str, Any]:
    if platform in CATALOG and platform != "custom":
        return CATALOG[platform]
    if platform.startswith(CUSTOM_PREFIX):
        return CATALOG["custom"]
    raise ValueError(
        f"Unsupported ETL connector '{platform}'. Supported: {', '.join(sorted(k for k in CATALOG if k != 'custom'))}, "
        f"or any '{CUSTOM_PREFIX}<name>' custom connector."
    )


def _secret_fields(platform: str) -> frozenset[str]:
    return frozenset(f["name"] for f in _spec_for(platform)["fields"] if f.get("secret"))


def save_config(tenant_id: str, platform: str, fields: dict[str, Any]) -> IntegrationConfigStatus:
    """Validate `fields` against the connector's model and persist it. Raises ValueError
    on an unknown platform or a missing/invalid required field.

    `platform == "custom"` itself is a template, not a connector — save under a
    "custom-<slug>" id instead (the frontend derives this from the name typed in).
    """
    if platform == "custom":
        raise ValueError('"custom" is a template, not a connector — save it under a "custom-<name>" id instead.')
    spec = _spec_for(platform)
    try:
        config = spec["model"](**fields)
    except ValidationError as exc:
        missing = ", ".join(sorted({str(err["loc"][-1]) for err in exc.errors()}))
        raise ValueError(f"Missing or invalid field(s): {missing}") from exc
    label = config.name if spec.get("template") else spec["label"]
    return store.save_platform_config(tenant_id, platform, label, config, _secret_fields(platform))


def config_status(tenant_id: str, platform: str) -> IntegrationConfigStatus:
    _spec_for(platform)  # raises ValueError on an unknown platform
    return store.platform_config_status(tenant_id, platform, _secret_fields(platform))

"""Pull run/execution records from ETL platforms (Talend, Boomi, Databricks).

Credentials come from the tenant's saved integration config — the same records the
org admin writes through the API — so a job only ever reads what that organization
connected. A platform with no config yields nothing rather than raising: a tenant that
uses Talend but not Boomi is the normal case, not an error.
"""

from __future__ import annotations

import logging
from typing import Any

import _backend  # noqa: F401  — puts backend/ on sys.path before shared.* imports

from shared.etl.client import BoomiClient, DatabricksJobsClient, TalendClient
from shared.etl.store import get_boomi_config, get_talend_config

log = logging.getLogger("middleware.etl")

PLATFORMS = ("talend", "boomi", "databricks")


def _client(platform: str, tenant_id: str):
    if platform == "talend":
        return TalendClient(get_talend_config(tenant_id))
    if platform == "boomi":
        return BoomiClient(get_boomi_config(tenant_id))
    if platform == "databricks":
        return DatabricksJobsClient(tenant_id)
    raise ValueError(f"Unknown ETL platform: {platform}")


def extract_runs(platform: str, tenant_id: str, limit: int = 100) -> list[dict[str, Any]]:
    """Raw run records for one platform, or [] when this tenant has not connected it."""
    client = _client(platform, tenant_id)
    if not client.configured:
        log.info("%s not configured for tenant=%s; skipping", platform, tenant_id)
        return []

    try:
        if platform == "talend":
            return client.task_executions()[:limit]
        if platform == "boomi":
            return client.execution_records()[:limit]
        return client.job_runs(limit=limit)
    except Exception as exc:  # noqa: BLE001 — one bad connector must not kill the job
        log.warning("%s extract failed for tenant=%s: %s", platform, tenant_id, exc)
        return []


def extract_all(tenant_id: str, limit: int = 100) -> dict[str, list[dict[str, Any]]]:
    """Every connected platform for one tenant, keyed by platform."""
    return {p: extract_runs(p, tenant_id, limit) for p in PLATFORMS}

"""Background poller registry for live ETL integrations."""

from __future__ import annotations

import logging
import os
from collections.abc import Callable

from shared.core import config_store
from . import boomi, databricks, talend

log = logging.getLogger("pinghold.etl.pollers")

PollerStart = Callable[[str], None]

POLLERS: dict[str, PollerStart] = {
    "talend": talend.start,
    "boomi": boomi.start,
    "databricks": databricks.start,
}


def _csv_env(name: str) -> list[str]:
    return [value.strip() for value in os.getenv(name, "").split(",") if value.strip()]


def enabled_pollers() -> dict[str, PollerStart]:
    requested = _csv_env("ETL_POLLERS")
    if not requested:
        return POLLERS

    selected: dict[str, PollerStart] = {}
    for name in requested:
        poller = POLLERS.get(name.lower())
        if poller:
            selected[name.lower()] = poller
        else:
            log.warning("Ignoring unknown ETL poller %s", name)
    return selected


def poller_tenants() -> list[str]:
    return _csv_env("ETL_POLL_TENANTS")


def start_configured() -> None:
    # Union of the explicit env list and any tenant with a persisted integration config,
    # so credentials saved through the API are auto-monitored after a restart.
    tenants = sorted(set(poller_tenants()) | set(config_store.list_tenants()))
    if not tenants:
        log.info("No ETL poll tenants (none in ETL_POLL_TENANTS and no saved configs); skipping startup polling")
        return

    for tenant_id in tenants:
        for name, start in enabled_pollers().items():
            start(tenant_id)
            log.info("Requested ETL poller startup provider=%s tenant=%s", name, tenant_id)

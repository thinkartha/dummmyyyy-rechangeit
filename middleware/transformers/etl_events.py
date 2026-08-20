"""Turn raw ETL platform rows into tenant-stamped CloudEvents.

The vendor-specific normalization and CloudEvent mapping already exist in
`backend/shared/etl/`; this module only picks the right pair per platform and stamps
`org_id` onto every event so a batch run cannot mix tenants.
"""

from __future__ import annotations

import logging
from typing import Any

import _backend  # noqa: F401  — puts backend/ on sys.path before shared.* imports

from shared.collector.cloudevents import CloudEvent
from shared.etl.dto import BoomiExecutionEvent
from shared.etl.mappers import map_boomi_execution, map_databricks_run, map_talend_run
from shared.etl.pollers.databricks import _normalize as _normalize_databricks
from shared.etl.pollers.talend import _normalize as _normalize_talend

log = logging.getLogger("middleware.etl")


def _to_event(platform: str, raw: dict[str, Any], tenant_id: str) -> CloudEvent:
    if platform == "talend":
        return map_talend_run(_normalize_talend(raw), tenant_id)
    if platform == "boomi":
        return map_boomi_execution(
            BoomiExecutionEvent.model_validate({**raw, "raw": raw}), tenant_id
        )
    if platform == "databricks":
        return map_databricks_run(_normalize_databricks(raw), tenant_id)
    raise ValueError(f"Unknown ETL platform: {platform}")


def transform_runs(
    platform: str, rows: list[dict[str, Any]], tenant_id: str
) -> list[CloudEvent]:
    """Map one platform's rows. A row the vendor shaped unexpectedly is dropped with a
    warning rather than failing the batch — the remaining runs are still worth loading."""
    events: list[CloudEvent] = []
    for raw in rows:
        try:
            events.append(_to_event(platform, raw, tenant_id))
        except Exception as exc:  # noqa: BLE001 — one malformed row, not the whole run
            log.warning("Dropped unmappable %s row for tenant=%s: %s", platform, tenant_id, exc)
    return events


def transform_all(
    extracted: dict[str, list[dict[str, Any]]], tenant_id: str
) -> list[CloudEvent]:
    """Flatten every platform's rows into one tenant-scoped event stream."""
    return [
        event
        for platform, rows in extracted.items()
        for event in transform_runs(platform, rows, tenant_id)
    ]

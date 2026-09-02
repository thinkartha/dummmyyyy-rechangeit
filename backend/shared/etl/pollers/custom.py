from __future__ import annotations

import logging
import os
import threading
import time

from shared.collector import ingest as collector
from shared.collector.cloudevents import make_event
from shared.etl.client import GenericRestClient, dig
from shared.etl.dto import CustomConnectorConfig, EtlIntegrationHealth
from shared.etl.mappers import incident_from_event
from shared.etl.store import (
    execution_seen,
    get_platform_config,
    record_event,
    record_incident,
    set_connector_error,
    set_health,
)

log = logging.getLogger("pinghold.etl.custom")
_started: set[tuple[str, str]] = set()


def _split(values: str) -> set[str]:
    return {v.strip().lower() for v in (values or "").split(",") if v.strip()}


def _classify(status: str, cfg: CustomConnectorConfig) -> tuple[str, str]:
    normalized = (status or "").strip().lower()
    if normalized in _split(cfg.success_values):
        return "etl.job.succeeded", "succeeded"
    if normalized in _split(cfg.failure_values):
        return "etl.job.failed", "failed"
    return "etl.job.started", normalized or "unknown"


def poll_once(tenant_id: str, connector_id: str) -> int:
    cfg = get_platform_config(tenant_id, connector_id, CustomConnectorConfig)
    if not cfg:
        return 0
    client = GenericRestClient(cfg)
    if not client.configured:
        set_health(tenant_id, EtlIntegrationHealth(
            id=connector_id, name=cfg.name, status="not_configured", mode="live", configured=False
        ))
        return 0
    set_health(tenant_id, EtlIntegrationHealth(
        id=connector_id, name=cfg.name, status="ok", mode="live", configured=True
    ))
    count = 0
    try:
        for raw in client.executions():
            run_id = str(dig(raw, cfg.id_field) or "")
            if not run_id or execution_seen(tenant_id, connector_id, run_id):
                continue
            event_type, event_status = _classify(str(dig(raw, cfg.status_field) or ""), cfg)
            ce = make_event(
                source=connector_id,
                type=event_type,
                tenant_id=tenant_id,
                correlationid=run_id,
                data={
                    "platform": connector_id,
                    "platform_label": cfg.name,
                    "job_id": run_id,
                    "job_name": dig(raw, cfg.name_field) or run_id,
                    "execution_id": run_id,
                    "status": event_status,
                    "severity": "critical" if event_type == "etl.job.failed" else "info",
                    "error_message": dig(raw, cfg.error_field) if cfg.error_field else None,
                    "records_processed": dig(raw, cfg.records_field) if cfg.records_field else None,
                    "raw": raw,
                },
            )
            ingested = collector.ingest(ce)
            record_event(tenant_id, ingested)
            incident = incident_from_event(ingested)
            if incident:
                record_incident(tenant_id, incident)
            count += 1
    except Exception as exc:
        log.warning("Custom connector %s poll failed: %s", connector_id, exc)
        set_connector_error(tenant_id, connector_id, str(exc))
    return count


def start(tenant_id: str, connector_id: str) -> None:
    """Start an interval poll loop for one custom connector, mirroring talend/boomi's
    pollers. Unlike them it isn't restarted at boot via pollers.start_configured() —
    that walks a static POLLERS registry, and connector ids here are created at runtime.
    # ponytail: fine as long as the process doesn't restart mid-session; the "Poll now"
    # button and the next config save both re-arm it. Add a persisted connector index
    # (instead of piggybacking on the health cache) if boot-time recovery is needed.
    """
    key = (tenant_id, connector_id)
    if key in _started or os.getenv("ETL_CONNECTOR_MODE", "live").lower() != "live":
        return
    interval = int(os.getenv("CUSTOM_ETL_POLL_INTERVAL_SECONDS", "60"))

    def _loop() -> None:
        while True:
            poll_once(tenant_id, connector_id)
            time.sleep(interval)

    threading.Thread(target=_loop, daemon=True).start()
    _started.add(key)
    log.info("Custom connector poller started tenant=%s connector=%s interval=%ss", tenant_id, connector_id, interval)

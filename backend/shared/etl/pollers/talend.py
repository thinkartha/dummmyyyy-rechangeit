from __future__ import annotations

import logging
import os
import threading
import time
from typing import Any

from shared.collector import ingest as collector
from shared.etl.client import TalendClient
from shared.etl.dto import EtlIntegrationHealth, TalendRunEvent
from shared.etl.mappers import incident_from_event, map_talend_run
from shared.etl.store import execution_seen, get_talend_config, record_event, record_incident, set_connector_error, set_health

log = logging.getLogger("pinghold.etl.talend")
_started_tenants: set[str] = set()


def _normalize(raw: dict[str, Any]) -> TalendRunEvent:
    run_id = raw.get("task_execution_id") or raw.get("taskExecutionId") or raw.get("runId") or raw.get("id")
    task_id = raw.get("task_id") or raw.get("taskId")
    return TalendRunEvent(
        task_id=task_id,
        task_name=raw.get("task_name") or raw.get("taskName") or raw.get("name"),
        artifact_name=raw.get("artifact_name") or raw.get("artifactName"),
        task_execution_id=str(run_id),
        status=str(raw.get("status") or "unknown"),
        start_time=raw.get("start_time") or raw.get("startTime"),
        finish_time=raw.get("finish_time") or raw.get("finishTime"),
        environment_id=raw.get("environment_id") or raw.get("environmentId"),
        workspace_id=raw.get("workspace_id") or raw.get("workspaceId"),
        engine_id=raw.get("engine_id") or raw.get("engineId"),
        engine_type=raw.get("engine_type") or raw.get("engineType"),
        error_message=raw.get("error_message") or raw.get("errorMessage") or raw.get("message"),
        rows_rejected=raw.get("rows_rejected") or raw.get("rowsRejected"),
        records_processed=raw.get("records_processed") or raw.get("recordsProcessed"),
        raw=raw,
    )


def poll_once(tenant_id: str, client: TalendClient | None = None) -> int:
    client = client or TalendClient(get_talend_config(tenant_id))
    if not client.configured:
        set_health(tenant_id, EtlIntegrationHealth(
            id="talend", name="Talend", status="not_configured", mode="live", configured=False
        ))
        return 0
    set_health(tenant_id, EtlIntegrationHealth(id="talend", name="Talend", status="ok", mode="live", configured=True))
    count = 0
    try:
        for raw in client.task_executions():
            run = _normalize(raw)
            if not run.task_execution_id or execution_seen(tenant_id, "talend", run.task_execution_id):
                continue
            metrics = client.component_metrics(run.task_execution_id)
            if metrics:
                run.metrics = metrics
                run.artifact_name = run.artifact_name or metrics.get("artifact_name") or metrics.get("artifactName")
                run.engine_id = run.engine_id or metrics.get("engine_id") or metrics.get("engineId")
                run.engine_type = run.engine_type or metrics.get("engine_type") or metrics.get("engineType")
            ce = collector.ingest(map_talend_run(run, tenant_id))
            record_event(tenant_id, ce)
            incident = incident_from_event(ce)
            if incident:
                record_incident(tenant_id, incident)
            count += 1
    except Exception as exc:
        log.warning("Talend poll failed: %s", exc)
        set_connector_error(tenant_id, "talend", str(exc))
    return count


def start(tenant_id: str) -> None:
    if tenant_id in _started_tenants or os.getenv("ETL_CONNECTOR_MODE", "live").lower() != "live":
        return
    interval = int(os.getenv("TALEND_POLL_INTERVAL_SECONDS", "60"))

    def _loop() -> None:
        while True:
            poll_once(tenant_id)
            time.sleep(interval)

    threading.Thread(target=_loop, daemon=True).start()
    _started_tenants.add(tenant_id)
    log.info("Talend poller started tenant=%s interval=%ss", tenant_id, interval)

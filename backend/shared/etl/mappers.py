from __future__ import annotations

import re

from datetime import datetime, timezone

from shared.collector.cloudevents import CloudEvent, make_event
from .dto import BoomiExecutionEvent, DatabricksRunEvent, EtlIncident, TalendRunEvent
from .store import now_iso


_TALEND_FAILED = {
    "execution_failed", "failed", "error", "timeout", "terminated",
    "deploy_failed", "DEPLOY_FAILED", "EXECUTION_FAILED", "FAILED",
    "ERROR", "TIMEOUT", "TERMINATED", "ABORTED", "CANCELLED",
}
_BOOMI_FAILED = {"ERROR", "ABORTED", "DISCARDED"}
_BOOMI_WARN = {"COMPLETE_WARN", "ABORTED_RECOVERING"}
_DATABRICKS_WARN = {"CANCELED", "CANCELLED", "SKIPPED", "EXCLUDED"}


def _slug(value: str) -> str:
    return re.sub(r"[^A-Za-z0-9]+", "-", value).strip("-").upper()[:32] or "UNKNOWN"


def _severity(status: str) -> str:
    s = status.upper()
    if s in _BOOMI_FAILED or status in _TALEND_FAILED or s in _TALEND_FAILED:
        return "critical"
    if s in _BOOMI_WARN or "warn" in status.lower():
        return "warning"
    return "info"


def _event_type(status: str) -> str:
    sev = _severity(status)
    if sev == "critical":
        return "etl.job.failed"
    if sev == "warning":
        return "etl.job.warning"
    if status.upper() in {"STARTED", "INPROCESS", "ENQUEUED"}:
        return "etl.job.running"
    return "etl.job.succeeded"


def map_talend_run(run: TalendRunEvent, tenant_id: str) -> CloudEvent:
    name = run.task_name or run.artifact_name or run.task_id or "Talend task"
    return make_event(
        source="talend",
        type=_event_type(run.status),
        tenant_id=tenant_id,
        correlationid=run.task_execution_id,
        data={
            "platform": "talend",
            "job_id": run.task_id,
            "job_name": name,
            "execution_id": run.task_execution_id,
            "status": run.status,
            "severity": _severity(run.status),
            "started_at": run.start_time,
            "ended_at": run.finish_time,
            "environment_id": run.environment_id,
            "workspace_id": run.workspace_id,
            "engine_id": run.engine_id,
            "engine_type": run.engine_type,
            "error_message": run.error_message,
            "records_processed": run.records_processed,
            "rows_rejected": run.rows_rejected,
            "metrics": run.metrics,
        },
    )


def map_boomi_execution(execution: BoomiExecutionEvent, tenant_id: str) -> CloudEvent:
    name = execution.process_name or execution.process_id or "Boomi process"
    return make_event(
        source="boomi",
        type=_event_type(execution.status),
        tenant_id=tenant_id,
        correlationid=execution.execution_id,
        data={
            "platform": "boomi",
            "job_id": execution.process_id,
            "job_name": name,
            "execution_id": execution.execution_id,
            "status": execution.status,
            "severity": _severity(execution.status),
            "started_at": execution.execution_time,
            "ended_at": execution.recorded_date,
            "runtime_id": execution.atom_id,
            "runtime_name": execution.atom_name,
            "execution_type": execution.execution_type,
            "error_message": execution.message,
            "duration_ms": execution.execution_duration,
            "records_processed": execution.inbound_document_count,
            "error_records": execution.inbound_error_document_count,
            "outbound_records": execution.outbound_document_count,
        },
    )


def _epoch_ms_iso(value: int | None) -> str | None:
    if not value:
        return None
    return datetime.fromtimestamp(value / 1000, tz=timezone.utc).isoformat()


def map_databricks_run(run: DatabricksRunEvent, tenant_id: str) -> CloudEvent:
    """Map Databricks lifecycle/result state into the shared ETL event contract."""
    result = (run.result_state or "").upper()
    lifecycle = run.life_cycle_state.upper()
    status = result or lifecycle
    if result == "SUCCESS":
        event_type, severity = "etl.job.succeeded", "info"
    elif result in _DATABRICKS_WARN:
        event_type, severity = "etl.job.warning", "warning"
    elif result or lifecycle == "INTERNAL_ERROR":
        event_type, severity = "etl.job.failed", "critical"
    else:
        event_type, severity = "etl.job.running", "info"

    duration = run.run_duration
    if duration is None and run.start_time and run.end_time:
        duration = max(0, run.end_time - run.start_time)
    name = run.job_name or run.run_name or f"Databricks job {run.job_id}"
    return make_event(
        source="databricks",
        type=event_type,
        tenant_id=tenant_id,
        correlationid=run.run_id,
        data={
            "platform": "databricks",
            "job_id": run.job_id,
            "job_name": name,
            "execution_id": run.run_id,
            "run_name": run.run_name,
            "status": status,
            "life_cycle_state": lifecycle,
            "result_state": result or None,
            "severity": severity,
            "started_at": _epoch_ms_iso(run.start_time),
            "ended_at": _epoch_ms_iso(run.end_time),
            "duration_ms": duration,
            "trigger": run.trigger,
            "run_page_url": run.run_page_url,
            "task_count": run.task_count,
            "failed_task_count": run.failed_task_count,
            "error_message": run.state_message if severity != "info" else None,
        },
    )


def incident_from_event(ce: CloudEvent) -> EtlIncident | None:
    if ce.type not in {"etl.job.failed", "etl.job.warning"}:
        return None
    platform = str(ce.data.get("platform") or ce.source)
    execution_id = str(ce.data.get("execution_id") or ce.correlationid or ce.id)
    job_name = str(ce.data.get("job_name") or "ETL job")
    error = str(ce.data.get("error_message") or "Execution reported an unsuccessful status")
    severity = str(ce.data.get("severity") or "critical")
    return EtlIncident(
        id=f"INC-{_slug(platform)}-{_slug(execution_id)}",
        tenant_id=ce.tenant_id or "default",
        platform=platform,
        execution_id=execution_id,
        title=f"{platform.title()} job issue: {job_name}",
        severity=severity,
        root_cause=error,
        recommended_action=f"Review {platform.title()} execution logs, validate upstream dependencies, and rerun {job_name}.",
        source_system=ce.data.get("source_system"),
        target_system=ce.data.get("target_system"),
        created_at=now_iso(),
    )

from __future__ import annotations

import logging
import os
import threading
import time
from typing import Any

from shared.collector import ingest as collector
from shared.etl.client import DatabricksJobsClient
from shared.etl.dto import (
    DatabricksRunDetail,
    DatabricksRunEvent,
    DatabricksRunTask,
    EtlIntegrationHealth,
)
from shared.etl.mappers import _epoch_ms_iso, incident_from_event, map_databricks_run
from shared.etl.store import execution_seen, record_event, record_incident, set_connector_error, set_health

log = logging.getLogger("pinghold.etl.databricks")
_started_tenants: set[str] = set()


def _task_failed(task: dict[str, Any]) -> bool:
    state = task.get("state") if isinstance(task.get("state"), dict) else {}
    return str(state.get("result_state") or "").upper() in {
        "FAILED", "TIMEDOUT", "INTERNAL_ERROR", "CANCELED", "CANCELLED",
    }


def _normalize(raw: dict[str, Any]) -> DatabricksRunEvent:
    state = raw.get("state") if isinstance(raw.get("state"), dict) else {}
    tasks = raw.get("tasks") if isinstance(raw.get("tasks"), list) else []
    job_id = raw.get("job_id")
    run_id = raw.get("run_id")
    return DatabricksRunEvent(
        job_id=str(job_id) if job_id is not None else "unknown",
        job_name=raw.get("run_name") or raw.get("job_name"),
        run_id=str(run_id) if run_id is not None else "",
        run_name=raw.get("run_name"),
        life_cycle_state=str(state.get("life_cycle_state") or "UNKNOWN"),
        result_state=str(state["result_state"]) if state.get("result_state") else None,
        state_message=state.get("state_message") or raw.get("state_message"),
        start_time=raw.get("start_time"),
        end_time=raw.get("end_time"),
        run_duration=raw.get("run_duration"),
        trigger=raw.get("trigger"),
        run_page_url=raw.get("run_page_url"),
        task_count=len(tasks),
        failed_task_count=sum(_task_failed(task) for task in tasks if isinstance(task, dict)),
        raw=raw,
    )


def _task_target(task: dict[str, Any]) -> tuple[str | None, str | None]:
    """What this task runs, as (kind, target).

    Databricks names the payload after the task type — notebook_task, spark_python_task,
    sql_task and a dozen more — so this looks for the shape rather than enumerating
    them, and an unrecognised task type degrades to its own name instead of vanishing.
    """
    for key, field in (("notebook_task", "notebook_path"), ("spark_python_task", "python_file"),
                       ("spark_jar_task", "main_class_name"), ("python_wheel_task", "entry_point"),
                       ("sql_task", "warehouse_id"), ("dbt_task", "project_directory"),
                       ("pipeline_task", "pipeline_id"), ("run_job_task", "job_id")):
        payload = task.get(key)
        if isinstance(payload, dict):
            value = payload.get(field)
            return key.replace("_task", ""), str(value) if value is not None else None
    return None, None


def run_detail(tenant_id: str, run_id: str,
               client: DatabricksJobsClient | None = None) -> DatabricksRunDetail:
    """One run and its tasks, normalized.

    The run list the poller reads carries a task *count*; the question a failed run is
    opened with is which task failed and why, which only `runs/get` answers.
    """
    client = client or DatabricksJobsClient(tenant_id)
    if not client.configured:
        return DatabricksRunDetail(run_id=run_id,
                                   error="Databricks is not connected for this organization.")
    try:
        raw = client.run_detail(run_id)
    except Exception as exc:
        return DatabricksRunDetail(run_id=run_id, error=f"{type(exc).__name__}: {exc}")
    if not raw:
        return DatabricksRunDetail(run_id=run_id, error=f"Databricks returned no run {run_id}.")

    run = _normalize(raw)
    tasks = raw.get("tasks") if isinstance(raw.get("tasks"), list) else []
    detail_tasks: list[DatabricksRunTask] = []
    for task in tasks:
        if not isinstance(task, dict):
            continue
        state = task.get("state") if isinstance(task.get("state"), dict) else {}
        kind, target = _task_target(task)
        start, end = task.get("start_time"), task.get("end_time")
        duration = task.get("execution_duration")
        if duration is None and start and end:
            duration = max(0, end - start)
        detail_tasks.append(DatabricksRunTask(
            task_key=str(task.get("task_key") or "task"),
            run_id=str(task.get("run_id")) if task.get("run_id") is not None else None,
            state=str(state.get("life_cycle_state")) if state.get("life_cycle_state") else None,
            result_state=str(state.get("result_state")) if state.get("result_state") else None,
            state_message=state.get("state_message"),
            started_at=_epoch_ms_iso(start),
            ended_at=_epoch_ms_iso(end),
            duration_ms=duration,
            cluster=str(task.get("existing_cluster_id") or "") or None,
            kind=kind,
            target=target,
            run_page_url=task.get("run_page_url"),
            depends_on=[str(d.get("task_key")) for d in (task.get("depends_on") or [])
                        if isinstance(d, dict) and d.get("task_key")],
        ))

    duration = run.run_duration
    if duration is None and run.start_time and run.end_time:
        duration = max(0, run.end_time - run.start_time)
    return DatabricksRunDetail(
        run_id=run.run_id or run_id,
        job_id=run.job_id or None,
        job_name=run.job_name,
        run_name=run.run_name,
        life_cycle_state=run.life_cycle_state,
        result_state=run.result_state,
        state_message=run.state_message,
        started_at=_epoch_ms_iso(run.start_time),
        ended_at=_epoch_ms_iso(run.end_time),
        duration_ms=duration,
        trigger=run.trigger,
        run_page_url=run.run_page_url,
        tasks=detail_tasks,
    )


def poll_once(tenant_id: str, client: DatabricksJobsClient | None = None) -> int:
    client = client or DatabricksJobsClient(tenant_id)
    if not client.configured:
        set_health(tenant_id, EtlIntegrationHealth(
            id="databricks", name="Databricks", status="not_configured", mode="live", configured=False
        ))
        return 0

    set_health(tenant_id, EtlIntegrationHealth(
        id="databricks", name="Databricks", status="ok", mode="live", configured=True
    ))
    count = 0
    try:
        for raw in client.job_runs():
            run = _normalize(raw)
            if not run.run_id:
                continue
            # A run can be observed several times while it changes state. Deduplicate the
            # state, not just the run id, so its terminal SUCCESS/FAILED event is retained.
            state_key = f"{run.run_id}:{run.life_cycle_state}:{run.result_state or ''}"
            if execution_seen(tenant_id, "databricks", state_key):
                continue
            ce = collector.ingest(map_databricks_run(run, tenant_id))
            record_event(tenant_id, ce)
            incident = incident_from_event(ce)
            if incident:
                record_incident(tenant_id, incident)
            count += 1
    except Exception as exc:
        log.warning("Databricks poll failed: %s", exc)
        set_connector_error(tenant_id, "databricks", str(exc))
    return count


def start(tenant_id: str) -> None:
    if tenant_id in _started_tenants or os.getenv("ETL_CONNECTOR_MODE", "live").lower() != "live":
        return
    interval = int(os.getenv("DATABRICKS_POLL_INTERVAL_SECONDS", "60"))

    def _loop() -> None:
        while True:
            poll_once(tenant_id)
            time.sleep(interval)

    threading.Thread(target=_loop, daemon=True).start()
    _started_tenants.add(tenant_id)
    log.info("Databricks poller started tenant=%s interval=%ss", tenant_id, interval)

from __future__ import annotations

from collections import defaultdict, deque
from datetime import datetime, timezone
from typing import Deque

from pydantic import BaseModel

from shared.collector.cloudevents import CloudEvent
from shared.core import config_store, databricks as databricks_config, record_store, state_store
from .dto import (
    BoomiConfig,
    EtlExecutionResponse,
    EtlIncident,
    EtlIntegrationHealth,
    EtlSummaryItem,
    IntegrationConfigStatus,
    TalendConfig,
)

_MAX_EVENTS = 500
_EVENT_STREAM = "etl-events"
_INCIDENT_STREAM = "etl-incidents"
_events: dict[str, Deque[CloudEvent]] = defaultdict(lambda: deque(maxlen=_MAX_EVENTS))
_incidents: dict[str, Deque[EtlIncident]] = defaultdict(lambda: deque(maxlen=_MAX_EVENTS))
_health: dict[str, dict[str, EtlIntegrationHealth]] = defaultdict(dict)
_executions: dict[str, Deque[EtlExecutionResponse]] = defaultdict(lambda: deque(maxlen=_MAX_EVENTS))
_seen_executions: dict[str, set[str]] = defaultdict(set)
_configs: dict[tuple[str, str], BaseModel] = {}
_health_hydrated: set[str] = set()
_exec_hydrated: set[str] = set()


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _hydrate_health(tenant_id: str) -> None:
    """Load persisted health into memory once per tenant (e.g. after a restart)."""
    if tenant_id in _health_hydrated:
        return
    _health_hydrated.add(tenant_id)
    for platform, raw in state_store.load_health(tenant_id).items():
        if platform not in _health[tenant_id]:
            _health[tenant_id][platform] = EtlIntegrationHealth.model_validate_json(raw)


def _persist_health(tenant_id: str, h: EtlIntegrationHealth) -> None:
    state_store.save_health(tenant_id, h.id, h.model_dump_json())


def _mask(value: str | None) -> str | None:
    if not value:
        return None
    if len(value) <= 6:
        return "***"
    return f"{value[:3]}...{value[-3:]}"


def save_platform_config(
    tenant_id: str,
    platform: str,
    display_name: str,
    config: BaseModel,
    secret_fields: frozenset[str] = frozenset(),
) -> IntegrationConfigStatus:
    """Generic persist for any ETL connector's config. See catalog.py for the field
    spec each platform is validated against before this is called."""
    _configs[(tenant_id, platform)] = config
    config_store.save_config(tenant_id, platform, config.model_dump_json())
    set_health(tenant_id, EtlIntegrationHealth(
        id=platform, name=display_name, status="ok", mode="live", configured=True
    ))
    return platform_config_status(tenant_id, platform, secret_fields)


def get_platform_config(tenant_id: str, platform: str, model_cls: type[BaseModel]) -> BaseModel | None:
    cfg = _configs.get((tenant_id, platform))
    if cfg is None:  # not in memory — try the persisted store (e.g. after a restart)
        raw = config_store.get_config(tenant_id, platform)
        if raw:
            cfg = _configs[(tenant_id, platform)] = model_cls.model_validate_json(raw)
    return cfg


def platform_config_status(
    tenant_id: str, platform: str, secret_fields: frozenset[str] = frozenset()
) -> IntegrationConfigStatus:
    cfg = _configs.get((tenant_id, platform))
    fields: dict[str, str | None] = {}
    if cfg:
        for key, value in cfg.model_dump().items():
            if value in (None, ""):
                fields[key] = None
            elif key in secret_fields:
                fields[key] = _mask(str(value)) or "***"
            else:
                fields[key] = str(value)
    return IntegrationConfigStatus(
        id=platform, configured=cfg is not None,
        source="frontend" if cfg else "unset", fields=fields,
    )


# Back-compat accessors — client.py and _summary_for_platform below only ever need the
# typed config, not the generic save/status path.
def get_talend_config(tenant_id: str) -> TalendConfig | None:
    return get_platform_config(tenant_id, "talend", TalendConfig)


def get_boomi_config(tenant_id: str) -> BoomiConfig | None:
    return get_platform_config(tenant_id, "boomi", BoomiConfig)


def execution_seen(tenant_id: str, platform: str, execution_id: str) -> bool:
    key = f"{platform}:{execution_id}"
    if key in _seen_executions[tenant_id]:
        return True
    # Memory cold after a restart — fall back to the persisted dedup set before treating as new.
    if state_store.is_seen(tenant_id, platform, execution_id):
        _seen_executions[tenant_id].add(key)
        return True
    _seen_executions[tenant_id].add(key)
    state_store.mark_seen(tenant_id, platform, execution_id)
    return False


def record_event(tenant_id: str, ce: CloudEvent) -> None:
    _events[tenant_id].appendleft(ce)
    record_store.append(tenant_id, _EVENT_STREAM, ce.model_dump(mode="json"))
    platform = str(ce.data.get("platform") or ce.source)
    h = _health[tenant_id].get(platform)
    if h:
        h.last_event_at = ce.timestamp
        h.events_24h += 1
        _persist_health(tenant_id, h)


def record_incident(tenant_id: str, incident: EtlIncident) -> None:
    _incidents[tenant_id].appendleft(incident)
    record_store.append(tenant_id, _INCIDENT_STREAM, incident.model_dump(mode="json"))
    h = _health[tenant_id].get(incident.platform)
    if h:
        h.failed_jobs += 1
        h.status = "degraded"
        _persist_health(tenant_id, h)


def record_execution(tenant_id: str, execution: EtlExecutionResponse) -> None:
    _executions[tenant_id].appendleft(execution)
    state_store.save_execution(tenant_id, execution.created_at, execution.id, execution.model_dump_json())


def _hydrate_executions(tenant_id: str) -> None:
    """Load persisted executions into memory once per tenant (e.g. after a restart)."""
    if tenant_id in _exec_hydrated:
        return
    _exec_hydrated.add(tenant_id)
    if _executions.get(tenant_id):
        return  # already have live records this process; don't double-load
    for raw in reversed(state_store.load_executions(tenant_id, _MAX_EVENTS)):
        _executions[tenant_id].appendleft(EtlExecutionResponse.model_validate_json(raw))


def execution_requests(tenant_id: str, limit: int = 50) -> list[EtlExecutionResponse]:
    _hydrate_executions(tenant_id)
    return list(_executions.get(tenant_id, ()))[:limit]


def find_execution(tenant_id: str, execution_id: str) -> EtlExecutionResponse | None:
    _hydrate_executions(tenant_id)
    for execution in _executions.get(tenant_id, ()):
        if execution.id == execution_id:
            return execution
    return None


def set_health(tenant_id: str, health: EtlIntegrationHealth) -> None:
    _hydrate_health(tenant_id)
    existing = _health[tenant_id].get(health.id)
    if existing:
        health.last_event_at = existing.last_event_at
        health.events_24h = existing.events_24h
        health.failed_jobs = existing.failed_jobs
        if existing.status == "degraded" and health.status == "ok":
            health.status = "degraded"
    _health[tenant_id][health.id] = health
    _persist_health(tenant_id, health)


def set_connector_error(tenant_id: str, platform: str, message: str) -> None:
    h = _health[tenant_id].get(platform)
    if not h:
        return
    h.status = "error"
    h.last_error = message
    _persist_health(tenant_id, h)


def events(tenant_id: str, limit: int = 50) -> list[CloudEvent]:
    # A dedicated stream avoids unrelated telemetry crowding ETL runs out of a bounded
    # read while keeping history visible across Lambda invocations.
    rows = record_store.recent(tenant_id, _EVENT_STREAM, limit)
    result: list[CloudEvent] = []
    for row in rows:
        try:
            event = CloudEvent.model_validate(row)
        except Exception:
            continue
        result.append(event)
    return result


def incidents(tenant_id: str, limit: int = 50) -> list[EtlIncident]:
    result: list[EtlIncident] = []
    for row in record_store.recent(tenant_id, _INCIDENT_STREAM, limit):
        try:
            result.append(EtlIncident.model_validate(row))
        except Exception:
            continue
    return result


def health(tenant_id: str) -> list[EtlIntegrationHealth]:
    _hydrate_health(tenant_id)
    return list(_health.get(tenant_id, {}).values())


def _summary_for_platform(tenant_id: str, platform: str, display_name: str) -> EtlSummaryItem:
    platform_events = [e for e in events(tenant_id, _MAX_EVENTS) if (e.data.get("platform") or e.source) == platform]
    # Pollers can emit RUNNING and then a terminal event for the same execution. Summary
    # metrics count executions, not state transitions; events are already newest-first.
    seen_executions: set[str] = set()
    unique_events: list[CloudEvent] = []
    for event in platform_events:
        execution_id = str(event.data.get("execution_id") or event.correlationid or event.id)
        if execution_id in seen_executions:
            continue
        seen_executions.add(execution_id)
        unique_events.append(event)
    platform_events = unique_events
    total = len(platform_events)
    failures = len([e for e in platform_events if e.type in {"etl.job.failed", "etl.job.warning"}])
    successes = len([e for e in platform_events if e.type == "etl.job.succeeded"])
    completed = successes + failures
    success_rate = round((successes / completed) * 100, 1) if completed else 0.0
    failure_rate = round((failures / completed) * 100, 1) if completed else 0.0
    last_event = platform_events[0] if platform_events else None
    health_item = _health.get(tenant_id, {}).get(platform)
    if platform == "talend":
        cfg = get_talend_config(tenant_id)
        env = (cfg.selected_env if cfg else "production").upper()
    elif platform == "boomi":
        cfg = get_boomi_config(tenant_id)
        env = (cfg.selected_env if cfg else "production").upper()
    else:
        env = "WORKSPACE"
    connector_status = health_item.status if health_item else "not_configured"
    if platform == "databricks" and connector_status == "not_configured" and databricks_config.jobs_configured(tenant_id):
        connector_status = "ok"
    return EtlSummaryItem(
        name=display_name,
        status=connector_status,
        jobsPerDay=total,
        successRate=success_rate,
        failureRate=failure_rate,
        lastRun=last_event.timestamp if last_event else "never",
        totalJobs=total,
        environments=[env],
    )


def summary(tenant_id: str) -> list[EtlSummaryItem]:
    _hydrate_health(tenant_id)
    return [
        _summary_for_platform(tenant_id, "talend", "Talend"),
        _summary_for_platform(tenant_id, "boomi", "Dell Boomi"),
        _summary_for_platform(tenant_id, "databricks", "Databricks"),
    ]

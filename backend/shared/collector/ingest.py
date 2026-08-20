"""EP:collector — normalize inbound signals to the canonical CloudEvent and publish on the bus.

Unlike the old engine (which published to a throwaway EventBus that never delivered), this publishes
on the shared singleton bus and keeps a tenant-scoped recent-events stream so delivery is observable.

That stream is not a debugging aid: alert clustering and correlated incidents are computed
from it. It lives in core/record_store rather than a process-local deque, because on
Lambda a deque empties at every cold start and two concurrent invocations see different
halves of the same storm.
"""

from __future__ import annotations

import logging

from shared.core import record_store
from shared.core.envelope import EventEnvelope, topic_name
from shared.core.eventbus import event_bus
from shared.core.kafka import kafka_sink
from .cloudevents import CloudEvent, make_event
from .dto import PagerDutyWebhook, ServiceNowWebhook, GenericEvent

log = logging.getLogger("pinghold.collector")

# How far back the clustering and correlation endpoints look. Their query parameters are
# capped at this too, so the two never disagree about what "recent" means.
RECENT_MAX = 50
STREAM = "events"


def _pagerduty_severity(incident: dict) -> str:
    return "critical" if str(incident.get("urgency", "")).lower() == "high" else "warning"


def _servicenow_severity(priority: int | None) -> str:
    return {1: "critical", 2: "error", 3: "warning"}.get(priority or 0, "info")


def map_pagerduty(w: PagerDutyWebhook, tenant_id: str) -> CloudEvent:
    inc = w.incident
    return make_event(
        source="pagerduty",
        type="external.pagerduty",
        tenant_id=tenant_id,
        correlationid=str(inc.get("id")) if inc.get("id") else None,
        data={
            "event_type": w.event_type,
            "severity": _pagerduty_severity(inc),
            "title": inc.get("title"),
            "description": inc.get("description"),
            "status": inc.get("status"),
            "service": (inc.get("service") or {}).get("name"),
            "incident_id": inc.get("id"),
        },
    )


def map_servicenow(w: ServiceNowWebhook, tenant_id: str) -> CloudEvent:
    return make_event(
        source="servicenow",
        type="external.servicenow",
        tenant_id=tenant_id,
        correlationid=w.number,
        data={
            "severity": _servicenow_severity(w.priority),
            "title": w.short_description,
            "description": w.description,
            "state": w.state,
            "assignment_group": w.assignment_group,
            "sys_id": w.sys_id,
            "number": w.number,
        },
    )


def map_generic(e: GenericEvent, tenant_id: str) -> CloudEvent:
    return make_event(
        source=e.source,
        type=e.event_type,
        tenant_id=tenant_id,
        data={
            "severity": e.severity,
            "title": e.title,
            "description": e.description,
            **(e.data or {}),
        },
    )


def ingest(ce: CloudEvent) -> CloudEvent:
    tenant = ce.tenant_id or "default"
    event_bus.publish(
        EventEnvelope(tenant_id=tenant, event_type=ce.type, source="EP:collector", data=ce.data)
    )
    # Live transport: forward to a per-tenant Kafka topic when a broker is configured.
    kafka_sink.publish(topic_name(tenant, "events.raw"), ce.model_dump(), key=ce.id)
    record_store.append(tenant, STREAM, ce.model_dump(mode="json"))
    return ce


def recent(tenant_id: str, limit: int = 20) -> list[CloudEvent]:
    """Most recent events first. Rows that no longer parse as a CloudEvent are skipped
    rather than failing the whole read — a schema change must not black out the alerts
    screen for events written before it."""
    events = []
    for row in record_store.recent(tenant_id, STREAM, min(limit, RECENT_MAX)):
        try:
            events.append(CloudEvent(**row))
        except Exception:
            log.warning("Skipping unparseable stored event for tenant %s", tenant_id)
    return events

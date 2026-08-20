from fastapi import APIRouter, Depends, Query

from shared.core.tenancy import get_tenant_id
from shared.collector.cloudevents import CloudEvent
from shared.collector.dto import PagerDutyWebhook, ServiceNowWebhook, GenericEvent
from shared.collector import ingest as collector

router = APIRouter(prefix="/api/v1", tags=["ingest"])


@router.post("/ingest/pagerduty", response_model=CloudEvent)
def ingest_pagerduty(body: PagerDutyWebhook, tenant_id: str = Depends(get_tenant_id)) -> CloudEvent:
    return collector.ingest(collector.map_pagerduty(body, tenant_id))


@router.post("/ingest/servicenow", response_model=CloudEvent)
def ingest_servicenow(body: ServiceNowWebhook, tenant_id: str = Depends(get_tenant_id)) -> CloudEvent:
    return collector.ingest(collector.map_servicenow(body, tenant_id))


@router.post("/ingest/events", response_model=CloudEvent)
def ingest_event(body: GenericEvent, tenant_id: str = Depends(get_tenant_id)) -> CloudEvent:
    return collector.ingest(collector.map_generic(body, tenant_id))


@router.get("/events", response_model=list[CloudEvent])
def recent_events(
    tenant_id: str = Depends(get_tenant_id),
    limit: int = Query(default=20, ge=1, le=50),
) -> list[CloudEvent]:
    """Recently ingested events for this tenant (proves bus delivery + tenant scoping)."""
    return collector.recent(tenant_id, limit)

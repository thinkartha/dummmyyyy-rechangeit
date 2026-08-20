from fastapi import APIRouter, Depends, Query

from shared.core.tenancy import get_tenant_id
from shared.core import alert_management
from shared.collector.ingest import recent
from shared.pipeline.event_correlation import analyze, CorrelationResult

router = APIRouter(prefix="/api/v1", tags=["correlation"])


@router.get("/correlated-incidents", response_model=CorrelationResult)
def correlated_incidents(
    tenant_id: str = Depends(get_tenant_id),
    min_group_size: int = Query(default=2, ge=1, le=20),
) -> CorrelationResult:
    """Dedup + correlate this tenant's recently ingested events into incidents (EP:correlator)."""
    events = alert_management.unsuppressed_events(tenant_id, recent(tenant_id, 50))
    return analyze(tenant_id, events, min_group_size)

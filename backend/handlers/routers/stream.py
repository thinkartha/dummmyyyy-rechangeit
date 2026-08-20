from fastapi import APIRouter, Depends

from shared.core.tenancy import get_tenant_id
from shared.pipeline.event_correlation import CorrelationResult, DedupResult
from shared.pipeline.stream import stream_incidents

router = APIRouter(prefix="/api/v1", tags=["stream"])


@router.get("/stream/incidents", response_model=CorrelationResult)
def streamed_incidents(tenant_id: str = Depends(get_tenant_id)) -> CorrelationResult:
    """Incidents the background Kafka consumer has correlated from the live event stream."""
    result = stream_incidents(tenant_id)
    if result is None:
        return CorrelationResult(tenantId=tenant_id, dedup=DedupResult(kept=0, removed=0), incidents=[])
    return result

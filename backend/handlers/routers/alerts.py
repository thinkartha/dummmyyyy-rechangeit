"""Alert clustering routes: collapse a storm into a few alerts, then brief an agent.

Clusters are computed from this tenant's recently ingested events (the same buffer
/api/v1/events reads). Callers with alerts elsewhere can POST them directly.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status

from shared.collector import ingest as collector
from shared.collector.cloudevents import CloudEvent
from shared.core import alert_management
from shared.core.tenancy import get_tenant_id
from shared.pipeline import alert_clustering as clustering
from shared.pipeline.alert_clustering import ClusterResult

router = APIRouter(prefix="/api/v1/alerts", tags=["alerts"])

# The recent-events buffer holds 50 per tenant; ask for all of it.
_BUFFER_LIMIT = 50


def _events(tenant_id: str, limit: int) -> list[CloudEvent]:
    return alert_management.unsuppressed_events(tenant_id, collector.recent(tenant_id, limit))


@router.get("/clusters", response_model=ClusterResult)
def get_clusters(
    tenant_id: str = Depends(get_tenant_id),
    limit: int = Query(_BUFFER_LIMIT, ge=1, le=_BUFFER_LIMIT),
) -> ClusterResult:
    """Cluster this tenant's recent alerts, worst and largest first."""
    return clustering.cluster_alerts(tenant_id, _events(tenant_id, limit))


@router.post("/clusters", response_model=ClusterResult)
def post_clusters(
    events: list[CloudEvent],
    tenant_id: str = Depends(get_tenant_id),
) -> ClusterResult:
    """Cluster a caller-supplied batch without ingesting it — for previewing what a
    storm from another system would collapse into."""
    if not events:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No events supplied")
    return clustering.cluster_alerts(tenant_id, alert_management.unsuppressed_events(tenant_id, events))


@router.get("/clusters/{cluster_id}/brief")
def get_agent_brief(
    cluster_id: str,
    tenant_id: str = Depends(get_tenant_id),
    limit: int = Query(_BUFFER_LIMIT, ge=1, le=_BUFFER_LIMIT),
) -> dict:
    """One cluster condensed for a coding agent: facts, deduplicated logs, and a
    ready-to-send prompt. No model is called here — the caller sends it to whichever
    agent they run."""
    events = _events(tenant_id, limit)
    cluster = next((c for c in clustering.cluster(events) if c.id == cluster_id), None)
    if cluster is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cluster not found")
    return clustering.agent_brief(cluster, events)

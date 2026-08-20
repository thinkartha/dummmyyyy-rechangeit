"""Serverless AI observability routes: Lambda ingestion + DynamoDB history."""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from shared.core import agents as agent_obs
from shared.core import agent_telemetry
from shared.core import coding_agent
from shared.core import record_store
from shared.core import observability as obs
from shared.core.auth import ROLE_ORG_ADMIN, ROLE_PLATFORM_ADMIN, Principal, get_current_principal
from shared.core.tenancy import get_tenant_id
from shared.pipeline import alert_clustering

router = APIRouter(prefix="/api/v1/observability", tags=["observability"])


class AgentTelemetryBatch(BaseModel):
    logs: list[dict[str, Any]] = Field(default_factory=list, max_length=200)
    spans: list[dict[str, Any]] = Field(default_factory=list, max_length=200)
    evaluations: list[dict[str, Any]] = Field(default_factory=list, max_length=200)


def _guard(fn, *args):
    """Turn optional upstream failures into honest status codes."""
    try:
        return fn(*args)
    except obs.NotConfigured as exc:
        raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail=str(exc)) from exc
    except obs.UpstreamError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
    except record_store.StorageUnavailable as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc


def _require_admin(principal: Principal = Depends(get_current_principal)) -> Principal:
    if not ({ROLE_ORG_ADMIN, ROLE_PLATFORM_ADMIN} & set(principal.roles)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sending incident data to a coding agent requires an org admin",
        )
    return principal


def _coding_guard(fn, *args):
    try:
        return fn(*args)
    except coding_agent.NotConfigured as exc:
        raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail=str(exc)) from exc
    except coding_agent.UpstreamError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc


@router.get("/status")
def get_status(tenant_id: str = Depends(get_tenant_id)) -> dict:
    """Health of Lambda ingestion and tenant-scoped DynamoDB storage."""
    return agent_obs.storage_status(tenant_id)


@router.get("/routes")
def get_routes(tenant_id: str = Depends(get_tenant_id)) -> list[dict]:
    """Per-operation request counts derived from stored telemetry."""
    return _guard(agent_obs.route_stats, tenant_id)


@router.get("/traces")
def get_traces(
    limit: int = Query(50, ge=1, le=200),
    tenant_id: str = Depends(get_tenant_id),
) -> list[dict]:
    """Recent stored traces, newest first."""
    return _guard(agent_obs.list_traces, limit, tenant_id)


@router.get("/traces/{trace_id}")
def get_trace_detail(trace_id: str, tenant_id: str = Depends(get_tenant_id)) -> list[dict]:
    """All spans of one trace, ordered parent-before-child for a waterfall."""
    spans = _guard(agent_obs.get_trace, trace_id, tenant_id)
    if not spans:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trace not found")
    return spans


# --- AI agents (durable Lambda/DynamoDB telemetry) ---------------------------

@router.post("/agents/telemetry", status_code=status.HTTP_201_CREATED)
def ingest_agent_telemetry(
    batch: AgentTelemetryBatch,
    tenant_id: str = Depends(get_tenant_id),
) -> dict[str, Any]:
    """Persist logs, spans, and evaluations before acknowledging the request."""
    try:
        return agent_telemetry.ingest(tenant_id, batch.logs, batch.spans, batch.evaluations)
    except agent_telemetry.InvalidTelemetry as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    except record_store.StorageUnavailable as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc


@router.get("/agents/summary")
def get_agent_summary(tenant_id: str = Depends(get_tenant_id)) -> dict:
    """Headline agent numbers: fleet health, traffic, tokens, cost."""
    return _guard(agent_obs.summary, tenant_id)


@router.get("/agents/logs")
def get_agent_logs(
    limit: int = Query(100, ge=1, le=1000),
    tenant_id: str = Depends(get_tenant_id),
) -> list[dict[str, Any]]:
    """Recent durable AI/gateway logs, newest first."""
    return _guard(agent_telemetry.logs, tenant_id, limit)


@router.get("/agents")
def get_agents(tenant_id: str = Depends(get_tenant_id)) -> list[dict]:
    """One row per agent, busiest first."""
    return _guard(agent_obs.agent_stats, tenant_id)


@router.get("/agents/providers")
def get_provider_usage(tenant_id: str = Depends(get_tenant_id)) -> list[dict]:
    """Token and request share per LLM provider."""
    return _guard(agent_obs.provider_usage, tenant_id)


@router.get("/agents/tokens")
def get_token_timeseries(tenant_id: str = Depends(get_tenant_id)) -> list[dict]:
    """Hourly input/output token totals, oldest first."""
    return _guard(agent_obs.token_timeseries, tenant_id)


@router.get("/agents/gateway")
def get_ai_gateway_stats(tenant_id: str = Depends(get_tenant_id)) -> dict:
    """Per-model LLM traffic derived asynchronously from stored spans."""
    return _guard(agent_obs.ai_gateway_stats, tenant_id)


@router.get("/agents/workflows")
def get_agent_workflows(
    limit: int = Query(50, ge=1, le=200),
    tenant_id: str = Depends(get_tenant_id),
) -> list[dict]:
    """Multi-step agent runs derived from traces, newest first."""
    return _guard(agent_obs.agent_workflows, limit, tenant_id)


@router.get("/agents/evaluations")
def get_agent_evaluations(
    limit: int = Query(100, ge=1, le=200),
    tenant_id: str = Depends(get_tenant_id),
) -> dict:
    """Recent agent observations and their stored evaluation annotations."""
    return _guard(agent_obs.agent_evaluations, limit, tenant_id)


@router.get("/agents/incidents")
def get_agent_incidents(
    limit: int = Query(50, ge=1, le=200),
    tenant_id: str = Depends(get_tenant_id),
) -> list[dict]:
    """Recent failed agent spans, newest first."""
    return _guard(agent_obs.agent_incidents, limit, tenant_id)


def _agent_incident_cluster(
    tenant_id: str,
    cluster_id: str,
    limit: int,
) -> tuple[alert_clustering.AlertCluster, list]:
    events = _guard(agent_obs.agent_incident_events, tenant_id, limit)
    cluster = next((item for item in alert_clustering.cluster(events) if item.id == cluster_id), None)
    if cluster is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident cluster not found")
    return cluster, events


@router.get("/agents/incidents/clusters", response_model=alert_clustering.ClusterResult)
def get_agent_incident_clusters(
    limit: int = Query(200, ge=1, le=1000),
    tenant_id: str = Depends(get_tenant_id),
) -> alert_clustering.ClusterResult:
    """Collapse similar failed stored spans into one agent incident each."""
    events = _guard(agent_obs.agent_incident_events, tenant_id, limit)
    return alert_clustering.cluster_alerts(tenant_id, events)


@router.get("/agents/incidents/clusters/{cluster_id}/brief")
def get_agent_incident_brief(
    cluster_id: str,
    limit: int = Query(200, ge=1, le=1000),
    tenant_id: str = Depends(get_tenant_id),
) -> dict:
    """Condensed agent failures and a repo-oriented coding-agent prompt."""
    cluster, events = _agent_incident_cluster(tenant_id, cluster_id, limit)
    return alert_clustering.agent_brief(cluster, events)


@router.post("/agents/incidents/clusters/{cluster_id}/dispatch", status_code=status.HTTP_202_ACCEPTED)
def dispatch_agent_incident(
    cluster_id: str,
    limit: int = Query(200, ge=1, le=1000),
    tenant_id: str = Depends(get_tenant_id),
    _: Principal = Depends(_require_admin),
) -> dict:
    """Send the condensed brief to the configured coding-agent job endpoint."""
    cluster, events = _agent_incident_cluster(tenant_id, cluster_id, limit)
    brief = alert_clustering.agent_brief(cluster, events)
    return _coding_guard(coding_agent.dispatch, tenant_id, brief)


@router.get("/agents/incidents/dispatches")
def get_agent_incident_dispatches(
    cluster_id: str | None = None,
    limit: int = Query(20, ge=1, le=100),
    tenant_id: str = Depends(get_tenant_id),
) -> list[dict]:
    return coding_agent.history(tenant_id, cluster_id, limit)

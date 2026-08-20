"""FastAPI router for ELK Stack operations."""

from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import logging

from shared.core.tenancy import get_tenant_id
from shared.elk.otel import OTLPLog, OTLPMetric, OTLPSpan, OTLPConverter
from shared.elk.indexer import LogIndexer, MetricsIndexer, TracesIndexer
from shared.elk.queries import QueryService
from shared.elk.client import ElasticsearchNotConfigured, get_elasticsearch_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["elk"])

# Singleton instances
_log_indexer = LogIndexer()
_metrics_indexer = MetricsIndexer()
_traces_indexer = TracesIndexer()
_query_service = QueryService()


def _get_initialized_log_indexer(tenant_id: str) -> LogIndexer:
    """Get log indexer initialized for tenant."""
    _log_indexer.initialize(tenant_id)
    return _log_indexer


def _get_initialized_metrics_indexer(tenant_id: str) -> MetricsIndexer:
    """Get metrics indexer initialized for tenant."""
    _metrics_indexer.initialize(tenant_id)
    return _metrics_indexer


def _get_initialized_traces_indexer(tenant_id: str) -> TracesIndexer:
    """Get traces indexer initialized for tenant."""
    _traces_indexer.initialize(tenant_id)
    return _traces_indexer


# Data models for API
class LogRequest(BaseModel):
    """Incoming log request."""
    message: str
    level: Optional[str] = "INFO"
    logger: Optional[str] = None
    attributes: Optional[dict] = None
    trace_id: Optional[str] = None
    span_id: Optional[str] = None


class MetricRequest(BaseModel):
    """Incoming metric request."""
    name: str
    value: float
    unit: Optional[str] = ""
    attributes: Optional[dict] = None


class SpanRequest(BaseModel):
    """Incoming trace span request."""
    trace_id: str
    span_id: str
    parent_span_id: Optional[str] = None
    name: str
    kind: Optional[str] = "INTERNAL"
    start_time: str  # ISO format
    end_time: str  # ISO format
    status_code: Optional[str] = "UNSET"
    attributes: Optional[dict] = None


class SearchResponse(BaseModel):
    """Search response."""
    total: int
    hits: List[dict]


@router.post("/logs/ingest")
async def ingest_log(
    log: LogRequest,
    tenant_id: str = Depends(get_tenant_id),
) -> dict:
    """Ingest a log entry."""
    try:
        indexer = _get_initialized_log_indexer(tenant_id)
        doc_id = indexer.index_log(log.model_dump())
        return {"id": doc_id, "status": "ingested"}
    except Exception as e:
        logger.error(f"Failed to ingest log: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/logs/ingest-batch")
async def ingest_logs_batch(
    logs: List[LogRequest],
    tenant_id: str = Depends(get_tenant_id),
) -> dict:
    """Batch ingest logs."""
    try:
        indexer = _get_initialized_log_indexer(tenant_id)
        log_dicts = [log.model_dump() for log in logs]
        success, errors = indexer.bulk_index_logs(log_dicts)
        return {
            "indexed": success,
            "errors": len(errors),
            "status": "batched"
        }
    except Exception as e:
        logger.error(f"Failed to batch ingest logs: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/metrics/ingest")
async def ingest_metric(
    metric: MetricRequest,
    tenant_id: str = Depends(get_tenant_id),
) -> dict:
    """Ingest a metric."""
    try:
        indexer = _get_initialized_metrics_indexer(tenant_id)
        doc_id = indexer.index_metric(metric.model_dump())
        return {"id": doc_id, "status": "ingested"}
    except Exception as e:
        logger.error(f"Failed to ingest metric: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/metrics/ingest-batch")
async def ingest_metrics_batch(
    metrics: List[MetricRequest],
    tenant_id: str = Depends(get_tenant_id),
) -> dict:
    """Batch ingest metrics."""
    try:
        indexer = _get_initialized_metrics_indexer(tenant_id)
        metric_dicts = [m.model_dump() for m in metrics]
        success, errors = indexer.bulk_index_metrics(metric_dicts)
        return {
            "indexed": success,
            "errors": len(errors),
            "status": "batched"
        }
    except Exception as e:
        logger.error(f"Failed to batch ingest metrics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/traces/ingest")
async def ingest_span(
    span: SpanRequest,
    tenant_id: str = Depends(get_tenant_id),
) -> dict:
    """Ingest a trace span."""
    try:
        indexer = _get_initialized_traces_indexer(tenant_id)
        doc_id = indexer.index_span(span.model_dump())
        return {"id": doc_id, "status": "ingested"}
    except Exception as e:
        logger.error(f"Failed to ingest span: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/traces/ingest-batch")
async def ingest_spans_batch(
    spans: List[SpanRequest],
    tenant_id: str = Depends(get_tenant_id),
) -> dict:
    """Batch ingest trace spans."""
    try:
        indexer = _get_initialized_traces_indexer(tenant_id)
        span_dicts = [s.model_dump() for s in spans]
        success, errors = indexer.bulk_index_spans(span_dicts)
        return {
            "indexed": success,
            "errors": len(errors),
            "status": "batched"
        }
    except Exception as e:
        logger.error(f"Failed to batch ingest spans: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/logs/search", response_model=SearchResponse)
async def search_logs(
    q: str = Query("*", description="Search query"),
    level: Optional[str] = None,
    service: Optional[str] = None,
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    tenant_id: str = Depends(get_tenant_id),
) -> dict:
    """Search logs."""
    try:
        result = _query_service.search_logs(
            tenant_id=tenant_id,
            query=q,
            level=level,
            service=service,
            limit=limit,
            offset=offset,
        )
        return {
            "total": result["hits"]["total"]["value"],
            "hits": [hit["_source"] for hit in result["hits"]["hits"]]
        }
    except ElasticsearchNotConfigured:
        return {"total": 0, "hits": []}
    except Exception as e:
        logger.error(f"Search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/metrics/search", response_model=SearchResponse)
async def search_metrics(
    metric_name: Optional[str] = None,
    service: Optional[str] = None,
    limit: int = Query(100, ge=1, le=1000),
    tenant_id: str = Depends(get_tenant_id),
) -> dict:
    """Search metrics."""
    try:
        result = _query_service.search_metrics(
            tenant_id=tenant_id,
            metric_name=metric_name,
            service=service,
            limit=limit,
        )
        return {
            "total": result["hits"]["total"]["value"],
            "hits": [hit["_source"] for hit in result["hits"]["hits"]]
        }
    except ElasticsearchNotConfigured:
        return {"total": 0, "hits": []}
    except Exception as e:
        logger.error(f"Search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/traces/search", response_model=SearchResponse)
async def search_traces(
    trace_id: Optional[str] = None,
    service: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = Query(100, ge=1, le=1000),
    tenant_id: str = Depends(get_tenant_id),
) -> dict:
    """Search traces."""
    try:
        result = _query_service.search_traces(
            tenant_id=tenant_id,
            trace_id=trace_id,
            service=service,
            status=status,
            limit=limit,
        )
        return {
            "total": result["hits"]["total"]["value"],
            "hits": [hit["_source"] for hit in result["hits"]["hits"]]
        }
    except ElasticsearchNotConfigured:
        return {"total": 0, "hits": []}
    except Exception as e:
        logger.error(f"Search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health/es")
async def health_check() -> dict:
    """Check Elasticsearch cluster health."""
    try:
        client = get_elasticsearch_client()
        health = client.health()
        return {
            "status": "healthy",
            "elasticsearch": health
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=503, detail=str(e))

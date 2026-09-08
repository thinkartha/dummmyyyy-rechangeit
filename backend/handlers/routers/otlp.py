"""OTLP/HTTP ingest — onboarding a tenant that already runs OpenTelemetry.

Point an OTel Collector (or an SDK exporter) at this router's base URL:

    exporters:
      otlphttp:
        endpoint: https://<api>/api/v1/otlp
        encoding: json
        headers: {X-API-Key: <tenant api key>}

The exporter appends /v1/traces, /v1/metrics and /v1/logs itself, so the paths below
are the standard ones. Payloads are converted by shared/elk/otlp.py and written to the
same Elasticsearch indices as the native ingest routes in elk.py — no other wiring.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request

from shared.core.tenancy import get_tenant_id
from shared.elk import otlp
from shared.elk.client import ElasticsearchNotConfigured
from shared.elk.indexer import LogIndexer, MetricsIndexer, TracesIndexer

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/otlp", tags=["otlp"])

_INDEXERS = {
    "traces": (TracesIndexer(), otlp.traces, "bulk_index_spans"),
    "metrics": (MetricsIndexer(), otlp.metrics, "bulk_index_metrics"),
    "logs": (LogIndexer(), otlp.logs, "bulk_index_logs"),
}

# tenant -> signal -> {"at": iso, "count": n}. In-process only: this answers "is my
# collector actually reaching you?" during onboarding, which is a live question.
# ponytail: lost on restart and per-worker. Persist it when it becomes a real SLA view.
_LAST_SEEN: dict[str, dict[str, dict]] = {}


async def _ingest(request: Request, signal: str, tenant_id: str) -> dict:
    indexer, convert, bulk = _INDEXERS[signal]
    try:
        payload = await request.json()
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Body is not OTLP JSON: {exc}") from exc
    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="Body is not an OTLP JSON object.")
    docs = convert(payload)
    if not docs:
        # An empty export is normal collector behaviour, not an error.
        return {"partialSuccess": {}}
    try:
        indexer.initialize(tenant_id)
        indexed, errors = getattr(indexer, bulk)(docs)
    except ElasticsearchNotConfigured as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        logger.error("OTLP %s ingest failed: %s", signal, exc)
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    _LAST_SEEN.setdefault(tenant_id, {})[signal] = {
        "at": datetime.now(timezone.utc).isoformat(),
        "count": indexed,
    }
    if errors:
        # OTLP's own way of saying "kept some, dropped some" — the collector retries
        # nothing on a 200, which is right: a rejected span is not a transient failure.
        return {"partialSuccess": {"rejectedDataPoints": len(errors),
                                   "errorMessage": f"{len(errors)} of {len(docs)} {signal} rejected"}}
    return {"partialSuccess": {}}


@router.post("/v1/traces")
async def ingest_traces(request: Request, tenant_id: str = Depends(get_tenant_id)) -> dict:
    return await _ingest(request, "traces", tenant_id)


@router.post("/v1/metrics")
async def ingest_metrics(request: Request, tenant_id: str = Depends(get_tenant_id)) -> dict:
    return await _ingest(request, "metrics", tenant_id)


@router.post("/v1/logs")
async def ingest_logs(request: Request, tenant_id: str = Depends(get_tenant_id)) -> dict:
    return await _ingest(request, "logs", tenant_id)


@router.get("/status")
def otlp_status(request: Request, tenant_id: str = Depends(get_tenant_id)) -> dict:
    """Endpoint to configure, plus what has actually arrived — the onboarding check."""
    base = str(request.url_for("ingest_traces")).removesuffix("/v1/traces")
    seen = _LAST_SEEN.get(tenant_id, {})
    return {
        "endpoint": base,
        "protocol": "otlp/http",
        "encoding": "json",
        "auth_header": "X-API-Key",
        "signals": {s: seen.get(s) for s in _INDEXERS},
        "connected": bool(seen),
    }

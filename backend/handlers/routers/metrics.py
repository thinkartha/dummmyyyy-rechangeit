"""Cloud metric ingest and read.

The ingest half speaks Kinesis Data Firehose's HTTP endpoint contract, which is fussy in
ways that matter: the response body must echo the delivery's `requestId` and carry a
`timestamp`, and any status other than 200 makes Firehose retry the whole delivery and
eventually park it in the destination's S3 backup bucket. So a bad key is a 401 (retrying
will not help, and the operator needs to see it), a storage failure is a 500 (retrying
will help), and anything we merely could not parse is a 200 with the good records kept.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Body, Depends, Header, HTTPException, Query, Request, status
from fastapi.responses import JSONResponse

from shared.aws import metric_alerts, metric_stream
from shared.core import record_store
from shared.core.auth import ROLE_ORG_ADMIN, ROLE_PLATFORM_ADMIN, Principal, get_current_principal
from shared.core.tenancy import get_tenant_id

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/integrations/aws/metrics", tags=["cloud-metrics"])

# Firehose authenticates with its own access key and cannot present a session, so this
# router is registered outside the app-wide auth dependency — the same split gateways.py
# makes for the APISIX telemetry endpoint. A separate router rather than a per-route
# exemption is what keeps "which routes are unauthenticated" answerable from api.py.
ingest_router = APIRouter(prefix="/api/v1/integrations/aws/metrics", tags=["cloud-metrics"])


def _require_admin(principal: Principal = Depends(get_current_principal)) -> Principal:
    """Minting an ingest key hands out a credential that writes into this tenant's
    telemetry. Reading the metrics back is open to the org."""
    if not ({ROLE_ORG_ADMIN, ROLE_PLATFORM_ADMIN} & set(principal.roles)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This action requires an org admin or platform admin role",
        )
    return principal


def _since(hours: float) -> datetime:
    return datetime.now(timezone.utc) - timedelta(hours=hours)


def _firehose_response(request_id: str, error: str | None = None, code: int = 200):
    """Firehose reads only these three fields, and rejects a body without requestId."""
    body = {"requestId": request_id,
            "timestamp": int(datetime.now(timezone.utc).timestamp() * 1000)}
    if error:
        body["errorMessage"] = error
    return JSONResponse(status_code=code, content=body)


@ingest_router.post("/stream", include_in_schema=False)
async def ingest_metric_stream(
    request: Request,
    x_amz_firehose_request_id: str | None = Header(default=None, alias="X-Amz-Firehose-Request-Id"),
    x_amz_firehose_access_key: str | None = Header(default=None, alias="X-Amz-Firehose-Access-Key"),
):
    """Kinesis Data Firehose HTTP destination for a CloudWatch Metric Stream.

    Unauthenticated in the usual sense — Firehose cannot carry a Cognito token — so the
    access key *is* the tenant, and no other credential is consulted.
    """
    try:
        body = await request.json()
    except Exception:
        body = None
    if not isinstance(body, dict):
        return _firehose_response(x_amz_firehose_request_id or "", "Body is not a Firehose JSON envelope", 400)
    request_id = str(body.get("requestId") or x_amz_firehose_request_id or "")
    try:
        result = metric_stream.ingest(body, x_amz_firehose_access_key)
    except metric_stream.InvalidKey as exc:
        # 401, not 400: retrying an unknown key never succeeds, and this is the one
        # failure the customer can fix from their side.
        return _firehose_response(request_id, str(exc), 401)
    except record_store.StorageUnavailable as exc:
        # 500 so Firehose retries. Acknowledging data this process then dropped is the
        # only outcome with no recovery path.
        logger.error("metric stream storage failure: %s", exc)
        return _firehose_response(request_id, "Storage unavailable, retry", 500)
    logger.info("metric stream: stored %s rows for %s", result["stored"], result["tenant_id"])
    return _firehose_response(request_id)


@router.get("/key")
def get_ingest_key(
    tenant_id: str = Depends(get_tenant_id),
    _: Principal = Depends(_require_admin),
) -> dict:
    """This tenant's Firehose access key, plus whether anything has actually arrived."""
    record = metric_stream.ingest_key(tenant_id)
    return {
        "key": record["key"],
        "created_at": record.get("created_at"),
        "receiving": metric_stream.configured(tenant_id),
    }


@router.post("/key/rotate")
def rotate_ingest_key(
    tenant_id: str = Depends(get_tenant_id),
    _: Principal = Depends(_require_admin),
) -> dict:
    record = metric_stream.rotate_key(tenant_id)
    return {"key": record["key"], "created_at": record.get("created_at"), "receiving": False}


@router.get("/summary")
def get_summary(
    hours: float = Query(default=3, ge=0.1, le=720),
    tenant_id: str = Depends(get_tenant_id),
) -> dict:
    """Which AWS services are reporting, per account — the service-coverage table."""
    return metric_stream.summary(tenant_id, _since(hours))


@router.get("/catalog")
def get_catalog(
    hours: float = Query(default=3, ge=0.1, le=720),
    tenant_id: str = Depends(get_tenant_id),
) -> list[dict]:
    """Every (namespace, metric) seen, for a metric picker."""
    return metric_stream.catalog(tenant_id, _since(hours))


@router.get("/resources")
def get_resources(
    hours: float = Query(default=3, ge=0.1, le=720),
    tenant_id: str = Depends(get_tenant_id),
) -> list[dict]:
    """One row per distinct resource the stream has described."""
    return metric_stream.resources(tenant_id, _since(hours))


@router.get("/conditions")
def list_conditions(tenant_id: str = Depends(get_tenant_id)) -> list[dict]:
    """Threshold rules on streamed metrics, with what each is currently doing."""
    return metric_alerts.status(tenant_id)


@router.post("/conditions", status_code=status.HTTP_201_CREATED)
def create_condition(
    body: metric_alerts.MetricCondition,
    tenant_id: str = Depends(get_tenant_id),
    _: Principal = Depends(_require_admin),
) -> dict:
    """Add a threshold rule.

    Evaluated on the metric-stream write path rather than on a timer — see
    shared/aws/metric_alerts — so a new rule takes effect on the next delivery.
    """
    if body.comparison not in metric_alerts.COMPARISONS:
        raise HTTPException(status_code=422,
                            detail=f"comparison must be one of {sorted(metric_alerts.COMPARISONS)}")
    if body.severity not in metric_alerts.SEVERITIES:
        raise HTTPException(status_code=422,
                            detail=f"severity must be one of {list(metric_alerts.SEVERITIES)}")
    return metric_alerts.create_condition(tenant_id, body)


# response_model=None is load-bearing: this module uses `from __future__ import
# annotations`, so `-> None` reaches FastAPI as the string "None" and is taken for a
# response model, which a 204 is not allowed to have. The other routers get away with
# the bare annotation only because they do not postpone theirs.
@router.delete("/conditions/{condition_id}", status_code=status.HTTP_204_NO_CONTENT,
               response_model=None)
def delete_condition(
    condition_id: str,
    tenant_id: str = Depends(get_tenant_id),
    _: Principal = Depends(_require_admin),
) -> None:
    if not metric_alerts.delete_condition(tenant_id, condition_id):
        raise HTTPException(status_code=404, detail=f"No condition {condition_id}")


@router.get("/series")
def get_series(
    namespace: str = Query(...),
    metric: str = Query(...),
    hours: float = Query(default=3, ge=0.1, le=720),
    statistic: str = Query(default="avg", pattern="^(avg|min|max|sum|count)$"),
    dimension_id: str | None = Query(default=None, alias="dimensionId"),
    tenant_id: str = Depends(get_tenant_id),
) -> list[dict]:
    """One metric over time, oldest first."""
    return metric_stream.series(tenant_id, namespace, metric, since=_since(hours),
                                dimension_id=dimension_id, statistic=statistic)

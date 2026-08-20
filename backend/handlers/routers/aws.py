from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query

from shared.aws.dto import AwsLambdaConfig, AwsLambdaInvocationResponse, AwsLambdaInvokeRequest, AwsLambdaOverview
from shared.aws.lambda_service import (
    anomaly_events,
    config_status,
    find_invocation,
    invocation_history,
    invoke_lambda,
    lambda_overview,
    retry_invocation,
    save_config,
)
from shared.collector import ingest as collector
from shared.collector.cloudevents import CloudEvent
from shared.core.tenancy import get_tenant_id

router = APIRouter(prefix="/api/v1/integrations/aws", tags=["aws"])


@router.put("/lambda/config")
def configure_lambda(body: AwsLambdaConfig, tenant_id: str = Depends(get_tenant_id)) -> dict:
    return save_config(tenant_id, body)


@router.get("/lambda/config")
def get_lambda_config_status(tenant_id: str = Depends(get_tenant_id)) -> dict:
    return config_status(tenant_id)


@router.get("/lambda/overview", response_model=AwsLambdaOverview)
def get_lambda_overview(tenant_id: str = Depends(get_tenant_id)) -> AwsLambdaOverview:
    return lambda_overview(tenant_id)


@router.post("/lambda/poll", response_model=list[CloudEvent])
def poll_lambda_anomalies(tenant_id: str = Depends(get_tenant_id)) -> list[CloudEvent]:
    return [collector.ingest(event) for event in anomaly_events(tenant_id)]


@router.post("/lambda/invoke", response_model=AwsLambdaInvocationResponse)
def invoke_lambda_function(
    body: AwsLambdaInvokeRequest, tenant_id: str = Depends(get_tenant_id)
) -> AwsLambdaInvocationResponse:
    response, event = invoke_lambda(tenant_id, body)
    ingested = collector.ingest(event)
    response.event_id = ingested.id
    if response.status == "failed":
        raise HTTPException(status_code=502, detail=response.model_dump(by_alias=True))
    return response


@router.get("/lambda/invocations", response_model=list[AwsLambdaInvocationResponse])
def get_lambda_invocations(
    tenant_id: str = Depends(get_tenant_id),
    limit: int = Query(default=50, ge=1, le=200),
) -> list[AwsLambdaInvocationResponse]:
    return invocation_history(tenant_id, limit)


@router.post("/lambda/invocations/{invocation_id}/retry", response_model=AwsLambdaInvocationResponse)
def retry_lambda_invocation(
    invocation_id: str,
    tenant_id: str = Depends(get_tenant_id),
    dry_run: bool = Query(default=True),
) -> AwsLambdaInvocationResponse:
    if not find_invocation(tenant_id, invocation_id):
        raise HTTPException(status_code=404, detail=f"Lambda invocation {invocation_id} not found")
    response, event = retry_invocation(tenant_id, invocation_id, dry_run)
    ingested = collector.ingest(event)
    response.event_id = ingested.id
    if response.status == "failed":
        raise HTTPException(status_code=502, detail=response.model_dump(by_alias=True))
    return response

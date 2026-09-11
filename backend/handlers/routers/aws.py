from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query

from shared.aws.dto import AwsLambdaConfig, AwsLambdaInvocationResponse, AwsLambdaInvokeRequest, AwsLambdaOverview
from shared.aws import changes as change_tracking
from shared.aws.inventory import AwsInventoryReport, inventory
from shared.aws.lambda_service import (
    add_config,
    anomaly_events,
    config_status,
    connector_identity,
    delete_config,
    find_invocation,
    get_config,
    invocation_history,
    invoke_lambda,
    lambda_overview,
    list_config_status,
    retry_invocation,
    save_config,
    test_connection,
)
from shared.collector import ingest as collector
from shared.collector.cloudevents import CloudEvent
from shared.core.tenancy import get_tenant_id

router = APIRouter(prefix="/api/v1/integrations/aws", tags=["aws"])


@router.put("/lambda/config")
def configure_lambda(body: AwsLambdaConfig, tenant_id: str = Depends(get_tenant_id)) -> dict:
    """Save the tenant's primary AWS connection — the single-account form's route.

    Kept as-is now that a tenant can connect several accounts: with no id in the body it
    updates the first connection, which is what this route has always done. Adding one is
    POST /connections, so "add an account" can never overwrite an existing credential.
    """
    return save_config(tenant_id, body)


@router.get("/lambda/config")
def get_lambda_config_status(
    tenant_id: str = Depends(get_tenant_id),
    connection_id: str | None = Query(default=None, alias="connectionId"),
) -> dict:
    return config_status(tenant_id, connection_id)


@router.get("/connections")
def list_aws_connections(tenant_id: str = Depends(get_tenant_id)) -> list[dict]:
    """Every AWS account this tenant has connected, secrets masked."""
    return list_config_status(tenant_id)


@router.post("/connections")
def add_aws_connection(body: AwsLambdaConfig, tenant_id: str = Depends(get_tenant_id)) -> dict:
    """Connect another AWS account. Always creates; never touches an existing one."""
    return add_config(tenant_id, body)


@router.put("/connections/{connection_id}")
def update_aws_connection(
    connection_id: str, body: AwsLambdaConfig, tenant_id: str = Depends(get_tenant_id)
) -> dict:
    if not get_config(tenant_id, connection_id):
        raise HTTPException(status_code=404, detail=f"AWS connection {connection_id} not found")
    return save_config(tenant_id, body, connection_id)


@router.delete("/connections/{connection_id}")
def delete_aws_connection(connection_id: str, tenant_id: str = Depends(get_tenant_id)) -> dict:
    if not delete_config(tenant_id, connection_id):
        raise HTTPException(status_code=404, detail=f"AWS connection {connection_id} not found")
    return {"deleted": connection_id}


@router.get("/connector-identity")
def get_connector_identity() -> dict:
    """The ARN a customer's cross-account role has to trust, plus the trust policy.

    Handed to the browser so the connect form can show it: the role this deployment runs
    as is deliberately unnamed (a named IAM role forces a replacement on some stack
    updates), so without this a customer cannot write the trust policy at all.
    """
    return connector_identity()


@router.post("/test")
def test_aws_connection(
    tenant_id: str = Depends(get_tenant_id),
    connection_id: str | None = Query(default=None, alias="connectionId"),
) -> dict:
    """Probe the saved credential and report what it can actually do.

    POST rather than GET because it calls out to AWS on every request and is deliberately
    not cached — it exists to be pressed after changing something.
    """
    return test_connection(tenant_id, connection_id)


@router.get("/lambda/overview", response_model=AwsLambdaOverview)
def get_lambda_overview(
    tenant_id: str = Depends(get_tenant_id),
    connection_id: str | None = Query(default=None, alias="connectionId"),
) -> AwsLambdaOverview:
    return lambda_overview(tenant_id, connection_id)


@router.get("/inventory", response_model=AwsInventoryReport)
def get_aws_inventory(
    tenant_id: str = Depends(get_tenant_id),
    role_name: str | None = Query(default=None, alias="roleName"),
    connection_id: str | None = Query(default=None, alias="connectionId"),
) -> AwsInventoryReport:
    """DNS, CDN, buckets, alarms and IAM users for every account the credential reaches.

    Accounts come from `organizations:ListAccounts` on the connected credential — nothing
    is registered here — and each one is read through `roleName` (default
    `OrganizationAccountAccessRole`). A standalone account returns one row with
    `organization: false`, which is an answer rather than an error.
    """
    return inventory(tenant_id, role_name=role_name, connection_id=connection_id)


@router.get("/changes")
def get_aws_changes(
    tenant_id: str = Depends(get_tenant_id),
    limit: int = Query(default=100, ge=1, le=500),
) -> list[dict]:
    """Resources added, removed or modified since the last inventory read."""
    return change_tracking.recent(tenant_id, limit)


@router.post("/changes/scan", response_model=list[CloudEvent])
def scan_aws_changes(
    tenant_id: str = Depends(get_tenant_id),
    role_name: str | None = Query(default=None, alias="roleName"),
    connection_id: str | None = Query(default=None, alias="connectionId"),
) -> list[CloudEvent]:
    """Re-read the inventory, diff it against the stored snapshot, raise what changed.

    A POST because it takes a baseline: the first call for an account records nothing and
    only snapshots, and every call after it moves the comparison point forward. That is a
    write, and it should not happen because somebody opened a page twice.
    """
    report = inventory(tenant_id, role_name=role_name, connection_id=connection_id)
    found = change_tracking.record(tenant_id, report)
    return [collector.ingest(event) for event in change_tracking.events(tenant_id, found)]


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

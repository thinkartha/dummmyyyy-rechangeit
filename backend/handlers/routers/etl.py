from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query

from shared.collector import ingest as collector
from shared.collector.cloudevents import CloudEvent, make_event
from shared.core.tenancy import get_tenant_id
from shared.etl.dto import (
    BoomiConfig,
    BoomiExecutionEvent,
    DatabricksRunEvent,
    EtlExecuteRequest,
    EtlExecutionResponse,
    EtlIncident,
    EtlIntegrationHealth,
    EtlSummaryItem,
    IntegrationConfigStatus,
    TalendConfig,
    TalendRunEvent,
)
from shared.etl.mappers import incident_from_event, map_boomi_execution, map_databricks_run, map_talend_run
from shared.etl.client import BoomiClient, DatabricksJobsClient, TalendClient
from shared.etl.pollers import boomi, databricks, talend
from shared.etl.store import events as stored_events
from shared.etl.store import boomi_config_status, get_boomi_config, get_talend_config, save_boomi_config, save_talend_config, talend_config_status
from shared.etl.store import health as stored_health
from shared.etl.store import incidents as stored_incidents
from shared.etl.store import execution_requests, find_execution, now_iso, record_event, record_execution, record_incident, set_connector_error, set_health
from shared.etl.store import summary as stored_summary

router = APIRouter(prefix="/api/v1/integrations/etl", tags=["etl"])


def _record(tenant_id: str, ce: CloudEvent) -> CloudEvent:
    ingested = collector.ingest(ce)
    record_event(tenant_id, ingested)
    incident = incident_from_event(ingested)
    if incident:
        record_incident(tenant_id, incident)
    return ingested


def _provider_launch(platform: str, body: EtlExecuteRequest, tenant_id: str, fallback_execution_id: str) -> dict[str, object]:
    if platform == "talend":
        client = TalendClient(get_talend_config(tenant_id))
        return client.launch_task(
            body.job_id or "",
            parameters=body.parameters,
            fallback_execution_id=fallback_execution_id,
        )
    if platform == "boomi":
        client = BoomiClient(get_boomi_config(tenant_id))
        return client.launch_process(
            body.job_id or "",
            parameters=body.parameters,
            fallback_execution_id=fallback_execution_id,
        )
    if platform == "databricks":
        client = DatabricksJobsClient(tenant_id)
        return client.launch_job(
            body.job_id or "",
            parameters=body.parameters,
            fallback_execution_id=fallback_execution_id,
        )
    raise RuntimeError(f"Unsupported ETL platform {platform}")


def _execute(platform: str, display_name: str, body: EtlExecuteRequest, tenant_id: str) -> EtlExecutionResponse:
    fallback_execution_id = f"{platform}-exec-{uuid.uuid4().hex[:10]}"
    job_name = body.job_name or body.job_id or f"{display_name} job"
    provider_response: dict[str, object] | None = None
    execution_id = fallback_execution_id
    execution_status = "dry_run_started"
    event_type = "etl.job.started"
    event_status = "started"
    message = f"{display_name} execution recorded as a dry run. No external provider job was launched."

    if not body.dry_run:
        try:
            provider_response = _provider_launch(platform, body, tenant_id, fallback_execution_id)
            execution_id = str(provider_response.get("execution_id") or fallback_execution_id)
            provider_status = str(provider_response.get("status") or "submitted")
            execution_status = provider_status
            event_status = provider_status
            message = f"{display_name} execution launched by provider and recorded in Loveheartbeat."
        except Exception as exc:
            execution_status = "launch_failed"
            event_type = "etl.job.failed"
            event_status = "launch_failed"
            provider_response = {"error": str(exc)}
            message = f"{display_name} execution launch failed: {exc}"
            set_connector_error(tenant_id, platform, str(exc))

    ce = make_event(
        source=platform,
        type=event_type,
        tenant_id=tenant_id,
        correlationid=execution_id,
        data={
            "platform": platform,
            "job_id": body.job_id,
            "job_name": job_name,
            "execution_id": execution_id,
            "status": event_status,
            "severity": "critical" if event_type == "etl.job.failed" else "info",
            "environment": body.environment,
            "parameters": body.parameters,
            "requested_by": body.requested_by,
            "dry_run": body.dry_run,
            "provider_response": provider_response,
            "error_message": provider_response.get("error") if provider_response else None,
        },
    )
    ingested = _record(tenant_id, ce)
    response = EtlExecutionResponse(
        id=execution_id,
        tenant_id=tenant_id,
        platform=platform,
        job_id=body.job_id,
        job_name=job_name,
        status=execution_status,
        requested_by=body.requested_by,
        dry_run=body.dry_run,
        message=message,
        created_at=now_iso(),
        event_id=ingested.id,
        provider_response=provider_response,
    )
    record_execution(tenant_id, response)
    if execution_status == "launch_failed":
        # detail must be a string: the frontend surfaces `detail` as the error message.
        # The full execution record is still persisted and retrievable via GET /executions.
        raise HTTPException(status_code=502, detail=response.message)
    return response


@router.post("/talend", response_model=CloudEvent)
def ingest_talend(body: TalendRunEvent, tenant_id: str = Depends(get_tenant_id)) -> CloudEvent:
    return _record(tenant_id, map_talend_run(body, tenant_id))


@router.post("/boomi", response_model=CloudEvent)
def ingest_boomi(body: BoomiExecutionEvent, tenant_id: str = Depends(get_tenant_id)) -> CloudEvent:
    return _record(tenant_id, map_boomi_execution(body, tenant_id))


@router.post("/databricks", response_model=CloudEvent)
def ingest_databricks(body: DatabricksRunEvent, tenant_id: str = Depends(get_tenant_id)) -> CloudEvent:
    return _record(tenant_id, map_databricks_run(body, tenant_id))


@router.post("/talend/execute", response_model=EtlExecutionResponse)
def execute_talend(body: EtlExecuteRequest, tenant_id: str = Depends(get_tenant_id)) -> EtlExecutionResponse:
    return _execute("talend", "Talend", body, tenant_id)


@router.post("/boomi/execute", response_model=EtlExecutionResponse)
def execute_boomi(body: EtlExecuteRequest, tenant_id: str = Depends(get_tenant_id)) -> EtlExecutionResponse:
    return _execute("boomi", "Dell Boomi", body, tenant_id)


@router.post("/databricks/execute", response_model=EtlExecutionResponse)
def execute_databricks(body: EtlExecuteRequest, tenant_id: str = Depends(get_tenant_id)) -> EtlExecutionResponse:
    return _execute("databricks", "Databricks", body, tenant_id)


@router.post("/executions/{execution_id}/retry", response_model=EtlExecutionResponse)
def retry_execution(
    execution_id: str,
    tenant_id: str = Depends(get_tenant_id),
    dry_run: bool = Query(default=False, description="Re-run without launching a real provider job"),
) -> EtlExecutionResponse:
    """Re-run a previously recorded execution. Platform/job are read from the persisted record;
    the retry is itself recorded as a new execution."""
    prior = find_execution(tenant_id, execution_id)
    if not prior:
        raise HTTPException(status_code=404, detail=f"Execution {execution_id} not found")
    display = {
        "talend": "Talend",
        "boomi": "Dell Boomi",
        "databricks": "Databricks",
    }.get(prior.platform, prior.platform.title())
    body = EtlExecuteRequest(
        job_id=prior.job_id, job_name=prior.job_name, dry_run=dry_run, requested_by=prior.requested_by
    )
    return _execute(prior.platform, display, body, tenant_id)


@router.put("/talend/config", response_model=IntegrationConfigStatus)
def configure_talend(body: TalendConfig, tenant_id: str = Depends(get_tenant_id)) -> IntegrationConfigStatus:
    status = save_talend_config(tenant_id, body)
    # Start monitoring immediately after a successful UI configuration instead
    # of waiting for an application restart.
    talend.start(tenant_id)
    return status


@router.get("/talend/config", response_model=IntegrationConfigStatus)
def get_talend_config_status(tenant_id: str = Depends(get_tenant_id)) -> IntegrationConfigStatus:
    return talend_config_status(tenant_id)


@router.post("/talend/config/test")
def test_talend_config(
    body: TalendConfig | None = None,
    tenant_id: str = Depends(get_tenant_id),
) -> dict[str, str | bool]:
    client = TalendClient(body or get_talend_config(tenant_id))
    if not client.configured:
        raise HTTPException(
            status_code=422,
            detail="Talend requires a Bearer token (or a server-configured token) and an environment or workspace ID",
        )
    try:
        client.verify_connection()
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Talend connection failed: {exc}",
        ) from exc
    return {
        "id": "talend",
        "configured": client.configured,
        "endpoint": client.base_url,
        "message": "Talend credentials and observability access verified",
    }


@router.put("/boomi/config", response_model=IntegrationConfigStatus)
def configure_boomi(body: BoomiConfig, tenant_id: str = Depends(get_tenant_id)) -> IntegrationConfigStatus:
    return save_boomi_config(tenant_id, body)


@router.get("/boomi/config", response_model=IntegrationConfigStatus)
def get_boomi_config_status(tenant_id: str = Depends(get_tenant_id)) -> IntegrationConfigStatus:
    return boomi_config_status(tenant_id)


@router.post("/boomi/config/test")
def test_boomi_config(body: BoomiConfig) -> dict[str, str | bool]:
    client = BoomiClient(body)
    return {
        "id": "boomi",
        "configured": client.configured,
        "endpoint": client.base_url,
        "message": "Configuration has required fields" if client.configured else "Missing required Boomi fields",
    }


@router.post("/databricks/config/test")
def test_databricks_config(tenant_id: str = Depends(get_tenant_id)) -> dict[str, str | bool]:
    client = DatabricksJobsClient(tenant_id)
    if not client.configured:
        raise HTTPException(status_code=422, detail="Databricks requires a workspace host and token")
    try:
        client.verify_connection()
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Databricks Jobs connection failed: {exc}") from exc
    return {
        "id": "databricks",
        "configured": True,
        "endpoint": client.base_url,
        "message": "Databricks credentials and Jobs API access verified",
    }


@router.post("/talend/poll")
def poll_talend(tenant_id: str = Depends(get_tenant_id)) -> dict[str, int]:
    return {"ingested": talend.poll_once(tenant_id)}


@router.post("/boomi/poll")
def poll_boomi(tenant_id: str = Depends(get_tenant_id)) -> dict[str, int]:
    return {"ingested": boomi.poll_once(tenant_id)}


@router.post("/databricks/poll")
def poll_databricks(tenant_id: str = Depends(get_tenant_id)) -> dict[str, int]:
    return {"ingested": databricks.poll_once(tenant_id)}


def _demo_talend(success: bool, tenant_id: str) -> CloudEvent:
    if success:
        return map_talend_run(TalendRunEvent(
            task_id="talend-customer-sync", task_name="Customer Sync",
            task_execution_id=f"talend-demo-success-{uuid.uuid4().hex[:6]}",
            status="execution_success", records_processed=12840,
        ), tenant_id)
    return map_talend_run(TalendRunEvent(
        task_id="talend-order-load", task_name="Order Load",
        task_execution_id=f"talend-demo-failed-{uuid.uuid4().hex[:6]}",
        status="execution_failed",
        error_message="Source schema mismatch: customer_status missing",
        records_processed=3910,
    ), tenant_id)


def _demo_boomi(success: bool, tenant_id: str) -> CloudEvent:
    if success:
        return map_boomi_execution(BoomiExecutionEvent.model_validate({
            "executionId": f"boomi-demo-success-{uuid.uuid4().hex[:6]}",
            "processId": "boomi-invoice-integration", "processName": "Invoice Integration",
            "status": "COMPLETE", "message": "Completed successfully",
            "inboundDocumentCount": 312, "outboundDocumentCount": 312,
        }), tenant_id)
    return map_boomi_execution(BoomiExecutionEvent.model_validate({
        "executionId": f"boomi-demo-error-{uuid.uuid4().hex[:6]}",
        "processId": "boomi-netsuite-sap", "processName": "NetSuite to SAP Sync",
        "status": "ERROR", "atomName": "prod-atom-1",
        "message": "Connector timeout while calling NetSuite API",
        "inboundDocumentCount": 84, "inboundErrorDocumentCount": 9,
    }), tenant_id)


@router.post("/demo-seed")
def seed_demo(
    tenant_id: str = Depends(get_tenant_id),
    count: int = Query(default=2, ge=0, le=200, description="Number of (successful) jobs to seed"),
    incidents: int = Query(default=2, ge=0, le=200, description="Number of failed jobs (each also creates an incident)"),
) -> dict[str, int]:
    set_health(tenant_id, EtlIntegrationHealth(
        id="talend", name="Talend", status="ok", mode="demo", configured=True
    ))
    set_health(tenant_id, EtlIntegrationHealth(
        id="boomi", name="Dell Boomi", status="ok", mode="demo", configured=True
    ))
    builders = [_demo_talend, _demo_boomi]  # alternate platforms
    samples = [builders[i % 2](True, tenant_id) for i in range(count)]
    samples += [builders[i % 2](False, tenant_id) for i in range(incidents)]
    for ce in samples:
        _record(tenant_id, ce)
    return {"count": count, "incidents": incidents, "seeded": len(samples)}


@router.get("/events", response_model=list[CloudEvent])
def etl_events(
    tenant_id: str = Depends(get_tenant_id),
    limit: int = Query(default=50, ge=1, le=200),
) -> list[CloudEvent]:
    return stored_events(tenant_id, limit)


@router.get("/incidents", response_model=list[EtlIncident])
def etl_incidents(
    tenant_id: str = Depends(get_tenant_id),
    limit: int = Query(default=50, ge=1, le=200),
) -> list[EtlIncident]:
    return stored_incidents(tenant_id, limit)


@router.get("/health", response_model=list[EtlIntegrationHealth])
def etl_health(tenant_id: str = Depends(get_tenant_id)) -> list[EtlIntegrationHealth]:
    return stored_health(tenant_id)


@router.get("/summary", response_model=list[EtlSummaryItem])
def etl_summary(tenant_id: str = Depends(get_tenant_id)) -> list[EtlSummaryItem]:
    return stored_summary(tenant_id)


@router.get("/executions", response_model=list[EtlExecutionResponse])
def etl_executions(
    tenant_id: str = Depends(get_tenant_id),
    limit: int = Query(default=50, ge=1, le=200),
) -> list[EtlExecutionResponse]:
    return execution_requests(tenant_id, limit)

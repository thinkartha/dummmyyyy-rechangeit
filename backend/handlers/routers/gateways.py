"""API gateway routes: per-tenant gateway credentials, traffic and health.

Every route is scoped to the caller's tenant, resolved from the verified JWT claim by
get_tenant_id — never from anything the client sends.
"""

from typing import Any

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, Field

from shared.core import customer_gateways as customer_gw
from shared.core import gateways as gw
from shared.core.observability import NotConfigured, UpstreamError
from shared.core.tenancy import get_tenant_id

router = APIRouter(prefix="/api/v1/gateways", tags=["gateways"])
customer_agent_router = APIRouter(prefix="/api/v1/gateways", tags=["customer gateways"])
telemetry_router = APIRouter(prefix="/api/v1", tags=["telemetry"])


class GatewayConfigRequest(BaseModel):
    provider: str = Field(min_length=1, max_length=32)
    # Shape varies per provider (see gateways.CATALOG); validated against the catalog
    # in save_config rather than duplicated as eight pydantic models.
    fields: dict[str, Any] = Field(default_factory=dict)


def _guard(fn, *args, **kwargs):
    """Not-configured is a 501 (this tenant connected no gateway), unreachable is a 502
    (it is connected and broken). Collapsing both into 500 would make 'connect a
    gateway' indistinguishable from 'Kong is down'."""
    try:
        return fn(*args, **kwargs)
    except NotConfigured as exc:
        raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except UpstreamError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc


@router.get("/catalog")
def get_catalog() -> list[dict]:
    """Supported gateways and the connection form each needs. Free/OSS ones first."""
    return gw.catalog()


# --- config -----------------------------------------------------------------

@router.get("/config")
def get_config(tenant_id: str = Depends(get_tenant_id)) -> dict:
    """This tenant's gateway connection. Secrets are fingerprinted, never returned."""
    return gw.masked_config(tenant_id)


@router.put("/config")
def put_config(
    body: GatewayConfigRequest,
    tenant_id: str = Depends(get_tenant_id),
) -> dict:
    """Save the connection, then immediately report whether it works."""
    _guard(gw.save_config, tenant_id, body.provider, body.fields)
    return gw.status(tenant_id)


@router.delete("/config")
def delete_config(
    tenant_id: str = Depends(get_tenant_id),
) -> dict:
    """Disconnect, falling back to the deployment default if one is set."""
    gw.delete_config(tenant_id)
    return gw.masked_config(tenant_id)


# --- telemetry --------------------------------------------------------------

@router.get("/status")
def get_status(tenant_id: str = Depends(get_tenant_id)) -> dict:
    """Whether this tenant's gateway is connected and answering. Never raises."""
    return gw.status(tenant_id)


@router.get("/summary")
def get_summary(tenant_id: str = Depends(get_tenant_id)) -> dict:
    """Fleet totals across every route."""
    return _guard(gw.summary, tenant_id)


@router.get("/routes")
def get_routes(tenant_id: str = Depends(get_tenant_id)) -> list[dict]:
    """Per-route requests, errors and latency, busiest first."""
    return _guard(gw.route_stats, tenant_id)


# --- customer-hosted APISIX onboarding ----------------------------------------

class CustomerGatewayOrigin(BaseModel):
    scheme: str = "https"
    hostname: str
    port: int = 443
    host_header: str | None = None
    tls_server_name: str | None = None


class CustomerGatewayRequest(BaseModel):
    name: str
    public_hostname: str
    deployment_type: str
    origin: CustomerGatewayOrigin


class GatewayEnrollmentRequest(BaseModel):
    gateway_id: str | None = None
    token: str


class GatewayHeartbeatRequest(BaseModel):
    status: str | None = None


@router.post("/customer")
def create_customer_gateway(
    body: CustomerGatewayRequest,
    tenant_id: str = Depends(get_tenant_id),
) -> dict:
    """Create a hosted gateway record and issue a one-time enrollment token."""
    try:
        return customer_gw.create_gateway(tenant_id, body.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/customer/{gateway_id}")
def get_customer_gateway(gateway_id: str, tenant_id: str = Depends(get_tenant_id)) -> dict:
    try:
        return customer_gw.get_gateway_config(tenant_id, gateway_id)
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@customer_agent_router.post("/enroll")
def enroll_customer_gateway(
    body: GatewayEnrollmentRequest,
) -> dict:
    """Exchange the one-time enrollment token for a unique gateway credential."""
    try:
        return customer_gw.enroll_gateway(body.gateway_id, body.token)
    except (KeyError, ValueError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@customer_agent_router.get("/{gateway_id}/config")
def get_customer_gateway_config(
    gateway_id: str,
    x_gateway_credential: str | None = Header(default=None, alias="X-Gateway-Credential"),
) -> dict:
    try:
        return customer_gw.get_agent_config(gateway_id, x_gateway_credential)
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc


@customer_agent_router.post("/{gateway_id}/heartbeat")
def gateway_heartbeat(
    gateway_id: str,
    body: GatewayHeartbeatRequest,
    x_gateway_credential: str | None = Header(default=None, alias="X-Gateway-Credential"),
) -> dict:
    try:
        return customer_gw.heartbeat(gateway_id, x_gateway_credential, body.model_dump())
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc


@router.post("/{gateway_id}/validate-cutover")
def validate_gateway_cutover(
    gateway_id: str,
    body: dict | None = None,
    tenant_id: str = Depends(get_tenant_id),
) -> dict:
    payload = body or {}
    try:
        return customer_gw.validate_cutover(
            tenant_id,
            gateway_id,
            gateway_address=str(payload.get("gateway_address") or "").strip() or None,
            mode=str(payload.get("mode") or "dns"),
        )
    except KeyError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@telemetry_router.post("/telemetry/apisix")
def ingest_apisix_telemetry(
    payload: dict,
    x_gateway_credential: str | None = Header(default=None, alias="X-Gateway-Credential"),
) -> dict:
    try:
        if not x_gateway_credential:
            raise PermissionError("Gateway credential is required")
        return customer_gw.ingest_telemetry(payload, x_gateway_credential)
    except (KeyError, ValueError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

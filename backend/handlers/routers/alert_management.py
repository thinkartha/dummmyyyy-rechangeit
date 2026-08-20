"""Tenant-scoped SLA, routing and maintenance-window operations."""

from typing import Any, Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from shared.collector import ingest as collector
from shared.collector.cloudevents import CloudEvent
from shared.core import alert_management
from shared.core.tenancy import get_tenant_id

router = APIRouter(prefix="/api/v1/alert-management", tags=["alert-management"])


def _guard(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except alert_management.NotFound as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Not found: {exc.args[0]}") from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc


class SlaRuleRequest(BaseModel):
    priority: Literal["P1", "P2", "P3", "P4"]
    target_minutes: int = Field(ge=1, le=10080)
    enabled: bool = True


class SlaRulePatch(BaseModel):
    target_minutes: int | None = Field(default=None, ge=1, le=10080)
    enabled: bool | None = None


class RoutingRuleRequest(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    severity: str = Field(default="", max_length=32)
    source: str = Field(default="", max_length=100)
    category: str = Field(default="", max_length=100)
    team: str = Field(min_length=1, max_length=100)
    assignee: str = Field(default="", max_length=100)
    escalation_minutes: int = Field(default=15, ge=1, le=10080)
    notification_channels: list[str] = Field(default_factory=list, max_length=20)
    enabled: bool = True
    priority: int = Field(default=1, ge=1, le=100)


class RoutingRulePatch(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    severity: str | None = Field(default=None, max_length=32)
    source: str | None = Field(default=None, max_length=100)
    category: str | None = Field(default=None, max_length=100)
    team: str | None = Field(default=None, min_length=1, max_length=100)
    assignee: str | None = Field(default=None, max_length=100)
    escalation_minutes: int | None = Field(default=None, ge=1, le=10080)
    notification_channels: list[str] | None = Field(default=None, max_length=20)
    enabled: bool | None = None
    priority: int | None = Field(default=None, ge=1, le=100)


class MaintenanceWindowRequest(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=2000)
    start_time: str
    end_time: str
    affected_services: list[str] = Field(default_factory=list, max_length=100)
    recurrence: str = Field(default="One-time", max_length=100)


class MaintenanceWindowPatch(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    start_time: str | None = None
    end_time: str | None = None
    affected_services: list[str] | None = Field(default=None, max_length=100)
    recurrence: str | None = Field(default=None, max_length=100)


def _fields(body: BaseModel) -> dict[str, Any]:
    return body.model_dump(exclude_unset=True, exclude_none=True)


@router.get("/alerts", response_model=list[CloudEvent])
def get_active_alert_source(
    tenant_id: str = Depends(get_tenant_id),
    limit: int = Query(50, ge=1, le=50),
) -> list[CloudEvent]:
    """Recent alert events after applying maintenance-window suppression."""
    return alert_management.unsuppressed_events(tenant_id, collector.recent(tenant_id, limit))


@router.get("/sla")
def get_sla_dashboard(
    tenant_id: str = Depends(get_tenant_id),
    limit: int = Query(50, ge=1, le=50),
) -> dict:
    events = alert_management.unsuppressed_events(tenant_id, collector.recent(tenant_id, limit))
    return alert_management.sla_dashboard(tenant_id, events)


@router.post("/sla/rules", status_code=status.HTTP_201_CREATED)
def post_sla_rule(body: SlaRuleRequest, tenant_id: str = Depends(get_tenant_id)) -> dict:
    return _guard(alert_management.create_sla_rule, tenant_id, body.model_dump())


@router.patch("/sla/rules/{rule_id}")
def patch_sla_rule(rule_id: str, body: SlaRulePatch, tenant_id: str = Depends(get_tenant_id)) -> dict:
    return _guard(alert_management.update_sla_rule, tenant_id, rule_id, _fields(body))


@router.delete("/sla/rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_sla_rule(rule_id: str, tenant_id: str = Depends(get_tenant_id)) -> None:
    _guard(alert_management.delete_sla_rule, tenant_id, rule_id)


@router.get("/routing-rules")
def get_routing_rules(tenant_id: str = Depends(get_tenant_id)) -> list[dict]:
    return alert_management.list_routing_rules(tenant_id)


@router.post("/routing-rules", status_code=status.HTTP_201_CREATED)
def post_routing_rule(body: RoutingRuleRequest, tenant_id: str = Depends(get_tenant_id)) -> dict:
    return _guard(alert_management.create_routing_rule, tenant_id, body.model_dump())


@router.patch("/routing-rules/{rule_id}")
def patch_routing_rule(
    rule_id: str, body: RoutingRulePatch, tenant_id: str = Depends(get_tenant_id)
) -> dict:
    return _guard(alert_management.update_routing_rule, tenant_id, rule_id, _fields(body))


@router.delete("/routing-rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_routing_rule(rule_id: str, tenant_id: str = Depends(get_tenant_id)) -> None:
    _guard(alert_management.delete_routing_rule, tenant_id, rule_id)


@router.post("/routing-rules/{rule_id}/test")
def test_routing_rule(
    rule_id: str,
    tenant_id: str = Depends(get_tenant_id),
    limit: int = Query(50, ge=1, le=50),
) -> dict:
    return _guard(
        alert_management.test_routing_rule,
        tenant_id,
        rule_id,
        collector.recent(tenant_id, limit),
    )


@router.get("/maintenance-windows")
def get_maintenance_windows(tenant_id: str = Depends(get_tenant_id)) -> list[dict]:
    return alert_management.list_maintenance_windows(tenant_id, collector.recent(tenant_id, 50))


@router.post("/maintenance-windows", status_code=status.HTTP_201_CREATED)
def post_maintenance_window(
    body: MaintenanceWindowRequest, tenant_id: str = Depends(get_tenant_id)
) -> dict:
    return _guard(alert_management.create_maintenance_window, tenant_id, body.model_dump())


@router.patch("/maintenance-windows/{window_id}")
def patch_maintenance_window(
    window_id: str, body: MaintenanceWindowPatch, tenant_id: str = Depends(get_tenant_id)
) -> dict:
    return _guard(alert_management.update_maintenance_window, tenant_id, window_id, _fields(body))


@router.post("/maintenance-windows/{window_id}/{action}")
def change_maintenance_state(
    window_id: str,
    action: Literal["start", "end"],
    tenant_id: str = Depends(get_tenant_id),
) -> dict:
    return _guard(alert_management.set_maintenance_state, tenant_id, window_id, action)


@router.delete("/maintenance-windows/{window_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_maintenance_window(window_id: str, tenant_id: str = Depends(get_tenant_id)) -> None:
    _guard(alert_management.delete_maintenance_window, tenant_id, window_id)

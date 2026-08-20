"""AI automation routes: rules, ML model registry, predictive insights, agents.

Reads are open to the org; anything that changes automation behaviour — enabling a rule,
approving an insight, minting an agent key — requires an admin, because those decisions
act on the whole tenant's infrastructure.
"""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel, Field

from shared.core import automation
from shared.core.auth import ROLE_ORG_ADMIN, ROLE_PLATFORM_ADMIN, Principal, get_current_principal
from shared.core.tenancy import get_tenant_id

router = APIRouter(prefix="/api/v1/automation", tags=["automation"])


def _require_admin(principal: Principal = Depends(get_current_principal)) -> Principal:
    if not ({ROLE_ORG_ADMIN, ROLE_PLATFORM_ADMIN} & set(principal.roles)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This action requires an org admin or platform admin role",
        )
    return principal


def _guard(fn, *args, **kwargs):
    """Missing id is a 404, bad input a 400, storage failure a 502 — collapsing them into
    500 makes "you typed the wrong id" look like an outage."""
    try:
        return fn(*args, **kwargs)
    except automation.NotFound as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Not found: {exc.args[0]}") from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc


# --- models (request bodies) -------------------------------------------------

class SettingsRequest(BaseModel):
    enabled: bool | None = None
    auto_approve_confidence: int | None = Field(default=None, ge=0, le=100)
    require_approval_for_critical: bool | None = None


class RuleRequest(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=2000)
    category: str = Field(default="Infrastructure", max_length=64)
    trigger: str = Field(default="", max_length=500)
    action: str = Field(default="", max_length=500)
    status: str = Field(default="learning")
    enabled: bool = True
    ai_driven: bool = False
    confidence: float = Field(default=0, ge=0, le=100)


class RulePatch(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    category: str | None = Field(default=None, max_length=64)
    trigger: str | None = Field(default=None, max_length=500)
    action: str | None = Field(default=None, max_length=500)
    status: str | None = None
    enabled: bool | None = None
    ai_driven: bool | None = None
    confidence: float | None = Field(default=None, ge=0, le=100)


class RunRequest(BaseModel):
    succeeded: bool = True
    resolution_seconds: float | None = Field(default=None, ge=0)


class ModelPatch(BaseModel):
    status: str | None = None
    enabled: bool | None = None
    retraining: str | None = Field(default=None, max_length=200)
    description: str | None = Field(default=None, max_length=2000)


class AgentRequest(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=2000)
    environment: str = Field(default="Production", max_length=64)
    agent_type: str = Field(default="Monitoring Agent", max_length=64)
    capabilities: list[str] = Field(default_factory=list, max_length=50)
    endpoints: list[str] = Field(default_factory=list, max_length=100)


class AgentPatch(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    environment: str | None = Field(default=None, max_length=64)
    agent_type: str | None = Field(default=None, max_length=64)
    capabilities: list[str] | None = Field(default=None, max_length=50)
    endpoints: list[str] | None = Field(default=None, max_length=100)
    status: str | None = None


class HeartbeatRequest(BaseModel):
    version: str | None = Field(default=None, max_length=32)


def _set_fields(body: BaseModel) -> dict[str, Any]:
    """Only the fields the caller actually sent — a PATCH that omits `enabled` must not
    silently reset it."""
    return body.model_dump(exclude_unset=True, exclude_none=True)


# --- summary & settings -----------------------------------------------------

@router.get("/summary")
def get_summary(tenant_id: str = Depends(get_tenant_id)) -> dict:
    return automation.summary(tenant_id)


@router.get("/settings")
def get_settings(tenant_id: str = Depends(get_tenant_id)) -> dict:
    return automation.get_settings(tenant_id)


@router.put("/settings")
def put_settings(
    body: SettingsRequest,
    tenant_id: str = Depends(get_tenant_id),
    _: Principal = Depends(_require_admin),
) -> dict:
    """The master switch. Turning it off stops every rule from executing."""
    return _guard(automation.set_settings, tenant_id, _set_fields(body))


# --- rules ------------------------------------------------------------------

@router.get("/rules")
def list_rules(tenant_id: str = Depends(get_tenant_id)) -> list[dict]:
    return automation.list_rules(tenant_id)


@router.post("/rules", status_code=status.HTTP_201_CREATED)
def create_rule(
    body: RuleRequest,
    tenant_id: str = Depends(get_tenant_id),
    _: Principal = Depends(_require_admin),
) -> dict:
    return _guard(automation.create_rule, tenant_id, body.model_dump())


@router.patch("/rules/{rule_id}")
def patch_rule(
    rule_id: str,
    body: RulePatch,
    tenant_id: str = Depends(get_tenant_id),
    _: Principal = Depends(_require_admin),
) -> dict:
    return _guard(automation.update_rule, tenant_id, rule_id, _set_fields(body))


@router.delete("/rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_rule(
    rule_id: str,
    tenant_id: str = Depends(get_tenant_id),
    _: Principal = Depends(_require_admin),
) -> None:
    _guard(automation.delete_rule, tenant_id, rule_id)


@router.post("/rules/{rule_id}/run")
def run_rule(
    rule_id: str,
    body: RunRequest,
    tenant_id: str = Depends(get_tenant_id),
    _: Principal = Depends(_require_admin),
) -> dict:
    """Record an execution — used both by the runtime and by the UI's "Run now"."""
    return _guard(automation.run_rule, tenant_id, rule_id, body.succeeded, body.resolution_seconds)


@router.get("/executions")
def list_executions(
    tenant_id: str = Depends(get_tenant_id),
    limit: int = Query(50, ge=1, le=100),
) -> list[dict]:
    return automation.list_executions(tenant_id, limit)


# --- ML models --------------------------------------------------------------

@router.get("/models")
def list_models(tenant_id: str = Depends(get_tenant_id)) -> list[dict]:
    return automation.list_models(tenant_id)


@router.get("/models/{model_id}")
def get_model(model_id: str, tenant_id: str = Depends(get_tenant_id)) -> dict:
    return _guard(automation.get_model, tenant_id, model_id)


@router.patch("/models/{model_id}")
def patch_model(
    model_id: str,
    body: ModelPatch,
    tenant_id: str = Depends(get_tenant_id),
    _: Principal = Depends(_require_admin),
) -> dict:
    return _guard(automation.update_model, tenant_id, model_id, _set_fields(body))


@router.post("/models/{model_id}/retrain", status_code=status.HTTP_202_ACCEPTED)
def retrain_model(
    model_id: str,
    tenant_id: str = Depends(get_tenant_id),
    _: Principal = Depends(_require_admin),
) -> dict:
    return _guard(automation.retrain_model, tenant_id, model_id)


@router.get("/training-runs")
def list_training_runs(
    tenant_id: str = Depends(get_tenant_id),
    limit: int = Query(20, ge=1, le=50),
) -> list[dict]:
    return automation.list_training_runs(tenant_id, limit)


# --- insights ---------------------------------------------------------------

@router.get("/insights")
def list_insights(tenant_id: str = Depends(get_tenant_id)) -> list[dict]:
    return automation.list_insights(tenant_id)


@router.post("/insights/{insight_id}/{decision}")
def decide_insight(
    insight_id: str,
    decision: str,
    tenant_id: str = Depends(get_tenant_id),
    principal: Principal = Depends(_require_admin),
) -> dict:
    """decision is "approved" or "dismissed"; the caller's identity is recorded with it."""
    actor = principal.sub
    return _guard(automation.decide_insight, tenant_id, insight_id, decision, actor)


# --- agents -----------------------------------------------------------------

@router.get("/agents")
def list_agents(tenant_id: str = Depends(get_tenant_id)) -> list[dict]:
    """Agent keys are never in this response — only a fingerprint."""
    return automation.list_agents(tenant_id)


@router.post("/agents", status_code=status.HTTP_201_CREATED)
def create_agent(
    body: AgentRequest,
    tenant_id: str = Depends(get_tenant_id),
    _: Principal = Depends(_require_admin),
) -> dict:
    """Returns the new agent's key. This is the only response that contains it."""
    return _guard(automation.create_agent, tenant_id, body.model_dump())


@router.patch("/agents/{agent_id}")
def patch_agent(
    agent_id: str,
    body: AgentPatch,
    tenant_id: str = Depends(get_tenant_id),
    _: Principal = Depends(_require_admin),
) -> dict:
    return _guard(automation.update_agent, tenant_id, agent_id, _set_fields(body))


@router.delete("/agents/{agent_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_agent(
    agent_id: str,
    tenant_id: str = Depends(get_tenant_id),
    _: Principal = Depends(_require_admin),
) -> None:
    _guard(automation.delete_agent, tenant_id, agent_id)


@router.post("/agents/{agent_id}/rotate-key")
def rotate_agent_key(
    agent_id: str,
    tenant_id: str = Depends(get_tenant_id),
    _: Principal = Depends(_require_admin),
) -> dict:
    return _guard(automation.rotate_agent_key, tenant_id, agent_id)


@router.post("/agents/{agent_id}/heartbeat")
def agent_heartbeat(
    agent_id: str,
    body: HeartbeatRequest,
    tenant_id: str = Depends(get_tenant_id),
) -> dict:
    """Called by the installed agent, not by a person — no admin role required."""
    return _guard(automation.heartbeat, tenant_id, agent_id, body.version)


@router.get("/agents/{agent_id}/install")
def agent_install(
    agent_id: str,
    request: Request,
    tenant_id: str = Depends(get_tenant_id),
    _: Principal = Depends(_require_admin),
) -> dict:
    """Install manifest behind the Download button: package per platform, install command,
    and the config the agent boots with. Contains the key, hence admin-only."""
    api_base = str(request.base_url).rstrip("/") + "/api/v1"
    return _guard(automation.install_manifest, tenant_id, agent_id, api_base)

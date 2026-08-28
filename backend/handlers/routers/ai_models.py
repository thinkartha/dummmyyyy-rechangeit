"""Custom AI model monitoring routes: push inferences in, read model health out.

This is the path for models the platform cannot observe on its own — self-hosted,
fine-tuned, or behind a private endpoint. Models reached through the AI gateway or an
instrumented SDK already show up under /api/v1/observability/agents.
"""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from shared.core import ai_models
from shared.core.auth import ROLE_ORG_ADMIN, ROLE_PLATFORM_ADMIN, Principal, get_current_principal
from shared.core.tenancy import get_tenant_id

router = APIRouter(prefix="/api/v1/ai-models", tags=["ai-models"])


class Inference(BaseModel):
    """One model call. Only `model` is required — a team that can report nothing but
    latency should still get a latency chart rather than a validation error."""

    model: str = Field(min_length=1, max_length=128)
    version: str | None = Field(default=None, max_length=64)
    provider: str | None = Field(default=None, max_length=64)
    task: str | None = Field(default=None, max_length=64)
    timestamp: str | float | None = None
    latency_ms: float = Field(default=0.0, ge=0)
    success: bool = True
    error: str | None = Field(default=None, max_length=2000)
    tokens_in: float = Field(default=0.0, ge=0)
    tokens_out: float = Field(default=0.0, ge=0)
    cost: float | None = Field(default=None, ge=0)
    confidence: float | None = Field(default=None, ge=0, le=1)
    # Whatever the caller computes — PSI, KL divergence, a custom score. Compared
    # against their own thresholds, never interpreted here.
    drift_score: float | None = Field(default=None, ge=0)
    # Set when the true label is known; usually backfilled after the fact.
    correct: bool | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class InferenceBatch(BaseModel):
    inferences: list[Inference] = Field(min_length=1, max_length=1000)


class ThresholdRequest(BaseModel):
    thresholds: dict[str, float] = Field(min_length=1)


def _require_admin(principal: Principal = Depends(get_current_principal)) -> Principal:
    if not ({ROLE_ORG_ADMIN, ROLE_PLATFORM_ADMIN} & set(principal.roles)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This action requires an org admin or platform admin role",
        )
    return principal


# --- ingest -----------------------------------------------------------------

@router.post("/inferences", status_code=status.HTTP_202_ACCEPTED)
def post_inference(body: Inference, tenant_id: str = Depends(get_tenant_id)) -> dict:
    """Record one inference."""
    ai_models.record(tenant_id, body.model_dump())
    return {"accepted": 1}


@router.post("/inferences/batch", status_code=status.HTTP_202_ACCEPTED)
def post_inferences(body: InferenceBatch, tenant_id: str = Depends(get_tenant_id)) -> dict:
    """Record a batch — the path a training or serving job should use."""
    count = ai_models.record_batch(tenant_id, [i.model_dump() for i in body.inferences])
    return {"accepted": count}


# --- rollups ----------------------------------------------------------------

@router.get("/summary")
def get_summary(
    tenant_id: str = Depends(get_tenant_id),
    hours: int = Query(24, ge=1, le=720),
) -> dict:
    """Headline numbers across every custom model."""
    return ai_models.summary(tenant_id, hours)


@router.get("")
def get_models(
    tenant_id: str = Depends(get_tenant_id),
    hours: int = Query(24, ge=1, le=720),
) -> list[dict]:
    """One row per model: traffic, latency percentiles, tokens, cost, drift, accuracy."""
    return ai_models.model_stats(tenant_id, hours)


@router.get("/timeseries")
def get_timeseries(
    tenant_id: str = Depends(get_tenant_id),
    model: str | None = Query(default=None),
    hours: int = Query(24, ge=1, le=720),
) -> list[dict]:
    """Hourly buckets, oldest first. Omit `model` for the fleet total."""
    return ai_models.timeseries(tenant_id, model, hours)


@router.get("/failures")
def get_failures(
    tenant_id: str = Depends(get_tenant_id),
    model: str | None = Query(default=None),
    limit: int = Query(50, ge=1, le=200),
) -> list[dict]:
    """Recent failed inferences, newest first."""
    return ai_models.failures(tenant_id, model, limit)


# --- registry ---------------------------------------------------------------


class ModelRegistration(BaseModel):
    """A model the team runs, declared before it reports anything."""

    model: str = Field(min_length=1, max_length=128)
    name: str | None = Field(default=None, max_length=200)
    provider: str | None = Field(default=None, max_length=64)
    task: str | None = Field(default=None, max_length=64)
    version: str | None = Field(default=None, max_length=64)
    notes: str | None = Field(default=None, max_length=2000)


@router.post("", status_code=status.HTTP_201_CREATED)
def register_model(
    body: ModelRegistration,
    tenant_id: str = Depends(get_tenant_id),
    _: Principal = Depends(_require_admin),
) -> dict:
    """Declare a model so it has a row before its first inference arrives.

    Rows here are derived from reported inferences, which means a model that is deployed
    but not yet instrumented looks identical to one that was never set up. Registering
    separates those two: the row appears immediately, awaiting data.
    """
    try:
        return ai_models.register_model(tenant_id, body.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.delete("/{model}", status_code=status.HTTP_204_NO_CONTENT)
def unregister_model(
    model: str,
    tenant_id: str = Depends(get_tenant_id),
    _: Principal = Depends(_require_admin),
) -> None:
    """Stop declaring a model. Its recorded inferences are left alone, so one that is
    still reporting keeps its row — it just stops being listed as declared."""
    if not ai_models.unregister_model(tenant_id, model):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Model is not registered")


# --- thresholds -------------------------------------------------------------

@router.get("/thresholds")
def get_thresholds(
    tenant_id: str = Depends(get_tenant_id),
    model: str | None = Query(default=None),
) -> dict:
    """Health thresholds in effect — tenant defaults, overlaid with per-model overrides."""
    return ai_models.get_thresholds(tenant_id, model)


@router.put("/thresholds")
def put_thresholds(
    body: ThresholdRequest,
    tenant_id: str = Depends(get_tenant_id),
    model: str | None = Query(default=None),
    _: Principal = Depends(_require_admin),
) -> dict:
    """Override thresholds for the tenant, or for one model when `model` is given."""
    try:
        return ai_models.set_thresholds(tenant_id, body.thresholds, model)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

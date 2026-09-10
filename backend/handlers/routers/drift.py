from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from shared.core import mock_data
from shared.core.auth import ROLE_ORG_ADMIN, ROLE_PLATFORM_ADMIN, Principal, get_current_principal
from shared.core.tenancy import get_tenant_id
from shared.drift import collect
from shared.drift.detect import DriftReport
from shared.drift.seed import demo_report

router = APIRouter(prefix="/api/v1", tags=["drift"])


@router.get("/drift", response_model=DriftReport)
def drift(tenant_id: str = Depends(get_tenant_id)) -> DriftReport:
    """Data (KS), categorical (Chi-square), and config drift: last 24h vs the baseline.

    Features come from the telemetry already stored for this tenant — per-route request
    latency and status mix, per-model LLM latency, plus anything pushed to
    /drift/observations — so a tenant that uses the product has a feature stream without
    wiring up anything new. With no baseline pinned this is empty and `baseline_pinned`
    is false; that is "nothing is being compared yet", not "nothing drifted".
    """
    if mock_data.enabled():
        return demo_report()
    return collect.report(tenant_id)


class ObservationBatch(BaseModel):
    """Feature values a tenant scores on, which HTTP telemetry cannot imply.

    Numbers go to the KS test, strings to Chi-square, which is decided per value rather
    than declared — a caller should not have to label what a float is.
    """

    features: dict[str, Any] = Field(default_factory=dict)


@router.post("/drift/observations", status_code=status.HTTP_201_CREATED)
def post_observations(
    body: ObservationBatch,
    tenant_id: str = Depends(get_tenant_id),
) -> dict:
    if not body.features:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="features must not be empty")
    return collect.record_observations(tenant_id, body.features)


def _require_admin(principal: Principal = Depends(get_current_principal)) -> Principal:
    if not ({ROLE_ORG_ADMIN, ROLE_PLATFORM_ADMIN} & set(principal.roles)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This action requires an org admin or platform admin role",
        )
    return principal


@router.post("/drift/baseline", status_code=status.HTTP_201_CREATED)
def pin_baseline(
    tenant_id: str = Depends(get_tenant_id),
    _: Principal = Depends(_require_admin),
) -> dict:
    """Pin the current samples as the baseline. This is the page's "Rebaseline".

    Admin-only: it redefines what "normal" means for the whole organization, and doing
    it while a regression is live is how a regression stops being reported.
    """
    return collect.pin_baseline(tenant_id)

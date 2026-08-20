from fastapi import APIRouter, Depends

from shared.core.tenancy import get_tenant_id
from shared.drift.detect import DriftReport
from shared.drift.seed import demo_report

router = APIRouter(prefix="/api/v1", tags=["drift"])


@router.get("/drift", response_model=DriftReport)
def drift(tenant_id: str = Depends(get_tenant_id)) -> DriftReport:
    """Data (KS), categorical (Chi-square), and config drift over baseline vs current."""
    return demo_report()

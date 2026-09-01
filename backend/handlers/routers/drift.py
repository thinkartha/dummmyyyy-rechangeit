from fastapi import APIRouter, Depends

from shared.core import mock_data
from shared.core.tenancy import get_tenant_id
from shared.drift.detect import ConfigDrift, DriftReport
from shared.drift.seed import demo_report

router = APIRouter(prefix="/api/v1", tags=["drift"])


@router.get("/drift", response_model=DriftReport)
def drift(tenant_id: str = Depends(get_tenant_id)) -> DriftReport:
    """Data (KS), categorical (Chi-square), and config drift over baseline vs current.

    Nothing computes drift for a real tenant yet, so with mock data off this is an empty
    report rather than the demo one — which was being served to every tenant as if their
    own features had drifted.
    """
    if not mock_data.enabled():
        return DriftReport(
            numeric=[], categorical=[], any_drift=False,
            config=ConfigDrift(added=[], removed=[], changed=[],
                               baseline_hash="", current_hash=""),
        )
    return demo_report()

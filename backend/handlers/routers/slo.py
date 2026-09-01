from fastapi import APIRouter, Depends

from shared.core import mock_data
from shared.core.tenancy import get_tenant_id
from shared.slo.budget import SloStatus
from shared.slo.seed import demo_statuses

router = APIRouter(prefix="/api/v1", tags=["slo"])


@router.get("/slo", response_model=list[SloStatus])
def slos(tenant_id: str = Depends(get_tenant_id)) -> list[SloStatus]:
    """No tenant has defined an SLO yet, so with mock data off the honest answer is none
    — not the demo objectives, which were shown to everybody as their own."""
    return demo_statuses() if mock_data.enabled() else []

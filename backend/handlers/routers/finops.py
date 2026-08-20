from fastapi import APIRouter, Depends
from pydantic import BaseModel

from shared.core.tenancy import get_tenant_id
from shared.finops.cost import recommend, Recommendation
from shared.finops.seed import demo_usages

router = APIRouter(prefix="/api/v1", tags=["finops"])


class FinopsResponse(BaseModel):
    tenantId: str
    recommendations: list[Recommendation]
    total_monthly_savings: float


@router.get("/finops/recommendations", response_model=FinopsResponse)
def finops_recommendations(tenant_id: str = Depends(get_tenant_id)) -> FinopsResponse:
    recs, total = recommend(demo_usages())
    return FinopsResponse(tenantId=tenant_id, recommendations=recs, total_monthly_savings=total)

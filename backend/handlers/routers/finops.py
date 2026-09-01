from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from shared.aws.cost import CloudCostReport, cloud_cost
from shared.core import budgets as budget_store
from shared.core.auth import ROLE_ORG_ADMIN, ROLE_PLATFORM_ADMIN, Principal, get_current_principal
from shared.core import mock_data
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
    # Recommendations need real usage, and nothing collects it per tenant yet. With mock
    # data off that is an empty list, not savings figures invented from demo usage.
    usages = demo_usages() if mock_data.enabled() else []
    recs, total = recommend(usages)
    return FinopsResponse(tenantId=tenant_id, recommendations=recs, total_monthly_savings=total)


@router.get("/finops/cloud-cost", response_model=CloudCostReport)
def finops_cloud_cost(tenant_id: str = Depends(get_tenant_id)) -> CloudCostReport:
    """Month-to-date AWS spend per linked account, from Cost Explorer.

    The spend half of the Cloud Cost page. Budgets are fetched separately and joined in
    the browser, the same way the AI cost table does it — the ceiling and the spend come
    from different places and a tenant with no budgets is the normal case, not an error.
    """
    return cloud_cost(tenant_id)


# --- budgets ----------------------------------------------------------------
#
# The cost pages could say what was spent but never what was meant to be spent, so no
# row could be called over or under. A budget is that missing number.


def _require_admin(principal: Principal = Depends(get_current_principal)) -> Principal:
    if not ({ROLE_ORG_ADMIN, ROLE_PLATFORM_ADMIN} & set(principal.roles)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This action requires an org admin or platform admin role",
        )
    return principal


class BudgetRequest(BaseModel):
    scope: str = Field(description="cloud | ai")
    # "*" is the catch-all for the scope: one ceiling covering every account or tool
    # that has no budget of its own.
    target: str = Field(default="*", max_length=200)
    name: str | None = Field(default=None, max_length=200)
    monthly_limit: float = Field(gt=0)
    currency: str = Field(default="USD", min_length=3, max_length=3)


@router.get("/finops/budgets")
def list_budgets(
    scope: str | None = Query(default=None),
    tenant_id: str = Depends(get_tenant_id),
) -> list[dict]:
    """Monthly spend ceilings for this tenant, optionally one scope."""
    return budget_store.list_budgets(tenant_id, scope)


@router.post("/finops/budgets", status_code=status.HTTP_201_CREATED)
def save_budget(
    body: BudgetRequest,
    tenant_id: str = Depends(get_tenant_id),
    _: Principal = Depends(_require_admin),
) -> dict:
    """Set the ceiling for one account or tool. Setting the same target twice replaces
    it — that is an operator correcting the number, not asking for a second ceiling."""
    try:
        return budget_store.save_budget(tenant_id, body.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.delete("/finops/budgets/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget(
    budget_id: str,
    tenant_id: str = Depends(get_tenant_id),
    _: Principal = Depends(_require_admin),
) -> None:
    if not budget_store.delete_budget(tenant_id, budget_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found")

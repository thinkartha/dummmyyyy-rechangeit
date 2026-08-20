"""FinOps cost + right-sizing — salvaged from ping_hold_engine/finops.py.

Cost model, k8s resource parsers, p95 right-sizing and savings math are lifted verbatim (correct);
the dead service/event scaffolding was dropped. Powers the Usage / cost-transparency screen.
"""

from __future__ import annotations

import uuid
from pydantic import BaseModel, Field

# $ rates (lifted from the old cost_model).
COST_MODEL = {
    "cpu_cost_per_core_hour": 0.0425,
    "memory_cost_per_gb_hour": 0.0058,
}
_HOURS_PER_MONTH = 24 * 30


class ResourceUsage(BaseModel):
    component_id: str
    component_name: str
    namespace: str
    cpu_request: float  # cores
    memory_request_mb: float
    cpu_usage: list[float] = Field(default_factory=list)  # observed cores
    memory_usage_mb: list[float] = Field(default_factory=list)


class Recommendation(BaseModel):
    id: str
    component_name: str
    namespace: str
    type: str
    description: str
    estimated_monthly_savings: float
    confidence: float
    current_state: dict
    recommended_state: dict


def parse_cpu(cpu_str: str) -> float:
    if not cpu_str:
        return 0.0
    try:
        return float(cpu_str[:-1]) / 1000.0 if cpu_str.endswith("m") else float(cpu_str)
    except ValueError:
        return 0.0


def parse_memory_mb(mem_str: str) -> float:
    if not mem_str:
        return 0.0
    units = {"Ki": 1 / 1024, "Mi": 1, "Gi": 1024, "Ti": 1024 * 1024}
    try:
        for suffix, factor in units.items():
            if mem_str.endswith(suffix):
                return float(mem_str[: -len(suffix)]) * factor
        return float(mem_str) / (1024 * 1024)  # assume bytes
    except ValueError:
        return 0.0


def percentile(values: list[float], p: float) -> float:
    if not values:
        return 0.0
    s = sorted(values)
    return s[min(len(s) - 1, int(len(s) * p / 100))]  # clamped (old code could IndexError at p=100)


def cpu_savings(current: float, recommended: float) -> float:
    diff = current - recommended
    return diff * COST_MODEL["cpu_cost_per_core_hour"] * _HOURS_PER_MONTH if diff > 0 else 0.0


def memory_savings(current_mb: float, recommended_mb: float) -> float:
    diff_gb = (current_mb - recommended_mb) / 1024.0
    return diff_gb * COST_MODEL["memory_cost_per_gb_hour"] * _HOURS_PER_MONTH if diff_gb > 0 else 0.0


def recommend(usages: list[ResourceUsage]) -> tuple[list[Recommendation], float]:
    recs: list[Recommendation] = []
    total = 0.0
    for u in usages:
        if len(u.cpu_usage) < 10 or len(u.memory_usage_mb) < 10:
            continue
        cpu_p95 = percentile(u.cpu_usage, 95)
        mem_p95 = percentile(u.memory_usage_mb, 95)
        cpu_ratio = cpu_p95 / u.cpu_request if u.cpu_request > 0 else 0
        mem_ratio = mem_p95 / u.memory_request_mb if u.memory_request_mb > 0 else 0

        if cpu_ratio < 0.5 and u.cpu_request > 0.1:
            rec_cpu = max(cpu_p95 * 1.5, 0.1)  # 50% buffer
            sav = cpu_savings(u.cpu_request, rec_cpu)
            recs.append(Recommendation(
                id=str(uuid.uuid4()), component_name=u.component_name, namespace=u.namespace,
                type="resize", description=f"Reduce CPU request {u.cpu_request:.2f} → {rec_cpu:.2f} cores",
                estimated_monthly_savings=round(sav, 2), confidence=0.8,
                current_state={"cpu_request": u.cpu_request}, recommended_state={"cpu_request": round(rec_cpu, 2)},
            ))
            total += sav

        if mem_ratio < 0.5 and u.memory_request_mb > 50:
            rec_mem = max(mem_p95 * 1.5, 50)
            sav = memory_savings(u.memory_request_mb, rec_mem)
            recs.append(Recommendation(
                id=str(uuid.uuid4()), component_name=u.component_name, namespace=u.namespace,
                type="resize", description=f"Reduce memory request {u.memory_request_mb:.0f} → {rec_mem:.0f} MB",
                estimated_monthly_savings=round(sav, 2), confidence=0.8,
                current_state={"memory_request_mb": u.memory_request_mb}, recommended_state={"memory_request_mb": round(rec_mem)},
            ))
            total += sav

    recs.sort(key=lambda r: r.estimated_monthly_savings, reverse=True)
    return recs, round(total, 2)

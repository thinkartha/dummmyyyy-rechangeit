"""SLO error-budget + burn-rate engine — salvaged from ping_hold_engine/slo_insights.py.

The math is lifted verbatim (it was correct); only the dead event-bus/threading scaffolding was
dropped. Exposed as pure functions so it's testable and reusable by the EP:gate.
"""

from __future__ import annotations

import math
from pydantic import BaseModel


class Slo(BaseModel):
    id: str
    name: str
    target: float  # e.g. 99.9 (% success)
    window_hours: float = 24.0


class SloStatus(BaseModel):
    slo_id: str
    name: str
    target: float
    reliability: float
    error_budget_remaining_pct: float
    burn_rate: float
    time_to_exhaustion_hours: float | None  # None == not burning
    events_total: int
    events_success: int


def compute_status(slo: Slo, success: int, total: int, elapsed_seconds: float) -> SloStatus:
    reliability = (success / total) * 100.0 if total > 0 else 100.0

    error_budget = 100.0 - slo.target
    error_budget_used = max(0.0, 100.0 - reliability)
    error_budget_remaining = max(0.0, error_budget - error_budget_used)
    remaining_pct = (error_budget_remaining / error_budget) * 100.0 if error_budget > 0 else 100.0

    window_seconds = slo.window_hours * 3600.0
    burn_rate = 0.0
    if elapsed_seconds > 0 and error_budget > 0:
        normalized_used = error_budget_used / error_budget
        normalized_time = elapsed_seconds / window_seconds
        if normalized_time > 0:
            burn_rate = normalized_used / normalized_time

    if burn_rate > 0:
        tte: float | None = (remaining_pct / 100.0) * slo.window_hours / burn_rate
    else:
        tte = None

    return SloStatus(
        slo_id=slo.id,
        name=slo.name,
        target=slo.target,
        reliability=round(reliability, 3),
        error_budget_remaining_pct=round(remaining_pct, 1),
        burn_rate=round(burn_rate, 2),
        time_to_exhaustion_hours=(round(tte, 1) if tte is not None and not math.isinf(tte) else None),
        events_total=total,
        events_success=success,
    )


def error_budget_remaining_from_error_rate(target: float, current_error_pct: float) -> float:
    """Quick error-budget-remaining % given a target and an observed error rate.

    Used by EP:gate to turn an incident's error rate into an SLO-gate decision.
    """
    error_budget = 100.0 - target
    if error_budget <= 0:
        return 0.0
    remaining = max(0.0, error_budget - max(0.0, current_error_pct))
    return round((remaining / error_budget) * 100.0, 1)

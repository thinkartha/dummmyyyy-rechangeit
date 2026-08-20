"""Seed SLOs until SLI inputs flow from EP:collector. Statuses are computed by the real engine."""

from __future__ import annotations

from .budget import Slo, SloStatus, compute_status

_SLOS = [
    (Slo(id="slo-availability", name="API availability", target=99.9, window_hours=24),
     99975, 100000, 12 * 3600, "payments-api"),
    (Slo(id="slo-latency", name="Checkout latency < 500ms", target=99.0, window_hours=24),
     9880, 10000, 12 * 3600, "checkout-svc"),
]


def demo_statuses() -> list[SloStatus]:
    return [compute_status(slo, succ, tot, elapsed) for slo, succ, tot, elapsed, _ in _SLOS]


def service_error_budget(service: str) -> float:
    """Windowed error-budget-remaining % for a service's SLO (default 100 if none).

    Used by EP:gate: this is the *windowed* budget, NOT the incident's instantaneous error rate —
    a blown live metric is why we're remediating; it must not block the fix.
    """
    for slo, succ, tot, elapsed, svc in _SLOS:
        if svc == service:
            return compute_status(slo, succ, tot, elapsed).error_budget_remaining_pct
    return 100.0

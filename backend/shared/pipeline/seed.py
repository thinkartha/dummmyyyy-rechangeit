"""A seed scenario (raw signals) that drives the pipeline to a real, derived RCA.

Change these numbers and the computed RCA changes — it is not a static fixture.
"""

from __future__ import annotations

from .signals import Scenario, MetricSeries, DeployEvent, LogLine


def demo_scenario(incident_id: str = "INC-1207") -> Scenario:
    return Scenario(
        incident_id=incident_id,
        entrypoint="web",
        edges=[
            ("web", "checkout-svc"),
            ("checkout-svc", "payments-api"),
            ("payments-api", "payments-db"),
        ],
        metrics=[
            MetricSeries(service="web", metric="latency_p95", values=[50, 52, 49, 51, 50, 48, 51, 50, 49, 50]),
            MetricSeries(service="checkout-svc", metric="error_rate", values=[0.5, 0.6, 0.5, 0.5, 0.6, 0.5, 0.8, 1.2, 1.6, 1.8]),
            MetricSeries(service="payments-api", metric="latency_p95", values=[100, 102, 98, 105, 101, 99, 140, 260, 360, 410]),
            MetricSeries(service="payments-api", metric="error_rate", values=[0.4, 0.5, 0.4, 0.6, 0.5, 0.4, 8, 22, 34, 40]),
            MetricSeries(service="payments-api", metric="rps", values=[800, 820, 790, 810, 800, 950, 1100, 1200, 1280, 1300]),
        ],
        deploys=[DeployEvent(service="payments-api", version="v2.31.0", at_index=5, at_label="13:42")],
        logs=[
            LogLine(service="payments-api", level="error", message="pool timeout acquiring connection (50/50)"),
            LogLine(service="payments-api", level="error", message="pool timeout acquiring connection (50/50)"),
            LogLine(service="payments-api", level="error", message="pool timeout acquiring connection (49/50)"),
            LogLine(service="payments-api", level="warn", message="pool utilization 96%"),
        ],
        baseline_users=1000,
    )

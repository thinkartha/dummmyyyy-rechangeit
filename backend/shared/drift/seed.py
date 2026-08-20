"""Seed baseline-vs-current samples to exercise drift detection until live SLI windows feed it."""

from __future__ import annotations

from .detect import (
    NumericDrift,
    CategoricalDrift,
    DriftReport,
    ks_two_sample,
    chi_square_drift,
    config_drift,
)


def demo_report() -> DriftReport:
    numeric: list[NumericDrift] = []
    for name, base, cur in [
        # drifted: latency shifted ~4x
        ("payments-api latency_p95", [98, 101, 99, 102, 100, 97, 103, 99, 101, 100],
         [380, 400, 410, 390, 420, 405, 395, 415, 400, 410]),
        # stable: no meaningful shift
        ("auth-svc latency_p95", [50, 51, 49, 52, 50, 48, 51, 50, 49, 50],
         [51, 52, 50, 53, 51, 49, 52, 51, 50, 51]),
    ]:
        d, c, drift = ks_two_sample(base, cur)
        numeric.append(NumericDrift(feature=name, ks_statistic=d, critical=c, drift=drift))

    chi, c, drift = chi_square_drift(
        {"200": 900, "500": 10, "503": 5}, {"200": 600, "500": 300, "503": 50}
    )
    categorical = [CategoricalDrift(feature="http_status", chi_square=chi, critical=c, drift=drift)]

    cfg = config_drift(
        {"replicas": 3, "image": "payments-api:v2.30.4", "log_level": "info"},
        {"replicas": 3, "image": "payments-api:v2.31.0", "log_level": "info", "feature_x": True},
    )

    any_drift = (
        any(n.drift for n in numeric)
        or any(c0.drift for c0 in categorical)
        or bool(cfg.changed or cfg.added or cfg.removed)
    )
    return DriftReport(numeric=numeric, categorical=categorical, config=cfg, any_drift=any_drift)

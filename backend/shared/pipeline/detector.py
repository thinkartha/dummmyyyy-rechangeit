"""EP:detector — pluggable classical anomaly strategies + Drain3 log templating.

Multiple strategies run and their findings are merged (corroboration raises confidence). All are
classical/lightweight on purpose (the research found no deep-learning moat). Heavier strategies —
RCF (rrcf), Prophet/statsforecast (seasonal), vmanomaly — plug in as additional `STRATEGIES`
behind the same `Anomaly` output, with no change to the correlator/RCA downstream.
"""

from __future__ import annotations

import statistics
from typing import Callable

from pydantic import BaseModel, Field
from drain3 import TemplateMiner
from drain3.template_miner_config import TemplateMinerConfig

from .signals import MetricSeries, LogLine


class Anomaly(BaseModel):
    service: str
    metric: str
    score: float  # ratio of current window vs baseline (>=1)
    severity: str  # "warning" | "critical"
    onset_index: int
    current: float
    baseline: float
    detected_by: list[str] = Field(default_factory=list)


class LogTemplate(BaseModel):
    service: str
    template: str
    count: int
    level: str


def _severity(score: float) -> str | None:
    if score >= 3.0:
        return "critical"
    if score >= 1.5:
        return "warning"
    return None


def _windows(values: list[float]) -> tuple[float, float, int, int]:
    n = len(values)
    third = max(1, n // 3)
    baseline = sum(values[:third]) / third
    current = sum(values[-third:]) / third
    return (baseline or 1e-6), current, third, n


def _onset(values: list[float], threshold: float, default: int) -> int:
    return next((i for i, v in enumerate(values) if v > threshold), default)


def _ratio_strategy(s: MetricSeries) -> Anomaly | None:
    baseline, current, third, n = _windows(s.values)
    score = current / baseline
    sev = _severity(score)
    if not sev:
        return None
    return Anomaly(
        service=s.service, metric=s.metric, score=round(score, 2), severity=sev,
        onset_index=_onset(s.values, baseline * 1.5, n - third),
        current=round(current, 2), baseline=round(baseline, 2), detected_by=["ratio"],
    )


def _mad_strategy(s: MetricSeries) -> Anomaly | None:
    """Robust median + MAD z-score on the baseline window."""
    baseline, current, third, n = _windows(s.values)
    base = s.values[:third]
    med = statistics.median(base)
    mad = statistics.median([abs(v - med) for v in base]) or 1e-6
    z = (current - med) / (1.4826 * mad)
    if z < 3.5:
        return None
    score = current / (med or 1e-6)
    sev = "critical" if z >= 6 else "warning"
    return Anomaly(
        service=s.service, metric=s.metric, score=round(score, 2), severity=sev,
        onset_index=_onset(s.values, max(med * 1.5, med + 3 * (1.4826 * mad)), n - third),
        current=round(current, 2), baseline=round(med, 2), detected_by=["mad"],
    )


def _ewma_strategy(s: MetricSeries) -> Anomaly | None:
    """EWMA control: flag if the last point is far above the smoothed mean."""
    if len(s.values) < 6:
        return None
    alpha = 0.3
    ewma = s.values[0]
    for v in s.values[:-1]:
        ewma = alpha * v + (1 - alpha) * ewma
    last = s.values[-1]
    spread = statistics.pstdev(s.values) or 1e-6
    if (last - ewma) < 3 * spread:
        return None
    baseline, current, third, n = _windows(s.values)
    score = current / baseline
    return Anomaly(
        service=s.service, metric=s.metric, score=round(score, 2),
        severity=_severity(score) or "warning",
        onset_index=_onset(s.values, ewma + 3 * spread, n - third),
        current=round(current, 2), baseline=round(baseline, 2), detected_by=["ewma"],
    )


STRATEGIES: list[Callable[[MetricSeries], "Anomaly | None"]] = [
    _ratio_strategy,
    _mad_strategy,
    _ewma_strategy,
]


def detect_anomalies(metrics: list[MetricSeries]) -> list[Anomaly]:
    merged: dict[tuple[str, str], Anomaly] = {}
    for s in metrics:
        if len(s.values) < 6:
            continue
        for strat in STRATEGIES:
            a = strat(s)
            if a is None:
                continue
            key = (a.service, a.metric)
            if key in merged:
                cur = merged[key]
                cur.detected_by = sorted(set(cur.detected_by + a.detected_by))
                if a.score > cur.score:
                    cur.score, cur.severity, cur.current, cur.baseline, cur.onset_index = (
                        a.score, a.severity, a.current, a.baseline, a.onset_index,
                    )
            else:
                merged[key] = a
    out = list(merged.values())
    out.sort(key=lambda a: a.score, reverse=True)
    return out


def extract_log_templates(logs: list[LogLine]) -> list[LogTemplate]:
    by_service: dict[str, list[LogLine]] = {}
    for ln in logs:
        if ln.level in ("error", "warn"):
            by_service.setdefault(ln.service, []).append(ln)

    results: list[LogTemplate] = []
    for service, lines in by_service.items():
        miner = TemplateMiner(config=TemplateMinerConfig())
        for ln in lines:
            miner.add_log_message(ln.message)
        clusters = list(miner.drain.clusters)
        if not clusters:
            continue
        top = max(clusters, key=lambda c: c.size)
        level = "error" if any(l.level == "error" for l in lines) else "warn"
        results.append(LogTemplate(service=service, template=top.get_template(), count=top.size, level=level))
    results.sort(key=lambda t: t.count, reverse=True)
    return results

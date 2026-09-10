"""Threshold conditions on streamed cloud metrics.

Why evaluation lives on the write path
--------------------------------------
The deployed stack has no scheduler, so a condition evaluated on a timer would never
run. It does not need one: a metric stream delivery *is* the tick. Every delivery already
carries the newest datapoints, so conditions are evaluated against the rows being stored,
which makes alerting arrive at the same latency as the data — about a minute — with no
new infrastructure and no polling.

State, and why there is any
---------------------------
Evaluating each delivery independently would re-raise the same alert every minute for as
long as a metric stayed over its threshold, which is how an alerting system teaches people
to ignore it. So each condition keeps a small state record: how many consecutive breaching
periods it has seen, and whether it is currently firing. An event is raised on the
transition into firing and again on the transition out — never in between.

`for_periods` is the anti-flap control. A metric that crosses a threshold for one minute
and comes back has not had an incident; requiring N consecutive breaches is the standard
way to say so, and it is why the counter exists rather than a bare boolean.

Events go into the same collector spine as every other signal (`shared/collector/ingest`),
so cloud alerts route, cluster and correlate alongside API, ETL and database events rather
than forming a second alerting system beside the first.
"""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from typing import Any, Iterable

from pydantic import BaseModel, Field

from shared.collector.cloudevents import CloudEvent, make_event
from shared.core import config_store

_INTEGRATION = "aws-metric-alerts"
_STATE_INTEGRATION = "aws-metric-alert-state"

COMPARISONS = {
    "gt": lambda value, threshold: value > threshold,
    "gte": lambda value, threshold: value >= threshold,
    "lt": lambda value, threshold: value < threshold,
    "lte": lambda value, threshold: value <= threshold,
}

_COMPARISON_WORDS = {"gt": ">", "gte": "≥", "lt": "<", "lte": "≤"}

SEVERITIES = ("critical", "warning", "info")


class MetricCondition(BaseModel):
    id: str = Field(default_factory=lambda: f"cond_{uuid.uuid4().hex[:12]}")
    name: str
    namespace: str
    metric: str
    statistic: str = "avg"
    comparison: str = "gt"
    threshold: float
    # How many consecutive breaching minutes before this fires. 1 means "the moment it
    # crosses", which is right for a queue depth and wrong for CPU.
    for_periods: int = Field(default=2, ge=1, le=60)
    severity: str = "warning"
    enabled: bool = True
    # Optional narrowing. `dimensions` matches CloudWatch dimensions exactly; a condition
    # with none applies to every resource reporting the metric, which is usually what a
    # fleet-wide rule wants.
    dimensions: dict[str, str] = Field(default_factory=dict)
    account: str | None = None
    region: str | None = None

    model_config = {"populate_by_name": True}


def _load(tenant_id: str) -> list[dict[str, Any]]:
    raw = config_store.get_config(tenant_id, _INTEGRATION)
    return json.loads(raw) if raw else []


def _save(tenant_id: str, rows: list[dict[str, Any]]) -> None:
    config_store.save_config(tenant_id, _INTEGRATION, json.dumps(rows))


def list_conditions(tenant_id: str) -> list[dict[str, Any]]:
    return _load(tenant_id)


def create_condition(tenant_id: str, condition: MetricCondition) -> dict[str, Any]:
    rows = _load(tenant_id)
    row = condition.model_dump()
    rows.append(row)
    _save(tenant_id, rows)
    return row


def delete_condition(tenant_id: str, condition_id: str) -> bool:
    rows = _load(tenant_id)
    remaining = [r for r in rows if r.get("id") != condition_id]
    if len(remaining) == len(rows):
        return False
    _save(tenant_id, remaining)
    # The state row goes with it, or a re-created condition with the same id inherits a
    # firing state nothing is measuring any more.
    state = _load_state(tenant_id)
    for key in [k for k in state if k.startswith(f"{condition_id}|")]:
        state.pop(key)
    _save_state(tenant_id, state)
    return True


def _load_state(tenant_id: str) -> dict[str, Any]:
    raw = config_store.get_config(tenant_id, _STATE_INTEGRATION)
    return json.loads(raw) if raw else {}


def _save_state(tenant_id: str, state: dict[str, Any]) -> None:
    config_store.save_config(tenant_id, _STATE_INTEGRATION, json.dumps(state))


def _matches(condition: dict[str, Any], row: dict[str, Any]) -> bool:
    if row.get("namespace") != condition.get("namespace"):
        return False
    if row.get("metric") != condition.get("metric"):
        return False
    if condition.get("account") and row.get("account") != condition["account"]:
        return False
    if condition.get("region") and row.get("region") != condition["region"]:
        return False
    wanted = condition.get("dimensions") or {}
    if wanted:
        have = row.get("dimensions") or {}
        if any(have.get(k) != v for k, v in wanted.items()):
            return False
    return True


def _value(row: dict[str, Any], statistic: str) -> float | None:
    if statistic == "avg":
        count = row.get("count") or 0
        return (row.get("sum") or 0.0) / count if count else None
    value = row.get(statistic)
    return float(value) if isinstance(value, (int, float)) else None


def _describe(condition: dict[str, Any], value: float) -> str:
    word = _COMPARISON_WORDS.get(condition.get("comparison", "gt"), condition.get("comparison"))
    return (f"{condition['namespace']} {condition['metric']} "
            f"{condition.get('statistic', 'avg')}={round(value, 4)} {word} {condition['threshold']}")


def evaluate(tenant_id: str, rows: Iterable[dict[str, Any]]) -> list[CloudEvent]:
    """Evaluate every enabled condition against one delivery's rows.

    Returns the events to raise — the caller ingests them, so this stays testable without
    a collector and a single failed publish cannot lose the state transition that has
    already been recorded.

    Rows are grouped per resource, not per condition: a condition with no dimension filter
    applies to every reporting resource, and each of those has to fire and recover on its
    own. One noisy instance should raise one alert, not silence its neighbours.
    """
    conditions = [c for c in _load(tenant_id) if c.get("enabled", True)]
    if not conditions:
        return []
    rows = list(rows)
    state = _load_state(tenant_id)
    events: list[CloudEvent] = []
    changed = False

    for condition in conditions:
        matching = [r for r in rows if _matches(condition, r)]
        if not matching:
            continue
        # Newest first, so one delivery carrying several minutes for one resource is
        # judged on its latest minute rather than whichever came last in the list.
        matching.sort(key=lambda r: r.get("ts") or "", reverse=True)
        seen: set[str] = set()
        for row in matching:
            resource = row.get("dimension_id") or "-"
            if resource in seen:
                continue
            seen.add(resource)
            value = _value(row, condition.get("statistic", "avg"))
            if value is None:
                continue
            breaching = COMPARISONS.get(condition.get("comparison", "gt"),
                                        COMPARISONS["gt"])(value, condition["threshold"])
            key = f"{condition['id']}|{resource}"
            entry = state.get(key) or {"breaches": 0, "firing": False}

            if breaching:
                entry["breaches"] = entry.get("breaches", 0) + 1
                if not entry["firing"] and entry["breaches"] >= condition.get("for_periods", 1):
                    entry["firing"] = True
                    entry["since"] = row.get("ts")
                    events.append(_event(tenant_id, condition, row, value, firing=True))
            else:
                # One good period clears the counter: "consecutive" has to mean
                # consecutive, or a metric that breaches every other minute eventually
                # fires on an accumulation that never actually persisted.
                entry["breaches"] = 0
                if entry.get("firing"):
                    entry["firing"] = False
                    events.append(_event(tenant_id, condition, row, value, firing=False))
                    entry.pop("since", None)
            entry["last_value"] = value
            entry["last_seen"] = row.get("ts")
            state[key] = entry
            changed = True

    if changed:
        _save_state(tenant_id, state)
    return events


def _event(tenant_id: str, condition: dict[str, Any], row: dict[str, Any],
           value: float, *, firing: bool) -> CloudEvent:
    return make_event(
        source="aws.cloudwatch.metrics",
        type="cloud.alert.triggered" if firing else "cloud.alert.resolved",
        tenant_id=tenant_id,
        data={
            "condition_id": condition["id"],
            "title": condition["name"],
            # Recovery is not an incident, whatever the condition's severity says.
            "severity": condition.get("severity", "warning") if firing else "info",
            "status": "firing" if firing else "resolved",
            "summary": _describe(condition, value),
            "namespace": condition["namespace"],
            "metric": condition["metric"],
            "statistic": condition.get("statistic", "avg"),
            "comparison": condition.get("comparison", "gt"),
            "threshold": condition["threshold"],
            "value": round(value, 6),
            "account": row.get("account"),
            "region": row.get("region"),
            "dimensions": row.get("dimensions") or {},
            "resource": row.get("dimension_id"),
            "observed_at": row.get("ts"),
            "evaluated_at": datetime.now(timezone.utc).isoformat(),
        },
    )


def status(tenant_id: str) -> list[dict[str, Any]]:
    """Each condition with what it is currently doing, per resource.

    Conditions with no state yet are still listed: "nothing has matched this yet" is a
    different answer from "this is fine", and a rule watching a metric that never arrives
    is a rule worth noticing.
    """
    state = _load_state(tenant_id)
    out = []
    for condition in _load(tenant_id):
        resources = [
            {"resource": key.split("|", 1)[1], **value}
            for key, value in state.items() if key.startswith(f"{condition['id']}|")
        ]
        out.append({
            **condition,
            "firing": sum(1 for r in resources if r.get("firing")),
            "watching": len(resources),
            "resources": sorted(resources, key=lambda r: (not r.get("firing"), r["resource"])),
        })
    return out

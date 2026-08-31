"""Persistent alert-management settings and SLA evaluation.

The browser used to own routing rules, maintenance windows and SLA targets.  That made
every control reset on refresh and made Lambda deployments appear to "forget" changes.
This module keeps the tenant's configuration in the existing integrations DynamoDB table
and derives SLA status from the same recently-ingested CloudEvents used by clustering.
"""

from __future__ import annotations

import json
import secrets
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any

from shared.collector.cloudevents import CloudEvent
from . import config_store
from . import mock_data

INTEGRATION_KEY = "alert-management"
PRIORITIES = {"P1", "P2", "P3", "P4"}


class NotFound(KeyError):
    pass


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _iso(moment: datetime | None = None) -> str:
    return (moment or _now()).astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def _new_id(prefix: str) -> str:
    return f"{prefix}-{secrets.token_hex(4)}"


def _seed() -> dict[str, Any]:
    return {
        "sla_rules": [
            {"id": "sla-p1", "priority": "P1", "target_minutes": 15, "enabled": True},
            {"id": "sla-p2", "priority": "P2", "target_minutes": 60, "enabled": True},
            {"id": "sla-p3", "priority": "P3", "target_minutes": 240, "enabled": True},
            {"id": "sla-p4", "priority": "P4", "target_minutes": 1440, "enabled": True},
        ],
        "routing_rules": [
            {
                "id": "route-critical-infra",
                "name": "Critical infrastructure alerts",
                "severity": "critical",
                "source": "",
                "category": "infrastructure",
                "team": "Infrastructure Team",
                "assignee": "On-call Engineer",
                "escalation_minutes": 15,
                "notification_channels": ["Slack", "PagerDuty", "SMS"],
                "enabled": True,
                "priority": 1,
            },
            {
                "id": "route-database",
                "name": "Database alerts",
                "severity": "",
                "source": "database",
                "category": "",
                "team": "Database Team",
                "assignee": "DBA Lead",
                "escalation_minutes": 30,
                "notification_channels": ["Slack", "Email"],
                "enabled": True,
                "priority": 2,
            },
        ],
        "maintenance_windows": [],
    }


def _starting_state() -> dict[str, Any]:
    """What a tenant that has configured nothing starts with.

    The seeded routing rules, SLA policy and maintenance window are demo content: with
    PINGHOLD_MOCK_DATA=0 a fresh tenant has none of them, and the alert pages show an
    empty state rather than rules nobody wrote.
    """
    if mock_data.enabled():
        return _seed()
    return {key: ([] if isinstance(value, list) else value) for key, value in _seed().items()}


def _load(tenant_id: str) -> dict[str, Any]:
    raw = config_store.get_config(tenant_id, INTEGRATION_KEY)
    if raw:
        try:
            state = json.loads(raw)
        except json.JSONDecodeError:
            state = None
        if isinstance(state, dict):
            seeded = _starting_state()
            for key, value in seeded.items():
                state.setdefault(key, value)
            return state
    return deepcopy(_starting_state())


def _store(tenant_id: str, state: dict[str, Any]) -> None:
    if not config_store.save_config(tenant_id, INTEGRATION_KEY, json.dumps(state)):
        raise RuntimeError("Could not save alert-management state")


def _find(items: list[dict[str, Any]], item_id: str) -> dict[str, Any]:
    for item in items:
        if item["id"] == item_id:
            return item
    raise NotFound(item_id)


def _parse_time(value: Any) -> datetime | None:
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        return parsed.replace(tzinfo=parsed.tzinfo or timezone.utc).astimezone(timezone.utc)
    except (TypeError, ValueError):
        return None


def _priority(event: CloudEvent) -> str:
    explicit = str(event.data.get("priority", "")).upper()
    if explicit in PRIORITIES:
        return explicit
    return {
        "critical": "P1",
        "error": "P2",
        "warning": "P3",
        "info": "P4",
    }.get(str(event.data.get("severity", "info")).lower(), "P4")


def _resolved_at(event: CloudEvent) -> datetime | None:
    if str(event.data.get("status", "")).lower() not in {"resolved", "closed", "ok"}:
        return None
    return _parse_time(event.data.get("resolved_at") or event.data.get("updated_at")) or _parse_time(event.timestamp)


def sla_dashboard(tenant_id: str, events: list[CloudEvent], now: datetime | None = None) -> dict[str, Any]:
    """Evaluate each priority target against ingested alerts.

    An unresolved alert uses its current age; a resolved alert uses resolved_at-start.
    Events with malformed timestamps are ignored instead of turning the whole dashboard
    into a 500 response.
    """
    moment = now or _now()
    rules = [r for r in _load(tenant_id)["sla_rules"] if r.get("enabled", True)]
    by_priority = {r["priority"]: r for r in rules}
    rows: dict[str, list[dict[str, Any]]] = {priority: [] for priority in by_priority}

    for event in events:
        priority = _priority(event)
        if priority not in by_priority:
            continue
        started = _parse_time(event.timestamp)
        if started is None:
            continue
        resolved = _resolved_at(event)
        elapsed = max(0.0, ((resolved or moment) - started).total_seconds() / 60)
        target = float(by_priority[priority]["target_minutes"])
        rows[priority].append({
            "id": event.id,
            "title": str(event.data.get("title") or event.type),
            "description": str(event.data.get("description") or ""),
            "priority": priority,
            "started_at": event.timestamp,
            "resolved_at": _iso(resolved) if resolved else None,
            "elapsed_minutes": round(elapsed, 1),
            "target_minutes": target,
            "breached": elapsed > target,
            "active": resolved is None,
            "assignee": event.data.get("assignee"),
            "service": event.data.get("service"),
        })

    metrics = []
    all_rows = []
    for rule in rules:
        priority_rows = rows[rule["priority"]]
        all_rows.extend(priority_rows)
        breaches = sum(1 for row in priority_rows if row["breached"])
        total = len(priority_rows)
        metrics.append({
            **rule,
            "total": total,
            "breaches": breaches,
            "compliance_pct": round(((total - breaches) / total) * 100, 1) if total else 100.0,
            "average_minutes": round(sum(row["elapsed_minutes"] for row in priority_rows) / total, 1) if total else 0.0,
        })

    total = len(all_rows)
    breached = sum(1 for row in all_rows if row["breached"])
    active_breaches = sorted(
        (row for row in all_rows if row["breached"] and row["active"]),
        key=lambda row: row["elapsed_minutes"],
        reverse=True,
    )
    history: dict[str, list[bool]] = {}
    for row in all_rows:
        started = _parse_time(row["started_at"])
        if started:
            history.setdefault(started.date().isoformat(), []).append(not row["breached"])

    return {
        "rules": _load(tenant_id)["sla_rules"],
        "metrics": metrics,
        "summary": {
            "overall_sla_pct": round(((total - breached) / total) * 100, 1) if total else 100.0,
            "active_breaches": len(active_breaches),
            "average_resolution_minutes": round(sum(row["elapsed_minutes"] for row in all_rows) / total, 1) if total else 0.0,
            "monitored_alerts": total,
        },
        "history": [
            {"date": day, "compliance_pct": round(sum(values) / len(values) * 100, 1)}
            for day, values in sorted(history.items())
        ][-14:],
        "breaches": active_breaches,
    }


def create_sla_rule(tenant_id: str, values: dict[str, Any]) -> dict[str, Any]:
    state = _load(tenant_id)
    priority = str(values["priority"]).upper()
    if priority not in PRIORITIES:
        raise ValueError("priority must be P1, P2, P3 or P4")
    if any(rule["priority"] == priority for rule in state["sla_rules"]):
        raise ValueError(f"An SLA rule already exists for {priority}")
    rule = {"id": _new_id("sla"), **values, "priority": priority, "updated_at": _iso()}
    state["sla_rules"].append(rule)
    _store(tenant_id, state)
    return rule


def update_sla_rule(tenant_id: str, rule_id: str, values: dict[str, Any]) -> dict[str, Any]:
    state = _load(tenant_id)
    rule = _find(state["sla_rules"], rule_id)
    rule.update(values)
    rule["updated_at"] = _iso()
    _store(tenant_id, state)
    return rule


def delete_sla_rule(tenant_id: str, rule_id: str) -> None:
    state = _load(tenant_id)
    _find(state["sla_rules"], rule_id)
    state["sla_rules"] = [rule for rule in state["sla_rules"] if rule["id"] != rule_id]
    _store(tenant_id, state)


def list_routing_rules(tenant_id: str) -> list[dict[str, Any]]:
    return _load(tenant_id)["routing_rules"]


def create_routing_rule(tenant_id: str, values: dict[str, Any]) -> dict[str, Any]:
    state = _load(tenant_id)
    rule = {"id": _new_id("route"), **values, "updated_at": _iso()}
    state["routing_rules"].append(rule)
    _store(tenant_id, state)
    return rule


def update_routing_rule(tenant_id: str, rule_id: str, values: dict[str, Any]) -> dict[str, Any]:
    state = _load(tenant_id)
    rule = _find(state["routing_rules"], rule_id)
    rule.update(values)
    rule["updated_at"] = _iso()
    _store(tenant_id, state)
    return rule


def delete_routing_rule(tenant_id: str, rule_id: str) -> None:
    state = _load(tenant_id)
    _find(state["routing_rules"], rule_id)
    state["routing_rules"] = [rule for rule in state["routing_rules"] if rule["id"] != rule_id]
    _store(tenant_id, state)


def test_routing_rule(tenant_id: str, rule_id: str, events: list[CloudEvent]) -> dict[str, Any]:
    rule = _find(list_routing_rules(tenant_id), rule_id)

    def matches(event: CloudEvent) -> bool:
        checks = {
            "severity": str(event.data.get("severity", "")),
            "source": str(event.source),
            "category": str(event.data.get("category", "")),
        }
        return all(not rule.get(key) or rule[key].lower() in value.lower() for key, value in checks.items())

    matched = [event for event in events if matches(event)]
    return {
        "rule_id": rule_id,
        "matched_events": len(matched),
        "sample_event_ids": [event.id for event in matched[:5]],
        "route": {"team": rule["team"], "assignee": rule["assignee"], "channels": rule["notification_channels"]},
    }


def _window_status(window: dict[str, Any], now: datetime | None = None) -> str:
    if window.get("ended_at"):
        return "completed"
    if window.get("started_at"):
        return "active"
    moment = now or _now()
    start = _parse_time(window.get("start_time"))
    end = _parse_time(window.get("end_time"))
    if start and end and start <= moment < end:
        return "active"
    if end and moment >= end:
        return "completed"
    return "scheduled"


def _window_view(window: dict[str, Any]) -> dict[str, Any]:
    return {**window, "status": _window_status(window)}


def _suppression_window(event: CloudEvent, windows: list[dict[str, Any]]) -> dict[str, Any] | None:
    event_time = _parse_time(event.timestamp)
    if event_time is None:
        return None
    service = str(event.data.get("service") or "")
    for window in windows:
        start = _parse_time(window.get("started_at") or window.get("start_time"))
        end = _parse_time(window.get("ended_at") or window.get("end_time"))
        if start and event_time < start:
            continue
        if end and event_time >= end:
            continue
        affected = {str(value).lower() for value in window.get("affected_services", [])}
        if affected and "all" not in affected and service.lower() not in affected:
            continue
        return window
    return None


def unsuppressed_events(tenant_id: str, events: list[CloudEvent]) -> list[CloudEvent]:
    """Exclude alerts covered by an active maintenance window from incident/SLA views.

    The raw event remains in DynamoDB for auditability; suppression is a read-side policy,
    so ending a window never destroys telemetry.
    """
    windows = _load(tenant_id)["maintenance_windows"]
    return [event for event in events if _suppression_window(event, windows) is None]


def list_maintenance_windows(
    tenant_id: str, events: list[CloudEvent] | None = None
) -> list[dict[str, Any]]:
    windows = _load(tenant_id)["maintenance_windows"]
    result = []
    for window in windows:
        view = _window_view(window)
        if events is not None:
            view["suppressed_alerts"] = sum(
                1 for event in events if _suppression_window(event, [window]) is not None
            )
        result.append(view)
    return result


def create_maintenance_window(tenant_id: str, values: dict[str, Any]) -> dict[str, Any]:
    start = _parse_time(values["start_time"])
    end = _parse_time(values["end_time"])
    if start is None or end is None or end <= start:
        raise ValueError("end_time must be after start_time")
    state = _load(tenant_id)
    window = {
        "id": _new_id("maintenance"),
        **values,
        "suppressed_alerts": 0,
        "started_at": None,
        "ended_at": None,
        "updated_at": _iso(),
    }
    state["maintenance_windows"].append(window)
    _store(tenant_id, state)
    return _window_view(window)


def update_maintenance_window(tenant_id: str, window_id: str, values: dict[str, Any]) -> dict[str, Any]:
    state = _load(tenant_id)
    window = _find(state["maintenance_windows"], window_id)
    candidate = {**window, **values}
    start = _parse_time(candidate["start_time"])
    end = _parse_time(candidate["end_time"])
    if start is None or end is None or end <= start:
        raise ValueError("end_time must be after start_time")
    window.update(values)
    window["updated_at"] = _iso()
    _store(tenant_id, state)
    return _window_view(window)


def set_maintenance_state(tenant_id: str, window_id: str, action: str) -> dict[str, Any]:
    state = _load(tenant_id)
    window = _find(state["maintenance_windows"], window_id)
    if action == "start":
        window["started_at"] = _iso()
        window["ended_at"] = None
    elif action == "end":
        window["ended_at"] = _iso()
    else:
        raise ValueError("action must be start or end")
    window["updated_at"] = _iso()
    _store(tenant_id, state)
    return _window_view(window)


def delete_maintenance_window(tenant_id: str, window_id: str) -> None:
    state = _load(tenant_id)
    _find(state["maintenance_windows"], window_id)
    state["maintenance_windows"] = [window for window in state["maintenance_windows"] if window["id"] != window_id]
    _store(tenant_id, state)

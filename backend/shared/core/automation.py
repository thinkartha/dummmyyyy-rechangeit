"""AI automation state: rules, ML model registry, predictive insights and agents.

Everything the AI Automation screen can change lives here, persisted per tenant through
config_store (the same DynamoDB-or-memory path the connector configs use). Before this
module the screen was a wall of constants in the browser bundle — every switch, Edit,
Approve and Create button changed nothing.

Seeding follows the convention already set by finops/seed.py and drift/seed.py: a real
store and a real engine, primed with a representative starting set so a fresh tenant has
something to act on. Anything a tenant edits from then on is theirs.
"""

from __future__ import annotations

import json
import logging
import secrets
import time
from copy import deepcopy
from typing import Any

from . import config_store
from . import mock_data
from .automation_seed import seed_state

log = logging.getLogger("pinghold.automation")

INTEGRATION_KEY = "automation"

RULE_STATUSES = {"active", "learning", "paused", "error"}
MODEL_STATUSES = {"active", "training", "paused"}
AGENT_STATUSES = {"active", "warning", "pending", "offline"}
INSIGHT_DECISIONS = {"pending", "approved", "dismissed", "auto-approved"}

# An agent that has not checked in for this long is not "active" any more, whatever the
# last write said. Recomputed on read so a dead agent goes stale on its own.
_AGENT_STALE_S = 15 * 60


class NotFound(KeyError):
    """No such rule / model / insight / agent in this tenant."""


def _now() -> float:
    return time.time()


def _iso(ts: float | None) -> str | None:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(ts)) if ts else None


# --- persistence ------------------------------------------------------------

def _load(tenant_id: str) -> dict[str, Any]:
    raw = config_store.get_config(tenant_id, INTEGRATION_KEY)
    if raw:
        try:
            state = json.loads(raw)
        except json.JSONDecodeError:
            log.warning("Corrupt automation state for tenant %s; reseeding", tenant_id)
        else:
            if isinstance(state, dict) and "rules" in state:
                return state
    return deepcopy(_starting_state())


def _starting_state() -> dict[str, Any]:
    """Seeded rules and models are demo content; with mock data off a tenant starts empty."""
    state = deepcopy(seed_state())
    if mock_data.enabled():
        return state
    return {key: ([] if isinstance(value, list) else value) for key, value in state.items()}


def _store(tenant_id: str, state: dict[str, Any]) -> None:
    if not config_store.save_config(tenant_id, INTEGRATION_KEY, json.dumps(state)):
        raise RuntimeError("Could not save automation state")


def _find(items: list[dict[str, Any]], item_id: str) -> dict[str, Any]:
    for item in items:
        if item["id"] == item_id:
            return item
    raise NotFound(item_id)


def _new_id(prefix: str) -> str:
    return f"{prefix}-{secrets.token_hex(4)}"


# --- settings ---------------------------------------------------------------

def get_settings(tenant_id: str) -> dict[str, Any]:
    return _load(tenant_id)["settings"]


def set_settings(tenant_id: str, values: dict[str, Any]) -> dict[str, Any]:
    """The master switch and its friends. Unknown keys are rejected rather than stored,
    so a typo does not silently become a setting nothing reads."""
    state = _load(tenant_id)
    unknown = set(values) - set(state["settings"])
    if unknown:
        raise ValueError(f"Unknown setting(s): {', '.join(sorted(unknown))}")
    state["settings"].update(values)
    state["settings"]["updated_at"] = _iso(_now())
    _store(tenant_id, state)
    return state["settings"]


# --- rules ------------------------------------------------------------------

_RULE_FIELDS = {
    "name", "description", "category", "trigger", "action",
    "status", "enabled", "ai_driven", "confidence",
}


def list_rules(tenant_id: str) -> list[dict[str, Any]]:
    return _load(tenant_id)["rules"]


def create_rule(tenant_id: str, fields: dict[str, Any]) -> dict[str, Any]:
    if not str(fields.get("name", "")).strip():
        raise ValueError("A rule needs a name")
    state = _load(tenant_id)
    rule = {
        "id": _new_id("rule"),
        "name": fields["name"].strip(),
        "description": fields.get("description", ""),
        "category": fields.get("category", "Infrastructure"),
        "trigger": fields.get("trigger", ""),
        "action": fields.get("action", ""),
        # A brand-new rule has never fired, so it starts in learning rather than
        # claiming an "active" it has not earned.
        "status": fields.get("status", "learning"),
        "enabled": bool(fields.get("enabled", True)),
        "ai_driven": bool(fields.get("ai_driven", False)),
        "confidence": float(fields.get("confidence", 0)),
        "execution_count": 0,
        "success_count": 0,
        "success_rate": 0.0,
        "avg_resolution_seconds": None,
        "last_triggered": None,
        "created_at": _iso(_now()),
    }
    if rule["status"] not in RULE_STATUSES:
        raise ValueError(f"status must be one of {', '.join(sorted(RULE_STATUSES))}")
    state["rules"].insert(0, rule)
    _store(tenant_id, state)
    return rule


def update_rule(tenant_id: str, rule_id: str, fields: dict[str, Any]) -> dict[str, Any]:
    state = _load(tenant_id)
    rule = _find(state["rules"], rule_id)
    unknown = set(fields) - _RULE_FIELDS
    if unknown:
        raise ValueError(f"Cannot set field(s): {', '.join(sorted(unknown))}")
    if "status" in fields and fields["status"] not in RULE_STATUSES:
        raise ValueError(f"status must be one of {', '.join(sorted(RULE_STATUSES))}")
    rule.update(fields)
    rule["updated_at"] = _iso(_now())
    _store(tenant_id, state)
    return rule


def delete_rule(tenant_id: str, rule_id: str) -> None:
    state = _load(tenant_id)
    before = len(state["rules"])
    state["rules"] = [r for r in state["rules"] if r["id"] != rule_id]
    if len(state["rules"]) == before:
        raise NotFound(rule_id)
    _store(tenant_id, state)


def run_rule(tenant_id: str, rule_id: str, succeeded: bool = True,
             resolution_seconds: float | None = None) -> dict[str, Any]:
    """Record one execution. This is the write the automation runtime makes when a rule
    fires, and the same one the UI's manual "Run now" makes — a manual run is a real
    execution and is counted like one."""
    state = _load(tenant_id)
    rule = _find(state["rules"], rule_id)
    if not rule["enabled"]:
        raise ValueError("This rule is disabled")
    if not state["settings"]["enabled"]:
        raise ValueError("Automation is disabled for this organization (master switch)")

    rule["execution_count"] += 1
    rule["success_count"] += 1 if succeeded else 0
    rule["success_rate"] = round(rule["success_count"] / rule["execution_count"], 4)
    rule["last_triggered"] = _iso(_now())
    if resolution_seconds is not None:
        previous = rule.get("avg_resolution_seconds")
        n = rule["execution_count"]
        # Running mean: keeping every duration to average them would grow without bound
        # for a rule that fires every minute.
        rule["avg_resolution_seconds"] = round(
            resolution_seconds if previous is None else previous + (resolution_seconds - previous) / n, 2
        )
    if rule["status"] == "learning" and rule["execution_count"] >= 10 and rule["success_rate"] >= 0.8:
        rule["status"] = "active"

    state["executions"] = ([{
        "rule_id": rule_id,
        "rule_name": rule["name"],
        "succeeded": succeeded,
        "resolution_seconds": resolution_seconds,
        "at": _iso(_now()),
    }] + state.get("executions", []))[:100]
    _store(tenant_id, state)
    return rule


def list_executions(tenant_id: str, limit: int = 50) -> list[dict[str, Any]]:
    return _load(tenant_id).get("executions", [])[:limit]


# --- ML models --------------------------------------------------------------

def list_models(tenant_id: str) -> list[dict[str, Any]]:
    return _load(tenant_id)["models"]


def get_model(tenant_id: str, model_id: str) -> dict[str, Any]:
    return _find(_load(tenant_id)["models"], model_id)


def update_model(tenant_id: str, model_id: str, fields: dict[str, Any]) -> dict[str, Any]:
    allowed = {"status", "enabled", "retraining", "description"}
    unknown = set(fields) - allowed
    if unknown:
        raise ValueError(f"Cannot set field(s): {', '.join(sorted(unknown))}")
    if "status" in fields and fields["status"] not in MODEL_STATUSES:
        raise ValueError(f"status must be one of {', '.join(sorted(MODEL_STATUSES))}")
    state = _load(tenant_id)
    model = _find(state["models"], model_id)
    model.update(fields)
    _store(tenant_id, state)
    return model


def retrain_model(tenant_id: str, model_id: str) -> dict[str, Any]:
    """Queue a retrain. This records the request and flips the model to "training" — the
    trainer itself is a separate job that reports back through update_model. Nothing here
    pretends to fit a model.
    """
    state = _load(tenant_id)
    model = _find(state["models"], model_id)
    if model["status"] == "training":
        raise ValueError("This model is already training")
    model["status"] = "training"
    model["training_requested_at"] = _iso(_now())
    state["training_runs"] = ([{
        "model_id": model_id,
        "model_name": model["name"],
        "requested_at": _iso(_now()),
        "state": "queued",
    }] + state.get("training_runs", []))[:50]
    _store(tenant_id, state)
    return model


def list_training_runs(tenant_id: str, limit: int = 20) -> list[dict[str, Any]]:
    return _load(tenant_id).get("training_runs", [])[:limit]


# --- predictive insights ----------------------------------------------------

def list_insights(tenant_id: str) -> list[dict[str, Any]]:
    return _load(tenant_id)["insights"]


def decide_insight(tenant_id: str, insight_id: str, decision: str, actor: str | None = None) -> dict[str, Any]:
    """Approve or dismiss. The decision and who made it are kept on the insight — an
    approval that leaves no trace is indistinguishable from nobody having looked."""
    if decision not in INSIGHT_DECISIONS:
        raise ValueError(f"decision must be one of {', '.join(sorted(INSIGHT_DECISIONS))}")
    state = _load(tenant_id)
    insight = _find(state["insights"], insight_id)
    insight["status"] = decision
    insight["decided_by"] = actor
    insight["decided_at"] = _iso(_now())
    _store(tenant_id, state)
    return insight


# --- agents -----------------------------------------------------------------

_AGENT_FIELDS = {"name", "description", "environment", "agent_type", "capabilities", "endpoints", "status"}


def _agent_view(agent: dict[str, Any]) -> dict[str, Any]:
    """Read-side status: an agent that stopped checking in is offline no matter what its
    stored status says."""
    last = agent.get("last_seen_epoch")
    stale = last is not None and (_now() - last) > _AGENT_STALE_S
    return {
        **{k: v for k, v in agent.items() if k not in {"key", "last_seen_epoch"}},
        # The key is a credential: shown once at creation, a fingerprint after that.
        "key_hint": f"…{agent['key'][-6:]}",
        "last_seen": _iso(last),
        "status": "offline" if stale else agent["status"],
    }


def list_agents(tenant_id: str) -> list[dict[str, Any]]:
    return [_agent_view(a) for a in _load(tenant_id)["agents"]]


def create_agent(tenant_id: str, fields: dict[str, Any]) -> dict[str, Any]:
    """Register an agent and mint its key. The key is returned exactly once, here."""
    if not str(fields.get("name", "")).strip():
        raise ValueError("An agent needs a name")
    state = _load(tenant_id)
    key = f"phk_{secrets.token_urlsafe(24)}"
    agent = {
        "id": _new_id("agent"),
        "name": fields["name"].strip(),
        "description": fields.get("description", ""),
        "environment": fields.get("environment", "Production"),
        "agent_type": fields.get("agent_type", "Monitoring Agent"),
        "capabilities": list(fields.get("capabilities") or []),
        "endpoints": list(fields.get("endpoints") or []),
        "key": key,
        "version": "v1.0.0",
        # Nothing has connected yet, so it is pending, not active.
        "status": "pending",
        "last_seen_epoch": None,
        "created_at": _iso(_now()),
    }
    state["agents"].insert(0, agent)
    _store(tenant_id, state)
    return {**_agent_view(agent), "key": key}


def update_agent(tenant_id: str, agent_id: str, fields: dict[str, Any]) -> dict[str, Any]:
    unknown = set(fields) - _AGENT_FIELDS
    if unknown:
        raise ValueError(f"Cannot set field(s): {', '.join(sorted(unknown))}")
    if "status" in fields and fields["status"] not in AGENT_STATUSES:
        raise ValueError(f"status must be one of {', '.join(sorted(AGENT_STATUSES))}")
    state = _load(tenant_id)
    agent = _find(state["agents"], agent_id)
    agent.update(fields)
    _store(tenant_id, state)
    return _agent_view(agent)


def delete_agent(tenant_id: str, agent_id: str) -> None:
    state = _load(tenant_id)
    before = len(state["agents"])
    state["agents"] = [a for a in state["agents"] if a["id"] != agent_id]
    if len(state["agents"]) == before:
        raise NotFound(agent_id)
    _store(tenant_id, state)


def rotate_agent_key(tenant_id: str, agent_id: str) -> dict[str, Any]:
    state = _load(tenant_id)
    agent = _find(state["agents"], agent_id)
    key = f"phk_{secrets.token_urlsafe(24)}"
    agent["key"] = key
    agent["key_rotated_at"] = _iso(_now())
    _store(tenant_id, state)
    return {**_agent_view(agent), "key": key}


def heartbeat(tenant_id: str, agent_id: str, version: str | None = None) -> dict[str, Any]:
    """What an installed agent calls to say it is alive. Also what makes the Download
    flow verifiable: install, start, and the row turns active."""
    state = _load(tenant_id)
    agent = _find(state["agents"], agent_id)
    agent["last_seen_epoch"] = _now()
    agent["status"] = "active"
    if version:
        agent["version"] = version
    _store(tenant_id, state)
    return _agent_view(agent)


_PLATFORMS = {
    "windows": {"label": "Windows", "ext": "msi", "install": "msiexec /i {file} KEY={key}"},
    "macos": {"label": "macOS", "ext": "pkg", "install": "sudo installer -pkg {file} -target /"},
    "linux": {"label": "Linux", "ext": "deb", "install": "sudo dpkg -i {file}"},
}


def install_manifest(tenant_id: str, agent_id: str, api_base: str) -> dict[str, Any]:
    """Everything the Download button needs: the package name per platform, the install
    command, and the config the agent starts with. The binaries are served by whatever
    hosts releases; this hands out the coordinates, not the bytes."""
    state = _load(tenant_id)
    agent = _find(state["agents"], agent_id)
    slug = agent["name"].lower().replace(" ", "-")
    version = agent.get("version", "v1.0.0")
    return {
        "agent_id": agent_id,
        "name": agent["name"],
        "version": version,
        "key": agent["key"],
        "config": {
            "api_base": api_base,
            "agent_id": agent_id,
            "environment": agent["environment"],
            "heartbeat_seconds": 60,
        },
        "platforms": [
            {
                "id": key,
                "label": spec["label"],
                "file": (file := f"pinghold-agent-{slug}-{version}.{spec['ext']}"),
                "install_command": spec["install"].format(file=file, key=agent["key"]),
            }
            for key, spec in _PLATFORMS.items()
        ],
    }


# --- summary ----------------------------------------------------------------

def summary(tenant_id: str) -> dict[str, Any]:
    """The cards across the top of the screen."""
    state = _load(tenant_id)
    rules = state["rules"]
    active = [r for r in rules if r["enabled"] and r["status"] == "active"]
    executed = [r for r in rules if r["execution_count"]]
    total_runs = sum(r["execution_count"] for r in rules)
    total_ok = sum(r["success_count"] for r in rules)
    durations = [r["avg_resolution_seconds"] for r in executed if r.get("avg_resolution_seconds")]
    agents = [_agent_view(a) for a in state["agents"]]

    return {
        "automation_enabled": state["settings"]["enabled"],
        "rules": len(rules),
        "active_rules": len(active),
        "executions": total_runs,
        "success_rate": round(total_ok / total_runs, 4) if total_runs else 0.0,
        "avg_resolution_seconds": round(sum(durations) / len(durations), 1) if durations else None,
        "models": len(state["models"]),
        "models_training": sum(1 for m in state["models"] if m["status"] == "training"),
        "agents": len(agents),
        "agents_online": sum(1 for a in agents if a["status"] == "active"),
        "insights_pending": sum(1 for i in state["insights"] if i["status"] == "pending"),
    }

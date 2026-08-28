"""Spend budgets — a monthly ceiling per cloud account or AI tool.

The cost pages could always show what was spent; neither could say what was *meant* to
be spent, so "$4,182 today" carried no verdict and the AI Cost table's Budget column
read "no budget set" for everything. A budget is the missing half: the number a row is
compared against.

Deliberately not a billing system. There is no enforcement, no alerting, no proration —
a budget is a stored limit and the comparison the tables do against it. Storage is
config_store, the same per-tenant JSON the connector configs use, because a handful of
limits per tenant does not earn a table of its own.
"""

from __future__ import annotations

import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from . import config_store

log = logging.getLogger("pinghold.budgets")

INTEGRATION_KEY = "budgets"

# What a budget can be attached to. `cloud` is an account or provider on the cost page,
# `ai` is a tool or model on the AI cost page.
SCOPES = {"cloud", "ai"}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _load(tenant_id: str) -> list[dict[str, Any]]:
    raw = config_store.get_config(tenant_id, INTEGRATION_KEY)
    if not raw:
        return []
    try:
        saved = json.loads(raw)
    except json.JSONDecodeError:
        log.warning("Corrupt budget config for tenant %s", tenant_id)
        return []
    budgets = saved.get("budgets")
    return budgets if isinstance(budgets, list) else []


def _store(tenant_id: str, budgets: list[dict[str, Any]]) -> None:
    config_store.save_config(tenant_id, INTEGRATION_KEY, json.dumps({"budgets": budgets}))


def list_budgets(tenant_id: str, scope: str | None = None) -> list[dict[str, Any]]:
    budgets = _load(tenant_id)
    if scope:
        budgets = [b for b in budgets if b.get("scope") == scope]
    return sorted(budgets, key=lambda b: (b.get("scope", ""), b.get("target", "")))


def save_budget(tenant_id: str, fields: dict[str, Any]) -> dict[str, Any]:
    """Create or replace one budget.

    Keyed by (scope, target) rather than by id: setting a budget for the same target
    twice is the operator correcting the number, not asking for two ceilings on one
    thing. `target` "*" is the catch-all for that scope.
    """
    scope = str(fields.get("scope") or "").strip().lower()
    if scope not in SCOPES:
        raise ValueError(f"scope must be one of: {', '.join(sorted(SCOPES))}")

    target = str(fields.get("target") or "*").strip() or "*"

    try:
        monthly_limit = float(fields.get("monthly_limit"))
    except (TypeError, ValueError) as exc:
        raise ValueError("monthly_limit must be a number") from exc
    if monthly_limit <= 0:
        raise ValueError("monthly_limit must be greater than zero")

    currency = str(fields.get("currency") or "USD").strip().upper()
    if len(currency) != 3:
        raise ValueError("currency must be a three-letter code, e.g. USD")

    budgets = _load(tenant_id)
    existing = next(
        (b for b in budgets if b.get("scope") == scope and b.get("target") == target), None
    )
    entry = {
        "id": (existing or {}).get("id") or f"bgt_{uuid.uuid4().hex[:8]}",
        "scope": scope,
        "target": target,
        "name": str(fields.get("name") or target).strip(),
        "monthly_limit": round(monthly_limit, 2),
        "currency": currency,
        "created_at": (existing or {}).get("created_at") or _now(),
        "updated_at": _now(),
    }
    if existing:
        budgets[budgets.index(existing)] = entry
    else:
        budgets.append(entry)
    _store(tenant_id, budgets)
    return entry


def delete_budget(tenant_id: str, budget_id: str) -> bool:
    budgets = _load(tenant_id)
    remaining = [b for b in budgets if b.get("id") != budget_id]
    if len(remaining) == len(budgets):
        return False
    _store(tenant_id, remaining)
    return True


def budget_for(tenant_id: str, scope: str, target: str) -> dict[str, Any] | None:
    """The budget that applies to one row: its own, else the scope's catch-all."""
    budgets = list_budgets(tenant_id, scope)
    exact = next((b for b in budgets if b.get("target") == target), None)
    return exact or next((b for b in budgets if b.get("target") == "*"), None)

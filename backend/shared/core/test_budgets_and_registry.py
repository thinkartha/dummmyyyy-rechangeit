"""Budgets and the AI-model registry — the two stores behind the cost and model pages.

What these pin down:
  * a budget is keyed by (scope, target), so setting the same target twice corrects the
    number rather than stacking a second ceiling on one thing;
  * `budget_for` falls back to the scope's "*" catch-all, which is what lets one limit
    cover every tool nobody set a specific number for;
  * a registered model appears in model_stats before any inference exists, with None
    fields and an awaiting_data status — zeros there would read as "measured zero".

    python3 backend/shared/core/test_budgets_and_registry.py
"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))

from shared.core import ai_models, budgets  # noqa: E402

TENANT = "test-tenant"


def budget_cases():
    saved = budgets.save_budget(TENANT, {"scope": "ai", "target": "support-copilot",
                                         "monthly_limit": 500, "currency": "usd"})
    assert saved["currency"] == "USD", saved
    assert saved["monthly_limit"] == 500.0, saved

    # Same target again is a correction, not a second budget.
    again = budgets.save_budget(TENANT, {"scope": "ai", "target": "support-copilot",
                                         "monthly_limit": 750})
    assert again["id"] == saved["id"], (saved["id"], again["id"])
    assert again["created_at"] == saved["created_at"], "created_at must survive an edit"
    assert len(budgets.list_budgets(TENANT, "ai")) == 1, budgets.list_budgets(TENANT, "ai")

    # The catch-all applies to anything without its own number.
    budgets.save_budget(TENANT, {"scope": "ai", "target": "*", "monthly_limit": 100})
    assert budgets.budget_for(TENANT, "ai", "support-copilot")["monthly_limit"] == 750.0
    assert budgets.budget_for(TENANT, "ai", "unknown-tool")["monthly_limit"] == 100.0
    # Scopes do not leak into each other.
    assert budgets.budget_for(TENANT, "cloud", "support-copilot") is None

    for bad in ({"scope": "nope", "monthly_limit": 5},
                {"scope": "ai", "monthly_limit": 0},
                {"scope": "ai", "monthly_limit": "abc"},
                {"scope": "ai", "monthly_limit": 5, "currency": "dollars"}):
        try:
            budgets.save_budget(TENANT, bad)
        except ValueError:
            pass
        else:
            raise AssertionError(f"accepted invalid budget: {bad}")

    assert budgets.delete_budget(TENANT, saved["id"]) is True
    assert budgets.delete_budget(TENANT, saved["id"]) is False


def registry_cases():
    entry = ai_models.register_model(TENANT, {"model": "fraud-classifier", "task": "classification"})
    assert entry["name"] == "fraud-classifier", entry
    assert entry["provider"] == "self-hosted", entry

    rows = ai_models.model_stats(TENANT)
    row = next((r for r in rows if r["model"] == "fraud-classifier"), None)
    assert row is not None, "a registered model must have a row before any inference"
    assert row["status"] == "awaiting_data", row["status"]
    # None, not 0 — nothing has been measured, and 0ms latency is a claim.
    assert row["p95_latency_ms"] is None and row["last_seen"] is None, row

    ai_models.record(TENANT, {"model": "fraud-classifier", "latency_ms": 42.0, "success": True})
    rows = ai_models.model_stats(TENANT)
    row = next(r for r in rows if r["model"] == "fraud-classifier")
    assert row["requests"] == 1, row
    assert row["status"] != "awaiting_data", "a reporting model must use its measured status"
    assert row["registered"] is True, row

    try:
        ai_models.register_model(TENANT, {"model": "   "})
    except ValueError:
        pass
    else:
        raise AssertionError("accepted a blank model id")

    assert ai_models.unregister_model(TENANT, "fraud-classifier") is True
    assert ai_models.unregister_model(TENANT, "fraud-classifier") is False
    # Unregistering leaves the recorded inference, so the row survives.
    assert any(r["model"] == "fraud-classifier" for r in ai_models.model_stats(TENANT))


if __name__ == "__main__":
    budget_cases()
    registry_cases()
    print("ok")

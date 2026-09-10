"""Alert triage: ask the knowledge graph what it knows, route to agent or human."""
from __future__ import annotations

import os
from typing import Any

from rvkg import engine

# ponytail: one score threshold, no policy engine. Swap for per-tenant config when
# tenants actually disagree about it.
CONFIDENT = float(os.environ.get("TRIAGE_CONFIDENCE", "0.55"))


def _need(alert: dict[str, Any]) -> str:
    return " ".join(
        str(alert.get(k, ""))
        for k in ("title", "service", "message", "resource", "error")
    ).strip()


def triage(tenant_id: str, alert: dict[str, Any], project_id: str = "observability") -> dict[str, Any]:
    """Return {route, reason, confidence, context, trails} for one alert."""
    need = _need(alert)
    if not need:
        return {"route": "human", "reason": "alert has no describable content",
                "confidence": 0.0, "context": [], "trails": {}}

    out = engine.query_graph(tenant_id, project_id, [need])
    results = out.get("results") or []
    top = max((r.get("score") or 0.0) for r in results) if results else 0.0

    if str(alert.get("priority", "")).lower() in ("p0", "critical"):
        route, reason = "human", "critical priority always pages a human"
    elif top >= CONFIDENT:
        route, reason = "agent", f"graph grounding at {top:.2f} covers this alert"
    else:
        route, reason = "human", f"best grounding was {top:.2f}, below {CONFIDENT}"

    return {
        "route": route,
        "reason": reason,
        "confidence": top,
        "context": [{"artifact_id": r["artifact_id"], "score": r.get("score"),
                     "doc": r.get("doc", "")} for r in results],
        "trails": out.get("paths", {}),
    }


def record_outcome(tenant_id: str, alert_id: str, target: str,
                   relation: str = "TOUCHED", project_id: str = "observability") -> dict:
    """Feed a resolved alert back into the graph — no LLM, instant."""
    return engine.push_facts(tenant_id, project_id, [{
        "source": alert_id, "relation": relation, "target": target,
        "source_kind": "alert", "target_anchor": True,
    }])

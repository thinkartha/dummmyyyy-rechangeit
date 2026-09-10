"""Roll stored spans up per route, then write them into the rv-aiknowledge graph.

A span is not a fact and there is no useful graph with a node per request — a hundred
thousand of them is a dead index nobody can traverse. So the rollup is the unit:

  * facts   — the topology. route -> its source, its upstream, the model it calls.
              No LLM, idempotent, cheap enough to run every five minutes.
  * a doc   — only for a route that actually breached. Prose the extraction pass can
              read, which is what makes "why is checkout slow" answerable at all.

Facts for every route, a doc only for the slow ones: the topology is what traversal
needs to connect two routes through a shared upstream, and it is nearly free. Prose is
what costs an LLM call, so it is spent where there is something to explain.

    python3 backend/rvkg_bridge/bridge.py --tenant demo-tenant --org acme --project prod
"""

from __future__ import annotations

import argparse
import math
import os
import re
import sys
from collections import defaultdict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

from shared.core import agent_telemetry  # noqa: E402

import producers  # noqa: E402

_RVKG_PATH = os.environ.get("RVKG_PATH", "")
if _RVKG_PATH and _RVKG_PATH not in sys.path:
    sys.path.insert(0, _RVKG_PATH)

from rvkg import atlas_client, engine  # noqa: E402

SLOW_MS = float(os.environ.get("RVKG_SLOW_MS", "500"))


def _pct(values: list[float], p: float) -> float:
    """Nearest-rank percentile. Exact on the small per-route samples a 5-minute window
    produces, where interpolation would invent a latency nobody observed."""
    if not values:
        return 0.0
    ordered = sorted(values)
    return round(ordered[max(0, math.ceil(p * len(ordered)) - 1)], 3)


def _slug(route: str) -> str:
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", route.lower())).strip("-") or "route"


def rollup(spans: list[dict]) -> dict[str, dict]:
    """Per-route latency, split into the parts you can actually tune."""
    by_trace_model: dict[str, list[tuple[str, float]]] = defaultdict(list)
    for span in spans:
        if str(span.get("kind") or "").upper() != "LLM":
            continue
        attrs = span.get("attributes") or {}
        # An LLM span hangs off its route span's trace, which is how model time is
        # attributed to a route without either producer knowing about the other.
        trace = str(span.get("trace_id") or "")
        model = str(attrs.get("llm.model_name") or "unknown-model")
        by_trace_model[trace].append((model, float(span.get("duration_ms") or 0.0)))

    routes: dict[str, dict] = {}
    for span in spans:
        if str(span.get("kind") or "").upper() != "SERVER":
            continue
        attrs = span.get("attributes") or {}
        route = str(attrs.get("http.route") or span.get("name") or "").strip()
        if not route:
            continue
        entry = routes.setdefault(route, {
            "route": route, "total": [], "integration": [], "overhead": [],
            "model_ms": [], "errors": 0, "count": 0,
            "targets": set(), "models": set(), "sources": set(),
        })
        entry["count"] += 1
        entry["total"].append(float(span.get("duration_ms") or 0.0))
        entry["integration"].append(float(attrs.get("aws.apigw.integration_latency_ms") or 0.0))
        entry["overhead"].append(float(attrs.get("aws.apigw.overhead_ms") or 0.0))
        if str(span.get("status") or "").upper() == "ERROR":
            entry["errors"] += 1
        if attrs.get("aws.apigw.integration_target"):
            entry["targets"].add(str(attrs["aws.apigw.integration_target"]))
        if attrs.get("telemetry.source"):
            entry["sources"].add(str(attrs["telemetry.source"]))
        for model, duration in by_trace_model.get(str(span.get("trace_id") or ""), []):
            entry["models"].add(model)
            entry["model_ms"].append(duration)

    summary = {}
    for route, entry in routes.items():
        total = entry["total"]
        summary[route] = {
            "route": route,
            "count": entry["count"],
            "p50_ms": _pct(total, 0.50),
            "p95_ms": _pct(total, 0.95),
            "max_ms": round(max(total), 3) if total else 0.0,
            "integration_p95_ms": _pct(entry["integration"], 0.95),
            "overhead_p95_ms": _pct(entry["overhead"], 0.95),
            "model_p95_ms": _pct(entry["model_ms"], 0.95),
            "error_rate": round(entry["errors"] / entry["count"], 4) if entry["count"] else 0.0,
            "targets": sorted(entry["targets"]),
            "models": sorted(entry["models"]),
            "sources": sorted(entry["sources"]),
        }
    return summary


def facts_for(summary: dict[str, dict]) -> list[dict]:
    """Topology edges. Only the route is anchored.

    An upstream service and a model have no document behind them, so anchoring them
    would spend a discovery slot returning a node with nothing to read. Un-anchored,
    traversal still walks *through* them — which is exactly how two routes sharing one
    slow upstream end up connected.
    """
    facts = []
    for route, stats in summary.items():
        node = _slug(route)
        facts.append({"source": node, "relation": "IS_ROUTE",
                      "target": "api-surface", "source_label": route,
                      "source_kind": "route", "source_anchor": True,
                      "target_kind": "surface"})
        for target in stats["targets"]:
            facts.append({"source": node, "relation": "CALLS", "target": target,
                          "source_label": route, "source_kind": "route",
                          "source_anchor": True, "target_kind": "service"})
        for model in stats["models"]:
            facts.append({"source": node, "relation": "CALLS_MODEL", "target": model,
                          "source_label": route, "source_kind": "route",
                          "source_anchor": True, "target_kind": "model"})
        for source in stats["sources"]:
            facts.append({"source": node, "relation": "OBSERVED_BY", "target": source,
                          "source_label": route, "source_kind": "route",
                          "source_anchor": True, "target_kind": "telemetry_source"})
    return facts


def _dominant(stats: dict) -> str:
    """Where the time went — the sentence someone tuning the route needs first."""
    parts = [
        ("the model call", stats["model_p95_ms"]),
        ("the upstream integration", stats["integration_p95_ms"]),
        ("API Gateway itself", stats["overhead_p95_ms"]),
    ]
    label, value = max(parts, key=lambda p: p[1])
    p95 = stats["p95_ms"] or 1.0
    return f"{label} ({value:.0f} ms, {value / p95 * 100:.0f}% of p95)"


def document_for(stats: dict, slow_ms: float = SLOW_MS, recovered: bool = False) -> str:
    """The report for one route. `recovered` means this route has a document from an
    earlier window and no longer breaches — the reason it still gets written."""
    targets = ", ".join(stats["targets"]) or "none recorded"
    models = ", ".join(stats["models"]) or "none"
    breaching = stats["p95_ms"] >= slow_ms
    # A flat subject-predicate-object sentence, on its own line, because the claim
    # extractor is what makes the graph able to retire the older verdict when this one
    # contradicts it. Buried in a paragraph it reads as prose and nothing retires.
    verdict = (f"`{stats['route']}` is breaching its latency objective."
               if breaching else
               f"`{stats['route']}` is within its latency objective.")
    note = "" if not recovered else (
        f"\nThis route breached in an earlier window and does not any more. The earlier "
        f"report for it is superseded by these numbers.\n")
    return f"""# Latency report: {stats['route']}

{verdict}
{note}
`{stats['route']}` served {stats['count']} requests in this window at a p95 of
{stats['p95_ms']:.0f} ms (p50 {stats['p50_ms']:.0f} ms, worst {stats['max_ms']:.0f} ms),
against a {slow_ms:.0f} ms objective. The error rate was {stats['error_rate'] * 100:.1f}%.

Most of the tail is {_dominant(stats)}.

## Where the p95 goes

| component | p95 |
|---|---|
| upstream integration | {stats['integration_p95_ms']:.0f} ms |
| API Gateway overhead | {stats['overhead_p95_ms']:.0f} ms |
| model call | {stats['model_p95_ms']:.0f} ms |

The route calls {targets}. Models involved: {models}. Telemetry came from
{', '.join(stats['sources']) or 'unknown'}.

## Reading this

High integration latency with flat gateway overhead is the upstream service — the
gateway is waiting. High gateway overhead with a fast integration is authorizer,
request validation, or a cold start on the gateway side, and tuning the backend will
not move it. When the model call dominates, latency is a prompt, model or streaming
question, not an infrastructure one.
"""


def sync(tenant_id: str, org_id: str, project_id: str, limit: int = 5000,
         slow_ms: float = SLOW_MS, api_key: str = "") -> dict:
    spans = agent_telemetry.spans(tenant_id, limit)
    summary = rollup(spans)
    if not summary:
        return {"spans": len(spans), "routes": 0, "facts": 0, "documents": []}

    facts = facts_for(summary)
    engine.push_facts(org_id, project_id, facts)

    # Which routes already have a report. A route that recovers stops breaching, and
    # without this it would simply drop out of the loop — leaving its old report in the
    # graph to answer "why is checkout slow" from a window that no longer exists.
    # Re-indexing an unchanged document is content-hash cached, so this is not a new
    # LLM call per window; it is one per window in which the numbers actually moved.
    documented = set(atlas_client.get_project_shas(org_id, project_id))

    indexed, recovered = [], []
    for route, stats in summary.items():
        slug = _slug(route)
        breaching = stats["p95_ms"] >= slow_ms
        if not breaching and slug not in documented:
            continue
        engine.index_artifact(org_id, project_id, slug,
                              document_for(stats, slow_ms, recovered=not breaching),
                              api_key=api_key)
        indexed.append(slug)
        if not breaching:
            recovered.append(slug)
    # A route absent from this window keeps its report. Absence is not recovery — a
    # quiet hour and a deleted endpoint look identical from here.
    return {"spans": len(spans), "routes": len(summary), "facts": len(facts),
            "documents": indexed, "recovered": recovered, "summary": summary}


DEMO_QUESTIONS = [
    "why is the checkout endpoint slow",
    "which route spends its time inside the gateway instead of the backend",
    "how much of the AI chat latency is the model call",
]


def demo(tenant_id: str, org_id: str, project_id: str, slow_ms: float,
         requests: int = 600, turns: int = 6) -> dict:
    """Generate traffic, build the graph, ask it questions. One process on purpose —
    without DynamoDB the span store is per-process memory, so a two-command version
    would hand the bridge an empty store and look broken."""
    print("--> producing telemetry")
    gateway = producers.push_apigw(tenant_id, producers.synthetic_apigw(requests))
    agent = producers.run_agent(tenant_id, turns=turns)
    key = os.environ.get("OPENAI_API_KEY", "")
    print(f"    {gateway} gateway spans, {agent} agent spans"
          f"{'' if key else '  (no OPENAI_API_KEY: latencies synthesised)'}")

    print("--> rolling up and writing the graph")
    result = sync(tenant_id, org_id, project_id, slow_ms=slow_ms)
    _print_routes(result)
    print(f"\n    {result['facts']} facts written; documents indexed for "
          f"{result['documents'] or 'nothing (no route breached)'}")
    if result.get("recovered"):
        print(f"    recovered since an earlier window: {result['recovered']}")

    print("\n--> asking the graph")
    for question in DEMO_QUESTIONS:
        out = engine.query_graph(org_id, project_id, [question])
        print(f"\n  Q: {question}")
        rows = out.get("results") or []
        if not rows:
            print("     (no grounding — check MONGODB_URI and NEO4J_URI)")
        for row in rows:
            trail = (out.get("paths") or {}).get(row["artifact_id"], "direct match")
            print(f"     {row['score']:.2f}  {row['artifact_id']:22s} {trail}")
    if not key:
        print("\n  Scores are keyword hit-ratio, not cosine: set OPENAI_API_KEY for"
              "\n  embeddings before reading anything into the ranking.")
    return result


def _print_routes(result: dict) -> None:
    for _, stats in sorted(result.get("summary", {}).items(),
                           key=lambda kv: -kv[1]["p95_ms"]):
        print(f"    {stats['p95_ms']:8.0f} ms p95  n={stats['count']:<5d} "
              f"{stats['route']:26s} {_dominant(stats)}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--tenant", default=os.environ.get("RVKG_TENANT", "demo-tenant"))
    parser.add_argument("--org", default=os.environ.get("RVKG_ORG", "acme"))
    parser.add_argument("--project", default=os.environ.get("RVKG_PROJECT", "prod"))
    parser.add_argument("--slow-ms", type=float, default=SLOW_MS)
    parser.add_argument("--limit", type=int, default=5000)
    parser.add_argument("--demo", action="store_true",
                        help="generate traffic and query the graph, all in one process")
    args = parser.parse_args()

    if args.demo:
        demo(args.tenant, args.org, args.project, args.slow_ms)
        return 0

    result = sync(args.tenant, args.org, args.project, args.limit, args.slow_ms)
    print(f"spans={result['spans']} routes={result['routes']} "
          f"facts={result['facts']} documents={result['documents']}")
    _print_routes(result)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

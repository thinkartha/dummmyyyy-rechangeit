"""AI agent observability over durable spans stored by the Lambda API.

Deployed environments read tenant-scoped spans and evaluations from DynamoDB. Phoenix
remains an optional local/backward-compatible source when the durable record table is not
configured, but no long-running service is required in AWS.

Attribute naming is the hard part. Two conventions are in the wild — OpenInference
(`llm.token_count.prompt`, what Phoenix's own instrumentors emit) and OTel GenAI
(`gen_ai.usage.input_tokens`, what vendor SDKs increasingly emit) — and a real
deployment usually has both. Every read goes through _attr() with candidates from both
so one instrumented service does not blank out the dashboard for the others.

Cost is only reported when the span carries it. Deriving it from a built-in price table
would mean shipping prices that go stale silently and reporting invented numbers as
measurements; a null renders as "—" instead.
"""

from __future__ import annotations

import os
from collections import defaultdict
from datetime import datetime, timezone
from typing import Any

from shared.collector.cloudevents import CloudEvent
from . import agent_telemetry
from . import agent_seed
from . import observability as obs

# Rolled up per agent; a chatty agent easily exceeds this in a day, so it is a
# "recent activity" window rather than a complete history.
_SPAN_FETCH_LIMIT = 5000


def agent_project() -> str:
    return os.getenv("PHOENIX_AGENT_PROJECT", "default")


def _attr(span: dict, *names: str, default=None):
    """First attribute present under any of the given conventional names."""
    attrs = span.get("attributes") or {}
    for name in names:
        if name in attrs and attrs[name] is not None:
            return attrs[name]
        # Some exporters flatten nested attributes, others nest them.
        cursor: Any = attrs
        for part in name.split("."):
            if not isinstance(cursor, dict) or part not in cursor:
                cursor = None
                break
            cursor = cursor[part]
        if cursor is not None and not isinstance(cursor, dict):
            return cursor
    return default


def _number(value, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _is_llm_span(span: dict) -> bool:
    kind = str(_attr(span, "openinference.span.kind", "gen_ai.operation.name", default="")).upper()
    if kind in {"LLM", "CHAT", "COMPLETION", "AGENT", "CHAIN", "TOOL"}:
        return True
    # An exporter that sets no kind but does report a model is still an LLM call.
    return _attr(span, "llm.model_name", "gen_ai.request.model") is not None


def _model(span: dict) -> str:
    return str(_attr(span, "llm.model_name", "gen_ai.request.model", "gen_ai.response.model",
                     default="unknown"))


def _provider(span: dict) -> str:
    provider = _attr(span, "llm.provider", "gen_ai.system")
    if provider:
        return str(provider)
    # Fall back to inferring from the model name — imperfect, but "unknown" for every
    # row makes the provider breakdown useless.
    model = _model(span).lower()
    for needle, name in (
        ("gpt", "OpenAI"), ("o1", "OpenAI"), ("claude", "Anthropic"),
        ("gemini", "Google"), ("mistral", "Mistral"), ("llama", "Meta"),
    ):
        if needle in model:
            return name
    return "Unknown"


def _agent_name(span: dict) -> str:
    return str(_attr(span, "agent.name", "gen_ai.agent.name", "service.name",
                     default=span.get("name") or "unnamed-agent"))


def _tokens(span: dict) -> tuple[float, float]:
    prompt = _number(_attr(span, "llm.token_count.prompt", "gen_ai.usage.input_tokens",
                           "gen_ai.usage.prompt_tokens"))
    completion = _number(_attr(span, "llm.token_count.completion", "gen_ai.usage.output_tokens",
                               "gen_ai.usage.completion_tokens"))
    return prompt, completion


def _cost(span: dict) -> float | None:
    value = _attr(span, "llm.cost.total", "llm.cost", "gen_ai.usage.cost")
    return _number(value) if value is not None else None


def _parse_time(value) -> datetime | None:
    if not value:
        return None
    try:
        if isinstance(value, (int, float)):
            return datetime.fromtimestamp(float(value) / 1e9, tz=timezone.utc)
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except (ValueError, OSError):
        return None


def _all_spans(
    limit: int = _SPAN_FETCH_LIMIT,
    tenant_id: str | None = None,
) -> list[dict[str, Any]]:
    # Demo mode substitutes the span source only. Normalization, filtering and every
    # rollup below run unchanged, so what a demo shows is what production computes.
    if agent_seed.enabled():
        raw = agent_seed.spans()
    elif tenant_id:
        # A tenant sees its own stored telemetry or nothing. The shared Phoenix project
        # is one pool with no tenant label on it, so the old fallback here handed every
        # tenant that had not pushed a batch yet whatever spans happened to be in it —
        # which is where the unexplained routes and traces came from.
        raw = agent_telemetry.spans(tenant_id, limit) if agent_telemetry.uses_store(tenant_id) else []
    else:
        raw = obs._fetch_spans(limit, project=agent_project())
    return [obs._normalize(row) for row in raw]


def _llm_spans(
    limit: int = _SPAN_FETCH_LIMIT,
    tenant_id: str | None = None,
) -> list[dict[str, Any]]:
    return [span for span in _all_spans(limit, tenant_id) if _is_llm_span(span)]


def agent_stats(tenant_id: str | None = None) -> list[dict[str, Any]]:
    """One row per agent: traffic, latency, errors, tokens and cost."""
    grouped: dict[str, dict[str, Any]] = {}
    for span in _llm_spans(tenant_id=tenant_id):
        name = _agent_name(span)
        entry = grouped.setdefault(name, {
            "id": name, "name": name, "requests": 0, "errors": 0,
            "latency_total_ms": 0.0, "tokens_in": 0.0, "tokens_out": 0.0,
            "cost": 0.0, "cost_reported": False, "models": set(),
            "providers": set(), "last_seen": None,
        })
        entry["requests"] += 1
        if span["status"] == "ERROR":
            entry["errors"] += 1
        entry["latency_total_ms"] += span["duration_ms"]
        prompt, completion = _tokens(span)
        entry["tokens_in"] += prompt
        entry["tokens_out"] += completion
        cost = _cost(span)
        if cost is not None:
            entry["cost"] += cost
            entry["cost_reported"] = True
        entry["models"].add(_model(span))
        entry["providers"].add(_provider(span))
        started = _parse_time(span["start_time"])
        if started and (entry["last_seen"] is None or started > entry["last_seen"]):
            entry["last_seen"] = started

    rows = []
    for entry in grouped.values():
        requests = entry["requests"]
        rows.append({
            "id": entry["id"],
            "name": entry["name"],
            "requests": requests,
            "errors": entry["errors"],
            "error_rate": round(entry["errors"] / requests, 4) if requests else 0.0,
            "avg_latency_ms": round(entry["latency_total_ms"] / requests, 1) if requests else 0.0,
            "tokens_in": int(entry["tokens_in"]),
            "tokens_out": int(entry["tokens_out"]),
            "tokens_total": int(entry["tokens_in"] + entry["tokens_out"]),
            # None, not 0 — "no instrumentation reported cost" is not "this was free".
            "cost": round(entry["cost"], 4) if entry["cost_reported"] else None,
            "models": sorted(entry["models"]),
            "providers": sorted(entry["providers"]),
            "last_seen": entry["last_seen"].isoformat() if entry["last_seen"] else None,
            "status": _status(entry["errors"] / requests if requests else 0.0),
        })
    rows.sort(key=lambda r: r["requests"], reverse=True)
    return rows


def _status(error_rate: float) -> str:
    if error_rate >= 0.10:
        return "down"
    if error_rate >= 0.02:
        return "degraded"
    return "healthy"


def provider_usage(tenant_id: str | None = None) -> list[dict[str, Any]]:
    """Token and request share per provider, for the breakdown chart."""
    grouped: dict[str, dict[str, Any]] = defaultdict(
        lambda: {"tokens": 0.0, "cost": 0.0, "cost_reported": False, "requests": 0}
    )
    for span in _llm_spans(tenant_id=tenant_id):
        entry = grouped[_provider(span)]
        prompt, completion = _tokens(span)
        entry["tokens"] += prompt + completion
        entry["requests"] += 1
        cost = _cost(span)
        if cost is not None:
            entry["cost"] += cost
            entry["cost_reported"] = True

    total_tokens = sum(e["tokens"] for e in grouped.values())
    rows = [{
        "provider": provider,
        "tokens": int(entry["tokens"]),
        "cost": round(entry["cost"], 4) if entry["cost_reported"] else None,
        "requests": entry["requests"],
        "share": round(entry["tokens"] / total_tokens, 4) if total_tokens else 0.0,
    } for provider, entry in grouped.items()]
    rows.sort(key=lambda r: r["tokens"], reverse=True)
    return rows


def token_timeseries(tenant_id: str | None = None) -> list[dict[str, Any]]:
    """Hourly input/output token totals, oldest first."""
    buckets: dict[str, dict[str, float]] = defaultdict(lambda: {"input": 0.0, "output": 0.0})
    for span in _llm_spans(tenant_id=tenant_id):
        started = _parse_time(span["start_time"])
        if not started:
            continue
        key = started.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:00")
        prompt, completion = _tokens(span)
        buckets[key]["input"] += prompt
        buckets[key]["output"] += completion
    return [
        {"time": key, "input": int(v["input"]), "output": int(v["output"])}
        for key, v in sorted(buckets.items())
    ]


def agent_incidents(limit: int = 50, tenant_id: str | None = None) -> list[dict[str, Any]]:
    """Recent failed agent spans, newest first."""
    rows = [{
        "id": span["span_id"],
        "agent": _agent_name(span),
        "model": _model(span),
        "trace_id": span["trace_id"],
        "message": str(_attr(span, "exception.message", "status_message",
                             default=span.get("name") or "Span failed")),
        "type": str(_attr(span, "exception.type", default="error")),
        "timestamp": span["start_time"],
        "duration_ms": span["duration_ms"],
    } for span in _llm_spans(tenant_id=tenant_id) if span["status"] == "ERROR"]
    rows.sort(key=lambda r: str(r["timestamp"] or ""), reverse=True)
    return rows[:limit]


def _preview(value: Any, limit: int = 280) -> str | None:
    if value is None:
        return None
    if isinstance(value, str):
        text = value
    else:
        try:
            import json
            text = json.dumps(value, ensure_ascii=False, separators=(",", ":"))
        except (TypeError, ValueError):
            text = str(value)
    text = " ".join(text.split())
    return text if len(text) <= limit else f"{text[:limit - 1]}…"


def _observation(span: dict[str, Any]) -> dict[str, Any]:
    prompt, completion = _tokens(span)
    return {
        "id": str(span.get("span_id") or ""),
        "trace_id": str(span.get("trace_id") or ""),
        "agent": _agent_name(span),
        "model": _model(span),
        "operation": str(span.get("name") or "(unnamed)"),
        "status": str(span.get("status") or "UNSET"),
        "timestamp": span.get("start_time"),
        "duration_ms": round(_number(span.get("duration_ms")), 1),
        "tokens_in": int(prompt),
        "tokens_out": int(completion),
        "input": _preview(_attr(
            span, "input.value", "input", "llm.input_messages", "gen_ai.prompt",
        )),
        "output": _preview(_attr(
            span, "output.value", "output", "llm.output_messages", "gen_ai.completion",
        )),
    }


def _evaluation(row: dict[str, Any]) -> dict[str, Any]:
    result = row.get("result") if isinstance(row.get("result"), dict) else {}
    score_value = result.get("score", row.get("score"))
    score = _number(score_value) if score_value is not None else None
    return {
        "id": str(row.get("id") or row.get("annotation_id") or ""),
        "span_id": str(row.get("span_id") or ""),
        "name": str(row.get("name") or row.get("annotation_name") or "evaluation"),
        "kind": str(row.get("annotator_kind") or row.get("kind") or "unknown"),
        "score": round(score, 4) if score is not None else None,
        "label": _preview(result.get("label", row.get("label")), 80),
        "explanation": _preview(result.get("explanation", row.get("explanation")), 500),
        "created_at": row.get("created_at") or row.get("updated_at"),
    }


def _passed(evaluation: dict[str, Any]) -> bool | None:
    label = str(evaluation.get("label") or "").strip().lower()
    if label in {"pass", "passed", "good", "correct", "relevant", "grounded", "safe", "true"}:
        return True
    if label in {"fail", "failed", "bad", "incorrect", "irrelevant", "ungrounded", "unsafe", "false"}:
        return False
    score = evaluation.get("score")
    return score >= 0.7 if isinstance(score, (int, float)) else None


def agent_evaluations(limit: int = 100, tenant_id: str | None = None) -> dict[str, Any]:
    """Recent LLM observations joined with stored evaluation annotations."""
    spans = _llm_spans(max(limit, 1), tenant_id=tenant_id)
    spans.sort(key=lambda span: str(span.get("start_time") or ""), reverse=True)
    selected = spans[:limit]
    observations = [_observation(span) for span in selected]
    span_ids = [row["id"] for row in observations if row["id"]]
    evaluations_error = None
    if agent_seed.enabled():
        raw_evaluations = agent_seed.evaluations(selected)
    elif tenant_id and agent_telemetry.uses_store(tenant_id):
        selected_ids = set(span_ids)
        raw_evaluations = [
            row for row in agent_telemetry.evaluations(tenant_id)
            if not row.get("span_id") or str(row.get("span_id")) in selected_ids
        ]
    else:
        try:
            raw_evaluations = obs.span_annotations(span_ids, project=agent_project())
        except obs.UpstreamError as exc:
            # Span visibility is still valuable when a pinned/older Phoenix build has
            # no annotations route or that one endpoint is temporarily unavailable.
            raw_evaluations = []
            evaluations_error = str(exc)
    evaluations = [_evaluation(row) for row in raw_evaluations]
    evaluations.sort(key=lambda row: str(row.get("created_at") or ""), reverse=True)

    scored = [row["score"] for row in evaluations if row["score"] is not None]
    decided = [decision for decision in (_passed(row) for row in evaluations) if decision is not None]
    evaluated_spans = {row["span_id"] for row in evaluations if row["span_id"]}
    by_metric: list[dict[str, Any]] = []
    metric_rows: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in evaluations:
        metric_rows[row["name"]].append(row)
    for name, rows in sorted(metric_rows.items()):
        metric_scores = [row["score"] for row in rows if row["score"] is not None]
        metric_decisions = [decision for decision in (_passed(row) for row in rows) if decision is not None]
        by_metric.append({
            "name": name,
            "count": len(rows),
            "avg_score": round(sum(metric_scores) / len(metric_scores), 4) if metric_scores else None,
            "pass_rate": round(sum(metric_decisions) / len(metric_decisions), 4) if metric_decisions else None,
        })

    return {
        "demo": agent_seed.enabled(),
        "observations": observations,
        "evaluations": evaluations,
        "summary": {
            "observations": len(observations),
            "evaluated_spans": len(evaluated_spans),
            "evaluations": len(evaluations),
            "avg_score": round(sum(scored) / len(scored), 4) if scored else None,
            "pass_rate": round(sum(decided) / len(decided), 4) if decided else None,
            "by_metric": by_metric,
        },
        "evaluations_error": evaluations_error,
    }


def agent_incident_events(tenant_id: str, limit: int = 200) -> list[CloudEvent]:
    """Failed agent spans as the canonical events the alert clusterer expects.

    Keep the original span id, trace id and timestamp so a cluster remains stable across
    refreshes and a coding-agent brief can point back to the exact failed execution.
    """
    events: list[CloudEvent] = []
    durable_source = agent_telemetry.uses_store(tenant_id)
    for span in _llm_spans(tenant_id=tenant_id):
        if span["status"] != "ERROR":
            continue
        message = str(_attr(
            span,
            "exception.message",
            "status_message",
            default=span.get("name") or "Span failed",
        ))
        error_type = str(_attr(span, "exception.type", default="AgentError"))
        stacktrace = str(_attr(span, "exception.stacktrace", default="")).strip()
        description = "\n".join(part for part in (message, stacktrace) if part)
        events.append(CloudEvent(
            id=str(span.get("span_id") or f"{span.get('trace_id', 'trace')}-{len(events)}"),
            source="dynamodb" if durable_source else "phoenix",
            type="agent.span.failed",
            timestamp=str(span.get("start_time") or datetime.now(timezone.utc).isoformat()),
            correlationid=str(span.get("trace_id") or "") or None,
            tenant_id=tenant_id,
            data={
                "title": f"{error_type}: {message}",
                "description": description,
                "severity": "error",
                "status": "firing",
                "service": _agent_name(span),
                "agent": _agent_name(span),
                "model": _model(span),
                "trace_id": span.get("trace_id"),
                "span_id": span.get("span_id"),
                "duration_ms": span.get("duration_ms", 0),
            },
        ))
    events.sort(key=lambda event: event.timestamp, reverse=True)
    return events[:limit]


def agent_workflows(limit: int = 50, tenant_id: str | None = None) -> list[dict[str, Any]]:
    """Multi-step agent runs, newest first.

    A trace carrying more than one agent span *is* an agentic workflow — a chain, a
    tool loop, a planner calling sub-agents. Deriving them from traces means no
    separate workflow registry to keep in sync with what actually ran.
    """
    traces: dict[str, dict[str, Any]] = {}
    for span in _llm_spans(tenant_id=tenant_id):
        tid = span["trace_id"]
        if not tid:
            continue
        entry = traces.setdefault(tid, {
            "id": tid, "name": None, "steps": 0, "failed_steps": 0,
            "agents": set(), "started_at": None, "duration_ms": 0.0,
        })
        entry["steps"] += 1
        entry["agents"].add(_agent_name(span))
        if span["status"] == "ERROR":
            entry["failed_steps"] += 1
        started = _parse_time(span["start_time"])
        if started and (entry["started_at"] is None or started < entry["started_at"]):
            entry["started_at"] = started
        if not span["parent_span_id"]:
            entry["name"] = span["name"]
            entry["duration_ms"] = span["duration_ms"]
        entry["duration_ms"] = max(entry["duration_ms"], span["duration_ms"])

    rows = [{
        "id": e["id"],
        "name": e["name"] or f"workflow {e['id'][:8]}",
        "agents": len(e["agents"]),
        "steps": e["steps"],
        "completed_steps": e["steps"] - e["failed_steps"],
        "status": "failed" if e["failed_steps"] else "completed",
        "started_at": e["started_at"].isoformat() if e["started_at"] else None,
        "duration_ms": round(e["duration_ms"], 1),
    } for e in traces.values() if e["steps"] > 1]
    rows.sort(key=lambda r: str(r["started_at"] or ""), reverse=True)
    return rows[:limit]


def summary(tenant_id: str | None = None) -> dict[str, Any]:
    """Headline numbers for the overview cards, from one span fetch."""
    agents = agent_stats(tenant_id)
    requests = sum(a["requests"] for a in agents)
    errors = sum(a["errors"] for a in agents)
    costs = [a["cost"] for a in agents if a["cost"] is not None]
    weighted_latency = sum(a["avg_latency_ms"] * a["requests"] for a in agents)
    return {
        # Surfaced so the UI can label it. Demo telemetry that looks identical to
        # production telemetry is how a screenshot ends up in a status review.
        "demo": agent_seed.enabled(),
        "agents": len(agents),
        "healthy": sum(1 for a in agents if a["status"] == "healthy"),
        "degraded": sum(1 for a in agents if a["status"] == "degraded"),
        "down": sum(1 for a in agents if a["status"] == "down"),
        "requests": requests,
        "errors": errors,
        "error_rate": round(errors / requests, 4) if requests else 0.0,
        "avg_latency_ms": round(weighted_latency / requests, 1) if requests else 0.0,
        "tokens_total": sum(a["tokens_total"] for a in agents),
        "cost": round(sum(costs), 4) if costs else None,
    }


def ai_gateway_stats(tenant_id: str | None = None) -> dict[str, Any]:
    """Per-model accounting derived from stored spans instead of a live APISIX process."""
    models: dict[str, dict[str, Any]] = {}
    for span in _llm_spans(tenant_id=tenant_id):
        model = _model(span)
        row = models.setdefault(model, {
            "model": model,
            "prompt_tokens": 0,
            "completion_tokens": 0,
            "requests": 0,
            "latency_total_ms": 0.0,
            "routes": set(),
            "consumers": set(),
        })
        prompt, completion = _tokens(span)
        row["prompt_tokens"] += int(prompt)
        row["completion_tokens"] += int(completion)
        row["requests"] += 1
        row["latency_total_ms"] += _number(span.get("duration_ms"))
        row["routes"].add(str(_attr(span, "http.route", "gen_ai.operation.name", default=span["name"])))
        row["consumers"].add(_agent_name(span))

    rows = []
    for row in models.values():
        requests = row["requests"]
        rows.append({
            "model": row["model"],
            "prompt_tokens": row["prompt_tokens"],
            "completion_tokens": row["completion_tokens"],
            "total_tokens": row["prompt_tokens"] + row["completion_tokens"],
            "requests": requests,
            "avg_latency_ms": round(row["latency_total_ms"] / requests, 1) if requests else 0.0,
            # Lambda/DynamoDB is asynchronous; there is no resident gateway connection pool.
            "active_connections": 0,
            "routes": sorted(row["routes"]),
            "consumers": sorted(row["consumers"]),
        })
    rows.sort(key=lambda row: row["total_tokens"], reverse=True)
    return {
        "models": rows,
        "total_tokens": sum(row["total_tokens"] for row in rows),
        "total_requests": sum(row["requests"] for row in rows),
        "active_connections": 0,
        "has_traffic": bool(rows),
    }


def route_stats(tenant_id: str | None = None) -> list[dict[str, Any]]:
    """Operation counts derived from stored spans for the optional gateway table."""
    routes: dict[str, dict[str, Any]] = {}
    for span in _all_spans(tenant_id=tenant_id):
        route = str(_attr(span, "http.route", "gen_ai.operation.name", default=span["name"]))
        code = str(_attr(span, "http.response.status_code", "http.status_code", default="500" if span["status"] == "ERROR" else "200"))
        row = routes.setdefault(route, {"route": route, "requests": 0, "errors": 0, "by_code": {}})
        row["requests"] += 1
        row["by_code"][code] = row["by_code"].get(code, 0) + 1
        if span["status"] == "ERROR" or code.startswith("5"):
            row["errors"] += 1
    for row in routes.values():
        row["error_rate"] = round(row["errors"] / row["requests"], 4) if row["requests"] else 0.0
    return sorted(routes.values(), key=lambda row: row["requests"], reverse=True)


def list_traces(limit: int = 50, tenant_id: str | None = None) -> list[dict[str, Any]]:
    traces: dict[str, dict[str, Any]] = {}
    for span in _all_spans(limit * 20, tenant_id=tenant_id):
        trace_id = span["trace_id"]
        if not trace_id:
            continue
        row = traces.setdefault(trace_id, {
            "trace_id": trace_id,
            "root_name": None,
            "start_time": None,
            "duration_ms": 0.0,
            "span_count": 0,
            "errors": 0,
        })
        row["span_count"] += 1
        if span["status"] == "ERROR":
            row["errors"] += 1
        if not span["parent_span_id"]:
            row["root_name"] = span["name"]
            row["start_time"] = span["start_time"]
            row["duration_ms"] = span["duration_ms"]
        elif row["root_name"] is None:
            row["start_time"] = row["start_time"] or span["start_time"]
            row["duration_ms"] = max(row["duration_ms"], span["duration_ms"])
    rows = list(traces.values())
    for row in rows:
        row["root_name"] = row["root_name"] or "(root span missing)"
        row["status"] = "ERROR" if row["errors"] else "OK"
    rows.sort(key=lambda row: str(row["start_time"] or ""), reverse=True)
    return rows[:limit]


def get_trace(trace_id: str, tenant_id: str | None = None) -> list[dict[str, Any]]:
    spans = [span for span in _all_spans(tenant_id=tenant_id) if span["trace_id"] == trace_id]
    by_parent: dict[Any, list[dict[str, Any]]] = defaultdict(list)
    for span in spans:
        by_parent[span["parent_span_id"]].append(span)
    for children in by_parent.values():
        children.sort(key=lambda span: str(span["start_time"] or ""))

    ordered: list[dict[str, Any]] = []

    def walk(parent_id: Any, depth: int) -> None:
        for span in by_parent.get(parent_id, []):
            ordered.append({**span, "depth": depth})
            walk(span["span_id"], depth + 1)

    walk(None, 0)
    seen = {span["span_id"] for span in ordered}
    ordered.extend({**span, "depth": 0} for span in spans if span["span_id"] not in seen)
    return ordered


def storage_status(tenant_id: str) -> dict[str, Any]:
    store = agent_telemetry.status(tenant_id)
    half = {
        "configured": store["configured"],
        "reachable": store["reachable"],
        "error": store["error"],
    }
    return {
        "lambda": {"configured": True, "reachable": True, "error": None},
        "dynamodb": half,
        "storage_ok": half["reachable"],
        "processing": "on-read",
    }

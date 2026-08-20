"""Seed telemetry for demoing the AI agent dashboard without live agents.

Enabled by PINGHOLD_DEMO_AGENTS=1. Off by default, so a deployment that forgets to set
it shows real data or an honest empty state — never this.

The seed produces *raw Phoenix-shaped spans* and *raw APISIX Prometheus text*, not
canned API responses. Everything downstream — token rollups, provider inference, hourly
bucketing, workflow derivation, incident extraction, latency histograms — is computed by
the same functions that serve production traffic. A demo that renders correctly is
therefore evidence the real aggregation works, and the two paths cannot drift apart.

Deterministic by seed, so a recorded demo looks the same on every run. Timestamps are
relative to now, so the 24h charts are always populated.
"""

from __future__ import annotations

import os
import random
from datetime import datetime, timedelta, timezone
from typing import Any

# Fixed seed: a demo that reshuffles between takes is a bad demo.
_SEED = 20260803
_WINDOW_HOURS = 24


def enabled() -> bool:
    return os.getenv("PINGHOLD_DEMO_AGENTS", "").strip().lower() in {"1", "true", "yes", "on"}


# name, model, provider, share of traffic, error rate, latency band (ms), cost per 1k tokens
_AGENTS = [
    ("Customer Support Copilot", "gpt-4o-mini", "OpenAI", 0.34, 0.004, (400, 1200), 0.0006),
    ("Knowledge Base RAG", "gpt-4o-mini", "OpenAI", 0.24, 0.002, (250, 800), 0.0006),
    ("Incident Triage Agent", "claude-sonnet-4-5", "Anthropic", 0.18, 0.009, (700, 2200), 0.0090),
    ("ETL Anomaly Detector", "gemini-2.5-flash", "Google", 0.14, 0.045, (900, 3200), 0.0003),
    ("Orchestration Planner", "claude-sonnet-4-5", "Anthropic", 0.10, 0.012, (600, 1800), 0.0090),
]

_ERRORS = [
    ("RateLimitError", "429 rate limit exceeded for model"),
    ("TimeoutError", "upstream provider timed out after 30s"),
    ("ToolExecutionError", "tool 'query_metrics' returned a non-200 status"),
    ("ContextLengthExceeded", "request exceeds the model context window"),
    ("ContentFilterError", "response blocked by the provider content filter"),
]

_OPERATIONS = [
    "chat.completions", "agent.plan", "tool.call", "retriever.query", "chain.run",
]

_DEMO_CONVERSATIONS = [
    (
        "Summarize the checkout errors from the last 30 minutes and identify the likely owner.",
        "Checkout failures are concentrated in payment-service after a provider timeout. "
        "The Payments team is the likely owner; I attached the affected traces.",
    ),
    (
        "Find the deployment that caused the latency regression and recommend the safest next step.",
        "Latency increased after release api-2026.08.13.3. Pause the rollout and compare the "
        "database-call spans before deciding whether to roll back.",
    ),
    (
        "Answer the customer using only the refund policy in the knowledge base.",
        "The policy permits a full refund within 30 days when the subscription has not been renewed.",
    ),
    (
        "Check today's ETL runs for anomalies and explain the highest-impact one.",
        "orders_hourly processed 38% fewer rows than its seven-day baseline after the source "
        "credential expired. The downstream revenue model is delayed.",
    ),
    (
        "Plan a remediation for the repeated 503 responses without making production changes.",
        "First verify upstream capacity and retry headers, then prepare a bounded backoff change "
        "with a regression test. No production action was taken.",
    ),
]

_TOTAL_SPANS = 420


def _hex(rng: random.Random, n: int) -> str:
    return "".join(rng.choice("0123456789abcdef") for _ in range(n))


def _span(rng: random.Random, agent, started: datetime, trace_id: str,
          parent: str | None, name: str) -> dict[str, Any]:
    label, model, provider, _share, error_rate, (lo, hi), cost_per_1k = agent
    duration_ms = rng.uniform(lo, hi)
    failed = rng.random() < error_rate
    prompt = rng.randint(180, 3200)
    completion = 0 if failed else rng.randint(60, 1400)
    total = prompt + completion

    attributes: dict[str, Any] = {
        "openinference.span.kind": "LLM",
        "llm.model_name": model,
        "llm.provider": provider,
        "llm.token_count.prompt": prompt,
        "llm.token_count.completion": completion,
        "llm.cost.total": round(total / 1000 * cost_per_1k, 6),
        "agent.name": label,
    }
    prompt_text, response_text = rng.choice(_DEMO_CONVERSATIONS)
    attributes["input.value"] = prompt_text
    attributes["output.value"] = (
        "The model call failed before it produced a response."
        if failed else response_text
    )
    if failed:
        kind, message = rng.choice(_ERRORS)
        attributes["exception.type"] = kind
        attributes["exception.message"] = message

    return {
        "span_id": _hex(rng, 16),
        "trace_id": trace_id,
        "parent_id": parent,
        "name": name,
        "span_kind": "LLM",
        "start_time": started.isoformat(),
        "end_time": (started + timedelta(milliseconds=duration_ms)).isoformat(),
        "status_code": "ERROR" if failed else "OK",
        "attributes": attributes,
    }


def spans() -> list[dict[str, Any]]:
    """Raw Phoenix-shaped spans across the last 24 hours."""
    rng = random.Random(_SEED)
    now = datetime.now(timezone.utc)
    weights = [a[3] for a in _AGENTS]
    out: list[dict[str, Any]] = []

    while len(out) < _TOTAL_SPANS:
        agent = rng.choices(_AGENTS, weights=weights, k=1)[0]
        # Business-hours-ish shape rather than a flat line, so the hourly chart has
        # something to show.
        hours_ago = rng.triangular(0, _WINDOW_HOURS, _WINDOW_HOURS * 0.35)
        started = now - timedelta(hours=hours_ago)
        trace_id = _hex(rng, 32)

        # One in four runs is multi-step: a planner span with tool/retriever children.
        # These are what the Agentic Workflows view derives its rows from.
        if rng.random() < 0.25:
            root = _span(rng, agent, started, trace_id, None, "agent.plan")
            out.append(root)
            for step in range(rng.randint(2, 4)):
                child_agent = rng.choices(_AGENTS, weights=weights, k=1)[0]
                child_start = started + timedelta(milliseconds=120 * (step + 1))
                out.append(_span(rng, child_agent, child_start, trace_id,
                                 root["span_id"], rng.choice(_OPERATIONS[1:])))
        else:
            out.append(_span(rng, agent, started, trace_id, None, "chat.completions"))

    return out[:_TOTAL_SPANS]


def evaluations(source_spans: list[dict[str, Any]] | None = None) -> list[dict[str, Any]]:
    """Deterministic Phoenix-shaped span annotations for the demo evaluation view.

    The scores are deliberately realistic rather than uniformly green: failed calls
    score poorly, and successful calls still include occasional quality misses. This
    makes filters, pass-rate cards and explanations useful in a product demo.
    """
    rows: list[dict[str, Any]] = []
    metrics = (
        ("relevance", "The response directly addresses the requested task."),
        ("groundedness", "Claims are supported by the available trace or retrieved context."),
        ("action_safety", "The response recommends bounded action and avoids unsafe changes."),
    )
    for span in source_spans or spans():
        span_id = str(span.get("span_id") or "")
        if not span_id:
            continue
        # A per-span RNG keeps results stable even if the source list is filtered or
        # reordered before this function is called.
        rng = random.Random(f"{_SEED}:{span_id}")
        failed = str(span.get("status_code", "")).upper() == "ERROR"
        for metric, positive_explanation in metrics:
            base = rng.uniform(0.78, 0.98)
            if failed:
                base = rng.uniform(0.12, 0.52)
            elif rng.random() < 0.12:
                base = rng.uniform(0.48, 0.69)
            score = round(base, 2)
            passed = score >= 0.70
            rows.append({
                "id": f"demo-{span_id}-{metric}",
                "span_id": span_id,
                "name": metric,
                "annotator_kind": "LLM" if metric != "action_safety" else "CODE",
                "result": {
                    "score": score,
                    "label": "pass" if passed else "fail",
                    "explanation": positive_explanation if passed else (
                        "The response was incomplete or the execution failed before this "
                        "quality requirement could be satisfied."
                    ),
                },
                "created_at": span.get("start_time"),
            })
    return rows


def apisix_metrics() -> str:
    """Prometheus exposition text matching the seeded spans.

    Derived from the same spans rather than invented separately: the AI Gateway panel
    and the agent panels must agree, exactly as they would in production where both
    describe the same traffic.
    """
    per_model: dict[str, dict[str, float]] = {}
    for span in spans():
        attrs = span["attributes"]
        model = attrs["llm.model_name"]
        row = per_model.setdefault(model, {"prompt": 0.0, "completion": 0.0,
                                           "count": 0.0, "latency": 0.0})
        row["prompt"] += attrs["llm.token_count.prompt"]
        row["completion"] += attrs["llm.token_count.completion"]
        row["count"] += 1
        started = datetime.fromisoformat(span["start_time"])
        ended = datetime.fromisoformat(span["end_time"])
        row["latency"] += (ended - started).total_seconds() * 1000

    rng = random.Random(_SEED)
    lines = [
        "# TYPE apisix_llm_prompt_tokens counter",
        "# TYPE apisix_llm_completion_tokens counter",
        "# TYPE apisix_llm_latency histogram",
    ]
    for model, row in per_model.items():
        labels = f'route_id="ai-chat",consumer="pinghold-agents",llm_model="{model}",request_type="ai_chat",node="1"'
        lines += [
            f"apisix_llm_prompt_tokens{{{labels}}} {int(row['prompt'])}",
            f"apisix_llm_completion_tokens{{{labels}}} {int(row['completion'])}",
            f"apisix_llm_latency_sum{{{labels}}} {row['latency']:.0f}",
            f"apisix_llm_latency_count{{{labels}}} {int(row['count'])}",
            f'apisix_llm_active_connections{{route_id="ai-chat",llm_model="{model}",node="1"}} {rng.randint(0, 4)}',
        ]
    # The plain HTTP families APISIX always exports, so the route traffic view is
    # populated too.
    for route, ok, bad in (("ai-chat", 3820, 41), ("pinghold-api", 12440, 18), ("pinghold-health", 2880, 0)):
        lines.append(f'apisix_http_status{{code="200",route="{route}",node="1"}} {ok}')
        if bad:
            lines.append(f'apisix_http_status{{code="500",route="{route}",node="1"}} {bad}')
    return "\n".join(lines) + "\n"

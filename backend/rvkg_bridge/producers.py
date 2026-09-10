"""The two telemetry producers the graph bridge reads back: AWS API Gateway access
logs, and a small AI agent.

Both write to agent_telemetry and nowhere else. That store already normalises spans
and already backs the API Monitoring page, so a third producer means adding a mapper
here — not a second pipeline. Without DynamoDB configured it falls back to memory,
which is why the end-to-end test needs no AWS.

    python3 backend/rvkg_bridge/producers.py --synthetic
    python3 backend/rvkg_bridge/producers.py --log-group /aws/apigateway/prod --hours 1
"""

from __future__ import annotations

import argparse
import json
import os
import random
import sys
import time
from datetime import datetime, timedelta, timezone
from urllib import error, request

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

from shared.core import agent_telemetry  # noqa: E402

# The route an AI agent serves. Named once: the synthetic gateway logs and the agent
# below must agree on it or the graph gets two unrelated nodes for one endpoint.
AGENT_ROUTE = "POST /ai/chat"

# One profile per synthetic route: (latency ms range, share of it spent in the
# integration, error rate, integration target). Two deliberately different latency
# stories live here — /v1/checkout is slow in its upstream, /v1/catalog is slow in the
# gateway itself — so a query can be checked for telling them apart. AGENT_ROUTE is
# deliberately absent: its traffic comes from the agent, which is the only producer that
# knows how much of that latency was the model.
_ROUTES = [
    ("GET /v1/health", (8, 22), 0.70, 0.000, "health-svc.internal"),
    ("GET /v1/orders/{orderId}", (55, 150), 0.88, 0.004, "orders-svc.internal"),
    ("POST /v1/checkout", (900, 2600), 0.95, 0.040, "payments-svc.internal"),
    ("GET /v1/catalog", (140, 320), 0.35, 0.002, "catalog-svc.internal"),
]


def apigw_span(record: dict) -> dict:
    """One AWS API Gateway access-log record as a SERVER span.

    Handles both access-log shapes: HTTP APIs emit `routeKey` ("GET /v1/orders/{id}"),
    REST APIs emit `httpMethod` + `resourcePath`. Either way the route template is what
    is stored — `path` carries the caller's real ids and grouping on it turns every
    request into its own single-hit route.

    `requestId` becomes the span id, so a replayed subscription delivery is collapsed
    by record_store rather than double-counted.
    """
    route_key = str(record.get("routeKey") or "").strip()
    if route_key and route_key != "$default":
        method, _, path = route_key.partition(" ")
    else:
        method = record.get("httpMethod") or "GET"
        path = record.get("resourcePath") or record.get("path") or "/"

    total = _f(record.get("responseLatency"))
    integration = _f(record.get("integrationLatency"))
    # API Gateway does not report its own overhead; it is what the integration did not
    # account for. Negative only when the two fields came from different clocks.
    overhead = round(max(total - integration, 0.0), 3)

    return agent_telemetry.http_span(
        method,
        path,
        record.get("status") or record.get("integrationStatus") or 200,
        total,
        start_time=record.get("requestTime") or record.get("requestTimeEpoch"),
        span_id=str(record.get("requestId") or "").strip() or None,
        attributes={
            "telemetry.source": "aws.apigateway",
            "aws.apigw.integration_latency_ms": integration,
            "aws.apigw.overhead_ms": overhead,
            "aws.apigw.integration_target": record.get("integrationTarget") or None,
            "aws.apigw.api_id": record.get("apiId") or None,
        },
    )


def _f(value) -> float:
    try:
        return round(float(value), 3)
    except (TypeError, ValueError):
        return 0.0


def read_cloudwatch(log_group: str, hours: float = 1.0, region: str = "") -> list[dict]:
    """Access-log records from a CloudWatch log group. JSON access logs only.

    A poll, not a subscription: a Kinesis subscription is the production answer, but a
    5-minute cron over this covers a bridge that summarises 5-minute windows anyway.
    """
    import boto3  # deferred: only the real-AWS path needs it

    client = boto3.client("logs", **({"region_name": region} if region else {}))
    start = int((time.time() - hours * 3600) * 1000)
    records: list[dict] = []
    token = None
    while True:
        kwargs = {"logGroupName": log_group, "startTime": start, "limit": 10000}
        if token:
            kwargs["nextToken"] = token
        page = client.filter_log_events(**kwargs)
        for event in page.get("events", []):
            try:
                parsed = json.loads(event.get("message") or "")
            except ValueError:
                continue  # non-JSON access log format; nothing to map
            if isinstance(parsed, dict):
                records.append(parsed)
        token = page.get("nextToken")
        if not token:
            break
    return records


def synthetic_apigw(count: int = 400, seed: int = 11) -> list[dict]:
    """Access-log records with the shape AWS emits, for running this without AWS."""
    rng = random.Random(seed)
    now = datetime.now(timezone.utc)
    records = []
    for i in range(count):
        route, (lo, hi), integration_share, error_rate, target = rng.choice(_ROUTES)
        method, _, path = route.partition(" ")
        total = rng.uniform(lo, hi)
        failed = rng.random() < error_rate
        records.append({
            "requestId": f"syn-{seed}-{i:06d}",
            "apiId": "a1b2c3d4e5",
            "requestTime": (now - timedelta(seconds=rng.uniform(0, 3600))).isoformat(),
            "httpMethod": method,
            "routeKey": route,
            "resourcePath": path,
            "path": path.replace("{orderId}", str(rng.randint(1000, 9999))),
            "status": 502 if failed else 200,
            "integrationStatus": 502 if failed else 200,
            "responseLatency": round(total, 3),
            "integrationLatency": round(total * integration_share, 3),
            "integrationTarget": target,
        })
    return records


def push_apigw(tenant_id: str, records: list[dict]) -> int:
    """Map access-log records to spans and store them. Chunked to the ingest cap."""
    spans = [apigw_span(r) for r in records]
    batch = agent_telemetry.MAX_INGEST_RECORDS
    for i in range(0, len(spans), batch):
        agent_telemetry.ingest(tenant_id, [], spans[i:i + batch], [])
    return len(spans)


def run_agent(tenant_id: str, turns: int = 8, api_key: str = "", model: str = "") -> int:
    """A small AI agent: one model call per turn, each one timed and stored.

    Emits two spans per turn sharing a trace id — the SERVER span for the route it
    serves and the LLM span underneath it. That parent link is the whole point: it is
    what lets the bridge say how much of a route's latency was the model.

    No API key means synthesised durations, so the pipeline still has agent traffic to
    carry. The spans are marked `telemetry.synthetic` either way it happens, because
    demo latency that reads as production latency is how a graph answer ends up wrong.
    """
    api_key = api_key or os.environ.get("OPENAI_API_KEY", "")
    model = model or os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
    rng = random.Random(7)
    prompts = [
        "Summarise what a p95 latency regression on a checkout endpoint usually means.",
        "Name three causes of high API Gateway overhead that are not the backend.",
        "What does a rising integration latency with flat gateway overhead point to?",
        "In one sentence: when is a cold start the likely cause of tail latency?",
    ]

    spans = []
    for turn in range(turns):
        prompt = prompts[turn % len(prompts)]
        trace_id = f"agent-{int(time.time() * 1000)}-{turn:03d}"
        started = datetime.now(timezone.utc)
        llm_span, ok = _call_model(prompt, api_key, model, rng, trace_id, started)
        spans.append(llm_span)
        # The route span wraps the model call: gateway time plus everything the agent
        # did around it.
        overhead = rng.uniform(8, 45)
        spans.append(agent_telemetry.http_span(
            "POST", "/ai/chat", 200 if ok else 502,
            llm_span["duration_ms"] + overhead,
            start_time=started.isoformat(),
            span_id=trace_id,
            attributes={
                "telemetry.source": "ai.agent",
                "telemetry.synthetic": not api_key,
                "llm.model_name": model,
                "agent.name": "latency-tutor",
                "aws.apigw.integration_latency_ms": llm_span["duration_ms"],
                "aws.apigw.overhead_ms": round(overhead, 3),
                "aws.apigw.integration_target": "agent-svc.internal",
            },
        ))
    for i in range(0, len(spans), agent_telemetry.MAX_INGEST_RECORDS):
        agent_telemetry.ingest(tenant_id, [], spans[i:i + agent_telemetry.MAX_INGEST_RECORDS], [])
    return len(spans)


def _call_model(prompt, api_key, model, rng, trace_id, started):
    """The timed model call. Returns (LLM span, succeeded)."""
    attributes = {
        "openinference.span.kind": "LLM",
        "llm.model_name": model,
        "llm.provider": "openai",
        "agent.name": "latency-tutor",
        "input.value": prompt,
        "telemetry.source": "ai.agent",
        "telemetry.synthetic": not api_key,
    }

    if not api_key:
        duration = rng.uniform(650, 1800)
        attributes["output.value"] = "(no OPENAI_API_KEY: duration synthesised)"
        attributes["llm.token_count.prompt"] = rng.randint(40, 120)
        attributes["llm.token_count.completion"] = rng.randint(60, 300)
        return _llm_span(trace_id, started, duration, attributes, True), True

    body = json.dumps({
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 200,
    }).encode("utf-8")
    req = request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=body,
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"},
        method="POST",
    )
    began = time.perf_counter()
    try:
        with request.urlopen(req, timeout=60) as response:
            payload = json.loads(response.read().decode("utf-8"))
        duration = (time.perf_counter() - began) * 1000
        usage = payload.get("usage") or {}
        attributes["output.value"] = (
            payload.get("choices", [{}])[0].get("message", {}).get("content", "")
        )
        attributes["llm.token_count.prompt"] = usage.get("prompt_tokens", 0)
        attributes["llm.token_count.completion"] = usage.get("completion_tokens", 0)
        return _llm_span(trace_id, started, duration, attributes, True), True
    except (error.HTTPError, error.URLError, OSError, ValueError, KeyError) as exc:
        duration = (time.perf_counter() - began) * 1000
        attributes["exception.type"] = type(exc).__name__
        attributes["exception.message"] = str(exc)[:300]
        return _llm_span(trace_id, started, duration, attributes, False), False


def _llm_span(trace_id, started, duration, attributes, ok):
    return {
        "span_id": f"{trace_id}-llm",
        "trace_id": trace_id,
        "parent_id": trace_id,
        "name": "chat.completion",
        "span_kind": "LLM",
        "start_time": started.isoformat(),
        "end_time": (started + timedelta(milliseconds=duration)).isoformat(),
        "duration_ms": round(duration, 3),
        "status_code": "OK" if ok else "ERROR",
        "attributes": attributes,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--tenant", default=os.environ.get("RVKG_TENANT", "demo-tenant"))
    parser.add_argument("--synthetic", action="store_true",
                        help="generate API Gateway access logs instead of reading AWS")
    parser.add_argument("--count", type=int, default=400)
    parser.add_argument("--log-group", default="")
    parser.add_argument("--hours", type=float, default=1.0)
    parser.add_argument("--region", default="")
    parser.add_argument("--agent-turns", type=int, default=8)
    args = parser.parse_args()

    if not args.synthetic and not args.log_group:
        parser.error("pass --log-group, or --synthetic to run without AWS")

    records = (synthetic_apigw(args.count) if args.synthetic
               else read_cloudwatch(args.log_group, args.hours, args.region))
    stored = push_apigw(args.tenant, records)
    agent_spans = run_agent(args.tenant, args.agent_turns)
    print(f"gateway spans: {stored}   agent spans: {agent_spans}   tenant: {args.tenant}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

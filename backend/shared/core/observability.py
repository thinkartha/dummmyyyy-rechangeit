"""Gateway observability: APISIX traffic metrics + Phoenix traces.

The two halves are one pipeline. APISIX proxies traffic and its opentelemetry plugin
exports a span per request to Phoenix over OTLP; Phoenix stores them and this module
reads them back. APISIX answers "how much traffic and how many errors per route",
Phoenix answers "what happened inside one of those requests".

Both are optional: unset PHOENIX_BASE_URL / APISIX_PROMETHEUS_URL and the callers get
an explicit "not configured" rather than a crash, so the page degrades instead of 500ing.

ponytail: stdlib urllib, matching core/notifications.py — the Lambda package has no
HTTP client and this does not justify adding one.
"""

from __future__ import annotations

import json
import logging
import os
import re
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

log = logging.getLogger("pinghold.observability")

_TIMEOUT = 10


def phoenix_url() -> str:
    return os.getenv("PHOENIX_BASE_URL", "").rstrip("/")


def apisix_metrics_url() -> str:
    return os.getenv("APISIX_PROMETHEUS_URL", "").rstrip("/")


def phoenix_project() -> str:
    """Phoenix groups spans by project; APISIX's resource service.name lands here."""
    return os.getenv("PHOENIX_PROJECT", "apisix-gateway")


class NotConfigured(RuntimeError):
    """Raised when the backing service has no URL set."""


class UpstreamError(RuntimeError):
    """Raised when the backing service is configured but unreachable or erroring."""


def _get(url: str, accept: str = "application/json") -> bytes:
    headers = {"Accept": accept}
    # Phoenix can be run without auth on a private network or with bearer auth in a
    # hardened self-hosted deployment. Never send this token to the APISIX metrics URL.
    base = phoenix_url()
    token = os.getenv("PHOENIX_API_KEY", "").strip()
    if token and base and url.startswith(f"{base}/"):
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=_TIMEOUT) as resp:
            return resp.read()
    except urllib.error.HTTPError as exc:
        raise UpstreamError(f"{url} returned {exc.code}") from exc
    except Exception as exc:
        raise UpstreamError(f"{url} unreachable: {exc}") from exc


# --- APISIX -----------------------------------------------------------------

# apisix_http_status{code="200",route="pinghold-api",...} 42
_SAMPLE = re.compile(r'^(?P<name>\w+)\{(?P<labels>[^}]*)\}\s+(?P<value>[0-9.eE+-]+)\s*$')
_LABEL = re.compile(r'(\w+)="([^"]*)"')


def _parse_prometheus(text: str) -> list[tuple[str, dict[str, str], float]]:
    """Minimal Prometheus text-format reader: (metric, labels, value) per sample.

    ponytail: a regex over the two metric families we read, not prometheus_client —
    that dep exists to *expose* metrics, and pulling it in to parse four lines of
    text would ship a package into the Lambda for nothing.
    """
    out = []
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        m = _SAMPLE.match(line)
        if not m:
            continue
        try:
            value = float(m.group("value"))
        except ValueError:
            continue
        out.append((m.group("name"), dict(_LABEL.findall(m.group("labels"))), value))
    return out


def ai_gateway_stats() -> dict[str, Any]:
    """Per-model LLM traffic from the APISIX AI Gateway.

    Reads the apisix_llm_* families the ai-proxy-multi plugin emits:
      apisix_llm_prompt_tokens / apisix_llm_completion_tokens  (counters)
      apisix_llm_latency                                       (histogram)
      apisix_llm_active_connections                            (gauge)
    all labelled with llm_model, route_id, consumer and request_type.

    This is the gateway's own accounting, independent of whether the calling agent is
    instrumented at all — which is the point of putting the LLM traffic behind a
    gateway. It is the billing-grade number; Phoenix spans are the per-request detail.
    """
    from . import agent_seed

    if agent_seed.enabled():
        # Seeded exposition text, parsed by the same reader as the real endpoint.
        text = agent_seed.apisix_metrics()
    else:
        url = apisix_metrics_url()
        if not url:
            raise NotConfigured("APISIX_PROMETHEUS_URL is not set")
        text = _get(url, accept="text/plain").decode("utf-8", "replace")

    models: dict[str, dict[str, Any]] = {}

    def entry(model: str) -> dict[str, Any]:
        return models.setdefault(model, {
            "model": model, "prompt_tokens": 0.0, "completion_tokens": 0.0,
            "requests": 0.0, "latency_sum_ms": 0.0, "latency_count": 0.0,
            "active": 0.0, "routes": set(), "consumers": set(),
        })

    for name, labels, value in _parse_prometheus(text):
        if not name.startswith("apisix_llm_"):
            continue
        model = labels.get("llm_model") or "unknown"
        row = entry(model)
        if labels.get("route_id"):
            row["routes"].add(labels["route_id"])
        if labels.get("consumer"):
            row["consumers"].add(labels["consumer"])

        if name == "apisix_llm_prompt_tokens":
            row["prompt_tokens"] += value
        elif name == "apisix_llm_completion_tokens":
            row["completion_tokens"] += value
        elif name == "apisix_llm_active_connections":
            row["active"] += value
        # Histograms expose _sum and _count; the derived mean is all a summary row
        # needs, and avoids reconstructing quantiles from buckets.
        elif name == "apisix_llm_latency_sum":
            row["latency_sum_ms"] += value
        elif name == "apisix_llm_latency_count":
            row["latency_count"] += value
            row["requests"] += value

    rows = []
    for row in models.values():
        count = row["latency_count"]
        rows.append({
            "model": row["model"],
            "prompt_tokens": int(row["prompt_tokens"]),
            "completion_tokens": int(row["completion_tokens"]),
            "total_tokens": int(row["prompt_tokens"] + row["completion_tokens"]),
            "requests": int(row["requests"]),
            "avg_latency_ms": round(row["latency_sum_ms"] / count, 1) if count else 0.0,
            "active_connections": int(row["active"]),
            "routes": sorted(row["routes"]),
            "consumers": sorted(row["consumers"]),
        })
    rows.sort(key=lambda r: r["total_tokens"], reverse=True)

    return {
        "models": rows,
        "total_tokens": sum(r["total_tokens"] for r in rows),
        "total_requests": sum(r["requests"] for r in rows),
        "active_connections": sum(r["active_connections"] for r in rows),
        # No apisix_llm_* series at all means the AI routes have never been called.
        "has_traffic": bool(rows),
    }


def route_stats() -> list[dict[str, Any]]:
    """Per-route request/error counts from the APISIX Prometheus endpoint."""
    from . import agent_seed

    if agent_seed.enabled():
        text = agent_seed.apisix_metrics()
    else:
        url = apisix_metrics_url()
        if not url:
            raise NotConfigured("APISIX_PROMETHEUS_URL is not set")
        text = _get(url, accept="text/plain").decode("utf-8", "replace")

    routes: dict[str, dict[str, Any]] = {}
    for name, labels, value in _parse_prometheus(text):
        if name != "apisix_http_status":
            continue
        route = labels.get("route") or labels.get("matched_uri") or "unknown"
        code = labels.get("code", "")
        entry = routes.setdefault(
            route, {"route": route, "requests": 0.0, "errors": 0.0, "by_code": {}}
        )
        entry["requests"] += value
        entry["by_code"][code] = entry["by_code"].get(code, 0.0) + value
        # 5xx is the gateway's own failure signal; 4xx is usually the caller's fault.
        if code.startswith("5"):
            entry["errors"] += value

    for entry in routes.values():
        total = entry["requests"]
        entry["error_rate"] = round(entry["errors"] / total, 4) if total else 0.0
    return sorted(routes.values(), key=lambda r: r["requests"], reverse=True)


# --- Phoenix ----------------------------------------------------------------

def _span_field(span: dict, *names: str, default=None):
    """Phoenix span payloads differ across versions; take the first key that exists.

    Checked against Phoenix 8.x, which nests some fields under "context". Pinning the
    image tag in docker-compose is what keeps this honest — verify against your
    running version if you bump it.
    """
    for name in names:
        if name in span and span[name] is not None:
            return span[name]
        ctx = span.get("context") or {}
        if name in ctx and ctx[name] is not None:
            return ctx[name]
    return default


def _duration_ms(span: dict) -> float:
    supplied = _span_field(span, "duration_ms")
    if supplied is not None:
        try:
            return round(float(supplied), 3)
        except (TypeError, ValueError):
            pass
    start, end = _span_field(span, "start_time"), _span_field(span, "end_time")
    if not (start and end):
        return 0.0
    from datetime import datetime

    def parse(v):
        if isinstance(v, (int, float)):  # epoch nanos
            return float(v) / 1e6
        return datetime.fromisoformat(str(v).replace("Z", "+00:00")).timestamp() * 1000

    try:
        return round(parse(end) - parse(start), 3)
    except Exception:
        return 0.0


def _normalize(span: dict) -> dict[str, Any]:
    return {
        "span_id": _span_field(span, "span_id", "id", default=""),
        "trace_id": _span_field(span, "trace_id", default=""),
        "parent_span_id": _span_field(span, "parent_id", "parent_span_id"),
        "name": _span_field(span, "name", default="(unnamed)"),
        "kind": _span_field(span, "span_kind", "kind", default="INTERNAL"),
        "start_time": _span_field(span, "start_time"),
        "duration_ms": _duration_ms(span),
        "status": str(_span_field(span, "status_code", "status", default="UNSET")).upper(),
        "attributes": _span_field(span, "attributes", default={}) or {},
    }


def _fetch_spans(limit: int, project: str | None = None) -> list[dict[str, Any]]:
    base = phoenix_url()
    if not base:
        raise NotConfigured("PHOENIX_BASE_URL is not set")
    project_id = urllib.parse.quote(project or phoenix_project(), safe="")
    url = f"{base}/v1/projects/{project_id}/spans?limit={limit}"
    payload = json.loads(_get(url) or b"{}")
    raw = payload.get("data", payload) if isinstance(payload, dict) else payload
    return [_normalize(s) for s in raw if isinstance(s, dict)]


def span_annotations(span_ids: list[str], project: str | None = None) -> list[dict[str, Any]]:
    """Annotations/evaluation results attached to the requested Phoenix spans.

    Phoenix exposes these through its self-hosted REST API; no Arize-hosted service or
    paid API is involved. Older Phoenix releases may not expose this route, so callers
    should treat UpstreamError as "evaluations unavailable" rather than losing spans.
    """
    base = phoenix_url()
    if not base:
        raise NotConfigured("PHOENIX_BASE_URL is not set")
    ids = [str(span_id) for span_id in span_ids if span_id]
    if not ids:
        return []
    project_id = urllib.parse.quote(project or phoenix_project(), safe="")
    query = urllib.parse.urlencode({"span_ids": ids}, doseq=True)
    url = f"{base}/v1/projects/{project_id}/span_annotations?{query}"
    payload = json.loads(_get(url) or b"{}")
    raw = payload.get("data", payload) if isinstance(payload, dict) else payload
    return [row for row in raw if isinstance(row, dict)]


def list_traces(limit: int = 50) -> list[dict[str, Any]]:
    """Recent traces, one row per trace, newest first."""
    traces: dict[str, dict[str, Any]] = {}
    # Pull more spans than traces asked for — a trace is many spans, and taking
    # `limit` spans would return a handful of traces with holes in them.
    for span in _fetch_spans(limit * 20):
        tid = span["trace_id"]
        if not tid:
            continue
        entry = traces.setdefault(
            tid,
            {"trace_id": tid, "root_name": None, "start_time": None,
             "duration_ms": 0.0, "span_count": 0, "errors": 0},
        )
        entry["span_count"] += 1
        if span["status"] == "ERROR":
            entry["errors"] += 1
        # The root span (no parent) names the trace and carries its wall-clock span.
        if not span["parent_span_id"]:
            entry["root_name"] = span["name"]
            entry["start_time"] = span["start_time"]
            entry["duration_ms"] = span["duration_ms"]
        elif entry["root_name"] is None:
            entry["duration_ms"] = max(entry["duration_ms"], span["duration_ms"])
            entry["start_time"] = entry["start_time"] or span["start_time"]

    rows = list(traces.values())
    for row in rows:
        row["root_name"] = row["root_name"] or "(root span missing)"
        row["status"] = "ERROR" if row["errors"] else "OK"
    rows.sort(key=lambda r: str(r["start_time"] or ""), reverse=True)
    return rows[:limit]


def get_trace(trace_id: str) -> list[dict[str, Any]]:
    """All spans of one trace, ordered for a waterfall (parents before children)."""
    spans = [s for s in _fetch_spans(2000) if s["trace_id"] == trace_id]
    by_parent: dict[Any, list[dict]] = {}
    for span in spans:
        by_parent.setdefault(span["parent_span_id"], []).append(span)
    for children in by_parent.values():
        children.sort(key=lambda s: str(s["start_time"] or ""))

    ordered: list[dict[str, Any]] = []

    def walk(parent_id, depth: int) -> None:
        for span in by_parent.get(parent_id, []):
            ordered.append({**span, "depth": depth})
            walk(span["span_id"], depth + 1)

    walk(None, 0)
    # A span whose parent is outside this trace would otherwise vanish from the UI.
    seen = {s["span_id"] for s in ordered}
    ordered.extend({**s, "depth": 0} for s in spans if s["span_id"] not in seen)
    return ordered


def pipeline_status() -> dict[str, Any]:
    """Which half of the APISIX -> Phoenix pipeline is actually wired up."""
    status: dict[str, Any] = {}
    for name, check in (("apisix", route_stats), ("phoenix", lambda: _fetch_spans(1))):
        try:
            check()
            status[name] = {"configured": True, "reachable": True, "error": None}
        except NotConfigured as exc:
            status[name] = {"configured": False, "reachable": False, "error": str(exc)}
        except UpstreamError as exc:
            status[name] = {"configured": True, "reachable": False, "error": str(exc)}
    status["pipeline_ok"] = all(v["reachable"] for v in status.values() if isinstance(v, dict))
    return status

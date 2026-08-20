"""Custom AI model monitoring — push-based, for models this platform cannot see.

core/agents.py reads LLM spans from durable agent telemetry, which works when the model call goes
through an instrumented SDK or the AI gateway. It sees nothing of a fraud classifier on
a GPU box, a fine-tuned model behind a private endpoint, or anything a team runs
themselves. Those push here instead:

    POST /api/v1/ai-models/inferences   {model, latency_ms, success, tokens…, drift_score…}

and get the same rollups — traffic, error rate, p95 latency, tokens, cost, drift — plus
the ML-specific signals a generic APM has no field for: confidence, drift, and
ground-truth accuracy when a label arrives later.

Health thresholds are per model and per tenant, because "3% errors" is fine for a
speculative recommender and an incident for a payments risk model.

Inferences go to core/record_store (DynamoDB, with an in-memory fallback for local runs).
Rollups are recomputed on read over the requested window — no aggregation table to keep
correct. They used to live in a per-process ring buffer, which on Lambda meant history
vanished at every cold start and two concurrent invocations disagreed; the reporting API
is the only record a self-hosted model has, so it has to outlive the process.
"""

from __future__ import annotations

import json
import logging
import statistics
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Any

from . import config_store, record_store

log = logging.getLogger("pinghold.ai_models")

INTEGRATION_KEY = "ai-models"
STREAM = "ai-inferences"

DEFAULT_THRESHOLDS = {
    "error_rate_warn": 0.02,
    "error_rate_crit": 0.10,
    "p95_latency_ms_warn": 2000.0,
    "p95_latency_ms_crit": 10000.0,
    # Drift is reported by the caller (PSI, KL divergence, whatever they compute);
    # 0.1/0.25 are the conventional PSI bands.
    "drift_warn": 0.10,
    "drift_crit": 0.25,
    "accuracy_warn": 0.90,
    "accuracy_crit": 0.80,
}


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _parse_time(value: Any) -> datetime:
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    if isinstance(value, (int, float)):
        return datetime.fromtimestamp(float(value), tz=timezone.utc)
    if isinstance(value, str) and value:
        try:
            parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
            return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)
        except ValueError:
            pass
    return _now()


# --- thresholds -------------------------------------------------------------

def get_thresholds(tenant_id: str, model: str | None = None) -> dict[str, float]:
    """Tenant defaults overlaid with per-model overrides."""
    raw = config_store.get_config(tenant_id, INTEGRATION_KEY)
    saved: dict[str, Any] = {}
    if raw:
        try:
            saved = json.loads(raw)
        except json.JSONDecodeError:
            log.warning("Corrupt AI model config for tenant %s", tenant_id)
    merged = {**DEFAULT_THRESHOLDS, **(saved.get("defaults") or {})}
    if model:
        merged.update((saved.get("models") or {}).get(model) or {})
    return merged


def set_thresholds(tenant_id: str, values: dict[str, float], model: str | None = None) -> dict[str, float]:
    """Override thresholds for the tenant, or for one model. Unknown keys are rejected
    so a typo silently does nothing instead of loudly doing nothing."""
    unknown = set(values) - set(DEFAULT_THRESHOLDS)
    if unknown:
        raise ValueError(f"Unknown threshold(s): {', '.join(sorted(unknown))}")

    raw = config_store.get_config(tenant_id, INTEGRATION_KEY)
    try:
        saved = json.loads(raw) if raw else {}
    except json.JSONDecodeError:
        saved = {}
    saved.setdefault("defaults", {})
    saved.setdefault("models", {})
    if model:
        saved["models"].setdefault(model, {}).update(values)
    else:
        saved["defaults"].update(values)
    config_store.save_config(tenant_id, INTEGRATION_KEY, json.dumps(saved))
    return get_thresholds(tenant_id, model)


# --- ingest -----------------------------------------------------------------

def _normalize(inference: dict[str, Any]) -> dict[str, Any]:
    """Coerce one caller-supplied inference into the stored shape. `model` is required;
    everything else is optional because a team that only has latency should still get a
    latency chart."""
    model = str(inference.get("model") or "").strip()
    if not model:
        raise ValueError("model is required")

    return {
        "model": model,
        "version": str(inference.get("version") or "").strip() or None,
        "provider": str(inference.get("provider") or "").strip() or "custom",
        "task": str(inference.get("task") or "").strip() or None,
        "timestamp": _parse_time(inference.get("timestamp")),
        "latency_ms": float(inference.get("latency_ms") or 0.0),
        "success": bool(inference.get("success", True)),
        "error": inference.get("error"),
        "tokens_in": float(inference.get("tokens_in") or 0.0),
        "tokens_out": float(inference.get("tokens_out") or 0.0),
        # None, not 0 — "the caller did not report cost" is not "this was free".
        "cost": float(inference["cost"]) if inference.get("cost") is not None else None,
        "confidence": float(inference["confidence"]) if inference.get("confidence") is not None else None,
        "drift_score": float(inference["drift_score"]) if inference.get("drift_score") is not None else None,
        # Set when the true label is known — usually backfilled, not known at call time.
        "correct": bool(inference["correct"]) if inference.get("correct") is not None else None,
        "metadata": inference.get("metadata") or {},
    }


def record(tenant_id: str, inference: dict[str, Any]) -> dict[str, Any]:
    """Store one inference."""
    normalized = _normalize(inference)
    record_store.append(tenant_id, STREAM, _encode(normalized), normalized["timestamp"])
    return normalized


def record_batch(tenant_id: str, inferences: list[dict[str, Any]]) -> int:
    """One batched write rather than N round trips — this is the path a serving job uses.
    Normalizing the whole batch first means a bad row is rejected before any of it is
    written, instead of leaving half a batch behind."""
    normalized = [_normalize(i) for i in inferences]
    record_store.append_many(tenant_id, STREAM, [_encode(r) for r in normalized])
    return len(normalized)


def _encode(row: dict[str, Any]) -> dict[str, Any]:
    """Storage form: the timestamp becomes ISO text, everything else is already JSON-safe."""
    return {**row, "timestamp": row["timestamp"].isoformat()}


def _decode(row: dict[str, Any]) -> dict[str, Any]:
    return {**row, "timestamp": _parse_time(row.get("timestamp"))}


def _window(tenant_id: str, hours: int | None = None, model: str | None = None) -> list[dict[str, Any]]:
    """Rows for a time window, oldest first. The cutoff is pushed into the store as a
    range query, so a 1-hour view does not read a month of records to discard them."""
    since = _now() - timedelta(hours=hours) if hours else None
    rows = [_decode(r) for r in record_store.window(tenant_id, STREAM, since)]
    if model:
        rows = [r for r in rows if r["model"] == model]
    return rows


def _percentile(values: list[float], fraction: float) -> float | None:
    """Nearest-rank percentile. statistics.quantiles needs n>1 and interpolates; on the
    two-request days that is a made-up number."""
    if not values:
        return None
    ordered = sorted(values)
    index = min(len(ordered) - 1, max(0, round(fraction * len(ordered) + 0.5) - 1))
    return round(ordered[index], 1)


def _status(row: dict[str, Any], thresholds: dict[str, float]) -> tuple[str, list[str]]:
    status, reasons = "healthy", []

    def escalate(level: str, reason: str) -> None:
        nonlocal status
        reasons.append(reason)
        if level == "down" or status == "down":
            status = "down"
        else:
            status = "degraded"

    if row["error_rate"] >= thresholds["error_rate_crit"]:
        escalate("down", f"Error rate {row['error_rate']:.1%}")
    elif row["error_rate"] >= thresholds["error_rate_warn"]:
        escalate("degraded", f"Error rate {row['error_rate']:.1%}")

    p95 = row.get("p95_latency_ms")
    if p95 is not None:
        if p95 >= thresholds["p95_latency_ms_crit"]:
            escalate("down", f"p95 latency {p95:.0f} ms")
        elif p95 >= thresholds["p95_latency_ms_warn"]:
            escalate("degraded", f"p95 latency {p95:.0f} ms")

    drift = row.get("drift_score")
    if drift is not None:
        if drift >= thresholds["drift_crit"]:
            escalate("down", f"Drift score {drift:.2f}")
        elif drift >= thresholds["drift_warn"]:
            escalate("degraded", f"Drift score {drift:.2f}")

    accuracy = row.get("accuracy")
    if accuracy is not None:
        if accuracy < thresholds["accuracy_crit"]:
            escalate("down", f"Accuracy {accuracy:.1%}")
        elif accuracy < thresholds["accuracy_warn"]:
            escalate("degraded", f"Accuracy {accuracy:.1%}")

    return status, reasons


def model_stats(tenant_id: str, hours: int | None = 24) -> list[dict[str, Any]]:
    """One row per model, busiest first."""
    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in _window(tenant_id, hours):
        grouped[row["model"]].append(row)

    rows = []
    for model, records in grouped.items():
        requests = len(records)
        errors = sum(1 for r in records if not r["success"])
        latencies = [r["latency_ms"] for r in records if r["latency_ms"]]
        costs = [r["cost"] for r in records if r["cost"] is not None]
        confidences = [r["confidence"] for r in records if r["confidence"] is not None]
        drifts = [r["drift_score"] for r in records if r["drift_score"] is not None]
        labeled = [r["correct"] for r in records if r["correct"] is not None]

        row = {
            "model": model,
            "versions": sorted({r["version"] for r in records if r["version"]}),
            "providers": sorted({r["provider"] for r in records}),
            "tasks": sorted({r["task"] for r in records if r["task"]}),
            "requests": requests,
            "errors": errors,
            "error_rate": round(errors / requests, 4) if requests else 0.0,
            "avg_latency_ms": round(statistics.fmean(latencies), 1) if latencies else None,
            "p50_latency_ms": _percentile(latencies, 0.50),
            "p95_latency_ms": _percentile(latencies, 0.95),
            "p99_latency_ms": _percentile(latencies, 0.99),
            "tokens_in": int(sum(r["tokens_in"] for r in records)),
            "tokens_out": int(sum(r["tokens_out"] for r in records)),
            "cost": round(sum(costs), 4) if costs else None,
            "avg_confidence": round(statistics.fmean(confidences), 4) if confidences else None,
            # Latest drift wins: it is a windowed statistic the caller already computed,
            # so averaging their windows would smear a fresh spike into nothing.
            "drift_score": round(drifts[-1], 4) if drifts else None,
            "accuracy": round(sum(labeled) / len(labeled), 4) if labeled else None,
            "labeled_samples": len(labeled),
            "last_seen": max(r["timestamp"] for r in records).isoformat(),
        }
        row["status"], row["reasons"] = _status(row, get_thresholds(tenant_id, model))
        rows.append(row)

    rows.sort(key=lambda r: r["requests"], reverse=True)
    return rows


def summary(tenant_id: str, hours: int | None = 24) -> dict[str, Any]:
    """Headline numbers for the overview cards."""
    models = model_stats(tenant_id, hours)
    requests = sum(m["requests"] for m in models)
    errors = sum(m["errors"] for m in models)
    costs = [m["cost"] for m in models if m["cost"] is not None]
    weighted = sum(m["avg_latency_ms"] * m["requests"] for m in models if m["avg_latency_ms"])
    return {
        "models": len(models),
        "healthy": sum(1 for m in models if m["status"] == "healthy"),
        "degraded": sum(1 for m in models if m["status"] == "degraded"),
        "down": sum(1 for m in models if m["status"] == "down"),
        "requests": requests,
        "errors": errors,
        "error_rate": round(errors / requests, 4) if requests else 0.0,
        "avg_latency_ms": round(weighted / requests, 1) if requests else None,
        "tokens_total": sum(m["tokens_in"] + m["tokens_out"] for m in models),
        "cost": round(sum(costs), 4) if costs else None,
        "drifting": sum(1 for m in models if m["drift_score"] is not None
                        and m["drift_score"] >= get_thresholds(tenant_id, m["model"])["drift_warn"]),
        "window_hours": hours,
    }


def timeseries(tenant_id: str, model: str | None = None, hours: int = 24) -> list[dict[str, Any]]:
    """Hourly buckets for the charts, oldest first."""
    buckets: dict[str, dict[str, Any]] = {}
    for row in _window(tenant_id, hours, model):
        key = row["timestamp"].astimezone(timezone.utc).strftime("%Y-%m-%dT%H:00")
        bucket = buckets.setdefault(key, {
            "time": key, "requests": 0, "errors": 0, "tokens_in": 0, "tokens_out": 0,
            "cost": 0.0, "cost_reported": False, "_latencies": [], "_drifts": [],
        })
        bucket["requests"] += 1
        bucket["errors"] += 0 if row["success"] else 1
        bucket["tokens_in"] += int(row["tokens_in"])
        bucket["tokens_out"] += int(row["tokens_out"])
        if row["cost"] is not None:
            bucket["cost"] += row["cost"]
            bucket["cost_reported"] = True
        if row["latency_ms"]:
            bucket["_latencies"].append(row["latency_ms"])
        if row["drift_score"] is not None:
            bucket["_drifts"].append(row["drift_score"])

    out = []
    for bucket in sorted(buckets.values(), key=lambda b: b["time"]):
        latencies = bucket.pop("_latencies")
        drifts = bucket.pop("_drifts")
        reported = bucket.pop("cost_reported")
        out.append({
            **bucket,
            "cost": round(bucket["cost"], 4) if reported else None,
            "avg_latency_ms": round(statistics.fmean(latencies), 1) if latencies else None,
            "p95_latency_ms": _percentile(latencies, 0.95),
            "drift_score": round(statistics.fmean(drifts), 4) if drifts else None,
        })
    return out


def failures(tenant_id: str, model: str | None = None, limit: int = 50) -> list[dict[str, Any]]:
    """Recent failed inferences, newest first — the model-level incident feed."""
    rows = [{
        "model": r["model"],
        "version": r["version"],
        "timestamp": r["timestamp"].isoformat(),
        "latency_ms": r["latency_ms"],
        "error": r["error"] or "Inference failed",
        "metadata": r["metadata"],
    } for r in _window(tenant_id, None, model) if not r["success"]]
    rows.sort(key=lambda r: r["timestamp"], reverse=True)
    return rows[:limit]


def clear(tenant_id: str) -> int:
    """Drop this tenant's recorded inferences. Used by tests and by the UI's reset."""
    return record_store.clear(tenant_id, STREAM)

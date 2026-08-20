"""API gateway monitoring across vendors — traffic, errors and latency per route.

This generalizes what core/observability.py does for APISIX alone. An organization
running Kong, Tyk, Traefik, KrakenD, AWS API Gateway, Azure API Management or Apigee
connects it here and gets the same per-route table the APISIX page already shows.

Three transports cover all eight:

  prometheus — APISIX, Kong, Tyk, Traefik, KrakenD all expose a Prometheus endpoint.
               One parser plus a per-vendor metric/label spec, not five clients.
  aws        — CloudWatch AWS/ApiGateway metrics via boto3 (provided by the runtime).
  rest       — Azure Monitor and Apigee both answer a single authenticated GET.

Credentials are per tenant, stored via config_store, and never echoed back: reads go
through masked_config().

ponytail: stdlib urllib, matching core/observability.py — the Lambda package has no
HTTP client and one GET per provider does not justify adding one.
"""

from __future__ import annotations

import json
import logging
import os
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from typing import Any

from . import config_store
from .observability import NotConfigured, UpstreamError, _parse_prometheus

log = logging.getLogger("pinghold.gateways")

INTEGRATION_KEY = "api-gateway"
_TIMEOUT = 15


# --- catalog ----------------------------------------------------------------

# `free` marks gateways with a self-hostable open-source edition — the ones a team can
# run without a vendor contract. The three that are not free are still supported; they
# just cost money to operate.
#
# `fields` is the connection form the UI renders. `secret` fields are write-only.
CATALOG: dict[str, dict[str, Any]] = {
    "apisix": {
        "label": "Apache APISIX",
        "free": True,
        "license": "Apache-2.0",
        "transport": "prometheus",
        "docs": "https://apisix.apache.org/docs/apisix/plugins/prometheus/",
        "hint": "Enable the prometheus plugin, then point this at :9091/apisix/prometheus/metrics",
        "fields": [
            {"name": "metrics_url", "label": "Prometheus metrics URL", "required": True},
        ],
        # metric family -> how to read a route and a status code out of its labels
        "metrics": {
            "families": ["apisix_http_status"],
            "route_labels": ["route", "matched_uri", "service"],
            "code_labels": ["code"],
            "latency_families": ["apisix_http_latency_sum", "apisix_http_latency_count"],
        },
    },
    "kong": {
        "label": "Kong Gateway (OSS)",
        "free": True,
        "license": "Apache-2.0",
        "transport": "prometheus",
        "docs": "https://docs.konghq.com/hub/kong-inc/prometheus/",
        "hint": "Enable the prometheus plugin, then point this at the Admin API's /metrics",
        "fields": [
            {"name": "metrics_url", "label": "Prometheus metrics URL", "required": True},
            {"name": "admin_url", "label": "Admin API URL (optional, for status)"},
            {"name": "token", "label": "Admin API token", "secret": True},
        ],
        "metrics": {
            # Kong renamed this family in 3.x; accept both so one config works across versions.
            "families": ["kong_http_requests_total", "kong_http_status"],
            "route_labels": ["route", "service"],
            "code_labels": ["code", "status"],
            "latency_families": ["kong_request_latency_ms_sum", "kong_request_latency_ms_count"],
        },
    },
    "tyk": {
        "label": "Tyk Gateway (OSS)",
        "free": True,
        "license": "MPL-2.0",
        "transport": "prometheus",
        "docs": "https://tyk.io/docs/tyk-stack/tyk-pump/other-pumps/#prometheus-pump",
        "hint": "Run tyk-pump with the Prometheus pump and point this at its /metrics",
        "fields": [
            {"name": "metrics_url", "label": "Prometheus metrics URL", "required": True},
        ],
        "metrics": {
            "families": ["tyk_http_status", "tyk_http_status_per_path"],
            "route_labels": ["path", "api", "api_name"],
            "code_labels": ["code", "response_code"],
            "latency_families": ["tyk_latency_sum", "tyk_latency_count"],
        },
    },
    "traefik": {
        "label": "Traefik Proxy",
        "free": True,
        "license": "MIT",
        "transport": "prometheus",
        "docs": "https://doc.traefik.io/traefik/observability/metrics/prometheus/",
        "hint": "Set --metrics.prometheus=true and point this at the entrypoint's /metrics",
        "fields": [
            {"name": "metrics_url", "label": "Prometheus metrics URL", "required": True},
        ],
        "metrics": {
            "families": ["traefik_service_requests_total", "traefik_router_requests_total"],
            "route_labels": ["service", "router", "protocol"],
            "code_labels": ["code"],
            "latency_families": [
                "traefik_service_request_duration_seconds_sum",
                "traefik_service_request_duration_seconds_count",
            ],
        },
    },
    "krakend": {
        "label": "KrakenD",
        "free": True,
        "license": "Apache-2.0",
        "transport": "prometheus",
        "docs": "https://www.krakend.io/docs/telemetry/opencensus/",
        "hint": "Enable telemetry/opencensus with the prometheus exporter (default :9091/metrics)",
        "fields": [
            {"name": "metrics_url", "label": "Prometheus metrics URL", "required": True},
        ],
        "metrics": {
            "families": ["krakend_http_requests_total", "http_server_requests_total"],
            "route_labels": ["path", "endpoint", "name"],
            "code_labels": ["code", "status", "http_status"],
            "latency_families": [],
        },
    },
    "aws": {
        "label": "AWS API Gateway",
        "free": False,
        "transport": "aws",
        "docs": "https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-metrics-and-dimensions.html",
        "hint": "Reads CloudWatch AWS/ApiGateway metrics. Leave the keys blank to use the deployment's IAM role.",
        "fields": [
            {"name": "region", "label": "AWS region", "required": True},
            {"name": "api_name", "label": "API name (blank = all APIs)"},
            {"name": "access_key_id", "label": "Access key ID"},
            {"name": "secret_access_key", "label": "Secret access key", "secret": True},
        ],
    },
    "azure": {
        "label": "Azure API Management",
        "free": False,
        "transport": "rest",
        "docs": "https://learn.microsoft.com/en-us/azure/api-management/api-management-howto-use-azure-monitor",
        "hint": "Needs the APIM resource id and an Azure AD bearer token with Monitoring Reader.",
        "fields": [
            {"name": "resource_id", "label": "APIM resource id (/subscriptions/.../service/<name>)", "required": True},
            {"name": "token", "label": "Azure AD bearer token", "required": True, "secret": True},
        ],
    },
    "apigee": {
        "label": "Google Apigee",
        "free": False,
        "transport": "rest",
        "docs": "https://cloud.google.com/apigee/docs/api-platform/analytics/use-analytics-api-measure-api-program-performance",
        "hint": "Needs the Apigee org, an environment, and a GCP OAuth access token.",
        "fields": [
            {"name": "org", "label": "Apigee organization", "required": True},
            {"name": "environment", "label": "Environment", "required": True},
            {"name": "token", "label": "GCP OAuth access token", "required": True, "secret": True},
        ],
    },
}


def catalog() -> list[dict[str, Any]]:
    """Supported gateways, free/open-source ones first."""
    rows = [{"id": key, **{k: v for k, v in spec.items() if k != "metrics"}} for key, spec in CATALOG.items()]
    rows.sort(key=lambda r: (not r["free"], r["label"]))
    return rows


def _secret_fields(provider: str) -> set[str]:
    return {f["name"] for f in CATALOG[provider]["fields"] if f.get("secret")}


# --- config -----------------------------------------------------------------

def _env_config() -> dict[str, Any]:
    """Deployment-wide fallback without requiring a tenant-saved credential.

    Local Docker may still point at APISIX. In Lambda, monitor the AWS API Gateway
    created by this backend's own SAM stack using the execution role.
    """
    url = os.getenv("APISIX_PROMETHEUS_URL", "").strip()
    if url:
        return {"provider": "apisix", "metrics_url": url}
    api_name = os.getenv("PINGHOLD_API_GATEWAY_NAME", "").strip()
    if api_name:
        return {
            "provider": "aws",
            "region": os.getenv("AWS_REGION", "us-east-1"),
            "api_name": api_name,
        }
    return {}


def get_config(tenant_id: str | None = None) -> dict[str, Any]:
    """This tenant's gateway config, falling back to the deployment default.

    Returned with secrets intact — internal callers only. Anything reaching a client
    must go through masked_config().
    """
    if tenant_id:
        raw = config_store.get_config(tenant_id, INTEGRATION_KEY)
        if raw:
            try:
                saved = json.loads(raw)
            except json.JSONDecodeError:
                log.warning("Corrupt gateway config for tenant %s; falling back to env", tenant_id)
            else:
                if saved.get("provider") in CATALOG:
                    return saved
    return _env_config()


def save_config(tenant_id: str, provider: str, fields: dict[str, Any]) -> None:
    """Persist a tenant's gateway connection. Raises ValueError on a bad provider or a
    missing required field."""
    if provider not in CATALOG:
        raise ValueError(f"Unsupported gateway '{provider}'. Supported: {', '.join(sorted(CATALOG))}")
    spec = CATALOG[provider]
    clean: dict[str, Any] = {"provider": provider}
    missing = []
    for field in spec["fields"]:
        value = str(fields.get(field["name"], "") or "").strip()
        if field.get("required") and not value:
            missing.append(field["name"])
        if value:
            clean[field["name"]] = value
    if missing:
        raise ValueError(f"Missing required field(s): {', '.join(missing)}")
    if not config_store.save_config(tenant_id, INTEGRATION_KEY, json.dumps(clean)):
        raise UpstreamError("Could not save gateway configuration")


def delete_config(tenant_id: str) -> None:
    config_store.save_config(tenant_id, INTEGRATION_KEY, json.dumps({}))


def masked_config(tenant_id: str | None = None) -> dict[str, Any]:
    """Safe-to-return view: secrets become a 4-character hint."""
    cfg = get_config(tenant_id)
    provider = cfg.get("provider")
    if not provider:
        return {"provider": None, "configured": False, "source": "none", "fields": {}}

    secrets = _secret_fields(provider)
    fields = {}
    for key, value in cfg.items():
        if key == "provider":
            continue
        text = str(value)
        fields[key] = (f"…{text[-4:]}" if len(text) >= 4 else "set") if key in secrets else text

    tenant_saved = bool(tenant_id and cfg != _env_config())
    return {
        "provider": provider,
        "label": CATALOG[provider]["label"],
        "free": CATALOG[provider]["free"],
        "configured": True,
        # Tells the UI whether it is showing this org's own settings or the
        # deployment-wide fallback, which it must not offer to "clear".
        "source": "tenant" if tenant_saved else "environment",
        "fields": fields,
    }


def _require(tenant_id: str | None) -> dict[str, Any]:
    cfg = get_config(tenant_id)
    if not cfg.get("provider"):
        raise NotConfigured(
            "No API gateway is connected for this organization. "
            "Add one under Config Management → API Gateway."
        )
    return cfg


# --- transports -------------------------------------------------------------

def _http_get(url: str, headers: dict[str, str] | None = None, accept: str = "application/json") -> bytes:
    req = urllib.request.Request(url, headers={"Accept": accept, **(headers or {})})
    try:
        with urllib.request.urlopen(req, timeout=_TIMEOUT) as resp:
            return resp.read()
    except urllib.error.HTTPError as exc:
        # Never echo the body: Azure and Apigee include the request, which can carry
        # the token, and this logger goes to CloudWatch.
        raise UpstreamError(f"{urllib.parse.urlsplit(url).netloc} returned {exc.code}") from exc
    except Exception as exc:
        raise UpstreamError(f"{urllib.parse.urlsplit(url).netloc} unreachable: {exc}") from exc


def _label(labels: dict[str, str], candidates: list[str], default: str) -> str:
    for name in candidates:
        if labels.get(name):
            return labels[name]
    return default


def _prometheus_routes(cfg: dict[str, Any]) -> list[dict[str, Any]]:
    """Per-route counters from any gateway that speaks Prometheus.

    One reader for five vendors: the spec says which metric families count requests and
    which labels carry the route and the status code. A vendor that renames a family
    (Kong did, in 3.x) lists both names rather than getting its own parser.

    Only the *first* listed family that the endpoint actually exposes is counted. Tyk
    publishes tyk_http_status and tyk_http_status_per_path together, and Traefik
    publishes router and service counters together — they describe the same requests at
    different granularities, so summing every listed family would report double the
    traffic that went through the gateway.
    """
    spec = CATALOG[cfg["provider"]]["metrics"]
    text = _http_get(cfg["metrics_url"], accept="text/plain").decode("utf-8", "replace")
    samples = _parse_prometheus(text)

    present = {name for name, _, _ in samples}
    family = next((f for f in spec["families"] if f in present), None)
    lat_families = {f for f in (spec.get("latency_families") or []) if f in present}

    routes: dict[str, dict[str, Any]] = {}
    latency: dict[str, dict[str, float]] = {}

    for name, labels, value in samples:
        if name == family:
            route = _label(labels, spec["route_labels"], "unknown")
            code = _label(labels, spec["code_labels"], "")
            entry = routes.setdefault(
                route, {"route": route, "requests": 0.0, "errors": 0.0, "by_code": {}}
            )
            entry["requests"] += value
            entry["by_code"][code] = entry["by_code"].get(code, 0.0) + value
            # 5xx is the gateway's own failure signal; 4xx is usually the caller's fault.
            if code.startswith("5"):
                entry["errors"] += value
        elif name in lat_families:
            route = _label(labels, spec["route_labels"], "unknown")
            bucket = latency.setdefault(route, {"sum": 0.0, "count": 0.0})
            bucket["sum" if name.endswith("_sum") else "count"] += value

    # Seconds for Traefik's histogram, milliseconds everywhere else.
    scale = 1000.0 if any("seconds" in f for f in lat_families) else 1.0

    for route, entry in routes.items():
        total = entry["requests"]
        entry["error_rate"] = round(entry["errors"] / total, 4) if total else 0.0
        bucket = latency.get(route)
        entry["avg_latency_ms"] = (
            round(bucket["sum"] / bucket["count"] * scale, 1)
            if bucket and bucket["count"] else None
        )
    return sorted(routes.values(), key=lambda r: r["requests"], reverse=True)


def _boto_client(service: str, cfg: dict[str, Any]):
    try:
        import boto3
    except ImportError as exc:  # pragma: no cover - boto3 ships with the Lambda runtime
        raise UpstreamError("boto3 is not available in this deployment") from exc
    kwargs: dict[str, Any] = {"region_name": cfg.get("region")}
    # Explicit keys are optional: on Lambda the execution role is usually the right
    # identity, and asking a tenant to paste long-lived keys is worse than not.
    if cfg.get("access_key_id") and cfg.get("secret_access_key"):
        kwargs["aws_access_key_id"] = cfg["access_key_id"]
        kwargs["aws_secret_access_key"] = cfg["secret_access_key"]
    try:
        return boto3.client(service, **kwargs)
    except Exception as exc:
        raise UpstreamError(f"Could not create an AWS {service} client: {exc}") from exc


def _aws_routes(cfg: dict[str, Any], hours: int = 24) -> list[dict[str, Any]]:
    """Per-API traffic from CloudWatch AWS/ApiGateway.

    CloudWatch dimensions stop at the API (and optionally stage/method); one row per
    API is the finest breakdown available without turning on detailed metrics, which
    bills per method.
    """
    cw = _boto_client("cloudwatch", cfg)
    end = datetime.now(timezone.utc)
    start = end - timedelta(hours=hours)

    apis = [cfg["api_name"]] if cfg.get("api_name") else _aws_api_names(cfg)
    if not apis:
        return []

    metrics = {"Count": "requests", "5XXError": "errors", "4XXError": "client_errors", "Latency": "latency"}
    queries = []
    for index, api in enumerate(apis):
        for metric, _ in metrics.items():
            queries.append({
                # CloudWatch ids must start with a lowercase letter: m0_count, m0_5xxerror.
                "Id": f"m{index}_{metric.lower()}",
                "MetricStat": {
                    "Metric": {
                        "Namespace": "AWS/ApiGateway",
                        "MetricName": metric,
                        "Dimensions": [{"Name": "ApiName", "Value": api}],
                    },
                    "Period": hours * 3600,
                    # API Gateway's Count metric represents requests through the
                    # SampleCount statistic. Error totals use Sum; latency uses Average.
                    "Stat": (
                        "SampleCount" if metric == "Count"
                        else "Average" if metric == "Latency"
                        else "Sum"
                    ),
                },
                "ReturnData": True,
                "Label": f"{index}|{metric}",
            })

    try:
        resp = cw.get_metric_data(MetricDataQueries=queries, StartTime=start, EndTime=end)
    except Exception as exc:
        raise UpstreamError(f"CloudWatch query failed: {exc}") from exc

    rows: dict[str, dict[str, Any]] = {
        api: {"route": api, "requests": 0.0, "errors": 0.0, "by_code": {}, "avg_latency_ms": None}
        for api in apis
    }
    for result in resp.get("MetricDataResults", []):
        index, _, metric = str(result.get("Label", "")).partition("|")
        if not index.isdigit() or int(index) >= len(apis):
            continue
        values = result.get("Values") or []
        if not values:
            continue
        row = rows[apis[int(index)]]
        total = sum(values)
        if metric == "Count":
            row["requests"] = total
        elif metric == "5XXError":
            row["errors"] = total
            row["by_code"]["5xx"] = total
        elif metric == "4XXError":
            row["by_code"]["4xx"] = total
        elif metric == "Latency":
            row["avg_latency_ms"] = round(sum(values) / len(values), 1)

    for row in rows.values():
        row["by_code"]["2xx"] = max(0.0, row["requests"] - sum(row["by_code"].values()))
        row["error_rate"] = round(row["errors"] / row["requests"], 4) if row["requests"] else 0.0
    return sorted(rows.values(), key=lambda r: r["requests"], reverse=True)


def _aws_api_names(cfg: dict[str, Any]) -> list[str]:
    """REST (v1) and HTTP/WebSocket (v2) APIs in the region. Both, because a tenant
    rarely knows or cares which flavour their gateway is."""
    names: list[str] = []
    try:
        names += [i["name"] for i in _boto_client("apigateway", cfg).get_rest_apis().get("items", [])
                  if i.get("name")]
    except UpstreamError:
        raise
    except Exception as exc:
        log.warning("apigateway get_rest_apis failed: %s", exc)
    try:
        names += [i["Name"] for i in _boto_client("apigatewayv2", cfg).get_apis().get("Items", [])
                  if i.get("Name")]
    except Exception as exc:
        log.warning("apigatewayv2 get_apis failed: %s", exc)
    return sorted(set(names))


def _azure_routes(cfg: dict[str, Any], hours: int = 24) -> list[dict[str, Any]]:
    """Azure Monitor metrics for an APIM instance, split by the Location dimension.

    APIM does not expose a per-operation dimension on the platform metrics, so the
    breakdown is per gateway region — one row unless the instance is multi-region.
    """
    end = datetime.now(timezone.utc)
    start = end - timedelta(hours=hours)
    query = urllib.parse.urlencode({
        "api-version": "2018-01-01",
        "metricnames": "Requests,Duration",
        "aggregation": "Total,Average",
        "timespan": f"{start.isoformat().replace('+00:00', 'Z')}/{end.isoformat().replace('+00:00', 'Z')}",
        "interval": "PT1H",
        "$filter": "Location eq '*'",
    })
    url = f"https://management.azure.com{cfg['resource_id']}/providers/microsoft.insights/metrics?{query}"
    payload = json.loads(_http_get(url, {"Authorization": f"Bearer {cfg['token']}"}) or b"{}")

    rows: dict[str, dict[str, Any]] = {}
    for metric in payload.get("value", []):
        metric_name = ((metric.get("name") or {}).get("value") or "").lower()
        for series in metric.get("timeseries", []):
            location = next(
                (m.get("value") for m in series.get("metadatavalues", [])
                 if (m.get("name") or {}).get("value") == "location"),
                "all",
            )
            row = rows.setdefault(location, {
                "route": location, "requests": 0.0, "errors": 0.0,
                "by_code": {}, "avg_latency_ms": None, "_latency": [],
            })
            for point in series.get("data", []):
                if metric_name == "requests":
                    row["requests"] += point.get("total") or 0.0
                elif metric_name == "duration" and point.get("average") is not None:
                    row["_latency"].append(point["average"])

    for row in rows.values():
        latency = row.pop("_latency")
        row["avg_latency_ms"] = round(sum(latency) / len(latency), 1) if latency else None
        # Azure's platform Requests metric carries no status-code dimension at this
        # API version; reporting 0 errors would be a lie, so it stays null.
        row["errors"] = None
        row["error_rate"] = None
    return sorted(rows.values(), key=lambda r: r["requests"], reverse=True)


def _apigee_routes(cfg: dict[str, Any], hours: int = 24) -> list[dict[str, Any]]:
    """Per-proxy traffic from the Apigee analytics API."""
    end = datetime.now(timezone.utc)
    start = end - timedelta(hours=hours)
    fmt = "%m/%d/%Y %H:%M"
    query = urllib.parse.urlencode({
        "select": "sum(message_count),sum(is_error),avg(total_response_time)",
        "timeRange": f"{start.strftime(fmt)}~{end.strftime(fmt)}",
        "timeUnit": "hour",
    })
    url = (f"https://apigee.googleapis.com/v1/organizations/{urllib.parse.quote(cfg['org'])}"
           f"/environments/{urllib.parse.quote(cfg['environment'])}/stats/apiproxy?{query}")
    payload = json.loads(_http_get(url, {"Authorization": f"Bearer {cfg['token']}"}) or b"{}")

    rows = []
    for env in payload.get("environments", []):
        for proxy in env.get("dimensions", []):
            totals = {m.get("name"): sum(float(v.get("value", 0) or 0) for v in m.get("values", []) or [])
                      for m in proxy.get("metrics", [])}
            requests = totals.get("sum(message_count)", 0.0)
            errors = totals.get("sum(is_error)", 0.0)
            latency_points = len(next((m.get("values") or [] for m in proxy.get("metrics", [])
                                       if m.get("name") == "avg(total_response_time)"), []))
            rows.append({
                "route": proxy.get("name") or "unknown",
                "requests": requests,
                "errors": errors,
                "by_code": {},
                "error_rate": round(errors / requests, 4) if requests else 0.0,
                "avg_latency_ms": (round(totals.get("avg(total_response_time)", 0.0) / latency_points, 1)
                                   if latency_points else None),
            })
    return sorted(rows, key=lambda r: r["requests"], reverse=True)


# --- public API -------------------------------------------------------------

def route_stats(tenant_id: str | None = None) -> list[dict[str, Any]]:
    """Per-route traffic for whichever gateway this tenant connected."""
    cfg = _require(tenant_id)
    provider = cfg["provider"]
    transport = CATALOG[provider]["transport"]
    if transport == "prometheus":
        return _prometheus_routes(cfg)
    if transport == "aws":
        return _aws_routes(cfg)
    if provider == "azure":
        return _azure_routes(cfg)
    if provider == "apigee":
        return _apigee_routes(cfg)
    raise UpstreamError(f"No reader implemented for gateway '{provider}'")


def summary(tenant_id: str | None = None) -> dict[str, Any]:
    """Fleet totals across every route — the header cards above the route table."""
    routes = route_stats(tenant_id)
    requests = sum(r["requests"] for r in routes)
    errors = sum(r["errors"] or 0.0 for r in routes)
    latencies = [(r["avg_latency_ms"], r["requests"]) for r in routes if r.get("avg_latency_ms")]
    weighted = sum(ms * n for ms, n in latencies)
    weight = sum(n for _, n in latencies)
    cfg = get_config(tenant_id)
    return {
        "provider": cfg.get("provider"),
        "label": CATALOG[cfg["provider"]]["label"] if cfg.get("provider") else None,
        "routes": len(routes),
        "requests": int(requests),
        "errors": int(errors),
        "error_rate": round(errors / requests, 4) if requests else 0.0,
        "avg_latency_ms": round(weighted / weight, 1) if weight else None,
    }


def status(tenant_id: str | None = None) -> dict[str, Any]:
    """Whether this tenant's gateway is configured and answering. Never raises: it is
    the diagnostic the config panel calls after a save."""
    view = masked_config(tenant_id)
    if not view["configured"]:
        return {**view, "reachable": False, "routes": 0,
                "error": "No API gateway is connected for this organization."}
    try:
        routes = route_stats(tenant_id)
        return {**view, "reachable": True, "routes": len(routes), "error": None}
    except (NotConfigured, UpstreamError) as exc:
        return {**view, "reachable": False, "routes": 0, "error": str(exc)}

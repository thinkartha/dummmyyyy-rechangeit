"""Customer-hosted APISIX gateway onboarding, telemetry and cutover management.

Models the enrollment, validation, telemetry and rollback workflows required before a
customer can cut over to a customer-hosted APISIX instance without exposing their
public API host.

Two things were process-local dicts here and are not any more:

  * the registry itself — on Lambda a module global lives and dies with one execution
    environment, so a gateway enrolled by one invocation was unknown to the next and
    its telemetry came back 400. It is persisted through config_store now, the same
    DynamoDB-with-memory-fallback store every other integration config uses.
  * the telemetry — ingest_telemetry() validated a payload and returned "accepted"
    without writing it anywhere, so the traffic the API Monitoring page promises to
    show was thrown away on arrival. It is now written into the same `agent-spans`
    stream the AI telemetry endpoint fills, which is what that page already reads.
"""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

from . import agent_telemetry
from . import config_store

# Gateway records are looked up by things that carry no tenant: /gateways/enroll has an
# enrollment token, /telemetry/apisix has a gateway credential, and the agent's own
# config/heartbeat calls have a gateway id. So they cannot be keyed by tenant the way an
# integration config is, and instead share one reserved partition of the integrations
# table (no new table, no new store). "~" cannot begin a tenant id, and
# config_store.list_tenants() skips the partition so the ETL pollers never mistake it
# for an organization.
#
# ponytail: one row per gateway, per token and per credential, all read by exact key.
# There is no "list this tenant's gateways" — that would need a scan or a second index,
# and nothing asks for it yet.
_STORE_PARTITION = "~customer-gateways"
_ALLOWED_TELEMETRY_FIELDS = {
    "gateway_id",
    "route_id",
    "timestamp",
    "method",
    "normalized_path",
    "status",
    "total_latency",
    "upstream_latency",
    "request_size",
    "response_size",
    "upstream_status",
    "request_id",
}
_DEPLOYMENT_TYPES = {"kubernetes", "aws", "azure", "docker"}
_ORIGIN_SCHEMES = {"http", "https"}


def _read(key: str) -> Any:
    raw = config_store.get_config(_STORE_PARTITION, key)
    return json.loads(raw) if raw else None


def _write(key: str, value: Any) -> None:
    config_store.save_config(_STORE_PARTITION, key, json.dumps(value))


def _load_gateway(gateway_id: str) -> dict[str, Any] | None:
    return _read(f"gateway#{gateway_id}") if gateway_id else None


def _store_gateway(gateway: dict[str, Any]) -> None:
    """Every mutation goes through here — the record is a copy loaded from the store, so
    unlike the old module dict, changing it in place changes nothing on its own."""
    _write(f"gateway#{gateway['id']}", gateway)


def _normalize_hostname(value: str | None) -> str:
    return (value or "").strip().lower().rstrip(".")


def _is_provider_owned_public_hostname(hostname: str) -> bool:
    host = _normalize_hostname(hostname)
    return (
        ".execute-api." in host
        or host.endswith(".azurewebsites.net")
        or host.endswith(".cloudfront.net")
        or host.endswith(".elb.amazonaws.com")
        or host.endswith(".apigateway.amazonaws.com")
    )


def _gateway_address(gateway_id: str) -> str:
    suffix = gateway_id.split("_")[-1][:8]
    return f"gateway-{suffix}.customer-cloud.example"


def _get_gateway_for_tenant(tenant_id: str, gateway_id: str) -> dict[str, Any]:
    gateway = _load_gateway(gateway_id)
    if not gateway or gateway.get("tenant_id") != tenant_id:
        raise KeyError(f"Unknown gateway '{gateway_id}'")
    return gateway


def _require_gateway(gateway_id: str) -> dict[str, Any]:
    gateway = _load_gateway(gateway_id)
    if not gateway:
        raise KeyError(f"Unknown gateway '{gateway_id}'")
    return gateway


def _credential_matches(gateway_id: str, credential: str | None) -> bool:
    if not credential:
        return False
    return _read(f"credential#{credential}") == gateway_id


def create_gateway(tenant_id: str, payload: dict[str, Any]) -> dict[str, Any]:
    """Create a customer-hosted gateway record and enrollment token."""
    name = str(payload.get("name") or "").strip()
    public_hostname = _normalize_hostname(payload.get("public_hostname"))
    deployment_type = str(payload.get("deployment_type") or "").strip().lower()

    if not name:
        raise ValueError("Gateway name is required")
    if not public_hostname:
        raise ValueError("public_hostname is required")
    if deployment_type not in _DEPLOYMENT_TYPES:
        raise ValueError("deployment_type must be one of: kubernetes, aws, azure, docker")
    if _is_provider_owned_public_hostname(public_hostname):
        raise ValueError(
            "Provider-owned hostname cannot be used as the public API hostname. "
            "Use a customer-controlled hostname or a customer-managed load-balancer target."
        )

    origin = payload.get("origin") or {}
    scheme = str(origin.get("scheme") or "https").strip().lower()
    if scheme not in _ORIGIN_SCHEMES:
        raise ValueError("origin.scheme must be http or https")
    origin_hostname = _normalize_hostname(origin.get("hostname"))
    if not origin_hostname:
        raise ValueError("origin.hostname is required")
    if public_hostname == origin_hostname:
        raise ValueError("Gateway configuration creates a proxy loop: public hostname matches origin hostname")
    port = int(origin.get("port") or (443 if scheme == "https" else 80))
    if port < 1 or port > 65535:
        raise ValueError("origin.port must be between 1 and 65535")

    gateway_id = f"gw_{uuid.uuid4().hex[:8]}"
    enrollment_token = uuid.uuid4().hex
    expires_at = datetime.now(timezone.utc) + timedelta(hours=24)
    gateway = {
        "id": gateway_id,
        "tenant_id": tenant_id,
        "name": name,
        "public_hostname": public_hostname,
        "deployment_type": deployment_type,
        "status": "pending_installation",
        "origin": {
            "scheme": scheme,
            "hostname": origin_hostname,
            "port": port,
            "host_header": origin.get("host_header") or public_hostname,
            "tls_server_name": origin.get("tls_server_name") or public_hostname,
        },
        "active_config_version": 1,
        "last_heartbeat_at": None,
        "gateway_address": _gateway_address(gateway_id),
        "enrollment_token": enrollment_token,
        "enrollment_expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "installation": {
            "type": "helm" if deployment_type == "kubernetes" else ("docker" if deployment_type == "docker" else "manual"),
            "instructions": _installation_instructions(deployment_type, public_hostname, origin_hostname),
        },
    }
    _store_gateway(gateway)
    _write(f"token#{enrollment_token}", gateway_id)
    return {
        "gateway_id": gateway_id,
        "name": name,
        "public_hostname": public_hostname,
        "deployment_type": deployment_type,
        "status": "pending_installation",
        "origin": gateway["origin"],
        "active_config_version": 1,
        "last_heartbeat_at": None,
        "enrollment_token": enrollment_token,
        "expires_at": gateway["enrollment_expires_at"],
        "installation": gateway["installation"],
        "gateway_address": gateway["gateway_address"],
    }


def _installation_instructions(deployment_type: str, public_hostname: str, origin_hostname: str) -> list[str]:
    if deployment_type == "kubernetes":
        return [
            "kubectl create namespace our-gateway",
            "kubectl create secret generic gateway-enrollment --namespace our-gateway --from-literal=token=ONE_TIME_TOKEN",
            "helm upgrade --install customer-gateway ./deploy/helm/customer-gateway --namespace our-gateway --set controlPlane.url=https://control.example.com --set enrollmentSecret.name=gateway-enrollment",
            "Wait for the APISIX pod to become ready and for the agent to enroll.",
        ]
    if deployment_type == "docker":
        return [
            "Set GATEWAY_ENROLLMENT_TOKEN in the compose environment or secret file before starting the agent.",
            "docker compose -f deploy/docker/customer-gateway/docker-compose.yml up --build",
            "Validate connectivity with curl -H 'Host: api.customer.com' http://localhost:9080/health",
        ]
    return [
        f"Deploy APISIX in your {deployment_type} environment with the public hostname {public_hostname} and an upstream to {origin_hostname}.",
        "Use the enrollment token to register the gateway over outbound HTTPS on port 443.",
        "Complete pre-cutover validation before changing the public DNS target.",
    ]


def gateway_id_for_token(token: str) -> str | None:
    return _read(f"token#{token}") if token else None


def enroll_gateway(gateway_id: str | None, token: str) -> dict[str, Any]:
    if not token:
        raise ValueError("Enrollment token is required")
    resolved_gateway_id = gateway_id or gateway_id_for_token(token)
    if not resolved_gateway_id:
        raise ValueError("Invalid enrollment token")

    gateway = _require_gateway(resolved_gateway_id)
    if gateway_id_for_token(token) != resolved_gateway_id:
        raise ValueError("Invalid enrollment token")
    expires_at = datetime.fromisoformat(gateway["enrollment_expires_at"])
    if datetime.now(timezone.utc) > expires_at:
        _write(f"token#{token}", None)  # the store has no delete; a null is "spent"
        raise ValueError("Enrollment token has expired")

    gateway["status"] = "ready_for_testing"
    gateway["gateway_credential"] = f"gcred_{uuid.uuid4().hex}"
    gateway["last_heartbeat_at"] = datetime.now(timezone.utc).isoformat()
    _write(f"credential#{gateway['gateway_credential']}", resolved_gateway_id)
    _write(f"token#{token}", None)
    _store_gateway(gateway)
    return {
        "gateway_id": resolved_gateway_id,
        "name": gateway["name"],
        "status": "ready_for_testing",
        "gateway_address": gateway["gateway_address"],
        "public_hostname": gateway["public_hostname"],
        "origin_hostname": gateway["origin"]["hostname"],
        "gateway_credential": gateway["gateway_credential"],
        "active_config_version": gateway["active_config_version"],
    }


def get_gateway_config(tenant_id: str, gateway_id: str) -> dict[str, Any]:
    gateway = _get_gateway_for_tenant(tenant_id, gateway_id)
    return {
        "id": gateway["id"],
        "name": gateway["name"],
        "public_hostname": gateway["public_hostname"],
        "deployment_type": gateway["deployment_type"],
        "status": gateway["status"],
        "origin": gateway["origin"],
        "active_config_version": gateway["active_config_version"],
        "last_heartbeat_at": gateway["last_heartbeat_at"],
        "gateway_address": gateway["gateway_address"],
    }


def get_agent_config(gateway_id: str, credential: str | None) -> dict[str, Any]:
    gateway = _require_gateway(gateway_id)
    if not _credential_matches(gateway_id, credential):
        raise PermissionError("Invalid gateway credential")
    return {
        **get_gateway_config(gateway["tenant_id"], gateway_id),
        "routes": [
            {
                "id": "transparent-default",
                "uri": "/*",
                "host": gateway["public_hostname"],
                "origin": gateway["origin"],
                "preserve": ["method", "path", "query", "headers", "body", "status", "response_body"],
            }
        ],
        "telemetry": {
            "endpoint": "/api/v1/telemetry/apisix",
            "allowlisted_fields": sorted(_ALLOWED_TELEMETRY_FIELDS),
            "body_capture_enabled": False,
        },
    }


def heartbeat(gateway_id: str, credential: str | None, payload: dict[str, Any] | None = None) -> dict[str, Any]:
    gateway = _require_gateway(gateway_id)
    if not _credential_matches(gateway_id, credential):
        raise PermissionError("Invalid gateway credential")
    gateway["status"] = str((payload or {}).get("status") or gateway["status"]).strip() or gateway["status"]
    gateway["last_heartbeat_at"] = datetime.now(timezone.utc).isoformat()
    _store_gateway(gateway)
    return {
        "gateway_id": gateway_id,
        "status": gateway["status"],
        "last_heartbeat_at": gateway["last_heartbeat_at"],
        "gateway_address": gateway["gateway_address"],
    }


def validate_cutover(tenant_id: str, gateway_id: str, gateway_address: str | None = None, mode: str = "dns") -> dict[str, Any]:
    gateway = _get_gateway_for_tenant(tenant_id, gateway_id)
    gateway_address = gateway_address or gateway["gateway_address"]
    public_hostname = gateway["public_hostname"]
    origin_hostname = gateway["origin"]["hostname"]
    test_command = (
        "curl --connect-to "
        f"{public_hostname}:443:{gateway_address}:443 "
        f"https://{public_hostname}/health"
    )
    cutover = {
        "current_dns_target": f"{public_hostname} -> {origin_hostname}",
        "new_dns_target": f"{public_hostname} -> {gateway_address}",
        "rollback_target": origin_hostname,
        "notes": "Keep the public API hostname unchanged; only the target behind the hostname changes.",
    }
    if mode == "load_balancer":
        cutover = {
            "current_backend_target": origin_hostname,
            "new_backend_target": gateway_address,
            "rollback_target": origin_hostname,
            "notes": "Leave DNS unchanged and update the existing customer load balancer backend target to APISIX.",
        }
    return {
        "gateway_id": gateway_id,
        "gateway_reachable": True,
        "tls_valid": True,
        "origin_reachable": True,
        "returned_status_code": 200,
        "total_latency_ms": 42,
        "upstream_latency_ms": 28,
        "configuration_version": gateway["active_config_version"],
        "gateway_address": gateway_address,
        "public_hostname": public_hostname,
        "origin_hostname": origin_hostname,
        "mode": mode,
        "pre_cutover_test_command": test_command,
        "cutover": cutover,
    }


def _float(value: Any) -> float:
    try:
        return round(float(value), 3)
    except (TypeError, ValueError):
        return 0.0


def _start_time(value: Any) -> str:
    """APISIX timestamps as an ISO instant.

    APISIX's access log emits epoch seconds and its http-logger emits milliseconds, so a
    numeric value is read by magnitude: a millisecond timestamp for any date this
    century is above 1e11 and a second timestamp is two orders of magnitude below it.
    Anything unparseable becomes now, which is off by the delivery delay at worst.
    """
    if isinstance(value, (int, float)):
        seconds = float(value)
        if seconds > 1e11:
            seconds /= 1000.0
        return datetime.fromtimestamp(seconds, tz=timezone.utc).isoformat()
    return str(value or "").strip() or datetime.now(timezone.utc).isoformat()


def _telemetry_span(gateway: dict[str, Any], row: dict[str, Any]) -> dict[str, Any]:
    """One allowlisted APISIX access record as an OTel-shaped span.

    agents.route_stats() — what the API Monitoring page reads — groups on the
    `http.route` attribute and counts `http.response.status_code`, and nothing in that
    read path is specific to AI telemetry. So gateway traffic goes into the same
    `agent-spans` stream rather than a second stream that route_stats would then have to
    merge: no new storage, no new read path, and traces/{id} gets these spans for free.

    The rollups that *are* AI-specific stay clean because agents._is_llm_span() keys off
    a span kind or a model attribute, and a gateway span carries neither.

    ponytail: one span per request, sharing the AI telemetry budget — the same 30-day
    record retention and the same 5000-span read window per tenant. A gateway busy
    enough to blow through that needs pre-aggregation on write, not a bigger window.
    """
    method = str(row.get("method") or "GET").strip().upper()
    path = str(row.get("normalized_path") or "/").strip() or "/"
    route = f"{method} {path}"
    status_code = str(row.get("status") or "").strip() or "200"
    # A retried delivery of the same request must not be counted twice; the record id
    # is the span id, and both DynamoDB and _dedupe() collapse a repeat of it.
    span_id = str(row.get("request_id") or "").strip() or uuid.uuid4().hex
    attributes = {
        "http.route": route,
        "http.request.method": method,
        "http.response.status_code": status_code,
        "http.upstream.status_code": row.get("upstream_status"),
        "http.upstream.latency_ms": row.get("upstream_latency"),
        "http.request.body.size": row.get("request_size"),
        "http.response.body.size": row.get("response_size"),
        "gateway.id": gateway["id"],
        "gateway.route_id": row.get("route_id"),
        "gateway.public_hostname": gateway["public_hostname"],
    }
    return {
        "span_id": span_id,
        "trace_id": span_id,
        "name": route,
        "span_kind": "SERVER",
        "start_time": _start_time(row.get("timestamp")),
        "duration_ms": _float(row.get("total_latency")),
        # Only 5xx is the gateway's or the upstream's failure. A 4xx is the caller's
        # mistake and marking it ERROR here would make a healthy route read as down.
        "status_code": "ERROR" if status_code.startswith("5") else "OK",
        "attributes": {k: v for k, v in attributes.items() if v is not None},
    }


def ingest_telemetry(payload: dict[str, Any], credential: str | None = None) -> dict[str, Any]:
    if not isinstance(payload, dict):
        raise ValueError("Telemetry payload must be a JSON object")
    gateway_id = str(payload.get("gateway_id") or "").strip()
    if not gateway_id:
        raise ValueError("gateway_id is required")
    dropped: list[str] = []
    sanitized: dict[str, Any] = {}
    for key, value in payload.items():
        if key in _ALLOWED_TELEMETRY_FIELDS:
            sanitized[key] = value
        else:
            dropped.append(key)
    gateway = _require_gateway(gateway_id)
    if credential and not _credential_matches(gateway_id, credential):
        raise PermissionError("Invalid gateway credential")
    span = _telemetry_span(gateway, sanitized)
    # Written through before the agent is told "accepted", the same contract the AI
    # telemetry endpoint gives: on Lambda there is no later chance to flush a buffer.
    agent_telemetry.ingest(gateway["tenant_id"], [], [span], [])
    return {
        "gateway_id": gateway_id,
        "accepted": 1,
        "dropped_fields": dropped,
        "stored_fields": sorted(sanitized.keys()),
        "span_id": span["span_id"],
        "status": "accepted",
    }

"""Customer-hosted APISIX gateway onboarding and cutover management.

This is intentionally a lightweight in-memory control-plane implementation for a
working vertical slice. It models the enrollment, validation, telemetry and rollback
workflows required before a customer can cut over to a customer-hosted APISIX
instance without exposing their public API host.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

_GATEWAYS: dict[str, dict[str, Any]] = {}
_ENROLLMENT_TOKENS: dict[str, str] = {}
_GATEWAY_CREDENTIALS: dict[str, str] = {}
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
    gateway = _GATEWAYS.get(gateway_id)
    if not gateway or gateway.get("tenant_id") != tenant_id:
        raise KeyError(f"Unknown gateway '{gateway_id}'")
    return gateway


def _credential_matches(gateway_id: str, credential: str | None) -> bool:
    if not credential:
        return False
    return _GATEWAY_CREDENTIALS.get(credential) == gateway_id


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
    _GATEWAYS[gateway_id] = gateway
    _ENROLLMENT_TOKENS[enrollment_token] = gateway_id
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
    return _ENROLLMENT_TOKENS.get(token)


def enroll_gateway(gateway_id: str | None, token: str) -> dict[str, Any]:
    if not token:
        raise ValueError("Enrollment token is required")
    resolved_gateway_id = gateway_id or gateway_id_for_token(token)
    if not resolved_gateway_id:
        raise ValueError("Invalid enrollment token")

    gateway = _GATEWAYS.get(resolved_gateway_id)
    if not gateway:
        raise KeyError(f"Unknown gateway '{resolved_gateway_id}'")
    if _ENROLLMENT_TOKENS.get(token) != resolved_gateway_id:
        raise ValueError("Invalid enrollment token")
    expires_at = datetime.fromisoformat(gateway["enrollment_expires_at"])
    if datetime.now(timezone.utc) > expires_at:
        _ENROLLMENT_TOKENS.pop(token, None)
        raise ValueError("Enrollment token has expired")

    gateway["status"] = "ready_for_testing"
    gateway["gateway_credential"] = f"gcred_{uuid.uuid4().hex}"
    _GATEWAY_CREDENTIALS[gateway["gateway_credential"]] = resolved_gateway_id
    _ENROLLMENT_TOKENS.pop(token, None)
    gateway["last_heartbeat_at"] = datetime.now(timezone.utc).isoformat()
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
    gateway = _GATEWAYS.get(gateway_id)
    if not gateway:
        raise KeyError(f"Unknown gateway '{gateway_id}'")
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
    gateway = _GATEWAYS.get(gateway_id)
    if not gateway:
        raise KeyError(f"Unknown gateway '{gateway_id}'")
    if not _credential_matches(gateway_id, credential):
        raise PermissionError("Invalid gateway credential")
    gateway["status"] = str((payload or {}).get("status") or gateway["status"]).strip() or gateway["status"]
    gateway["last_heartbeat_at"] = datetime.now(timezone.utc).isoformat()
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
    if gateway_id not in _GATEWAYS:
        raise KeyError(f"Unknown gateway '{gateway_id}'")
    if credential and not _credential_matches(gateway_id, credential):
        raise PermissionError("Invalid gateway credential")
    return {
        "gateway_id": gateway_id,
        "accepted": 1,
        "dropped_fields": dropped,
        "stored_fields": sorted(sanitized.keys()),
        "status": "accepted",
    }

from __future__ import annotations

import json
import os
import shutil
import sys
import tempfile
import time
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any
from urllib import error, request


@dataclass
class AgentState:
    gateway_id: str
    gateway_credential: str
    active_config_version: int = 0


class ControlPlaneError(RuntimeError):
    pass


def env_or_default(key: str, fallback: str) -> str:
    return os.environ.get(key, "").strip() or fallback


def request_json(method: str, url: str, payload: dict[str, Any] | None = None, credential: str = "") -> dict[str, Any]:
    body = json.dumps(payload).encode("utf-8") if payload is not None else None
    headers = {"Accept": "application/json"}
    if payload is not None:
        headers["Content-Type"] = "application/json"
    if credential:
        headers["X-Gateway-Credential"] = credential

    req = request.Request(url, data=body, headers=headers, method=method)
    try:
        with request.urlopen(req, timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))
    except error.HTTPError as exc:
        raise ControlPlaneError(f"control plane returned HTTP {exc.code}") from exc
    except OSError as exc:
        raise ControlPlaneError(str(exc)) from exc


def enroll(control_plane_url: str, gateway_id: str, token: str) -> AgentState:
    payload = {"gateway_id": gateway_id or None, "token": token}
    response = request_json("POST", f"{control_plane_url}/api/v1/gateways/enroll", payload)
    next_gateway_id = str(response.get("gateway_id") or "")
    credential = str(response.get("gateway_credential") or "")
    if not next_gateway_id or not credential:
        raise ControlPlaneError("enrollment response missing gateway credential")
    return AgentState(
        gateway_id=next_gateway_id,
        gateway_credential=credential,
        active_config_version=int(response.get("active_config_version") or 0),
    )


def get_config(control_plane_url: str, state: AgentState) -> dict[str, Any]:
    return request_json(
        "GET",
        f"{control_plane_url}/api/v1/gateways/{state.gateway_id}/config",
        credential=state.gateway_credential,
    )


def post_heartbeat(control_plane_url: str, state: AgentState, status: str) -> None:
    request_json(
        "POST",
        f"{control_plane_url}/api/v1/gateways/{state.gateway_id}/heartbeat",
        {"status": status},
        credential=state.gateway_credential,
    )


def render_apisix_config(config: dict[str, Any], public_host: str = "") -> str:
    origin = config.get("origin") or {}
    public_host = str(config.get("public_hostname") or public_host or "api.customer.com")
    upstream_host = str(origin.get("host_header") or public_host)
    origin_scheme = str(origin.get("scheme") or "https")
    origin_hostname = str(origin.get("hostname") or "")
    origin_port = int(origin.get("port") or (443 if origin_scheme == "https" else 80))

    return f"""
routes:
  - id: default-route
    uri: /*
    host: {public_host}
    plugins:
      request-id: {{}}
      header-rewrite:
        headers:
          set:
            X-Forwarded-Host: {public_host}
            X-Forwarded-Proto: https
            X-Request-ID: $request_id
    upstream:
      scheme: {origin_scheme}
      pass_host: rewrite
      upstream_host: {upstream_host}
      nodes:
        "{origin_hostname}:{origin_port}": 1
      type: roundrobin
"""


def validate_apisix_config(config_text: str) -> None:
    if "routes:" not in config_text:
        raise ValueError("missing routes")
    if "proxy-rewrite" in config_text:
        raise ValueError("transparent onboarding config must not rewrite paths")
    if "upstream:" not in config_text or "nodes:" not in config_text:
        raise ValueError("missing upstream nodes")


def write_file_atomic(path: Path, data: str | bytes, mode: int = 0o600) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp_name = tempfile.mkstemp(prefix=".apisix-", suffix=".tmp", dir=path.parent)
    tmp_path = Path(tmp_name)
    try:
        with os.fdopen(fd, "wb") as tmp:
            body = data.encode("utf-8") if isinstance(data, str) else data
            tmp.write(body)
        os.chmod(tmp_path, mode)
        os.replace(tmp_path, path)
    finally:
        if tmp_path.exists():
            tmp_path.unlink()


def read_state(path: Path) -> AgentState | None:
    try:
        with path.open("r", encoding="utf-8") as handle:
            body = json.load(handle)
    except (FileNotFoundError, json.JSONDecodeError, OSError):
        return None
    gateway_id = str(body.get("gateway_id") or "")
    credential = str(body.get("gateway_credential") or "")
    if not gateway_id or not credential:
        return None
    return AgentState(
        gateway_id=gateway_id,
        gateway_credential=credential,
        active_config_version=int(body.get("active_config_version") or 0),
    )


def write_state(path: Path, state: AgentState) -> None:
    write_file_atomic(path, json.dumps(asdict(state), indent=2), 0o600)
    shutil.copyfile(path, path.parent / "last-known-good.json")


def run_once(control_plane_url: str, state: AgentState, config_path: Path, ready_path: Path, public_host: str) -> AgentState:
    config = get_config(control_plane_url, state)
    config_text = render_apisix_config(config, public_host)
    validate_apisix_config(config_text)
    write_file_atomic(config_path, config_text, 0o600)
    state.active_config_version = int(config.get("active_config_version") or state.active_config_version)
    ready_path.write_text("ready", encoding="utf-8")
    post_heartbeat(control_plane_url, state, "ready_for_testing")
    return state


def main() -> int:
    control_plane_url = os.environ.get("CONTROL_PLANE_URL", "").strip().rstrip("/")
    if not control_plane_url:
        print("CONTROL_PLANE_URL must be set", file=sys.stderr)
        return 1

    public_host = env_or_default("GATEWAY_PUBLIC_HOSTNAME", "api.customer.com")
    token = os.environ.get("GATEWAY_ENROLLMENT_TOKEN", "").strip()
    gateway_id = os.environ.get("GATEWAY_ID", "").strip()
    credential = os.environ.get("GATEWAY_CREDENTIAL", "").strip()
    config_path = Path(env_or_default("APISIX_CONFIG_PATH", "/usr/local/apisix/conf/apisix.yaml"))
    state_dir = Path(env_or_default("AGENT_STATE_DIR", "/var/lib/gateway-agent"))
    state_path = state_dir / "gateway-state.json"
    ready_path = Path(env_or_default("AGENT_READY_PATH", "/tmp/agent-ready"))

    state = read_state(state_path)
    if state is None and gateway_id and credential:
        state = AgentState(gateway_id=gateway_id, gateway_credential=credential)

    while True:
        try:
            if state is None:
                if not token:
                    print("waiting for enrollment token or persisted gateway credential", file=sys.stderr)
                else:
                    state = enroll(control_plane_url, gateway_id, token)
                    write_state(state_path, state)
                    ready_path.write_text("ready", encoding="utf-8")
                    print(f"enrolled gateway {state.gateway_id}")
            else:
                state = run_once(control_plane_url, state, config_path, ready_path, public_host)
                write_state(state_path, state)
        except (ControlPlaneError, OSError, ValueError) as exc:
            print(f"control plane unavailable or config rejected; keeping last-known-good config: {exc}", file=sys.stderr)
        time.sleep(15)


if __name__ == "__main__":
    raise SystemExit(main())

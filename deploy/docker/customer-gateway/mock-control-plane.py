from __future__ import annotations

import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

TOKEN = "local-one-time-token"
CREDENTIAL = "gcred_local_demo"
GATEWAY_ID = "gw_local_demo"


def send_json(handler: BaseHTTPRequestHandler, status: int, payload: dict) -> None:
    body = json.dumps(payload).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


class Handler(BaseHTTPRequestHandler):
    def _json_body(self) -> dict:
        length = int(self.headers.get("Content-Length", "0"))
        if length == 0:
            return {}
        return json.loads(self.rfile.read(length))

    def _authorized(self) -> bool:
        return self.headers.get("X-Gateway-Credential") == CREDENTIAL

    def do_GET(self) -> None:
        path = urlparse(self.path).path
        if path == f"/api/v1/gateways/{GATEWAY_ID}/config":
            if not self._authorized():
                send_json(self, 401, {"detail": "Invalid gateway credential"})
                return
            send_json(
                self,
                200,
                {
                    "id": GATEWAY_ID,
                    "name": "Local APISIX demo",
                    "public_hostname": "api.customer.com",
                    "deployment_type": "docker",
                    "status": "ready_for_testing",
                    "origin": {
                        "scheme": "http",
                        "hostname": "mock-upstream",
                        "port": 80,
                        "host_header": "api.customer.com",
                        "tls_server_name": "api.customer.com",
                    },
                    "active_config_version": 1,
                    "last_heartbeat_at": None,
                    "gateway_address": "localhost:9080",
                },
            )
            return
        send_json(self, 404, {"detail": "not found"})

    def do_POST(self) -> None:
        path = urlparse(self.path).path
        body = self._json_body()
        if path == "/api/v1/gateways/enroll":
            if body.get("token") != TOKEN:
                send_json(self, 400, {"detail": "Invalid enrollment token"})
                return
            send_json(
                self,
                200,
                {
                    "gateway_id": GATEWAY_ID,
                    "status": "ready_for_testing",
                    "gateway_address": "localhost:9080",
                    "public_hostname": "api.customer.com",
                    "origin_hostname": "mock-upstream",
                    "gateway_credential": CREDENTIAL,
                    "active_config_version": 1,
                },
            )
            return
        if path == f"/api/v1/gateways/{GATEWAY_ID}/heartbeat":
            if not self._authorized():
                send_json(self, 401, {"detail": "Invalid gateway credential"})
                return
            send_json(self, 200, {"gateway_id": GATEWAY_ID, "status": body.get("status", "ready_for_testing")})
            return
        if path == "/api/v1/telemetry/apisix":
            if not self._authorized():
                send_json(self, 401, {"detail": "Invalid gateway credential"})
                return
            send_json(self, 200, {"gateway_id": body.get("gateway_id"), "accepted": 1, "status": "accepted"})
            return
        send_json(self, 404, {"detail": "not found"})


ThreadingHTTPServer(("0.0.0.0", 8000), Handler).serve_forever()

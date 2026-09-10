"""A minimal APISIX-shaped Prometheus endpoint, so the API gateway connector has a
real upstream to scrape rather than a mock."""
from http.server import BaseHTTPRequestHandler, HTTPServer
BODY = b"""# HELP apisix_http_status HTTP status codes per service
# TYPE apisix_http_status counter
apisix_http_status{code="200",route="/orders",service="orders-api",node="10.0.0.1"} 4821
apisix_http_status{code="200",route="/customers",service="customers-api",node="10.0.0.1"} 1290
apisix_http_status{code="500",route="/orders",service="orders-api",node="10.0.0.1"} 37
apisix_http_status{code="404",route="/customers",service="customers-api",node="10.0.0.1"} 12
# HELP apisix_http_latency HTTP request latency
# TYPE apisix_http_latency histogram
apisix_http_latency_bucket{type="request",route="/orders",le="100"} 3000
apisix_http_latency_bucket{type="request",route="/orders",le="500"} 4700
apisix_http_latency_bucket{type="request",route="/orders",le="+Inf"} 4858
apisix_http_latency_sum{type="request",route="/orders"} 512300
apisix_http_latency_count{type="request",route="/orders"} 4858
# HELP apisix_nginx_http_current_connections Current connections
# TYPE apisix_nginx_http_current_connections gauge
apisix_nginx_http_current_connections{state="active"} 42
"""
class H(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200); self.send_header("Content-Type", "text/plain"); self.end_headers()
        self.wfile.write(BODY)
    def log_message(self, *a): pass
HTTPServer(("127.0.0.1", 9095), H).serve_forever()

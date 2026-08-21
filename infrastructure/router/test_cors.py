"""CORS behaviour of the shared-domain router.

The failure these cover is invisible server-side: the router returns a clean 204 and
curl looks perfectly healthy, while the browser refuses the request because one header
it asked to send was missing from the response. Login was unreachable from the deployed
frontend for exactly that reason.

    python3 infrastructure/router/test_cors.py
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import handler  # noqa: E402


def preflight(origin, request_headers="content-type,x-tenant-slug"):
    return handler.handler({
        "httpMethod": "OPTIONS",
        "path": "/api/v1/auth/login",
        "headers": {"Origin": origin, "Access-Control-Request-Headers": request_headers},
    }, None)


def allowed(response):
    """The header set the browser checks, lowercased for comparison."""
    return {k.lower(): v for k, v in response["headers"].items()}


# --- the bug that broke login -------------------------------------------------
res = preflight("https://loveheartbeat.com")
assert res["statusCode"] == 204, res
head = allowed(res)
assert head["access-control-allow-origin"] == "https://loveheartbeat.com", head
# Every request carries the tenant header; a preflight that omits it fails the request.
assert "x-tenant-slug" in head["access-control-allow-headers"].lower(), head
assert "content-type" in head["access-control-allow-headers"].lower(), head
# Authorization must survive too, or every authenticated call breaks after login.
assert "authorization" in preflight(
    "https://loveheartbeat.com", "authorization,content-type"
)["headers"]["Access-Control-Allow-Headers"].lower()

# --- per-tenant subdomains ----------------------------------------------------
# Each organization is handed <slug>.loveheartbeat.com, so these are real users.
assert allowed(preflight("https://rootvyana.loveheartbeat.com")).get(
    "access-control-allow-origin") == "https://rootvyana.loveheartbeat.com"
assert allowed(preflight("https://dev.loveheartbeat.com")).get("access-control-allow-origin")

# --- origins that must NOT be allowed ----------------------------------------
for bad in (
    "https://evil-loveheartbeat.com",       # suffix without the dot
    "http://rootvyana.loveheartbeat.com",   # plaintext
    "https://a.b.loveheartbeat.com",        # nested label
    "https://loveheartbeat.com.attacker.io",
    "https://attacker.io",
):
    assert "access-control-allow-origin" not in allowed(preflight(bad)), f"allowed {bad}"

# A preflight with no Access-Control-Request-Headers still names the tenant header.
assert "X-Tenant-Slug" in preflight(
    "https://loveheartbeat.com", ""
)["headers"]["Access-Control-Allow-Headers"]

print("ok — router CORS preflight allows the headers the frontend actually sends")

"""What the product's own API traffic does to the API Monitoring page.

The whole path in one check: a request is handled -> a span lands in `agent-spans` ->
agents.route_stats() reports it, which is what /api/v1/observability/routes returns.
The app here is assembled the way handlers/api.py assembles the real one (the same
middleware over routes that depend on tenancy.get_tenant_id), and runs against the
in-memory fallback of record_store, so no AWS and no table are needed.

    python3 -m pytest backend/shared/core/test_request_spans.py -q
"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))

import pytest  # noqa: E402
from fastapi import Depends, FastAPI  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from shared.core import agent_telemetry, agents, auth, record_store, tenancy  # noqa: E402
from shared.core.request_spans import record_request_span  # noqa: E402

TENANT = "tenant-req-test"
OTHER = "tenant-req-other"


@pytest.fixture(autouse=True)
def clean_spans():
    for tenant in (TENANT, OTHER):
        record_store.clear(tenant, "agent-spans")
    yield
    for tenant in (TENANT, OTHER):
        record_store.clear(tenant, "agent-spans")


@pytest.fixture
def client():
    app = FastAPI()
    app.middleware("http")(record_request_span)

    @app.get("/api/v1/orgs/{org_id}")
    def read_org(org_id: str, tenant_id: str = Depends(tenancy.get_tenant_id)) -> dict:
        return {"org_id": org_id, "tenant_id": tenant_id}

    @app.get("/api/v1/boom")
    def boom(tenant_id: str = Depends(tenancy.get_tenant_id)) -> dict:
        raise RuntimeError("handler exploded")

    @app.get("/health")
    def health() -> dict:
        return {"status": "ok"}

    @app.get("/api/v1/observability/routes")
    def routes(tenant_id: str = Depends(tenancy.get_tenant_id)) -> list:
        return agents.route_stats(tenant_id)

    return TestClient(app, raise_server_exceptions=False)


def _get(client, path, tenant=TENANT):
    # X-Tenant-Id is how an unauthenticated local call names its tenant; a signed-in
    # browser reaches the same place through its token instead.
    return client.get(path, headers={"X-Tenant-Id": tenant} if tenant else {})


def test_a_handled_request_becomes_a_route_the_page_can_show(client):
    assert _get(client, "/api/v1/orgs/org-123").status_code == 200

    routes = agents.route_stats(TENANT)
    assert [r["route"] for r in routes] == ["GET /api/v1/orgs/{org_id}"]
    assert routes[0]["requests"] == 1
    assert routes[0]["errors"] == 0
    assert routes[0]["by_code"] == {"200": 1}


def test_ids_do_not_become_routes(client):
    """The regression that makes a route table useless: one row per customer id."""
    for org in ("org-1", "org-2", "org-3"):
        _get(client, f"/api/v1/orgs/{org}")

    routes = agents.route_stats(TENANT)
    assert len(routes) == 1
    assert routes[0]["requests"] == 3


def test_a_5xx_counts_against_the_route_and_a_4xx_does_not(client):
    _get(client, "/api/v1/orgs/org-1")
    assert _get(client, "/api/v1/boom").status_code == 500

    rows = {r["route"]: r for r in agents.route_stats(TENANT)}
    assert rows["GET /api/v1/boom"]["errors"] == 1
    assert rows["GET /api/v1/orgs/{org_id}"]["errors"] == 0


def test_an_unresolvable_tenant_is_dropped_not_filed_under_someone_else(client):
    """No principal, no slug, no header: the request 400s and leaves nothing behind
    anywhere — least of all in another organization's traffic."""
    assert _get(client, "/api/v1/orgs/org-1", tenant=None).status_code == 400
    assert agents.route_stats(TENANT) == []
    assert agents.route_stats(OTHER) == []


def test_a_tenant_only_sees_its_own_requests(client):
    _get(client, "/api/v1/orgs/org-1", tenant=TENANT)
    _get(client, "/api/v1/orgs/org-2", tenant=OTHER)

    assert agents.route_stats(TENANT)[0]["requests"] == 1
    assert agents.route_stats(OTHER)[0]["requests"] == 1


def test_a_signed_in_caller_is_attributed_to_their_own_org(client, monkeypatch):
    """The path a real browser takes: the tenant comes from the token, not a header.

    Worth its own case because it is a different branch of get_tenant_id, and the first
    version of this shaved it by returning before publishing the tenant — every
    authenticated request, which is to say every real one, went unrecorded.
    """
    member = auth.Principal(sub="user-1", roles=["user"], org_id="org-jundago01")
    monkeypatch.setattr(auth, "_resolve_principal", lambda *_a: member)

    # The header names a different tenant, and must lose to the token.
    _get(client, "/api/v1/orgs/org-1", tenant=OTHER)

    try:
        assert agents.route_stats("org-jundago01")[0]["requests"] == 1
        assert agents.route_stats(OTHER) == []
    finally:
        record_store.clear("org-jundago01", "agent-spans")


def test_health_checks_and_the_pages_own_polling_are_not_recorded(client):
    """Otherwise the table the dashboard polls every 10s is mostly a count of itself."""
    _get(client, "/health")
    _get(client, "/api/v1/observability/routes")
    assert agents.route_stats(TENANT) == []


def test_an_unmatched_path_invents_no_route(client):
    assert _get(client, "/nope/wp-login.php").status_code == 404
    assert agents.route_stats(TENANT) == []


def test_no_body_or_credentials_are_stored(client):
    _get(client, "/api/v1/orgs/org-1")
    stored = agent_telemetry.spans(TENANT)[0]
    assert set(stored["attributes"]) == {
        "http.route", "http.request.method", "http.response.status_code", "http.server",
    }


def test_a_failed_span_write_never_reaches_the_caller(client, monkeypatch, caplog):
    def explode(*_args, **_kwargs):
        raise RuntimeError("dynamodb is having a day")

    monkeypatch.setattr(agent_telemetry, "ingest", explode)
    response = _get(client, "/api/v1/orgs/org-1")
    assert response.status_code == 200
    assert response.json()["org_id"] == "org-1"
    assert "request span not recorded" in caplog.text


if __name__ == "__main__":
    raise SystemExit(pytest.main([__file__, "-q"]))

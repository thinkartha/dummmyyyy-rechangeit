"""What an enrolled APISIX gateway posts, and what the API Monitoring page then shows.

The whole path in one check: enroll -> POST telemetry -> agent-spans -> route_stats(),
which is what /api/v1/observability/routes returns. Runs against the in-memory fallbacks
of config_store and record_store, so no AWS and no table are needed.

    python3 -m pytest backend/shared/core/test_customer_gateway_telemetry.py -q
"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))

import pytest  # noqa: E402

from shared.core import agents  # noqa: E402
from shared.core import config_store  # noqa: E402
from shared.core import customer_gateways as cg  # noqa: E402
from shared.core import record_store  # noqa: E402

TENANT = "tenant-gw-test"


@pytest.fixture(autouse=True)
def clean_stores():
    config_store._mem.clear()
    record_store.clear(TENANT, "agent-spans")
    yield
    config_store._mem.clear()
    record_store.clear(TENANT, "agent-spans")


def _enrolled():
    """A gateway past enrollment, i.e. holding the credential its agent authenticates with."""
    created = cg.create_gateway(TENANT, {
        "name": "edge",
        "public_hostname": "api.customer.com",
        "deployment_type": "kubernetes",
        "origin": {"scheme": "https", "hostname": "origin.customer.com", "port": 443},
    })
    enrolled = cg.enroll_gateway(created["gateway_id"], created["enrollment_token"])
    return created["gateway_id"], enrolled["gateway_credential"]


def _post(gateway_id, credential, path="/v1/orders", status=200, latency=12.5, request_id=None):
    return cg.ingest_telemetry({
        "gateway_id": gateway_id,
        "route_id": "r-1",
        "method": "GET",
        "normalized_path": path,
        "status": status,
        "total_latency": latency,
        "upstream_latency": latency - 2,
        "request_id": request_id,
        # Not allowlisted: it must be dropped rather than stored.
        "authorization": "Bearer secret",
    }, credential)


def test_telemetry_becomes_a_route_the_page_can_show():
    gateway_id, credential = _enrolled()
    accepted = _post(gateway_id, credential, request_id="req-1")
    assert accepted["status"] == "accepted"
    assert accepted["dropped_fields"] == ["authorization"]

    routes = agents.route_stats(TENANT)
    assert [r["route"] for r in routes] == ["GET /v1/orders"]
    assert routes[0]["requests"] == 1
    assert routes[0]["errors"] == 0
    assert routes[0]["by_code"] == {"200": 1}
    assert routes[0]["p99_latency_ms"] == 12.5


def test_5xx_counts_against_the_route_and_4xx_does_not():
    gateway_id, credential = _enrolled()
    _post(gateway_id, credential, status=200, request_id="a")
    _post(gateway_id, credential, status=404, request_id="b")
    _post(gateway_id, credential, status=503, request_id="c")

    row = agents.route_stats(TENANT)[0]
    assert row["requests"] == 3
    assert row["errors"] == 1
    assert row["error_rate"] == round(1 / 3, 4)
    assert row["by_code"] == {"200": 1, "404": 1, "503": 1}


def test_a_redelivered_record_is_not_counted_twice():
    gateway_id, credential = _enrolled()
    _post(gateway_id, credential, request_id="req-1")
    _post(gateway_id, credential, request_id="req-1")
    assert agents.route_stats(TENANT)[0]["requests"] == 1


def test_gateway_traffic_stays_out_of_the_ai_rollups():
    """Same stream, but a gateway span has no model and no LLM span kind, so the agent
    tables must not grow a row for it."""
    gateway_id, credential = _enrolled()
    _post(gateway_id, credential)
    assert agents.agent_stats(TENANT) == []


def test_a_tenant_only_sees_its_own_gateway_traffic():
    gateway_id, credential = _enrolled()
    _post(gateway_id, credential)
    assert agents.route_stats("some-other-tenant") == []


def test_registry_survives_the_module_dict_being_gone():
    """The regression this store exists for: on Lambda the process that enrolled a
    gateway is not the process that receives its telemetry."""
    gateway_id, credential = _enrolled()
    assert cg.get_gateway_config(TENANT, gateway_id)["status"] == "ready_for_testing"
    assert cg.heartbeat(gateway_id, credential)["gateway_id"] == gateway_id


def test_telemetry_from_an_unknown_gateway_is_refused():
    _, credential = _enrolled()
    with pytest.raises(KeyError):
        _post("gw_nonexistent", credential)


def test_the_enrollment_token_is_single_use():
    created = cg.create_gateway(TENANT, {
        "name": "edge",
        "public_hostname": "api.customer.com",
        "deployment_type": "docker",
        "origin": {"scheme": "https", "hostname": "origin.customer.com", "port": 443},
    })
    cg.enroll_gateway(created["gateway_id"], created["enrollment_token"])
    with pytest.raises(ValueError):
        cg.enroll_gateway(created["gateway_id"], created["enrollment_token"])


def test_the_registry_partition_is_not_an_etl_tenant():
    _enrolled()
    assert config_store.list_tenants() == []


if __name__ == "__main__":
    raise SystemExit(pytest.main([__file__, "-q"]))

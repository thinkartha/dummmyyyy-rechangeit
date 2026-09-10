"""AWS API Gateway logs + an AI agent -> spans -> rollup -> graph -> a latency answer.

The mapping and the rollup arithmetic run with nothing configured: record_store falls
back to memory, so no AWS and no table. The last test needs Mongo and Neo4j and skips
without them.

    python3 -m pytest backend/rvkg_bridge/test_e2e.py -q
    RVKG_PATH=~/Desktop/rv-aiknowledge python3 -m pytest backend/rvkg_bridge/test_e2e.py -q
"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

import pytest  # noqa: E402

from shared.core import agent_telemetry  # noqa: E402
from shared.core import record_store  # noqa: E402

import producers  # noqa: E402

bridge = pytest.importorskip("bridge", reason="rv-aiknowledge not importable; set RVKG_PATH")

TENANT = "rvkg-bridge-test"


@pytest.fixture(autouse=True)
def clean_tenant():
    for stream in (agent_telemetry.SPAN_STREAM, agent_telemetry.LOG_STREAM):
        record_store.clear(TENANT, stream)
    yield
    for stream in (agent_telemetry.SPAN_STREAM, agent_telemetry.LOG_STREAM):
        record_store.clear(TENANT, stream)


def test_apigw_record_becomes_a_route_span():
    span = producers.apigw_span({
        "requestId": "abc-123",
        "routeKey": "GET /v1/orders/{orderId}",
        "path": "/v1/orders/8814",
        "status": 200,
        "responseLatency": 210.0,
        "integrationLatency": 180.0,
        "integrationTarget": "orders-svc.internal",
    })
    attrs = span["attributes"]
    # The template, never the concrete path — otherwise every request is its own route.
    assert attrs["http.route"] == "GET /v1/orders/{orderId}"
    assert attrs["aws.apigw.overhead_ms"] == 30.0
    # The request id is the span id, so a replayed delivery collapses instead of
    # doubling the route's request count.
    assert span["span_id"] == "abc-123"


def test_rest_api_log_shape_also_maps():
    span = producers.apigw_span({
        "requestId": "r-1", "httpMethod": "post", "resourcePath": "/v1/checkout",
        "status": 502, "responseLatency": 1900, "integrationLatency": 1850,
    })
    assert span["attributes"]["http.route"] == "POST /v1/checkout"
    assert span["status_code"] == "ERROR"


def test_clock_skew_does_not_produce_negative_overhead():
    span = producers.apigw_span({
        "requestId": "r-2", "routeKey": "GET /x",
        "responseLatency": 100, "integrationLatency": 140,
    })
    assert span["attributes"]["aws.apigw.overhead_ms"] == 0.0


def test_rollup_splits_the_tail_into_tunable_parts():
    producers.push_apigw(TENANT, producers.synthetic_apigw(600))
    producers.run_agent(TENANT, turns=6, api_key="")  # no key: synthesised durations

    summary = bridge.rollup(agent_telemetry.spans(TENANT))

    checkout = summary["POST /v1/checkout"]
    health = summary["GET /v1/health"]
    catalog = summary["GET /v1/catalog"]

    assert checkout["p95_ms"] > health["p95_ms"] * 10
    # Checkout is slow in its upstream; catalog is slow in the gateway. A rollup that
    # cannot tell those apart sends someone to tune the wrong thing.
    assert checkout["integration_p95_ms"] > checkout["overhead_p95_ms"]
    assert catalog["overhead_p95_ms"] > catalog["integration_p95_ms"]
    assert checkout["targets"] == ["payments-svc.internal"]
    assert 0 < checkout["error_rate"] < 0.2


def test_agent_model_time_attributes_to_the_route_it_serves():
    producers.run_agent(TENANT, turns=6, api_key="")
    summary = bridge.rollup(agent_telemetry.spans(TENANT))

    route = summary[producers.AGENT_ROUTE]
    # The LLM span carries no route of its own; it reaches one through the shared trace.
    assert route["models"], "model time did not attribute to the agent's route"
    assert route["model_p95_ms"] > 0
    assert "the model call" in bridge._dominant(route)


def test_percentile_is_nearest_rank():
    assert bridge._pct([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 0.95) == 10
    assert bridge._pct([1, 2, 3, 4], 0.50) == 2
    assert bridge._pct([], 0.95) == 0.0


def test_only_the_route_is_anchored():
    summary = {"POST /v1/checkout": {
        "route": "POST /v1/checkout", "targets": ["payments-svc.internal"],
        "models": ["gpt-4o-mini"], "sources": ["aws.apigateway"],
    }}
    facts = bridge.facts_for(summary)
    assert all(f["source"] == "post-v1-checkout" for f in facts)
    assert all(f.get("source_anchor") for f in facts)
    # Upstreams and models have no document behind them: traversal walks through them,
    # it must not spend a discovery slot returning them.
    assert not any(f.get("target_anchor") for f in facts)
    assert {f["relation"] for f in facts} == {"IS_ROUTE", "CALLS", "CALLS_MODEL", "OBSERVED_BY"}


@pytest.mark.skipif(
    not (os.environ.get("MONGODB_URI") and os.environ.get("NEO4J_URI")),
    reason="needs Mongo + Neo4j",
)
def test_graph_answers_a_latency_question():
    from rvkg import engine

    org, project = "rvkg-bridge-test", "e2e"
    producers.push_apigw(TENANT, producers.synthetic_apigw(600))
    producers.run_agent(TENANT, turns=6)

    result = bridge.sync(TENANT, org, project)
    assert "post-v1-checkout" in result["documents"]
    assert "get-v1-health" not in result["documents"], "a fast route bought an LLM call"

    out = engine.query_graph(org, project, ["why is the checkout endpoint slow"])
    ids = [r["artifact_id"] for r in out["results"]]
    assert "post-v1-checkout" in ids
    assert len(ids) < result["routes"], "the relevance gate returned the whole corpus"


@pytest.mark.skipif(
    not (os.environ.get("MONGODB_URI") and os.environ.get("NEO4J_URI")),
    reason="needs Mongo + Neo4j",
)
def test_a_recovered_route_stops_saying_it_is_slow(monkeypatch):
    """The staleness bug: a route that drops below the objective used to fall out of
    the indexing loop, leaving last week's "checkout is slow" in the graph forever."""
    from rvkg import atlas_client, neo4j_client

    org, project = "rvkg-bridge-test", "recovery"
    neo4j_client.delete_project(org, project)
    for slug in atlas_client.get_project_shas(org, project):
        atlas_client.delete_artifact(org, project, slug)

    slow = [("POST /v1/checkout", (900, 2600), 0.95, 0.04, "payments-svc.internal")]
    fixed = [("POST /v1/checkout", (80, 180), 0.90, 0.001, "payments-svc.internal"),
             ("POST /v1/refund", (1400, 3000), 0.96, 0.02, "payments-svc.internal")]

    monkeypatch.setattr(producers, "_ROUTES", slow)
    producers.push_apigw(TENANT, producers.synthetic_apigw(300, seed=1))
    first = bridge.sync(TENANT, org, project)
    assert first["documents"] == ["post-v1-checkout"]

    record_store.clear(TENANT, agent_telemetry.SPAN_STREAM)
    monkeypatch.setattr(producers, "_ROUTES", fixed)
    producers.push_apigw(TENANT, producers.synthetic_apigw(300, seed=2))
    second = bridge.sync(TENANT, org, project)

    assert "post-v1-checkout" in second["recovered"]
    content = atlas_client.get_artifact_content(org, project, ["post-v1-checkout"])
    report = content["post-v1-checkout"]
    assert "is within its latency objective" in report
    assert "is breaching its latency objective" not in report
    assert "superseded" in report
    # And the window still accumulates: the new route arrived without disturbing the old.
    assert "post-v1-refund" in second["documents"]


@pytest.mark.skipif(
    not (os.environ.get("MONGODB_URI") and os.environ.get("NEO4J_URI")),
    reason="needs Mongo + Neo4j",
)
def test_a_second_window_of_logs_grows_the_graph(monkeypatch):
    """Accumulation: window 2 must not overwrite window 1. The graph gets bigger, the
    old route is still there, and a shared upstream is one node linking both routes."""
    from rvkg import atlas_client, neo4j_client

    org, project = "rvkg-bridge-test", "accumulate"
    neo4j_client.delete_project(org, project)
    for slug in atlas_client.get_project_shas(org, project):
        atlas_client.delete_artifact(org, project, slug)

    checkout = ("POST /v1/checkout", (900, 2600), 0.95, 0.04, "payments-svc.internal")
    refund = ("POST /v1/refund", (1400, 3000), 0.96, 0.02, "payments-svc.internal")

    monkeypatch.setattr(producers, "_ROUTES", [checkout])
    producers.push_apigw(TENANT, producers.synthetic_apigw(300, seed=1))
    bridge.sync(TENANT, org, project)
    before = neo4j_client.get_node_count(org, project)

    record_store.clear(TENANT, agent_telemetry.SPAN_STREAM)
    monkeypatch.setattr(producers, "_ROUTES", [checkout, refund])
    producers.push_apigw(TENANT, producers.synthetic_apigw(300, seed=2))
    bridge.sync(TENANT, org, project)

    assert neo4j_client.get_node_count(org, project) > before, "window 2 replaced window 1"
    assert set(atlas_client.get_project_shas(org, project)) >= {
        "post-v1-checkout", "post-v1-refund"}

    # The payoff: payments-svc MERGEd into one node, so a question about it now reaches
    # both routes — a connection neither window made on its own.
    reached = neo4j_client.bfs_from_artifacts(org, project, ["post-v1-refund"])
    assert "post-v1-checkout" in reached, "the shared upstream did not link the two windows"

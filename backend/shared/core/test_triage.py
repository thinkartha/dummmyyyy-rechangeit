"""Self-check: routing decisions, no network."""
from unittest.mock import patch

from . import triage


def _q(results, paths=None):
    return patch.object(triage.engine, "query_graph",
                        return_value={"results": results, "paths": paths or {}})


def test_routes():
    with _q([{"artifact_id": "runbook", "score": 0.8, "doc": "restart it"}]):
        assert triage.triage("acme", {"title": "checkout 500s"})["route"] == "agent"

    with _q([{"artifact_id": "x", "score": 0.2, "doc": ""}]):
        assert triage.triage("acme", {"title": "weird thing"})["route"] == "human"

    with _q([{"artifact_id": "runbook", "score": 0.9, "doc": ""}]):
        assert triage.triage("acme", {"title": "db down", "priority": "P0"})["route"] == "human"

    with _q([]):
        assert triage.triage("acme", {})["route"] == "human"


if __name__ == "__main__":
    test_routes()
    print("ok")

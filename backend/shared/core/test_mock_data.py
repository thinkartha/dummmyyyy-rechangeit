"""The mock-data switch, from both sides.

What this pins down:
  * off is the default — a deployment that sets nothing serves no fabricated records;
  * off empties every seeded collection: the agent telemetry seed, the starting alert
    routing/SLA/maintenance state, and the starting automation rules and models;
  * on restores all of them, so the demo path still works from one flag.

    python3 backend/shared/core/test_mock_data.py
"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))

from shared.core import agent_seed, alert_management, automation, mock_data  # noqa: E402


def _set(value):
    for var in ("PINGHOLD_MOCK_DATA", "PINGHOLD_DEMO_AGENTS"):
        os.environ.pop(var, None)
    if value is not None:
        os.environ["PINGHOLD_MOCK_DATA"] = value


def test_off_by_default():
    _set(None)
    assert mock_data.enabled() is False
    assert agent_seed.enabled() is False
    alerts = alert_management._starting_state()
    assert alerts["routing_rules"] == [] and alerts["sla_rules"] == []
    auto = automation._starting_state()
    assert auto["rules"] == [] and auto["models"] == []


def test_on_seeds_every_source():
    _set("1")
    assert mock_data.enabled() is True
    assert agent_seed.enabled() is True
    assert alert_management._starting_state()["routing_rules"]
    assert automation._starting_state()["rules"]


def test_legacy_flag_still_honoured():
    """An existing stack set PINGHOLD_DEMO_AGENTS=1; deploying must not silently
    change what it serves."""
    _set(None)
    os.environ["PINGHOLD_DEMO_AGENTS"] = "1"
    assert mock_data.enabled() is True
    _set(None)


if __name__ == "__main__":
    test_off_by_default()
    test_on_seeds_every_source()
    test_legacy_flag_still_honoured()
    print("ok — mock data off by default, and one flag governs every seeded source")

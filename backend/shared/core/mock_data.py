"""One switch for every fabricated record the API can serve.

`PINGHOLD_MOCK_DATA=1` turns on the seeded agent telemetry, the starting automation
state, the starting alert-management rules, and the demo RCA scenario. `0` — the
default, and what production runs — means every one of those paths returns empty and
the UI shows an honest empty state instead.

There was previously one flag for the agent seed alone (`PINGHOLD_DEMO_AGENTS`), which
left three other seeded sources on in every deployment. It is still read so an existing
stack does not change behaviour on deploy, but the stack parameter is now MockData.
"""

from __future__ import annotations

import os

_TRUE = {"1", "true", "yes", "on"}


def enabled() -> bool:
    for var in ("PINGHOLD_MOCK_DATA", "PINGHOLD_DEMO_AGENTS"):
        if os.getenv(var, "").strip().lower() in _TRUE:
            return True
    return False

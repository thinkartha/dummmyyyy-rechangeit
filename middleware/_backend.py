"""Make `backend/` importable from middleware jobs.

The vendor ETL clients, DTOs, and CloudEvent mappers already live in
`backend/shared/etl/`, because the API serves manual-poll endpoints from the same
code. Middleware needs exactly those pieces to run the batch version of the poll.

ponytail: a sys.path append, not a shared package or a vendored copy. Duplicating the
~400-line Talend/Boomi/Databricks clients here would give two implementations that
drift the first time a vendor changes a field name. Promote to an installable package
if middleware ever deploys separately from the backend.
"""

from __future__ import annotations

import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parent.parent / "backend"

if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))

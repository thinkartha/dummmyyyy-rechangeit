"""The job-run drill-down's normalization.

What fails quietly here: a task type nobody enumerated disappearing from the list, a
duration that Databricks reports only as start/end, and an unreachable workspace coming
back as an empty run that reads as "this run had no tasks".

    python -m pytest shared/etl/pollers/test_databricks_run_detail.py
"""
from __future__ import annotations

from shared.etl.pollers import databricks


class _Client:
    configured = True

    def __init__(self, payload=None, raises=None):
        self.payload, self.raises = payload, raises

    def run_detail(self, run_id):
        if self.raises:
            raise self.raises
        return self.payload


RUN = {
    "run_id": 42, "job_id": 7, "run_name": "nightly-load",
    "state": {"life_cycle_state": "TERMINATED", "result_state": "FAILED",
              "state_message": "Task ingest failed"},
    "start_time": 1_757_000_000_000, "end_time": 1_757_000_060_000,
    "run_page_url": "https://dbc.example/#job/7/run/42",
    "tasks": [
        {"task_key": "ingest", "run_id": 43,
         "state": {"life_cycle_state": "TERMINATED", "result_state": "FAILED",
                   "state_message": "py4j error"},
         "notebook_task": {"notebook_path": "/Repos/etl/ingest"},
         "start_time": 1_757_000_000_000, "end_time": 1_757_000_030_000},
        {"task_key": "transform",
         "state": {"life_cycle_state": "SKIPPED"},
         "sql_task": {"warehouse_id": "wh-1"},
         "depends_on": [{"task_key": "ingest"}],
         "execution_duration": 0},
        # A task type this code has never heard of still has to appear: it is the one
        # the operator is looking at.
        {"task_key": "mystery", "state": {"result_state": "SUCCESS"},
         "future_task": {"whatever": 1}},
    ],
}


def test_tasks_carry_what_failed_and_why():
    detail = databricks.run_detail("t", "42", client=_Client(RUN))
    assert [t.task_key for t in detail.tasks] == ["ingest", "transform", "mystery"]
    ingest = detail.tasks[0]
    assert (ingest.result_state, ingest.state_message) == ("FAILED", "py4j error")
    assert (ingest.kind, ingest.target) == ("notebook", "/Repos/etl/ingest")
    # Databricks reported no execution_duration for this one; start/end still give it.
    assert ingest.duration_ms == 30_000
    assert detail.tasks[1].depends_on == ["ingest"]
    # Unknown task type: no kind, but the row is there.
    assert detail.tasks[2].kind is None


def test_run_level_fields_survive():
    detail = databricks.run_detail("t", "42", client=_Client(RUN))
    assert detail.result_state == "FAILED"
    assert detail.duration_ms == 60_000
    assert detail.run_page_url.endswith("/run/42")
    assert detail.error is None


def test_an_unreachable_workspace_says_so_rather_than_returning_an_empty_run():
    detail = databricks.run_detail("t", "42", client=_Client(raises=RuntimeError("401")))
    assert detail.tasks == []
    assert "RuntimeError: 401" in detail.error

    missing = databricks.run_detail("t", "99", client=_Client({}))
    assert "no run 99" in missing.error

"""Threshold conditions: the state machine, not the arithmetic.

The arithmetic is one comparison. What is easy to get wrong is everything around it —
re-raising the same alert every minute, firing on breaches that were never consecutive,
one noisy resource silencing its neighbours, and a recovery inheriting the severity of
the incident it ended.
"""

from __future__ import annotations

import pytest

from shared.aws import metric_alerts
from shared.aws.metric_alerts import MetricCondition
from shared.core import config_store

TENANT = "t-alerts"


def _row(value: float, resource: str = "i-a", ts: str = "2026-09-10T10:00:00+00:00", **over):
    row = {
        "account": "111122223333", "region": "us-east-1", "namespace": "AWS/EC2",
        "metric": "CPUUtilization", "dimensions": {"InstanceId": resource},
        "dimension_id": resource, "ts": ts,
        "min": value, "max": value, "sum": value, "count": 1.0,
    }
    row.update(over)
    return row


@pytest.fixture(autouse=True)
def clean():
    config_store.save_config(TENANT, "aws-metric-alerts", "[]")
    config_store.save_config(TENANT, "aws-metric-alert-state", "{}")
    yield


def _condition(**over):
    fields = {"name": "CPU high", "namespace": "AWS/EC2", "metric": "CPUUtilization",
              "threshold": 80.0, "for_periods": 2}
    fields.update(over)
    return metric_alerts.create_condition(TENANT, MetricCondition(**fields))


def test_fires_only_after_the_required_consecutive_periods():
    _condition(for_periods=2)
    assert metric_alerts.evaluate(TENANT, [_row(95)]) == []
    events = metric_alerts.evaluate(TENANT, [_row(96, ts="2026-09-10T10:01:00+00:00")])
    assert [e.type for e in events] == ["cloud.alert.triggered"]


def test_a_good_period_resets_the_counter():
    """Otherwise a metric that breaches every other minute eventually fires on an
    accumulation that never actually persisted."""
    _condition(for_periods=3)
    metric_alerts.evaluate(TENANT, [_row(95)])
    metric_alerts.evaluate(TENANT, [_row(10, ts="2026-09-10T10:01:00+00:00")])
    metric_alerts.evaluate(TENANT, [_row(95, ts="2026-09-10T10:02:00+00:00")])
    assert metric_alerts.evaluate(TENANT, [_row(95, ts="2026-09-10T10:03:00+00:00")]) == []


def test_it_does_not_re_raise_while_it_stays_firing():
    """The failure that teaches people to ignore an alerting system."""
    _condition(for_periods=1)
    assert len(metric_alerts.evaluate(TENANT, [_row(95)])) == 1
    for minute in range(1, 5):
        assert metric_alerts.evaluate(
            TENANT, [_row(95, ts=f"2026-09-10T10:0{minute}:00+00:00")]) == []


def test_recovery_raises_once_and_is_not_an_incident():
    _condition(for_periods=1, severity="critical")
    metric_alerts.evaluate(TENANT, [_row(95)])
    events = metric_alerts.evaluate(TENANT, [_row(5, ts="2026-09-10T10:01:00+00:00")])
    assert [e.type for e in events] == ["cloud.alert.resolved"]
    assert events[0].data["severity"] == "info", "a recovery is not critical"
    assert events[0].data["status"] == "resolved"
    assert metric_alerts.evaluate(TENANT, [_row(5, ts="2026-09-10T10:02:00+00:00")]) == []


def test_each_resource_fires_and_recovers_on_its_own():
    """One noisy instance must not mark the fleet down, nor silence its neighbours."""
    _condition(for_periods=1)
    events = metric_alerts.evaluate(TENANT, [_row(95, "i-a"), _row(10, "i-b")])
    assert len(events) == 1
    assert events[0].data["resource"] == "i-a"

    later = metric_alerts.evaluate(TENANT, [
        _row(10, "i-a", ts="2026-09-10T10:01:00+00:00"),
        _row(99, "i-b", ts="2026-09-10T10:01:00+00:00"),
    ])
    assert {(e.type, e.data["resource"]) for e in later} == {
        ("cloud.alert.resolved", "i-a"), ("cloud.alert.triggered", "i-b")}


def test_comparisons_other_than_greater_than():
    metric_alerts.create_condition(TENANT, MetricCondition(
        name="Queue drained", namespace="AWS/SQS",
        metric="ApproximateNumberOfMessagesVisible",
        comparison="lt", threshold=1, for_periods=1))
    events = metric_alerts.evaluate(TENANT, [
        _row(0, "orders", namespace="AWS/SQS", metric="ApproximateNumberOfMessagesVisible")])
    assert [e.type for e in events] == ["cloud.alert.triggered"]


def test_dimension_and_account_filters_narrow_a_condition():
    _condition(for_periods=1, dimensions={"InstanceId": "i-only"})
    assert metric_alerts.evaluate(TENANT, [_row(95, "i-other")]) == []
    assert len(metric_alerts.evaluate(TENANT, [_row(95, "i-only")])) == 1


def test_a_disabled_condition_is_not_evaluated():
    _condition(for_periods=1, enabled=False)
    assert metric_alerts.evaluate(TENANT, [_row(99)]) == []


def test_statistic_selects_which_number_is_compared():
    """max and avg disagree exactly when it matters — a spike inside a calm minute."""
    _condition(for_periods=1, statistic="max", threshold=90)
    row = _row(0, sum=100.0, count=10.0, max=95.0, min=0.0)  # avg 10, max 95
    assert len(metric_alerts.evaluate(TENANT, [row])) == 1

    config_store.save_config(TENANT, "aws-metric-alerts", "[]")
    config_store.save_config(TENANT, "aws-metric-alert-state", "{}")
    _condition(for_periods=1, statistic="avg", threshold=90)
    assert metric_alerts.evaluate(TENANT, [row]) == []


def test_one_delivery_with_several_minutes_judges_the_latest():
    _condition(for_periods=1)
    events = metric_alerts.evaluate(TENANT, [
        _row(99, ts="2026-09-10T10:00:00+00:00"),
        _row(5, ts="2026-09-10T10:05:00+00:00"),
    ])
    assert events == [], "the newest minute is fine, so it is not firing"


def test_deleting_a_condition_drops_its_state():
    """A re-created condition reusing an id must not inherit a firing state nothing is
    measuring any more."""
    condition = _condition(for_periods=1)
    metric_alerts.evaluate(TENANT, [_row(95)])
    assert metric_alerts.delete_condition(TENANT, condition["id"]) is True
    assert metric_alerts._load_state(TENANT) == {}
    assert metric_alerts.delete_condition(TENANT, condition["id"]) is False


def test_status_lists_a_condition_nothing_has_matched():
    """"Nothing has matched this yet" is a different answer from "this is fine"."""
    _condition()
    rows = metric_alerts.status(TENANT)
    assert rows[0]["watching"] == 0 and rows[0]["firing"] == 0


def test_event_summary_names_the_numbers():
    _condition(for_periods=1)
    event = metric_alerts.evaluate(TENANT, [_row(95)])[0]
    assert "CPUUtilization" in event.data["summary"]
    assert "95" in event.data["summary"] and "80" in event.data["summary"]
    assert event.data["account"] == "111122223333"
    assert event.data["region"] == "us-east-1"

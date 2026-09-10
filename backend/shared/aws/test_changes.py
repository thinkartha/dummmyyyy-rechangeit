"""Inventory change tracking: the baseline rule and the false alarm it prevents."""

from __future__ import annotations

import pytest

from shared.aws import changes
from shared.aws.inventory import AccountInventory, AwsInventoryReport, Bucket, Distribution
from shared.core import config_store, record_store

TENANT = "t-changes"


@pytest.fixture(autouse=True)
def clean():
    config_store.save_config(TENANT, "aws-inventory-snapshot", "{}")
    record_store.clear(TENANT, changes.STREAM)
    yield
    record_store.clear(TENANT, changes.STREAM)


def _report(*accounts):
    return AwsInventoryReport(accounts=list(accounts), configured=True)


def _account(buckets=(), distributions=(), error=None, account_id="111122223333"):
    return AccountInventory(
        accountId=account_id, name="prod", error=error,
        buckets=[Bucket(name=b, region="us-east-1") for b in buckets],
        distributions=list(distributions),
    )


def test_the_first_run_takes_a_baseline_and_reports_nothing():
    """Otherwise every resource is 'added' on the day monitoring is switched on."""
    found = changes.record(TENANT, _report(_account(buckets=["a", "b"])))
    assert found == []


def test_added_and_removed_are_reported_against_the_baseline():
    changes.record(TENANT, _report(_account(buckets=["a", "b"])))
    found = changes.record(TENANT, _report(_account(buckets=["b", "c"])))
    assert {(f["change"], f["name"]) for f in found} == {("added", "c"), ("removed", "a")}
    assert all(f["account"] == "111122223333" for f in found)


def test_a_watched_field_changing_is_a_modification():
    before = _account(distributions=[Distribution(id="E1", domainName="d.example", enabled=True)])
    after = _account(distributions=[Distribution(id="E1", domainName="d.example", enabled=False)])
    changes.record(TENANT, _report(before))
    found = changes.record(TENANT, _report(after))
    assert len(found) == 1
    assert found[0]["change"] == "modified"
    assert found[0]["fields"]["enabled"] == {"from": True, "to": False}


def test_an_unreachable_account_is_skipped_not_emptied():
    """The most alarming false alarm this could produce: a missing cross-account role
    reported as every bucket in the account having been deleted."""
    changes.record(TENANT, _report(_account(buckets=["a", "b"])))
    found = changes.record(TENANT, _report(_account(buckets=[], error="AccessDenied")))
    assert found == []
    # And the baseline is intact, so the account is still known after the outage.
    recovered = changes.record(TENANT, _report(_account(buckets=["a"])))
    assert {(f["change"], f["name"]) for f in recovered} == {("removed", "b")}


def test_nothing_changing_reports_nothing():
    changes.record(TENANT, _report(_account(buckets=["a"])))
    assert changes.record(TENANT, _report(_account(buckets=["a"]))) == []


def test_accounts_are_tracked_separately():
    changes.record(TENANT, _report(
        _account(buckets=["a"], account_id="111111111111"),
        _account(buckets=["b"], account_id="222222222222")))
    found = changes.record(TENANT, _report(
        _account(buckets=["a"], account_id="111111111111"),
        _account(buckets=["b", "c"], account_id="222222222222")))
    assert len(found) == 1
    assert found[0]["account"] == "222222222222" and found[0]["name"] == "c"


def test_a_new_account_takes_its_own_baseline():
    changes.record(TENANT, _report(_account(buckets=["a"], account_id="111111111111")))
    found = changes.record(TENANT, _report(
        _account(buckets=["a"], account_id="111111111111"),
        _account(buckets=["x", "y"], account_id="333333333333")))
    assert found == [], "an account seen for the first time is a baseline, not two additions"


def test_changes_are_stored_and_readable():
    changes.record(TENANT, _report(_account(buckets=["a"])))
    changes.record(TENANT, _report(_account(buckets=["a", "b"])))
    stored = changes.recent(TENANT)
    assert [s["name"] for s in stored] == ["b"]


def test_removal_is_a_warning_and_addition_is_not():
    changes.record(TENANT, _report(_account(buckets=["a"])))
    found = changes.record(TENANT, _report(_account(buckets=["b"])))
    events = {e.data["change"]: e for e in changes.events(TENANT, found)}
    assert events["removed"].data["severity"] == "warning"
    assert events["added"].data["severity"] == "info"
    assert events["removed"].type == "cloud.resource.removed"
    assert "was removed" in events["removed"].data["summary"]

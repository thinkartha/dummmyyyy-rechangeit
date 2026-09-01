"""Multi-account inventory: the fan-out, the fallbacks, and what a refusal looks like.

    python3 backend/shared/aws/test_inventory.py
"""

import os
import sys
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))

from shared.aws import inventory, lambda_service  # noqa: E402
from shared.aws.dto import AwsLambdaConfig  # noqa: E402


class FakePaginator:
    def __init__(self, client, operation):
        self.client = client
        self.operation = operation

    def paginate(self, **kwargs):
        self.client.seen.append((self.operation, kwargs))
        return list(self.client.pages.get(self.operation, [{}]))


class FakeClient:
    """One boto client. `pages` feeds paginators, `calls` feeds direct calls."""

    def __init__(self, pages=None, calls=None, raises=None):
        self.pages = pages or {}
        self.calls = calls or {}
        self.raises = raises
        self.seen = []

    def get_paginator(self, operation):
        if self.raises:
            raise self.raises
        return FakePaginator(self, operation)

    def __getattr__(self, name):
        def call(**kwargs):
            if self.raises:
                raise self.raises
            self.seen.append((name, kwargs))
            value = self.calls.get(name, {})
            return value(**kwargs) if callable(value) else value

        return call


class FakeSession:
    def __init__(self, clients, label="base"):
        self.clients = clients
        self.label = label
        self.regions = {}

    def client(self, service, region_name=None):
        self.regions[service] = region_name
        return self.clients.setdefault(service, FakeClient())


def _zone(zid, name, count=3, private=False):
    return {"Id": f"/hostedzone/{zid}", "Name": name,
            "ResourceRecordSetCount": count, "Config": {"PrivateZone": private}}


def _clients(**overrides):
    """A believable, fully-permitted account."""
    clients = {
        "sts": FakeClient(calls={"get_caller_identity": {"Account": "111111111111"}}),
        "route53": FakeClient({"list_hosted_zones": [{"HostedZones": [
            _zone("Z2", "zeta.example.com."), _zone("Z1", "alpha.example.com.", 12, private=True)]}]}),
        "route53domains": FakeClient({
            "list_domains": [{"Domains": [{"DomainName": "alpha.example.com", "AutoRenew": True,
                                           "Expiry": datetime(2027, 1, 1)}]}],
            "list_operations": [{"Operations": [
                {"DomainName": "new.example.com", "Status": "IN_PROGRESS", "Type": "REGISTER_DOMAIN"},
                {"DomainName": "old.example.com", "Status": "SUCCESSFUL", "Type": "REGISTER_DOMAIN"},
                {"DomainName": "alpha.example.com", "Status": "IN_PROGRESS", "Type": "RENEW_DOMAIN"}]}]}),
        "cloudfront": FakeClient({"list_distributions": [{"DistributionList": {"Items": [
            {"Id": "E123", "DomainName": "d1.cloudfront.net", "Enabled": True, "Status": "Deployed",
             "Aliases": {"Items": ["cdn.example.com"]},
             "Origins": {"Items": [{"DomainName": "origin.example.com"}]}}]}}]}),
        "s3": FakeClient(
            calls={"list_buckets": {"Buckets": [{"Name": "b-west", "CreationDate": datetime(2024, 5, 1)},
                                                {"Name": "b-classic"}, {"Name": "b-eu"}]},
                   "get_bucket_location": lambda Bucket: {
                       "b-west": {"LocationConstraint": "us-west-2"},
                       "b-classic": {"LocationConstraint": None},
                       "b-eu": {"LocationConstraint": "EU"}}[Bucket]}),
        "cloudwatch": FakeClient({"describe_alarms": [{"MetricAlarms": [
            {"AlarmName": "billing-high", "MetricName": "EstimatedCharges",
             "StateReason": "threshold crossed", "StateUpdatedTimestamp": datetime(2026, 9, 1)}]}]}),
        "iam": FakeClient({"list_users": [{"Users": [
            {"UserName": "deploy", "Arn": "arn:aws:iam::111111111111:user/deploy",
             "CreateDate": datetime(2023, 2, 2)}]}]}),
    }
    clients.update(overrides)
    return clients


def _wire(base_clients=None, org_accounts=None, org_raises=None, members=None, configured=True):
    inventory._CACHE.clear()
    clients = base_clients if base_clients is not None else _clients()
    if org_raises:
        clients["organizations"] = FakeClient(raises=org_raises)
    else:
        clients["organizations"] = FakeClient(
            {"list_accounts": [{"Accounts": org_accounts or []}]})
    base = FakeSession(clients)

    lambda_service.get_config = lambda _t: AwsLambdaConfig(region="eu-west-1") if configured else None
    lambda_service._session = lambda _cfg: base

    assumed = []

    def fake_assume(session, account_id, role_name, region):
        assumed.append((account_id, role_name, region))
        target = (members or {}).get(account_id)
        if isinstance(target, Exception):
            raise target
        return FakeSession(target if target is not None else _clients(), label=account_id)

    inventory._assume = fake_assume
    return base, assumed


def test_unconnected_tenant_gets_nothing_not_zero():
    _wire(configured=False)
    report = inventory.inventory("tenant-a")
    assert report.configured is False
    assert report.accounts == [] and report.error is None


def test_standalone_account_is_an_answer_not_an_error():
    """No organizations:ListAccounts is the common case, and must degrade cleanly."""
    _, assumed = _wire(org_raises=RuntimeError("AccessDeniedException: organizations:ListAccounts"))
    report = inventory.inventory("tenant-a")
    assert report.configured is True and report.error is None
    assert report.organization is False
    assert [a.account_id for a in report.accounts] == ["111111111111"]
    assert assumed == []  # nothing to fan out to


def test_organization_fans_out_to_every_member_account():
    _, assumed = _wire(org_accounts=[
        {"Id": "111111111111", "Name": "management", "Status": "ACTIVE"},
        {"Id": "222222222222", "Name": "prod", "Status": "ACTIVE"},
        {"Id": "333333333333", "Name": "sandbox", "Status": "ACTIVE"},
        {"Id": "444444444444", "Name": "closed", "Status": "SUSPENDED"}])
    report = inventory.inventory("tenant-a")
    assert report.organization is True
    assert [a.account_id for a in report.accounts] == ["111111111111", "222222222222", "333333333333"]
    assert [a.name for a in report.accounts] == ["management", "prod", "sandbox"]
    # The connected account uses the credential it already has; only members are assumed.
    assert assumed == [("222222222222", "OrganizationAccountAccessRole", "eu-west-1"),
                       ("333333333333", "OrganizationAccountAccessRole", "eu-west-1")]


def test_role_name_is_overridable():
    _, assumed = _wire(org_accounts=[{"Id": "111111111111", "Status": "ACTIVE"},
                                     {"Id": "222222222222", "Status": "ACTIVE"}])
    inventory.inventory("tenant-a", role_name="AuditReadOnly")
    assert assumed == [("222222222222", "AuditReadOnly", "eu-west-1")]


def test_one_unreachable_account_does_not_take_the_others_down():
    _wire(org_accounts=[{"Id": "111111111111", "Status": "ACTIVE"},
                        {"Id": "222222222222", "Status": "ACTIVE"},
                        {"Id": "333333333333", "Status": "ACTIVE"}],
          members={"222222222222": RuntimeError("AccessDenied: not authorized to AssumeRole")})
    report = inventory.inventory("tenant-a")
    denied = next(a for a in report.accounts if a.account_id == "222222222222")
    assert "AccessDenied" in denied.error and denied.hosted_zones == []
    assert report.error is None
    assert len(next(a for a in report.accounts if a.account_id == "333333333333").hosted_zones) == 2


def test_one_denied_service_names_itself_and_keeps_the_rest():
    clients = _clients(route53=FakeClient(raises=RuntimeError("AccessDeniedException: route53:ListHostedZones")))
    _wire(base_clients=clients, org_raises=RuntimeError("no org"))
    account = inventory.inventory("tenant-a").accounts[0]
    assert account.error is None
    assert "route53" in account.service_errors and "AccessDenied" in account.service_errors["route53"]
    assert account.hosted_zones == []
    assert [b.name for b in account.buckets] == ["b-classic", "b-eu", "b-west"]
    assert [u.user_name for u in account.users] == ["deploy"]


def test_hosted_zones_carry_the_bare_zone_id_and_privacy():
    _wire(org_raises=RuntimeError("no org"))
    zones = inventory.inventory("tenant-a").accounts[0].hosted_zones
    assert [(z.id, z.name, z.record_count, z.private) for z in zones] == [
        ("Z1", "alpha.example.com.", 12, True), ("Z2", "zeta.example.com.", 3, False)]


def test_pending_registrations_show_up_next_to_registered_domains():
    _wire(org_raises=RuntimeError("no org"))
    domains = inventory.inventory("tenant-a").accounts[0].domains
    assert [(d.name, d.pending) for d in domains] == [("alpha.example.com", False), ("new.example.com", True)]
    assert domains[0].expiry == "2027-01-01T00:00:00" and domains[0].auto_renew is True
    assert domains[1].operation == "REGISTER_DOMAIN"  # SUCCESSFUL and already-owned ops are not "pending"


def test_bucket_regions_handle_the_two_legacy_answers():
    """LocationConstraint None means us-east-1 and "EU" means eu-west-1 — not null regions."""
    _wire(org_raises=RuntimeError("no org"))
    buckets = inventory.inventory("tenant-a").accounts[0].buckets
    assert {b.name: b.region for b in buckets} == {
        "b-classic": "us-east-1", "b-eu": "eu-west-1", "b-west": "us-west-2"}
    assert next(b for b in buckets if b.name == "b-west").created == "2024-05-01T00:00:00"


def test_only_alarms_in_alarm_state_are_asked_for():
    base, _ = _wire(org_raises=RuntimeError("no org"))
    report = inventory.inventory("tenant-a")
    assert [a.name for a in report.accounts[0].alarms] == ["billing-high"]
    assert base.clients["cloudwatch"].seen == [("describe_alarms", {"StateValue": "ALARM"})]
    # Alarms are regional and follow the connector's region; the global services do not.
    assert base.regions["cloudwatch"] == "eu-west-1"
    assert base.regions["route53"] == base.regions["cloudfront"] == "us-east-1"
    assert base.regions["route53domains"] == base.regions["iam"] == "us-east-1"


def test_cloudfront_distribution_is_flattened():
    _wire(org_raises=RuntimeError("no org"))
    dist = inventory.inventory("tenant-a").accounts[0].distributions[0]
    assert (dist.id, dist.domain_name, dist.aliases, dist.origin, dist.enabled, dist.status) == (
        "E123", "d1.cloudfront.net", ["cdn.example.com"], "origin.example.com", True, "Deployed")


def test_bad_credentials_say_so_and_are_not_cached():
    clients = _clients(sts=FakeClient(raises=RuntimeError("InvalidClientTokenId")))
    _wire(base_clients=clients, org_raises=RuntimeError("no org"))
    report = inventory.inventory("tenant-a")
    assert report.configured is True and "InvalidClientTokenId" in report.error
    assert report.accounts == []
    assert not inventory._CACHE


def test_second_read_is_served_from_cache_per_tenant_and_role():
    """Six-plus slow calls per account; a second page load must not repeat them."""
    base, _ = _wire(org_raises=RuntimeError("no org"))
    inventory.inventory("tenant-a")
    inventory.inventory("tenant-a")
    assert len(base.clients["sts"].seen) == 1

    inventory.inventory("tenant-a", role_name="AuditReadOnly")  # different fan-out, different key
    assert len(base.clients["sts"].seen) == 2

    inventory.inventory("tenant-b")  # tenants never share an inventory
    assert len(base.clients["sts"].seen) == 3

    inventory.invalidate("tenant-a")
    inventory.inventory("tenant-a")
    assert len(base.clients["sts"].seen) == 4
    inventory.inventory("tenant-b")
    assert len(base.clients["sts"].seen) == 4  # invalidate is per tenant, not global


if __name__ == "__main__":
    for name, fn in sorted(globals().items()):
        if name.startswith("test_"):
            fn()
            print(f"ok  {name}")
    print("all green")

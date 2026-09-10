"""What actually exists in the customer's AWS accounts: DNS, CDN, buckets, alarms, users.

The Cloud pages could say what a tenant *spent* (`cost.py`) and what its Lambdas were
doing (`lambda_service.py`), and nothing at all about what it owns. Route 53, CloudFront,
S3, CloudWatch alarms and IAM users had zero references in the backend — the Lambda
overview even hardcoded `activeAlarms` to 0. This is the missing half of "multi-cloud
monitoring": the inventory, per account.

Multi-account without an accounts table
---------------------------------------
The connector stores exactly one role ARN per tenant, and customers have several
accounts. AWS already keeps the authoritative account list, so this asks it for one
(`organizations:ListAccounts`) and then fans out by assuming `OrganizationAccountAccessRole`
— the role AWS Organizations creates in every member account — for the per-account reads.
Nothing is stored: no accounts table, no per-account ARN CRUD, no registration screen to
keep in sync with reality.

A standalone account, or a role without `organizations:ListAccounts`, is a normal answer
and not an error: the report comes back with one account (the connected one) and
`organization=false`. A single account that refuses the assume-role, or a single service
that refuses a read, degrades to an `error` / `serviceErrors` entry on that account —
never to an empty response for everybody else.

Route 53, Route 53 Domains, CloudFront, IAM and Organizations are global services with
one endpoint each, so they are pinned to `us-east-1` rather than iterated per region.
S3's `list_buckets` is global too; only `get_bucket_location` is per bucket.

The role needs the policy documented in `backend/README.md` ("AWS connector IAM policy").
Anything missing from it comes back as a per-service reason rather than as an empty list
pretending the account owns nothing.
"""

from __future__ import annotations

import time
from concurrent.futures import ThreadPoolExecutor
from typing import Any, Callable, Iterator

from pydantic import BaseModel, Field

from . import lambda_service

# Route 53 / route53domains / CloudFront / IAM / Organizations are global services whose
# endpoints live in us-east-1. Boto will build a client in the tenant's region and then
# fail to resolve it, so the region is pinned here rather than taken from the config.
_GLOBAL_REGION = "us-east-1"

# The role AWS Organizations itself creates in every member account it provisions, which
# is why it can be the default: it is already there. Overridable per request for orgs
# that renamed it or that use a hand-rolled cross-account role.
_DEFAULT_ROLE = "OrganizationAccountAccessRole"

# These reads are free but slow: ~6 API calls per account plus one per bucket, serially,
# across every account in the org — seconds, not milliseconds, for a page load. What they
# describe (zones, distributions, buckets, users) changes on the order of days, so a
# fifteen-minute answer is indistinguishable from a live one, and an alarm that fires in
# between is CloudWatch's job to page on, not this page's job to discover.
# ponytail: process-local dict, so each worker pays its own miss, same as cost.py. Move
# both to config_store or Redis if the fleet grows past a couple of workers.
_TTL_SECONDS = 15 * 60
_CACHE: dict[str, tuple[float, "AwsInventoryReport"]] = {}


class HostedZone(BaseModel):
    id: str
    name: str
    record_count: int = Field(default=0, alias="recordCount")
    private: bool = False

    model_config = {"populate_by_name": True}


class Domain(BaseModel):
    name: str
    status: str
    pending: bool = False
    operation: str | None = None
    expiry: str | None = None
    auto_renew: bool | None = Field(default=None, alias="autoRenew")

    model_config = {"populate_by_name": True}


class Distribution(BaseModel):
    id: str
    domain_name: str | None = Field(default=None, alias="domainName")
    aliases: list[str] = Field(default_factory=list)
    origin: str | None = None
    enabled: bool = False
    status: str | None = None

    model_config = {"populate_by_name": True}


class Bucket(BaseModel):
    name: str
    region: str | None = None
    created: str | None = None


class Alarm(BaseModel):
    name: str
    metric: str | None = None
    region: str | None = None
    reason: str | None = None
    since: str | None = None


class IamUser(BaseModel):
    user_name: str = Field(alias="userName")
    arn: str | None = None
    created: str | None = None
    password_last_used: str | None = Field(default=None, alias="passwordLastUsed")

    model_config = {"populate_by_name": True}


class AccountInventory(BaseModel):
    account_id: str = Field(alias="accountId")
    name: str | None = None
    # The account whose credential this tenant saved, as opposed to one reached by
    # assuming a role. The page labels them differently because they fail differently:
    # a member account with no cross-account role is the common setup mistake.
    connected: bool = False
    hosted_zones: list[HostedZone] = Field(default_factory=list, alias="hostedZones")
    domains: list[Domain] = Field(default_factory=list)
    distributions: list[Distribution] = Field(default_factory=list)
    buckets: list[Bucket] = Field(default_factory=list)
    alarms: list[Alarm] = Field(default_factory=list)
    users: list[IamUser] = Field(default_factory=list)
    # The regions this account was actually read in, so a page can say "no alarms in the
    # regions we looked at" rather than the unqualified "no alarms".
    regions: list[str] = Field(default_factory=list)
    # Resource ARN -> tags, from the Resource Groups Tagging API. One call per region
    # covers every taggable service, which is what makes grouping by team or environment
    # affordable at all.
    tags: dict[str, dict[str, str]] = Field(default_factory=dict)
    tag_keys: list[str] = Field(default_factory=list, alias="tagKeys")
    # The account could not be reached at all — almost always a missing cross-account role.
    error: str | None = None
    # One service refused; the rest of the account is still real. Keyed by service name so
    # the operator knows which statement to add to the role.
    service_errors: dict[str, str] = Field(default_factory=dict, alias="serviceErrors")

    model_config = {"populate_by_name": True}


class AwsInventoryReport(BaseModel):
    accounts: list[AccountInventory] = Field(default_factory=list)
    # False means "one account, because AWS did not offer a list" — standalone account or
    # no organizations:ListAccounts. It is not a failure, but it explains a short report.
    organization: bool = False
    role_name: str = Field(default=_DEFAULT_ROLE, alias="roleName")
    # Which regions were read. An empty alarm list means something different depending
    # on this, so it travels with the report rather than being assumed by the reader.
    regions: list[str] = Field(default_factory=list)
    configured: bool = False
    # Same contract as the cost report and the Lambda overview: empty with a reason beats
    # an empty list that reads as "you own nothing".
    error: str | None = None

    model_config = {"populate_by_name": True}


def _iso(value: Any) -> str | None:
    """boto returns datetimes; pydantic and JSON want strings."""
    return value.isoformat() if hasattr(value, "isoformat") else (value or None)


def _items(client, operation: str, *path: str, **kwargs) -> Iterator[dict]:
    """Every item from every page of a paginated call, flattened.

    `path` walks into the page (CloudFront buries its list under `DistributionList.Items`);
    the last step must land on the list.
    """
    for page in client.get_paginator(operation).paginate(**kwargs):
        node: Any = page
        for step in path:
            node = node.get(step) or {}
        if isinstance(node, list):
            yield from node


def _guard(errors: dict[str, str], service: str, read: Callable[[], list]) -> list:
    """Run one service read; a refusal names the service instead of emptying the account."""
    try:
        return read()
    except Exception as exc:
        errors[service] = f"{type(exc).__name__}: {exc}"
        return []


def _guard_dict(errors: dict[str, str], service: str, read: Callable[[], dict]) -> dict:
    """Same contract for a read that answers with a mapping rather than a list."""
    try:
        return read()
    except Exception as exc:
        errors[service] = f"{type(exc).__name__}: {exc}"
        return {}


def _hosted_zones(session) -> list[HostedZone]:
    r53 = session.client("route53", region_name=_GLOBAL_REGION)
    return sorted(
        (
            HostedZone(
                # AWS returns "/hostedzone/Z123"; the ID everything else takes is "Z123".
                id=(zone.get("Id") or "").rsplit("/", 1)[-1],
                name=zone.get("Name", ""),
                recordCount=int(zone.get("ResourceRecordSetCount") or 0),
                private=bool((zone.get("Config") or {}).get("PrivateZone")),
            )
            for zone in _items(r53, "list_hosted_zones", "HostedZones")
        ),
        key=lambda z: z.name,
    )


def _domains(session) -> list[Domain]:
    """Registered domains, plus registrations/transfers still in flight.

    route53domains is us-east-1 only — not "global-ish", genuinely one region — so a client
    built in the tenant's region fails to resolve rather than returning an empty list.
    """
    client = session.client("route53domains", region_name=_GLOBAL_REGION)
    domains = [
        Domain(
            name=item.get("DomainName", ""),
            status="registered",
            expiry=_iso(item.get("Expiry")),
            autoRenew=item.get("AutoRenew"),
        )
        for item in _items(client, "list_domains", "Domains")
    ]
    registered = {d.name for d in domains}
    for op in _items(client, "list_operations", "Operations"):
        # ponytail: an in-flight operation on a domain already listed (a renewal, a DNSSEC
        # change) is dropped rather than shown twice. Surface it as an `operations` list of
        # its own if operators ask to see renewals mid-flight.
        name = op.get("DomainName") or ""
        if op.get("Status") in ("SUBMITTED", "IN_PROGRESS") and name not in registered:
            domains.append(
                Domain(name=name, status=op.get("Status", ""), pending=True, operation=op.get("Type"))
            )
    return sorted(domains, key=lambda d: d.name)


def _distributions(session) -> list[Distribution]:
    cf = session.client("cloudfront", region_name=_GLOBAL_REGION)
    out = []
    for item in _items(cf, "list_distributions", "DistributionList", "Items"):
        origins = (item.get("Origins") or {}).get("Items") or []
        out.append(
            Distribution(
                id=item.get("Id", ""),
                domainName=item.get("DomainName"),
                aliases=(item.get("Aliases") or {}).get("Items") or [],
                origin=origins[0].get("DomainName") if origins else None,
                enabled=bool(item.get("Enabled")),
                status=item.get("Status"),
            )
        )
    return sorted(out, key=lambda d: d.id)


def _bucket_region(s3, name: str) -> str | None:
    """`get_bucket_location`'s two historical special cases, plus a per-bucket refusal.

    None means us-east-1 (it predates the field), "EU" is the original eu-west-1 name. One
    bucket the role cannot locate must not cost us the other ninety-nine.
    """
    try:
        constraint = s3.get_bucket_location(Bucket=name).get("LocationConstraint")
    except Exception:
        return None
    return {None: "us-east-1", "": "us-east-1", "EU": "eu-west-1"}.get(constraint, constraint)


def _buckets(session) -> list[Bucket]:
    # ponytail: one get_bucket_location per bucket, serially. Fine at tens of buckets;
    # thread it or drop the region column if somebody connects an account with thousands.
    s3 = session.client("s3", region_name=_GLOBAL_REGION)
    return [
        Bucket(name=item["Name"], region=_bucket_region(s3, item["Name"]), created=_iso(item.get("CreationDate")))
        for item in sorted(s3.list_buckets().get("Buckets", []), key=lambda b: b.get("Name", ""))
    ]


def _alarms(session, regions: list[str]) -> list[Alarm]:
    """Alarms currently firing, across every region the tenant asked for.

    Regions come from the connector config rather than from `ec2:DescribeRegions`:
    iterating all ~17 enabled regions multiplies the call count for the majority of
    accounts that only use one, and an account that alarms in three regions knows which
    three. A region that refuses the read is skipped rather than failing the account —
    losing eu-west-1 should not also lose us-east-1.
    """
    found: list[Alarm] = []
    for region in regions:
        cw = session.client("cloudwatch", region_name=region)
        try:
            found.extend(
                Alarm(
                    name=item.get("AlarmName", ""),
                    metric=item.get("MetricName"),
                    region=region,
                    reason=item.get("StateReason"),
                    since=_iso(item.get("StateUpdatedTimestamp")),
                )
                for item in _items(cw, "describe_alarms", "MetricAlarms", StateValue="ALARM")
            )
        except Exception:
            continue
    return sorted(found, key=lambda a: (a.region or "", a.name))


def _tags(session, regions: list[str]) -> dict[str, dict[str, str]]:
    """Every tagged resource ARN -> its tags, via the Resource Groups Tagging API.

    One paginated call per region covers every taggable service at once, which is the
    only reason tags are affordable here: asking each service for its own tags would be
    a call per service per account. Tags are what make "spend by team" and "alarms in
    prod" answerable, so they are worth the one extra read.
    """
    out: dict[str, dict[str, str]] = {}
    for region in regions:
        api = session.client("resourcegroupstaggingapi", region_name=region)
        try:
            for item in _items(api, "get_resources", "ResourceTagMappingList"):
                arn = item.get("ResourceARN")
                if not arn:
                    continue
                out[arn] = {t.get("Key", ""): t.get("Value", "") for t in item.get("Tags", [])}
        except Exception:
            continue
    return out


def _users(session) -> list[IamUser]:
    iam = session.client("iam", region_name=_GLOBAL_REGION)
    return sorted(
        (
            IamUser(
                userName=item.get("UserName", ""),
                arn=item.get("Arn"),
                created=_iso(item.get("CreateDate")),
                passwordLastUsed=_iso(item.get("PasswordLastUsed")),
            )
            for item in _items(iam, "list_users", "Users")
        ),
        key=lambda u: u.user_name,
    )


def _assume(session, account_id: str, role_name: str, region: str):
    """A session in a member account, via the cross-account role Organizations installs."""
    import boto3

    creds = session.client("sts").assume_role(
        RoleArn=f"arn:aws:iam::{account_id}:role/{role_name}",
        RoleSessionName="LoveheartbeatInventory",
    )["Credentials"]
    return boto3.Session(
        aws_access_key_id=creds["AccessKeyId"],
        aws_secret_access_key=creds["SecretAccessKey"],
        aws_session_token=creds["SessionToken"],
        region_name=region,
    )


def _org_accounts(session) -> list[dict]:
    """Active member accounts, or [] when this is not (or cannot see) an organization."""
    try:
        org = session.client("organizations", region_name=_GLOBAL_REGION)
        return [a for a in _items(org, "list_accounts", "Accounts") if a.get("Status", "ACTIVE") == "ACTIVE"]
    except Exception:
        # Denied, or AWSOrganizationsNotInUseException on a standalone account. Both mean
        # "there is one account", which is an answer, not a failure.
        return []


def _collect(session, account_id: str, name: str | None, regions: list[str],
             connected: bool = False) -> AccountInventory:
    errors: dict[str, str] = {}
    tags = _guard_dict(errors, "resourcegroupstaggingapi", lambda: _tags(session, regions))
    return AccountInventory(
        accountId=account_id,
        name=name,
        connected=connected,
        regions=list(regions),
        hostedZones=_guard(errors, "route53", lambda: _hosted_zones(session)),
        domains=_guard(errors, "route53domains", lambda: _domains(session)),
        distributions=_guard(errors, "cloudfront", lambda: _distributions(session)),
        buckets=_guard(errors, "s3", lambda: _buckets(session)),
        alarms=_guard(errors, "cloudwatch", lambda: _alarms(session, regions)),
        users=_guard(errors, "iam", lambda: _users(session)),
        tags=tags,
        tagKeys=sorted({k for values in tags.values() for k in values}),
        serviceErrors=errors,
    )


def read_regions(cfg) -> list[str]:
    """The regions to read for this tenant: the primary first, then the extras.

    De-duplicated while preserving order, because `region` being repeated in `regions`
    is the obvious thing for an operator to do and would otherwise double every regional
    call and every alarm row.
    """
    ordered = [cfg.region, *(getattr(cfg, "regions", None) or [])]
    seen: dict[str, None] = {}
    for region in ordered:
        cleaned = str(region or "").strip()
        if cleaned:
            seen.setdefault(cleaned, None)
    return list(seen) or [_GLOBAL_REGION]


def inventory(tenant_id: str, role_name: str | None = None) -> AwsInventoryReport:
    """Per-account inventory for every AWS account this tenant's credential can reach."""
    cfg = lambda_service.get_config(tenant_id)
    if not cfg:
        return AwsInventoryReport(configured=False)

    # Explicit argument wins, then the saved config, then the role Organizations makes.
    role_name = role_name or getattr(cfg, "member_role_name", None) or _DEFAULT_ROLE
    regions = read_regions(cfg)
    # The role name and the region set both change the fan-out, so both change the
    # answer, so both belong in the key.
    cache_key = f"{tenant_id}|{role_name}|{','.join(regions)}"
    cached = _CACHE.get(cache_key)
    if cached and time.monotonic() - cached[0] < _TTL_SECONDS:
        return cached[1]

    try:
        base = lambda_service._session(cfg)
        connected_id = base.client("sts").get_caller_identity()["Account"]
    except Exception as exc:
        # Not cached: bad credentials are worth re-checking the moment they are fixed.
        return AwsInventoryReport(configured=True, roleName=role_name, error=f"{type(exc).__name__}: {exc}")

    org_accounts = _org_accounts(base)
    targets = [(a.get("Id", ""), a.get("Name")) for a in org_accounts] or [(connected_id, None)]

    def one(target: tuple[str, str | None]) -> AccountInventory:
        account_id, name = target
        if account_id == connected_id:
            # The management account already has the credential; assuming a role into
            # itself would fail, and OrganizationAccountAccessRole usually is not there.
            return _collect(base, account_id, name, regions, connected=True)
        try:
            member = _assume(base, account_id, role_name, cfg.region)
        except Exception as exc:
            return AccountInventory(accountId=account_id, name=name, error=f"{type(exc).__name__}: {exc}")
        return _collect(member, account_id, name, regions)

    # Serially this is ~6 calls per account plus one per bucket, which for a handful of
    # accounts runs past API Gateway's hard 29s integration timeout — so every cache miss
    # would 504 rather than return late. Each account already builds its own boto3
    # Session (sessions are not safe to share across threads; separate ones are), so the
    # fan-out parallelises without any other change.
    # ponytail: 8 threads, not a tuned pool. AWS throttling, not the pool, is the next
    # ceiling here — add backoff on the individual reads if you start seeing Throttling.
    with ThreadPoolExecutor(max_workers=min(8, len(targets))) as pool:
        accounts = list(pool.map(one, targets))

    report = AwsInventoryReport(
        accounts=accounts,
        organization=bool(org_accounts),
        roleName=role_name,
        regions=regions,
        configured=True,
    )
    _CACHE[cache_key] = (time.monotonic(), report)
    return report


def invalidate(tenant_id: str) -> None:
    """Drop this tenant's cached inventory — used when the AWS connection is re-saved."""
    for key in [k for k in _CACHE if k.split("|", 1)[0] == tenant_id]:
        _CACHE.pop(key, None)

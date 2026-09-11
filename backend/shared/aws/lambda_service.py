from __future__ import annotations

import json
import uuid
from collections import defaultdict, deque
from datetime import date, datetime, timedelta, timezone
from statistics import mean
from typing import Any, Deque

from shared.collector.cloudevents import CloudEvent, make_event
from shared.core import config_store, mock_data
from .dto import (
    AwsLambdaConfig,
    AwsLambdaFunction,
    AwsLambdaInvocationResponse,
    AwsLambdaInvokeRequest,
    AwsLambdaMetricPoint,
    AwsLambdaOverview,
)

# A tenant can connect more than one AWS account. They live in a single list row
# (`aws-accounts`); the pre-list `aws-lambda` row is still read when that one is absent,
# so an existing tenant's connection migrates itself on the next save.
_IN_MEMORY_ACCOUNTS: dict[str, list[AwsLambdaConfig]] = {}
_INTEGRATION = "aws-lambda"
_ACCOUNTS_INTEGRATION = "aws-accounts"
_MAX_INVOCATIONS = 200
_INVOCATIONS: dict[str, Deque[AwsLambdaInvocationResponse]] = defaultdict(lambda: deque(maxlen=_MAX_INVOCATIONS))


def _mask(value: str | None) -> str | None:
    if not value:
        return None
    if len(value) <= 6:
        return "***"
    return f"{value[:3]}...{value[-3:]}"


def list_configs(tenant_id: str) -> list[AwsLambdaConfig]:
    """Every AWS account this tenant has connected, in the order they were added."""
    cached = _IN_MEMORY_ACCOUNTS.get(tenant_id)
    if cached is not None:
        return cached
    raw = config_store.get_config(tenant_id, _ACCOUNTS_INTEGRATION)
    if raw:
        accounts = [AwsLambdaConfig.model_validate(item) for item in json.loads(raw)]
    else:
        legacy = config_store.get_config(tenant_id, _INTEGRATION)
        accounts = [AwsLambdaConfig.model_validate_json(legacy)] if legacy else []
    for index, account in enumerate(accounts):
        account.id = account.id or f"aws-{index + 1}"
    _IN_MEMORY_ACCOUNTS[tenant_id] = accounts
    return accounts


def get_config(tenant_id: str, connection_id: str | None = None) -> AwsLambdaConfig | None:
    """The named connection, or the tenant's first one.

    Callers that predate multiple accounts pass no id and keep reading the primary
    credential, which is the one a single-account tenant has.
    """
    accounts = list_configs(tenant_id)
    if connection_id:
        return next((a for a in accounts if a.id == connection_id), None)
    return accounts[0] if accounts else None


def _persist(tenant_id: str, accounts: list[AwsLambdaConfig]) -> None:
    _IN_MEMORY_ACCOUNTS[tenant_id] = accounts
    config_store.save_config(
        tenant_id,
        _ACCOUNTS_INTEGRATION,
        json.dumps([a.model_dump(by_alias=True, mode="json") for a in accounts]),
    )
    # Cost Explorer and inventory answers are cached for hours. Saving new credentials is
    # exactly when somebody is watching for the page to change, so the stale answers go
    # with them. Imported here rather than at module scope: both import this module.
    from . import cost, inventory

    cost.invalidate(tenant_id)
    inventory.invalidate(tenant_id)


def _keep_secrets(new: AwsLambdaConfig, old: AwsLambdaConfig) -> AwsLambdaConfig:
    """A blank or masked secret means "leave it alone", not "erase it".

    `config_status` masks secrets and the connect form prefills from it, so saving an
    edited region would otherwise post the mask back and wipe the credential.
    """
    for field in ("access_key_id", "secret_access_key", "external_id"):
        value = getattr(new, field)
        if not value or set(value) <= {"*"} or "..." in value:
            setattr(new, field, getattr(old, field))
    return new


def save_config(
    tenant_id: str, config: AwsLambdaConfig, connection_id: str | None = None
) -> dict[str, Any]:
    """Create or update one connection.

    With no id this updates the tenant's first connection — what the single-account form
    has always done — and creates it if there is none.
    """
    accounts = list(list_configs(tenant_id))
    target = connection_id or config.id or (accounts[0].id if accounts else None)
    for index, existing in enumerate(accounts):
        if existing.id == target:
            config.id = target
            accounts[index] = _keep_secrets(config, existing)
            break
    else:
        config.id = target or f"aws-{uuid.uuid4().hex[:8]}"
        accounts.append(config)
    _persist(tenant_id, accounts)
    return config_status(tenant_id, config.id)


def add_config(tenant_id: str, config: AwsLambdaConfig) -> dict[str, Any]:
    """Always a new connection. Separate from save_config so that "add an account" can
    never silently overwrite the one already there."""
    config.id = f"aws-{uuid.uuid4().hex[:8]}"
    _persist(tenant_id, [*list_configs(tenant_id), config])
    return config_status(tenant_id, config.id)


def delete_config(tenant_id: str, connection_id: str) -> bool:
    accounts = list_configs(tenant_id)
    remaining = [a for a in accounts if a.id != connection_id]
    if len(remaining) == len(accounts):
        return False
    _persist(tenant_id, remaining)
    return True


def config_status(tenant_id: str, connection_id: str | None = None) -> dict[str, Any]:
    return _status(get_config(tenant_id, connection_id))


def list_config_status(tenant_id: str) -> list[dict[str, Any]]:
    return [_status(cfg) for cfg in list_configs(tenant_id)]


def _status(cfg: AwsLambdaConfig | None) -> dict[str, Any]:
    return {
        "id": _INTEGRATION,
        "connectionId": cfg.id if cfg else None,
        "label": (cfg.label if cfg else None) or (cfg.id if cfg else None),
        "configured": cfg is not None,
        "source": "frontend" if cfg else "unset",
        "fields": {
            "id": cfg.id if cfg else None,
            "label": cfg.label if cfg else None,
            "region": cfg.region if cfg else None,
            "regions": ",".join(cfg.regions) if cfg else None,
            "member_role_name": cfg.member_role_name if cfg else None,
            "auth_method": cfg.auth_method if cfg else None,
            "access_key_id": _mask(cfg.access_key_id) if cfg else None,
            "secret_access_key": "***" if cfg and cfg.secret_access_key else None,
            "role_arn": cfg.role_arn if cfg else None,
            "external_id": _mask(cfg.external_id) if cfg else None,
            "function_prefixes": ",".join(cfg.function_prefixes) if cfg else None,
            "log_groups": ",".join(cfg.log_groups) if cfg else None,
            "collection_interval_seconds": str(cfg.collection_interval_seconds) if cfg else None,
        },
    }


def _empty_overview(cfg: AwsLambdaConfig | None, error: str | None = None) -> AwsLambdaOverview:
    """Zeros, plus why. What a tenant sees before connecting, or when AWS refused.

    This used to be `_demo_overview`, which fabricated three functions and a traffic
    curve for both cases — so a connection whose credentials AWS rejected rendered
    identically to a working one, and the page looked populated with numbers that
    belonged to nobody.
    """
    return AwsLambdaOverview(
        region=cfg.region if cfg else "us-east-1",
        configured=cfg is not None,
        source="error" if error else "none",
        functions=0,
        invocationsPerMinute=0,
        errorRate=0.0,
        avgDurationMs=0.0,
        throttles=0,
        activeAlarms=0,
        logGroups=len(cfg.log_groups) if cfg and cfg.log_groups else 0,
        metrics=[],
        functionList=[],
        error=error,
    )


def _demo_overview(cfg: AwsLambdaConfig | None) -> AwsLambdaOverview:
    region = cfg.region if cfg else "us-east-1"
    metrics = [
        AwsLambdaMetricPoint(time="10:00", invocations=120, errors=2, throttles=0, durationMs=245, concurrentExecutions=18),
        AwsLambdaMetricPoint(time="10:15", invocations=98, errors=1, throttles=0, durationMs=198, concurrentExecutions=15),
        AwsLambdaMetricPoint(time="10:30", invocations=145, errors=3, throttles=1, durationMs=310, concurrentExecutions=24),
        AwsLambdaMetricPoint(time="10:45", invocations=87, errors=0, throttles=0, durationMs=176, concurrentExecutions=13),
        AwsLambdaMetricPoint(time="11:00", invocations=134, errors=1, throttles=0, durationMs=226, concurrentExecutions=20),
    ]
    return AwsLambdaOverview(
        region=region,
        configured=cfg is not None,
        source="demo",
        functions=3,
        invocationsPerMinute=134,
        errorRate=round(sum(m.errors for m in metrics) / max(sum(m.invocations for m in metrics), 1) * 100, 2),
        avgDurationMs=round(mean(m.duration_ms for m in metrics), 1),
        throttles=sum(m.throttles for m in metrics),
        activeAlarms=1,
        logGroups=len(cfg.log_groups) if cfg and cfg.log_groups else 3,
        metrics=metrics,
        functionList=[
            AwsLambdaFunction(name="data-processor", runtime="python3.11", memoryMb=512, timeoutSeconds=60),
            AwsLambdaFunction(name="alert-normalizer", runtime="nodejs20.x", memoryMb=256, timeoutSeconds=30),
            AwsLambdaFunction(name="ticket-dispatcher", runtime="python3.11", memoryMb=256, timeoutSeconds=45),
        ],
    )


def _session(cfg: AwsLambdaConfig):
    import boto3

    kwargs: dict[str, Any] = {"region_name": cfg.region}
    if cfg.auth_method == "access-keys" and cfg.access_key_id and cfg.secret_access_key:
        kwargs["aws_access_key_id"] = cfg.access_key_id
        kwargs["aws_secret_access_key"] = cfg.secret_access_key
    session = boto3.Session(**kwargs)
    if cfg.auth_method == "iam-role" and cfg.role_arn:
        sts = session.client("sts")
        assume_kwargs: dict[str, Any] = {"RoleArn": cfg.role_arn, "RoleSessionName": "LoveheartbeatLambdaMonitoring"}
        if cfg.external_id:
            assume_kwargs["ExternalId"] = cfg.external_id
        creds = sts.assume_role(**assume_kwargs)["Credentials"]
        return boto3.Session(
            aws_access_key_id=creds["AccessKeyId"],
            aws_secret_access_key=creds["SecretAccessKey"],
            aws_session_token=creds["SessionToken"],
            region_name=cfg.region,
        )
    return session


_CONNECTOR_IDENTITY: dict[str, Any] | None = None


def connector_identity() -> dict[str, Any]:
    """The IAM role ARN a customer's cross-account role must trust.

    Derived from this process's own credentials rather than configured: STS reports the
    assumed-role ARN it is running as, and the role ARN is a mechanical rewrite of it.
    A configured value is one more thing to keep in step with reality and to get wrong
    after a stack rename; asking is always right.

    Cached for the life of the execution environment because it cannot change without
    the function being replaced.
    """
    global _CONNECTOR_IDENTITY
    if _CONNECTOR_IDENTITY is not None:
        return _CONNECTOR_IDENTITY
    try:
        import boto3

        identity = boto3.client("sts").get_caller_identity()
        arn = identity.get("Arn", "")
        account = identity.get("Account")
        # arn:aws:sts::123:assumed-role/<role>/<session> -> arn:aws:iam::123:role/<role>
        role_arn = arn
        if ":assumed-role/" in arn:
            role = arn.split(":assumed-role/", 1)[1].split("/", 1)[0]
            role_arn = f"arn:aws:iam::{account}:role/{role}"
        _CONNECTOR_IDENTITY = {"principal_arn": role_arn, "account": account,
                               "resolved": True, "error": None}
    except Exception as exc:
        # Locally there are no credentials at all, which is normal — the page shows the
        # reason instead of a fabricated ARN somebody might paste into a trust policy.
        _CONNECTOR_IDENTITY = {"principal_arn": None, "account": None,
                               "resolved": False, "error": f"{type(exc).__name__}: {exc}"}
    return _CONNECTOR_IDENTITY


def test_connection(tenant_id: str, connection_id: str | None = None) -> dict[str, Any]:
    """Can we actually use this connection, and for what?

    Saving a connection told the operator nothing: `config_status` reports that fields
    are stored, never that AWS accepts them, so a wrong role ARN or a trust policy that
    does not name us looked identical to a working setup until some other page came back
    empty hours later.

    Each capability is probed separately and reported separately, because they fail
    separately and for different reasons — a role can be perfectly good for CloudWatch
    and missing `ce:GetCostAndUsage`, and "it doesn't work" is not a useful answer to
    that. The probes are the cheapest call that proves the permission, not a full read.
    """
    cfg = get_config(tenant_id, connection_id)
    if not cfg:
        return {"configured": False, "ok": False,
                "error": "No AWS connection saved for this organization.",
                "checks": []}

    try:
        session = _session(cfg)
        identity = session.client("sts").get_caller_identity()
    except Exception as exc:
        # The first hop failed, so every capability below is unreachable and probing them
        # would return five copies of the same error.
        return {
            "configured": True, "ok": False, "account": None,
            "error": f"{type(exc).__name__}: {exc}",
            "hint": "Check the role ARN, the external ID, and that the role's trust "
                    "policy names this deployment's ConnectorPrincipalArn.",
            "checks": [],
        }

    from . import inventory as inventory_mod

    regions = inventory_mod.read_regions(cfg)
    primary = regions[0]

    def _probe(name: str, label: str, call, needs: str):
        try:
            call()
            return {"id": name, "label": label, "ok": True, "permission": needs, "error": None}
        except Exception as exc:
            return {"id": name, "label": label, "ok": False, "permission": needs,
                    "error": f"{type(exc).__name__}: {exc}"}

    checks = [
        _probe("organizations", "Discover member accounts",
               lambda: session.client("organizations", region_name="us-east-1").list_accounts(MaxResults=1),
               "organizations:ListAccounts"),
        _probe("cloudwatch", f"Read CloudWatch alarms ({primary})",
               lambda: session.client("cloudwatch", region_name=primary).describe_alarms(MaxRecords=1),
               "cloudwatch:DescribeAlarms"),
        _probe("lambda", f"List Lambda functions ({primary})",
               lambda: session.client("lambda", region_name=primary).list_functions(MaxItems=1),
               "lambda:ListFunctions"),
        _probe("cost", "Read Cost Explorer",
               lambda: session.client("ce", region_name="us-east-1").get_cost_and_usage(
                   TimePeriod={"Start": (date.today() - timedelta(days=2)).isoformat(),
                               "End": (date.today() - timedelta(days=1)).isoformat()},
                   Granularity="DAILY", Metrics=["UnblendedCost"]),
               "ce:GetCostAndUsage"),
        _probe("tags", f"Read resource tags ({primary})",
               lambda: session.client("resourcegroupstaggingapi", region_name=primary)
                              .get_resources(ResourcesPerPage=1),
               "tag:GetResources"),
    ]
    return {
        "configured": True,
        # The credential works. An individual capability being refused is a finding to
        # show, not a failed connection — most of the product works without Cost Explorer.
        "ok": True,
        "account": identity.get("Account"),
        "arn": identity.get("Arn"),
        "regions": regions,
        "error": None,
        "checks": checks,
    }


def _matches(name: str, prefixes: list[str]) -> bool:
    return not prefixes or any(name.startswith(prefix) for prefix in prefixes)


def _sum_metric(cw, metric_name: str, function_name: str, start: datetime, end: datetime) -> float:
    response = cw.get_metric_statistics(
        Namespace="AWS/Lambda",
        MetricName=metric_name,
        Dimensions=[{"Name": "FunctionName", "Value": function_name}],
        StartTime=start,
        EndTime=end,
        Period=300,
        Statistics=["Sum"],
    )
    return float(sum(point.get("Sum", 0) for point in response.get("Datapoints", [])))


def _avg_duration(cw, function_name: str, start: datetime, end: datetime) -> float:
    response = cw.get_metric_statistics(
        Namespace="AWS/Lambda",
        MetricName="Duration",
        Dimensions=[{"Name": "FunctionName", "Value": function_name}],
        StartTime=start,
        EndTime=end,
        Period=300,
        Statistics=["Average"],
    )
    values = [float(point.get("Average", 0)) for point in response.get("Datapoints", [])]
    return round(mean(values), 1) if values else 0.0


def lambda_overview(tenant_id: str, connection_id: str | None = None) -> AwsLambdaOverview:
    cfg = get_config(tenant_id, connection_id)
    if not cfg:
        return _demo_overview(None) if mock_data.enabled() else _empty_overview(None)
    try:
        session = _session(cfg)
        lambda_client = session.client("lambda")
        cw = session.client("cloudwatch")
        functions: list[AwsLambdaFunction] = []
        paginator = lambda_client.get_paginator("list_functions")
        for page in paginator.paginate():
            for item in page.get("Functions", []):
                name = item.get("FunctionName", "")
                if not _matches(name, cfg.function_prefixes):
                    continue
                functions.append(
                    AwsLambdaFunction(
                        name=name,
                        arn=item.get("FunctionArn"),
                        runtime=item.get("Runtime"),
                        memoryMb=item.get("MemorySize"),
                        timeoutSeconds=item.get("Timeout"),
                        lastModified=item.get("LastModified"),
                    )
                )
        end = datetime.now(timezone.utc)
        start = end - timedelta(minutes=15)
        invocations = errors = throttles = 0.0
        durations: list[float] = []
        for fn in functions:
            invocations += _sum_metric(cw, "Invocations", fn.name, start, end)
            errors += _sum_metric(cw, "Errors", fn.name, start, end)
            throttles += _sum_metric(cw, "Throttles", fn.name, start, end)
            duration = _avg_duration(cw, fn.name, start, end)
            if duration:
                durations.append(duration)
        point = AwsLambdaMetricPoint(
            time=end.strftime("%H:%M"),
            invocations=int(invocations),
            errors=int(errors),
            throttles=int(throttles),
            durationMs=round(mean(durations), 1) if durations else 0.0,
            concurrentExecutions=0,
        )
        return AwsLambdaOverview(
            region=cfg.region,
            configured=True,
            source="cloudwatch",
            functions=len(functions),
            invocationsPerMinute=round(invocations / 15),
            errorRate=round(errors / max(invocations, 1) * 100, 2),
            avgDurationMs=point.duration_ms,
            throttles=int(throttles),
            activeAlarms=0,
            logGroups=len(cfg.log_groups),
            metrics=[point],
            functionList=functions,
        )
    except Exception as exc:
        if mock_data.enabled():
            return _demo_overview(cfg)
        return _empty_overview(cfg, f"{type(exc).__name__}: {exc}")


def anomaly_events(tenant_id: str) -> list[CloudEvent]:
    cfg = get_config(tenant_id) or AwsLambdaConfig()
    overview = lambda_overview(tenant_id)
    events: list[CloudEvent] = []
    if overview.error_rate >= cfg.error_rate_threshold:
        events.append(
            make_event(
                source="aws.lambda",
                type="aws.lambda.error_rate",
                tenant_id=tenant_id,
                correlationid=f"lambda-errors-{overview.region}",
                data={
                    "platform": "aws-lambda",
                    "severity": "critical",
                    "title": "Lambda error rate threshold breached",
                    "description": f"Lambda error rate is {overview.error_rate}%.",
                    "region": overview.region,
                    "error_rate": overview.error_rate,
                },
            )
        )
    if overview.throttles >= cfg.throttle_threshold:
        events.append(
            make_event(
                source="aws.lambda",
                type="aws.lambda.throttled",
                tenant_id=tenant_id,
                correlationid=f"lambda-throttles-{overview.region}",
                data={
                    "platform": "aws-lambda",
                    "severity": "warning",
                    "title": "Lambda throttling detected",
                    "description": f"{overview.throttles} Lambda throttles detected.",
                    "region": overview.region,
                    "throttles": overview.throttles,
                },
            )
        )
    if overview.avg_duration_ms >= cfg.duration_ms_threshold:
        events.append(
            make_event(
                source="aws.lambda",
                type="aws.lambda.duration",
                tenant_id=tenant_id,
                correlationid=f"lambda-duration-{overview.region}",
                data={
                    "platform": "aws-lambda",
                    "severity": "warning",
                    "title": "Lambda duration threshold breached",
                    "description": f"Average Lambda duration is {overview.avg_duration_ms} ms.",
                    "region": overview.region,
                    "avg_duration_ms": overview.avg_duration_ms,
                },
            )
        )
    return events


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _event_for_invocation(response: AwsLambdaInvocationResponse) -> CloudEvent:
    severity = "critical" if response.status == "failed" else "info"
    return make_event(
        source="aws.lambda",
        type="aws.lambda.invoked" if response.status != "failed" else "aws.lambda.invoke_failed",
        tenant_id=response.tenant_id,
        correlationid=response.id,
        data={
            "platform": "aws-lambda",
            "severity": severity,
            "title": f"Lambda invoke {response.status}: {response.function_name}",
            "description": response.message,
            "function_name": response.function_name,
            "invocation_id": response.id,
            "request_id": response.request_id,
            "status_code": response.status_code,
            "dry_run": response.dry_run,
            "requested_by": response.requested_by,
        },
    )


def _decode_payload(stream: Any) -> Any:
    if not stream:
        return None
    raw = stream.read()
    if not raw:
        return None
    text = raw.decode("utf-8", errors="replace")
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return text


def _record_invocation(tenant_id: str, response: AwsLambdaInvocationResponse) -> AwsLambdaInvocationResponse:
    _INVOCATIONS[tenant_id].appendleft(response)
    return response


def invoke_lambda(tenant_id: str, body: AwsLambdaInvokeRequest) -> tuple[AwsLambdaInvocationResponse, CloudEvent]:
    invocation_id = f"lambda-inv-{uuid.uuid4().hex[:10]}"
    if body.dry_run:
        response = AwsLambdaInvocationResponse(
            id=invocation_id,
            tenantId=tenant_id,
            functionName=body.function_name,
            status="dry_run_started",
            invocationType=body.invocation_type,
            requestedBy=body.requested_by,
            dryRun=True,
            message="AWS Lambda invocation recorded as a dry run. No function was invoked.",
            createdAt=_now_iso(),
            providerResponse={"payload": body.payload, "qualifier": body.qualifier},
        )
        return _record_invocation(tenant_id, response), _event_for_invocation(response)

    cfg = get_config(tenant_id)
    if not cfg:
        response = AwsLambdaInvocationResponse(
            id=invocation_id,
            tenantId=tenant_id,
            functionName=body.function_name,
            status="failed",
            invocationType=body.invocation_type,
            requestedBy=body.requested_by,
            dryRun=False,
            message="AWS Lambda is not configured for this tenant.",
            createdAt=_now_iso(),
            providerResponse={"error": "missing aws-lambda config"},
        )
        return _record_invocation(tenant_id, response), _event_for_invocation(response)

    try:
        client = _session(cfg).client("lambda")
        invoke_kwargs: dict[str, Any] = {
            "FunctionName": body.function_name,
            "InvocationType": body.invocation_type,
            "Payload": json.dumps(body.payload).encode("utf-8"),
        }
        if body.qualifier:
            invoke_kwargs["Qualifier"] = body.qualifier
        if body.client_context:
            invoke_kwargs["ClientContext"] = body.client_context
        result = client.invoke(**invoke_kwargs)
        metadata = result.get("ResponseMetadata", {})
        function_error = result.get("FunctionError")
        status = "failed" if function_error else "submitted"
        if body.invocation_type == "RequestResponse" and not function_error:
            status = "succeeded"
        response = AwsLambdaInvocationResponse(
            id=invocation_id,
            tenantId=tenant_id,
            functionName=body.function_name,
            status=status,
            invocationType=body.invocation_type,
            requestedBy=body.requested_by,
            dryRun=False,
            message=(
                f"Lambda {body.function_name} returned {function_error}."
                if function_error
                else f"Lambda {body.function_name} invocation submitted."
            ),
            createdAt=_now_iso(),
            requestId=metadata.get("RequestId"),
            statusCode=result.get("StatusCode"),
            executedVersion=result.get("ExecutedVersion"),
            payload=_decode_payload(result.get("Payload")),
            logResult=result.get("LogResult"),
            providerResponse={
                "payload": body.payload,
                "function_error": function_error,
                "response_metadata": metadata,
                "qualifier": body.qualifier,
            },
        )
    except Exception as exc:
        response = AwsLambdaInvocationResponse(
            id=invocation_id,
            tenantId=tenant_id,
            functionName=body.function_name,
            status="failed",
            invocationType=body.invocation_type,
            requestedBy=body.requested_by,
            dryRun=False,
            message=f"Lambda invocation failed: {exc}",
            createdAt=_now_iso(),
            providerResponse={"error": str(exc), "payload": body.payload, "qualifier": body.qualifier},
        )
    return _record_invocation(tenant_id, response), _event_for_invocation(response)


def invocation_history(tenant_id: str, limit: int = 50) -> list[AwsLambdaInvocationResponse]:
    return list(_INVOCATIONS.get(tenant_id, ()))[:limit]


def find_invocation(tenant_id: str, invocation_id: str) -> AwsLambdaInvocationResponse | None:
    for invocation in _INVOCATIONS.get(tenant_id, ()):
        if invocation.id == invocation_id:
            return invocation
    return None


def retry_invocation(tenant_id: str, invocation_id: str, dry_run: bool) -> tuple[AwsLambdaInvocationResponse, CloudEvent]:
    prior = find_invocation(tenant_id, invocation_id)
    if not prior:
        response = AwsLambdaInvocationResponse(
            id=f"lambda-inv-{uuid.uuid4().hex[:10]}",
            tenantId=tenant_id,
            functionName="unknown",
            status="failed",
            invocationType="RequestResponse",
            dryRun=dry_run,
            message=f"Lambda invocation {invocation_id} was not found.",
            createdAt=_now_iso(),
            providerResponse={"error": "not_found", "prior_invocation_id": invocation_id},
        )
        return response, _event_for_invocation(response)
    payload = prior.provider_response.get("payload", {}) if prior.provider_response else {}
    body = AwsLambdaInvokeRequest(
        functionName=prior.function_name,
        invocationType=prior.invocation_type if prior.invocation_type in {"RequestResponse", "Event", "DryRun"} else "RequestResponse",
        payload=payload if isinstance(payload, dict) else {},
        requestedBy=prior.requested_by,
        dryRun=dry_run,
    )
    return invoke_lambda(tenant_id, body)

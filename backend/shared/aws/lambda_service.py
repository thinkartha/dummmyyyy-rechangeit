from __future__ import annotations

import json
import uuid
from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone
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

_IN_MEMORY_CONFIGS: dict[str, AwsLambdaConfig] = {}
_INTEGRATION = "aws-lambda"
_MAX_INVOCATIONS = 200
_INVOCATIONS: dict[str, Deque[AwsLambdaInvocationResponse]] = defaultdict(lambda: deque(maxlen=_MAX_INVOCATIONS))


def _mask(value: str | None) -> str | None:
    if not value:
        return None
    if len(value) <= 6:
        return "***"
    return f"{value[:3]}...{value[-3:]}"


def save_config(tenant_id: str, config: AwsLambdaConfig) -> dict[str, Any]:
    _IN_MEMORY_CONFIGS[tenant_id] = config
    config_store.save_config(tenant_id, _INTEGRATION, config.model_dump_json(by_alias=True))
    # Cost Explorer and inventory answers are cached for hours. Saving new credentials is
    # exactly when somebody is watching for the page to change, so the stale answers go
    # with them. Imported here rather than at module scope: both import this module.
    from . import cost, inventory

    cost.invalidate(tenant_id)
    inventory.invalidate(tenant_id)
    return config_status(tenant_id)


def get_config(tenant_id: str) -> AwsLambdaConfig | None:
    cfg = _IN_MEMORY_CONFIGS.get(tenant_id)
    if cfg:
        return cfg
    raw = config_store.get_config(tenant_id, _INTEGRATION)
    if raw:
        cfg = AwsLambdaConfig.model_validate_json(raw)
        _IN_MEMORY_CONFIGS[tenant_id] = cfg
    return cfg


def config_status(tenant_id: str) -> dict[str, Any]:
    cfg = get_config(tenant_id)
    return {
        "id": _INTEGRATION,
        "configured": cfg is not None,
        "source": "frontend" if cfg else "unset",
        "fields": {
            "region": cfg.region if cfg else None,
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


def lambda_overview(tenant_id: str) -> AwsLambdaOverview:
    cfg = get_config(tenant_id)
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

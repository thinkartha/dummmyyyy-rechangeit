from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


class AwsLambdaConfig(BaseModel):
    region: str = "us-east-1"
    auth_method: Literal["default-chain", "access-keys", "iam-role"] = Field(
        default="default-chain", alias="authMethod"
    )
    access_key_id: str | None = Field(default=None, alias="accessKeyId")
    secret_access_key: str | None = Field(default=None, alias="secretAccessKey", repr=False)
    role_arn: str | None = Field(default=None, alias="roleArn")
    external_id: str | None = Field(default=None, alias="externalId")
    function_prefixes: list[str] = Field(default_factory=list, alias="functionPrefixes")
    log_groups: list[str] = Field(default_factory=list, alias="logGroups")
    collection_interval_seconds: int = Field(default=300, alias="collectionIntervalSeconds")
    error_rate_threshold: float = Field(default=5.0, alias="errorRateThreshold")
    duration_ms_threshold: float = Field(default=1000.0, alias="durationMsThreshold")
    throttle_threshold: int = Field(default=1, alias="throttleThreshold")

    model_config = {"populate_by_name": True}


class AwsLambdaFunction(BaseModel):
    name: str
    arn: str | None = None
    runtime: str | None = None
    memory_mb: int | None = Field(default=None, alias="memoryMb")
    timeout_seconds: int | None = Field(default=None, alias="timeoutSeconds")
    last_modified: str | None = Field(default=None, alias="lastModified")

    model_config = {"populate_by_name": True}


class AwsLambdaMetricPoint(BaseModel):
    time: str
    invocations: int
    errors: int
    throttles: int
    duration_ms: float = Field(alias="durationMs")
    concurrent_executions: int = Field(default=0, alias="concurrentExecutions")

    model_config = {"populate_by_name": True}


class AwsLambdaOverview(BaseModel):
    region: str
    configured: bool
    source: Literal["demo", "cloudwatch", "none", "error"]
    functions: int
    invocations_per_minute: int = Field(alias="invocationsPerMinute")
    error_rate: float = Field(alias="errorRate")
    avg_duration_ms: float = Field(alias="avgDurationMs")
    throttles: int
    active_alarms: int = Field(alias="activeAlarms")
    log_groups: int = Field(alias="logGroups")
    metrics: list[AwsLambdaMetricPoint]
    function_list: list[AwsLambdaFunction] = Field(default_factory=list, alias="functionList")
    # Why the numbers are zero. A connected account that AWS refused has to say so —
    # the page used to show fabricated functions instead and read as healthy.
    error: str | None = None

    model_config = {"populate_by_name": True}


class AwsLambdaInvokeRequest(BaseModel):
    function_name: str = Field(alias="functionName")
    payload: dict[str, Any] = Field(default_factory=dict)
    invocation_type: Literal["RequestResponse", "Event", "DryRun"] = Field(
        default="RequestResponse", alias="invocationType"
    )
    qualifier: str | None = None
    client_context: str | None = Field(default=None, alias="clientContext")
    requested_by: str | None = Field(default=None, alias="requestedBy")
    dry_run: bool = Field(default=True, alias="dryRun")

    model_config = {"populate_by_name": True}


class AwsLambdaInvocationResponse(BaseModel):
    id: str
    tenant_id: str = Field(alias="tenantId")
    function_name: str = Field(alias="functionName")
    status: str
    invocation_type: str = Field(alias="invocationType")
    requested_by: str | None = Field(default=None, alias="requestedBy")
    dry_run: bool = Field(alias="dryRun")
    message: str
    created_at: str = Field(alias="createdAt")
    request_id: str | None = Field(default=None, alias="requestId")
    status_code: int | None = Field(default=None, alias="statusCode")
    executed_version: str | None = Field(default=None, alias="executedVersion")
    payload: Any | None = None
    log_result: str | None = Field(default=None, alias="logResult")
    event_id: str | None = Field(default=None, alias="eventId")
    provider_response: dict[str, Any] | None = Field(default=None, alias="providerResponse")

    model_config = {"populate_by_name": True}

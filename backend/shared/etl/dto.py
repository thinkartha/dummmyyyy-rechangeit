from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field, field_validator


class TalendRunEvent(BaseModel):
    task_id: str | None = None
    task_name: str | None = None
    artifact_name: str | None = None
    task_execution_id: str
    status: str
    start_time: str | None = None
    finish_time: str | None = None
    environment_id: str | None = None
    workspace_id: str | None = None
    engine_id: str | None = None
    engine_type: str | None = None
    error_message: str | None = None
    rows_rejected: int | None = None
    records_processed: int | None = None
    metrics: dict[str, Any] | None = None
    raw: dict[str, Any] | None = None


class BoomiExecutionEvent(BaseModel):
    account: str | None = None
    atom_id: str | None = Field(default=None, alias="atomId")
    atom_name: str | None = Field(default=None, alias="atomName")
    execution_id: str = Field(alias="executionId")
    execution_time: str | None = Field(default=None, alias="executionTime")
    execution_type: str | None = Field(default=None, alias="executionType")
    message: str | None = None
    process_id: str | None = Field(default=None, alias="processId")
    process_name: str | None = Field(default=None, alias="processName")
    recorded_date: str | None = Field(default=None, alias="recordedDate")
    status: str
    execution_duration: int | None = Field(default=None, alias="executionDuration")
    inbound_document_count: int | None = Field(default=None, alias="inboundDocumentCount")
    inbound_error_document_count: int | None = Field(default=None, alias="inboundErrorDocumentCount")
    outbound_document_count: int | None = Field(default=None, alias="outboundDocumentCount")
    raw: dict[str, Any] | None = None

    model_config = {"populate_by_name": True}


class DatabricksRunEvent(BaseModel):
    """Normalized Lakeflow Jobs run returned by the Databricks Jobs API."""

    job_id: str
    job_name: str | None = None
    run_id: str
    run_name: str | None = None
    life_cycle_state: str
    result_state: str | None = None
    state_message: str | None = None
    start_time: int | None = None
    end_time: int | None = None
    run_duration: int | None = None
    trigger: str | None = None
    run_page_url: str | None = None
    task_count: int = 0
    failed_task_count: int = 0
    raw: dict[str, Any] | None = None


class EtlIncident(BaseModel):
    id: str
    tenant_id: str
    platform: str
    execution_id: str
    title: str
    severity: str
    status: str = "active"
    root_cause: str
    recommended_action: str
    source_system: str | None = None
    target_system: str | None = None
    created_at: str


class EtlIntegrationHealth(BaseModel):
    id: str
    name: str
    status: str
    mode: str
    configured: bool
    last_event_at: str | None = None
    events_24h: int = 0
    failed_jobs: int = 0
    last_error: str | None = None


class CommandCenterConfigMixin(BaseModel):
    selected_env: str = Field(default="production", alias="selectedEnv")
    auth_method: str = Field(default="api-key", alias="authMethod")
    endpoint: str | None = None
    connection_timeout_seconds: int = Field(default=30, alias="connectionTimeoutSeconds")
    retry_attempts: int = Field(default=3, alias="retryAttempts")
    rate_limit_per_minute: int = Field(default=100, alias="rateLimitPerMinute")
    batch_size: int = Field(default=50, alias="batchSize")
    custom_headers: dict[str, str] = Field(default_factory=dict, alias="customHeaders")
    verify_ssl: bool = Field(default=True, alias="verifySsl")
    metadata_repository_url: str | None = Field(default=None, alias="metadataRepositoryUrl")
    project_workspace: str | None = Field(default=None, alias="projectWorkspace")
    version: str | None = "latest"

    model_config = {"populate_by_name": True}


class TalendConfig(CommandCenterConfigMixin):
    base_url: str | None = "https://api.us.cloud.talend.com"
    # Credentials are supplied only by the backend runtime (for example,
    # through a secret manager injected as environment variables).  The UI
    # persists scope and endpoint settings, never Talend credentials.
    client_id: str | None = None
    client_secret: str | None = Field(default=None, repr=False)
    bearer_token: str | None = Field(default=None, repr=False)
    environment_id: str | None = None
    workspace_id: str | None = None
    execution_endpoint_template: str | None = Field(default=None, alias="executionEndpointTemplate")
    last_days: str = "1"
    status_filter: str | None = None

    @field_validator("environment_id", "workspace_id", "bearer_token", "client_id", "client_secret", mode="before")
    @classmethod
    def strip_whitespace(cls, v: str | None) -> str | None:
        return v.strip() if isinstance(v, str) else v


class BoomiConfig(CommandCenterConfigMixin):
    account_id: str
    base_url: str | None = "https://api.boomi.com/api/rest/v1"
    username: str
    token: str = Field(repr=False)
    atom_id: str | None = Field(default=None, alias="atomId")
    environment_id: str | None = Field(default=None, alias="environmentId")
    execution_endpoint_template: str | None = Field(default=None, alias="executionEndpointTemplate")
    hours_back: int = 24


class IntegrationConfigStatus(BaseModel):
    id: str
    configured: bool
    source: str
    fields: dict[str, str | None]


class EtlSummaryItem(BaseModel):
    name: str
    status: str
    jobsPerDay: int
    successRate: float
    failureRate: float
    lastRun: str
    totalJobs: int
    environments: list[str]


class EtlExecuteRequest(BaseModel):
    job_id: str | None = Field(default=None, alias="jobId")
    job_name: str | None = Field(default=None, alias="jobName")
    environment: str = "production"
    parameters: dict[str, Any] = Field(default_factory=dict)
    requested_by: str | None = Field(default=None, alias="requestedBy")
    dry_run: bool = Field(default=True, alias="dryRun")

    model_config = {"populate_by_name": True}


class EtlExecutionResponse(BaseModel):
    id: str
    tenant_id: str
    platform: str
    job_id: str | None = None
    job_name: str
    status: str
    requested_by: str | None = None
    dry_run: bool
    message: str
    created_at: str
    event_id: str | None = None
    provider_response: dict[str, Any] | None = Field(default=None, alias="providerResponse")

    model_config = {"populate_by_name": True}

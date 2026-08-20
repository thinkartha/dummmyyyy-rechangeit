from __future__ import annotations

import base64
import json
import logging
import os
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from typing import Any

from .dto import BoomiConfig, TalendConfig
from shared.core import databricks as databricks_config

log = logging.getLogger("pinghold.etl.client")

# With expanded task details, some Databricks workspaces cap Jobs runs/list below
# the API's general page maximum (the service currently reports a maximum of 26).
# Use 25 and paginate so the connector works across workspace configurations.
_DATABRICKS_RUNS_PAGE_SIZE = 25


def _json_request(
    method: str,
    url: str,
    *,
    headers: dict[str, str] | None = None,
    payload: dict[str, Any] | None = None,
    timeout: int = 20,
) -> Any:
    body = json.dumps(payload).encode("utf-8") if payload is not None else None
    req = urllib.request.Request(url, data=body, method=method)
    req.add_header("Accept", "application/json")
    if body is not None:
        req.add_header("Content-Type", "application/json")
    for key, value in (headers or {}).items():
        req.add_header(key, value)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:  # noqa: S310 - configured admin URLs only.
            raw = resp.read().decode("utf-8")
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"{method} {url} failed with HTTP {exc.code}: {detail[:500]}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"{method} {url} failed: {exc}") from exc


def _format_endpoint(template: str, values: dict[str, Any]) -> str:
    try:
        return template.format(**{k: v or "" for k, v in values.items()})
    except KeyError as exc:
        raise RuntimeError(f"Execution endpoint template references unknown field {exc}") from exc


def _execution_id(data: dict[str, Any], fallback: str) -> str:
    for key in (
        "executionId",
        "execution_id",
        "taskExecutionId",
        "task_execution_id",
        "runId",
        "run_id",
        "requestId",
        "request_id",
        "id",
    ):
        value = data.get(key)
        if value:
            return str(value)
    nested = data.get("execution") if isinstance(data.get("execution"), dict) else None
    if nested:
        return _execution_id(nested, fallback)
    return fallback


class TalendClient:
    def __init__(self, config: TalendConfig | None = None) -> None:
        self.env = os.getenv("TALEND_ENV", "us")
        self.base_url = (
            (config.endpoint or config.base_url) if config else os.getenv("TALEND_BASE_URL", f"https://api.{self.env}.cloud.talend.com")
        ).rstrip("/")
        self.client_id = (config.client_id if config and config.client_id else os.getenv("TALEND_CLIENT_ID"))
        self.client_secret = (config.client_secret if config and config.client_secret else os.getenv("TALEND_CLIENT_SECRET"))
        # A service-account access token or personal access token. The UI
        # sends the token value only to the backend, where it is stored through
        # the integration configuration store and never returned to clients.
        self.api_token = (
            config.bearer_token if config and config.bearer_token else os.getenv("TALEND_API_TOKEN")
        )
        self.environment_id = config.environment_id if config else os.getenv("TALEND_ENVIRONMENT_ID")
        self.workspace_id = config.workspace_id if config else os.getenv("TALEND_WORKSPACE_ID")
        self.execution_endpoint_template = (
            config.execution_endpoint_template
            if config
            else os.getenv("TALEND_EXECUTION_ENDPOINT_TEMPLATE")
        )
        self.last_days = config.last_days if config else os.getenv("TALEND_LAST_DAYS", "1")
        self.status_filter = config.status_filter if config else os.getenv("TALEND_STATUS_FILTER", "")
        self._token: str | None = None

    @property
    def configured(self) -> bool:
        return bool((self.api_token or (self.client_id and self.client_secret)) and (self.environment_id or self.workspace_id))

    def _bearer(self) -> str:
        if self.api_token:
            return self.api_token
        if self._token:
            return self._token
        auth = base64.b64encode(f"{self.client_id}:{self.client_secret}".encode("utf-8")).decode("ascii")
        data = _json_request(
            "POST",
            f"{self.base_url}/security/oauth/token",
            headers={"Authorization": f"Basic {auth}"},
            payload={"audience": self.base_url, "grant_type": "client_credentials"},
        )
        token = data.get("access_token") or data.get("token")
        if not token:
            raise RuntimeError("Talend token response did not include access_token")
        self._token = str(token)
        return self._token

    def task_executions(self) -> list[dict[str, Any]]:
        """Return recent ETL executions through Talend Observability.

        This is the endpoint used by the Command Center monitoring UI.  It is
        intentionally separate from task-launch APIs, which have a different
        request contract.
        """
        payload: dict[str, Any] = {
            "category": "ETL",
            "limit": 50,
            "offset": 0,
        }
        if self.environment_id:
            payload["environmentId"] = self.environment_id
        if self.workspace_id:
            payload["filters"] = [{
                "field": "workspaceId",
                "operator": "in",
                "value": [self.workspace_id],
            }]
        data = _json_request(
            "POST",
            f"{self.base_url}/monitoring/observability/executions/search",
            headers={"Authorization": f"Bearer {self._bearer()}"},
            payload=payload,
        )
        if isinstance(data, dict):
            for key in ("items", "executions", "results", "data", "content"):
                if isinstance(data.get(key), list):
                    return data[key]
        if isinstance(data, list):
            return data
        return []

    def verify_connection(self) -> None:
        """Validate both OAuth credentials and access to the configured scope."""
        if not self.configured:
            raise RuntimeError(
                "Talend requires TALEND_API_TOKEN or TALEND_CLIENT_ID/TALEND_CLIENT_SECRET, "
                "and an environment or workspace ID"
            )
        self.task_executions()

    def component_metrics(self, run_id: str) -> dict[str, Any] | None:
        try:
            return _json_request(
                "GET",
                f"{self.base_url}/monitoring/observability/executions/{run_id}/component",
                headers={"Authorization": f"Bearer {self._bearer()}"},
            )
        except RuntimeError as exc:
            log.info("Talend metrics unavailable for %s: %s", run_id, exc)
            return None

    def launch_task(
        self,
        task_id: str,
        *,
        parameters: dict[str, Any] | None = None,
        fallback_execution_id: str,
    ) -> dict[str, Any]:
        if not self.configured:
            raise RuntimeError("Talend is not configured for live execution")
        if not task_id:
            raise RuntimeError("Talend execution requires a task id")

        values = {
            "task_id": task_id,
            "environment_id": self.environment_id,
            "workspace_id": self.workspace_id,
        }
        template = self.execution_endpoint_template or "/processing/executions"
        path = _format_endpoint(template, values)
        url = path if path.startswith("http") else f"{self.base_url}/{path.lstrip('/')}"

        request_parameters = dict(parameters or {})
        provider_payload = request_parameters.pop("providerPayload", None)
        payload = provider_payload if isinstance(provider_payload, dict) else {}
        payload.setdefault("executable", task_id)
        payload.setdefault("logLevel", "WARN")
        if request_parameters:
            payload.setdefault("parameters", request_parameters)

        data = _json_request(
            "POST",
            url,
            headers={"Authorization": f"Bearer {self._bearer()}"},
            payload=payload,
        )
        return {
            "execution_id": _execution_id(data, fallback_execution_id),
            "status": str(data.get("status") or data.get("state") or "submitted"),
            "raw": data,
        }


class BoomiClient:
    def __init__(self, config: BoomiConfig | None = None) -> None:
        self.account_id = config.account_id if config else os.getenv("BOOMI_ACCOUNT_ID")
        self.base_url = (
            (config.endpoint or config.base_url) if config else os.getenv("BOOMI_BASE_URL", "https://api.boomi.com/api/rest/v1")
        ).rstrip("/")
        self.username = config.username if config else os.getenv("BOOMI_USERNAME")
        self.token = config.token if config else os.getenv("BOOMI_TOKEN")
        self.atom_id = config.atom_id if config else os.getenv("BOOMI_ATOM_ID")
        self.environment_id = config.environment_id if config else os.getenv("BOOMI_ENVIRONMENT_ID")
        self.execution_endpoint_template = (
            config.execution_endpoint_template
            if config
            else os.getenv("BOOMI_EXECUTION_ENDPOINT_TEMPLATE")
        )
        self.hours_back = config.hours_back if config else int(os.getenv("BOOMI_HOURS_BACK", "24"))

    @property
    def configured(self) -> bool:
        return bool(self.account_id and self.username and self.token)

    def _auth_header(self) -> dict[str, str]:
        auth = base64.b64encode(f"{self.username}:{self.token}".encode("utf-8")).decode("ascii")
        return {"Authorization": f"Basic {auth}"}

    def execution_records(self) -> list[dict[str, Any]]:
        url = f"{self.base_url}/{self.account_id}/ExecutionRecord/query"
        cutoff = (datetime.now(timezone.utc) - timedelta(hours=self.hours_back)).replace(microsecond=0).isoformat()
        payload = {
            "QueryFilter": {
                "expression": {
                    "operator": "GREATER_THAN",
                    "property": "executionTime",
                    "argument": [cutoff],
                }
            },
            "QuerySort": {"sortField": [{"fieldName": "executionTime", "sortOrder": "DESC"}]},
        }
        data = _json_request("POST", url, headers=self._auth_header(), payload=payload)
        result = data.get("result")
        return result if isinstance(result, list) else []

    def launch_process(
        self,
        process_id: str,
        *,
        parameters: dict[str, Any] | None = None,
        fallback_execution_id: str,
    ) -> dict[str, Any]:
        if not self.configured:
            raise RuntimeError("Boomi is not configured for live execution")
        if not process_id:
            raise RuntimeError("Boomi execution requires a process id")

        values = {
            "account_id": self.account_id,
            "process_id": process_id,
            "atom_id": self.atom_id,
            "environment_id": self.environment_id,
        }
        template = self.execution_endpoint_template or "/{account_id}/executeProcess"
        path = _format_endpoint(template, values)
        url = path if path.startswith("http") else f"{self.base_url}/{path.lstrip('/')}"

        request_parameters = dict(parameters or {})
        atom_id = request_parameters.pop("atomId", None) or request_parameters.pop("atom_id", None) or self.atom_id
        environment_id = (
            request_parameters.pop("environmentId", None)
            or request_parameters.pop("environment_id", None)
            or self.environment_id
        )
        provider_payload = request_parameters.pop("providerPayload", None)
        payload = provider_payload if isinstance(provider_payload, dict) else {}
        payload.setdefault("processId", process_id)
        if atom_id:
            payload.setdefault("atomId", atom_id)
        if environment_id:
            payload.setdefault("environmentId", environment_id)
        if request_parameters:
            payload.setdefault("parameters", request_parameters)

        data = _json_request("POST", url, headers=self._auth_header(), payload=payload)
        return {
            "execution_id": _execution_id(data, fallback_execution_id),
            "status": str(data.get("status") or data.get("state") or "submitted"),
            "raw": data,
        }


class DatabricksJobsClient:
    """Lakeflow Jobs client using the workspace credentials already saved by Loveheartbeat."""

    def __init__(self, tenant_id: str | None = None) -> None:
        credentials = databricks_config.credentials(tenant_id)
        self.host = credentials["host"]
        self.token = credentials["token"]
        self.base_url = f"https://{self.host}" if self.host else ""

    @property
    def configured(self) -> bool:
        # Jobs API calls do not require the SQL warehouse used by the Delta query panel.
        return bool(self.host and self.token)

    def _headers(self) -> dict[str, str]:
        return {"Authorization": f"Bearer {self.token}"}

    def job_runs(self, limit: int = 100) -> list[dict[str, Any]]:
        if not self.configured:
            return []

        runs: list[dict[str, Any]] = []
        page_token: str | None = None
        while len(runs) < limit:
            page_size = min(_DATABRICKS_RUNS_PAGE_SIZE, limit - len(runs))
            params: dict[str, Any] = {"limit": page_size, "expand_tasks": "true"}
            if page_token:
                params["page_token"] = page_token
            data = _json_request(
                "GET",
                f"{self.base_url}/api/2.2/jobs/runs/list?{urllib.parse.urlencode(params)}",
                headers=self._headers(),
            )
            page = data.get("runs", []) if isinstance(data, dict) else []
            if not isinstance(page, list):
                break
            runs.extend(item for item in page if isinstance(item, dict))
            page_token = data.get("next_page_token") if isinstance(data, dict) else None
            if not page_token or not page:
                break
        return runs[:limit]

    def verify_connection(self) -> None:
        if not self.configured:
            raise RuntimeError("Databricks requires a workspace host and token")
        _json_request(
            "GET",
            f"{self.base_url}/api/2.2/jobs/list?limit=1",
            headers=self._headers(),
        )

    def launch_job(
        self,
        job_id: str,
        *,
        parameters: dict[str, Any] | None = None,
        fallback_execution_id: str,
    ) -> dict[str, Any]:
        if not self.configured:
            raise RuntimeError("Databricks is not configured for live execution")
        try:
            numeric_job_id = int(job_id)
        except (TypeError, ValueError) as exc:
            raise RuntimeError("Databricks execution requires a numeric job id") from exc

        request_parameters = dict(parameters or {})
        provider_payload = request_parameters.pop("providerPayload", None)
        payload = dict(provider_payload) if isinstance(provider_payload, dict) else {"job_id": numeric_job_id}
        payload.setdefault("job_id", numeric_job_id)
        if request_parameters:
            payload.setdefault("job_parameters", request_parameters)

        data = _json_request(
            "POST",
            f"{self.base_url}/api/2.2/jobs/run-now",
            headers=self._headers(),
            payload=payload,
        )
        return {
            "execution_id": _execution_id(data, fallback_execution_id),
            "status": str(data.get("state") or data.get("status") or "submitted"),
            "raw": data,
        }

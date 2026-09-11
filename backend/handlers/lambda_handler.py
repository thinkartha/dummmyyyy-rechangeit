"""AWS Lambda handler for the Loveheartbeat FastAPI backend.

Exposes `handler` for the `AWS::Serverless::Function` configured in template.yaml.
The function is wired to API Gateway with a Cognito authorizer so the
Authorization header is passed through to the application.

Runtime secrets are pulled from Secrets Manager here, before the application is imported.
Two reasons for fetching rather than passing them as template environment variables:
plaintext never lands in the function configuration or in CloudFormation events, and the
secret can be rotated without redeploying the stack. The ordering matters — core.auth
reads its configuration at import time, so the import below must stay after the fetch.
"""

import json
import logging
import os

log = logging.getLogger("pinghold.lambda")


def _load_secrets() -> None:
    """Merge pinghold/app-secrets-<stage> into the environment.

    setdefault, not assignment: an explicit environment variable on the function still
    wins, which is what makes a one-off override possible without editing the secret.
    A failure here is deliberately not swallowed into a silent fallback — core.auth
    refuses to start without a real JWT secret, which is the behaviour we want if
    Secrets Manager is unreachable.
    """
    secret_id = os.getenv("PINGHOLD_SECRETS_ARN")
    if not secret_id:
        log.warning("PINGHOLD_SECRETS_ARN unset — skipping Secrets Manager load")
        return

    import boto3

    payload = boto3.client("secretsmanager").get_secret_value(SecretId=secret_id)["SecretString"]
    for key, value in json.loads(payload).items():
        if isinstance(value, str) and value:
            os.environ.setdefault(key, value)
    log.info("Loaded runtime secrets from %s", secret_id)


_load_secrets()

from mangum import Mangum  # noqa: E402  — must follow _load_secrets()

from handlers.api import app  # noqa: E402  — core.auth reads env at import time

# Default API Gateway stage prefix handling.
_http_handler = Mangum(app, lifespan="off", api_gateway_base_path=os.getenv("STAGE", "/"))


def handler(event, context=None):
    """One function, two kinds of event.

    EventBridge invokes this same Lambda on a schedule to run the connector sweep (see
    handlers/scheduled.py). Mangum raises on anything that is not an HTTP event, so the
    two are separated here rather than by deploying a second function — a second
    function would be a copy of this one's role, environment and code for the sake of
    one `if`.

    The test is EventBridge's own envelope, not the absence of HTTP keys: a malformed
    API Gateway event should still reach Mangum and fail as a bad request, not silently
    trigger a poll of every tenant.
    """
    if isinstance(event, dict) and event.get("source") == "aws.events":
        from handlers.scheduled import handler as scheduled_handler

        return scheduled_handler(event, context)
    return _http_handler(event, context)

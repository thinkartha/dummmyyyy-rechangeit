import logging
import os

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from shared.core.auth import get_current_principal
from handlers.routers import (
    health, rca, ingest, finops, slo, auth, correlation, drift, stream, etl, aws, elk,
    admin, observability, databricks, gateways, databases, ai_models, alerts,
    data_observability, automation, alert_management, tenant,
)
from shared.pipeline import runtime
from shared.pipeline import stream as stream_consumer
from shared.etl import pollers
from shared.elk import close_elasticsearch_client

# Lambda should not start background pollers/threads on every cold start.
_DISABLE_BACKGROUND = os.getenv("AWS_LAMBDA_FUNCTION_NAME") or os.getenv("DISABLE_BACKGROUND_TASKS")

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Loveheartbeat API", version="0.0.1")

_LOCAL_ORIGINS = [f"http://localhost:{p}" for p in (3000, 3001, 3002, 3003)]
# Browsers send Origin with no trailing slash, and CORSMiddleware matches exactly:
# a stored "https://loveheartbeat.com/" silently drops the header on every response,
# which surfaces as a CORS error in the browser and a normal 200 in curl.
_FRONTEND_URL = os.getenv("PINGHOLD_FRONTEND_URL", "").rstrip("/")
if not _FRONTEND_URL:
    logging.warning(
        "PINGHOLD_FRONTEND_URL unset — browser requests from the deployed frontend "
        "will fail CORS. Set it to the frontend origin, e.g. https://loveheartbeat.com"
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=_LOCAL_ORIGINS + ([_FRONTEND_URL] if _FRONTEND_URL else []),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth is enforced here, not at API Gateway: get_current_principal accepts Cognito
# tokens, local JWTs, and API keys, while the gateway authorizer only accepted the
# first — which locked out the global admin and the login route itself.
_auth = [Depends(get_current_principal)]

# health is public; auth guards its own routes (login/register must stay reachable).
app.include_router(health.router)
app.include_router(auth.router)
# Tenant resolution is public: the UI calls it before it has a session, to learn
# which organization the slug it is running under belongs to.
app.include_router(tenant.router)
app.include_router(gateways.customer_agent_router)
app.include_router(gateways.telemetry_router)

for _router in (rca, ingest, finops, slo, admin, correlation, drift, stream, etl, aws, elk,
                observability, databricks, gateways, databases, ai_models, alerts,
                data_observability, automation, alert_management):
    app.include_router(_router.router, dependencies=_auth)


@app.on_event("startup")
def _startup() -> None:
    if _DISABLE_BACKGROUND:
        logging.getLogger(__name__).info("Background tasks disabled (Lambda/disabled env)")
        return
    # Subscribe pipeline audit handlers and seed the demo incident.
    runtime.init()
    # Start the background Kafka consumer (no-op without a broker).
    stream_consumer.start()
    # Start configured live ETL pollers. Manual poll endpoints remain available per tenant.
    pollers.start_configured()


@app.on_event("shutdown")
def _shutdown() -> None:
    # Close Elasticsearch connection
    close_elasticsearch_client()

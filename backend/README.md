# LoveHeartBeat backend (AWS Lambda)

Multi-tenant observability APIs. One FastAPI application served through Mangum behind
API Gateway, plus a few standalone Lambda handlers for the tenant/health surface.

## Layout

| Path | Purpose |
|------|---------|
| `handlers/lambda_handler.py` | Lambda entrypoint (`handler`) — loads secrets, then Mangum |
| `handlers/api.py` | FastAPI app: CORS, auth dependency, router mounting |
| `handlers/routers/` | HTTP routes, one module per product area |
| `handlers/health.py`, `example.py`, `organizations.py` | Standalone event-in/event-out handlers |
| `handlers/cognito_triggers.py` | Cognito pre-signup / post-confirmation triggers |
| `shared/core/` | Domain services — auth, orgs, users, gateways, alerts, automation, … |
| `shared/pipeline/` | Detection, correlation, clustering, RCA, service graph |
| `shared/etl/` | ETL platform clients, DTOs, mappers, pollers, store |
| `shared/elk/` | Elasticsearch client, indexer, queries, OTel mapping |
| `shared/collector/` | CloudEvents envelope + ingestion |
| `shared/aws/`, `slo/`, `finops/`, `drift/`, `contracts/` | Lambda integration, error budgets, cost, drift, RCA contracts |
| `shared/tenant.py` | Host / `X-Tenant-Slug` → `org_id` |
| `shared/response.py` | API Gateway response envelopes |
| `events/` | Sample API Gateway events, one per route family |

## Tenant resolution

Every request resolves to exactly one `org_id`, in this order:

1. Verified JWT / Cognito claim `org_id` (authenticated requests)
2. `solo-<sub>` for an authenticated user with no organization
3. `Host: <slug>.loveheartbeat.com` → slug → `org_id`
4. `X-Tenant-Slug: <slug>` header (local clients without wildcard DNS)
5. `X-Tenant-Id` header (dev/test override)

`shared/core/tenancy.py` implements this for the FastAPI routes and delegates steps 3–4
to `shared/tenant.py`, which the standalone handlers use directly — so both paths agree
on which organization a request belongs to.

## Route families

`/health` · `/api/v1/tenant` · `/organizations` · `/auth` · `/observability` ·
`/observability/agents` · `/gateways` · `/integrations/etl` · `/integrations/aws/lambda` ·
`/alerts` · `/alert-management` · `/automation` · `/ai-models` · `/databases` ·
`/data-observability` · `/databricks` · `/finops` · `/slo` · `/drift` ·
`/correlated-incidents` · `/incidents/{id}/rca` · `/logs` · `/metrics` · `/traces` ·
`/ingest` · `/admin`

Full list at `/docs` when running locally.

## AWS connector IAM policy

The AWS integration (`shared/aws/`) reads through one role per tenant — the `roleArn` on
`PUT /api/v1/integrations/aws/lambda/config`, assumed with the tenant's `externalId`. This
is everything it calls; anything missing comes back as an `error` on the response rather
than as zeros, so a short answer here shows up as a reason on the page.

`GET /api/v1/integrations/aws/inventory` additionally discovers member accounts with
`organizations:ListAccounts` and re-reads each one through `OrganizationAccountAccessRole`
(overridable with `?roleName=`). No account list is stored anywhere — a standalone account
or a denied `ListAccounts` simply returns the connected account alone.

Attach to the role the customer creates for us:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "LambdaMonitoring",
      "Effect": "Allow",
      "Action": [
        "lambda:ListFunctions",
        "lambda:GetFunction",
        "lambda:InvokeFunction",
        "cloudwatch:GetMetricStatistics"
      ],
      "Resource": "*"
    },
    {
      "Sid": "CloudCost",
      "Effect": "Allow",
      "Action": ["ce:GetCostAndUsage", "ce:GetCostForecast"],
      "Resource": "*"
    },
    {
      "Sid": "Inventory",
      "Effect": "Allow",
      "Action": [
        "route53:List*",
        "route53domains:List*",
        "cloudfront:List*",
        "s3:ListAllMyBuckets",
        "s3:GetBucketLocation",
        "cloudwatch:DescribeAlarms",
        "iam:ListUsers",
        "organizations:ListAccounts"
      ],
      "Resource": "*"
    },
    {
      "Sid": "FanOutToMemberAccounts",
      "Effect": "Allow",
      "Action": "sts:AssumeRole",
      "Resource": "arn:aws:iam::*:role/OrganizationAccountAccessRole"
    }
  ]
}
```

Notes:

- All of it is read-only except `lambda:InvokeFunction`, which backs the explicit
  invoke/retry buttons. Drop that one statement to make the role strictly read-only.
- The `Inventory` statement is also needed in each **member** account's
  `OrganizationAccountAccessRole` — the org-created role is `AdministratorAccess`, which
  already covers it; a hand-rolled replacement needs these actions.
- `organizations:ListAccounts` only works from the organization's management account. A
  member-account credential returns its own account only, which is a valid answer.
- The trust policy on the role should name our account as principal and require the
  `externalId` the tenant entered, so the ARN alone is not enough to assume it.
- AWS has **no public API for payment methods or billing contacts** — card details are
  console-only, so no policy grants access to them and no endpoint here reports them.

## Local

```bash
cd backend
pip install -r requirements.txt

# Serve the API
PYTHONPATH=. uvicorn handlers.api:app --reload --port 8000

# Or replay a sample API Gateway event through the Lambda entrypoint
PYTHONPATH=. python -c "
import json
from handlers.lambda_handler import handler
event = json.load(open('events/observability-status.json'))
print(handler(event, type('C', (), {'aws_request_id': 'local'})()))
"

# Standalone handlers
PYTHONPATH=. python -c "
from handlers.organizations import tenant_context_handler
print(tenant_context_handler({'headers': {'Host': 'rootvyana.loveheartbeat.com'}}, None))
"
```

Without configuration the API runs in demo mode: stores fall back to memory, unconnected
integrations return `501` with the reason, and auth accepts the dev API key
`dev-admin-key`. `GET /health/store` reports which stores are actually persistent —
worth checking before trusting anything you wrote.

## Environment

| Variable | Purpose |
|----------|---------|
| `PINGHOLD_JWT_SECRET` | Signing secret for native login tokens (required in production) |
| `PINGHOLD_API_KEYS` | API keys and their roles |
| `PINGHOLD_FRONTEND_URL` | Frontend origin for CORS — unset means browsers fail, curl succeeds |
| `PINGHOLD_SECRETS_ARN` | Secrets Manager secret merged into the environment at cold start |
| `PINGHOLD_USERS_TABLE`, `PINGHOLD_RECORDS_TABLE` | DynamoDB tables; memory fallback without them |
| `ELASTICSEARCH_URL` | ELK backend for logs/metrics/traces |
| `DISABLE_BACKGROUND_TASKS` | Skip pollers and consumers (set automatically on Lambda) |

## Deploy sketch

1. Package `handlers/` + `shared/` with `requirements.txt` for Lambda
2. API Gateway HTTP API → `handlers.lambda_handler.handler`
3. Wildcard custom domain `*.loveheartbeat.com` so `Host` carries the slug
4. DynamoDB tables for users and records; Secrets Manager for runtime secrets
5. Wire per-org IdP callbacks (Okta / SAML / OIDC) or native auth

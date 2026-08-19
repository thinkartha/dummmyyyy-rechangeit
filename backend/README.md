# LoveHeartBeat backend (AWS Lambda)

Multi-tenant SaaS APIs. Tenant is resolved from:

1. `Host: <slug>.loveheartbeat.com` (production)
2. `X-Tenant-Slug` header (local / API clients)

## Layout

- `handlers/` — Lambda entrypoints
- `shared/tenant.py` — slug → `org_id` resolution
- `shared/response.py` — API Gateway responses

## Design target

Shared platform for **~30,000 organizations** (trial → enterprise).
Every read/write is scoped by `org_id`. Auth is per-org Okta/SSO or native login.

## Local smoke test

```bash
cd backend
PYTHONPATH=. python -c "
from handlers.organizations import tenant_context_handler
event = {'headers': {'Host': 'rootvyana.loveheartbeat.com'}}
print(tenant_context_handler(event, None))
"
```

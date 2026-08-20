# Middleware — ETL / ELT pipelines

Batch and scheduled jobs: **extract → transform → load**, always scoped to one
organization. Runs on Lambda, Step Functions, ECS, or Glue.

## Layout

| Path | Purpose |
|------|---------|
| `pipelines/` | Runnable jobs (compose E → T → L) |
| `extractors/` | Sources — ETL platform APIs, CSV, later S3/DB |
| `transformers/` | Normalize vendor rows into CloudEvents |
| `loaders/` | Destinations — LoveHeartBeat ingest API, stdout |
| `sample_data/` | Local fixtures |
| `_backend.py` | Puts `backend/` on `sys.path` so jobs reuse `shared/` |

## Jobs

### `pipelines/etl_sync.py` — ETL platform sync

Pulls run/execution records from every ETL platform a tenant has connected
(Talend, Dell Boomi, Databricks), maps them to CloudEvents, and posts them to the
backend's ingest API so they land in ETL Monitoring, alerts, and RCA.

```bash
cd middleware
pip install -r requirements.txt
PYTHONPATH=. python -m pipelines.etl_sync rootvyana
PYTHONPATH=. python -m pipelines.etl_sync --demo   # self-check, no vendor/backend needed
```

| Env var | Default | Purpose |
|---------|---------|---------|
| `LHB_API_BASE_URL` | `http://localhost:8000` | Backend base URL |
| `LHB_API_KEY` | — | Sent as `X-API-Key` when the backend requires one |

Credentials for each platform come from the tenant's saved connector config in the
backend (`shared/etl/store.py`) — the job never holds vendor secrets itself. A platform
the org has not connected is skipped, not an error.

### `pipelines/example_pipeline.py` — minimal E → T → L

```bash
PYTHONPATH=. python -m pipelines.example_pipeline
```

## Why jobs import from `backend/`

The vendor clients, DTOs, and CloudEvent mappers live in `backend/shared/etl/` because
the API serves manual-poll endpoints from the same code. `_backend.py` adds that path
rather than vendoring a second copy that would drift the first time a vendor renames a
field. If middleware ever deploys separately, promote `shared/` to an installable package.

## Tenant safety

Every job takes an org slug / `org_id` and stamps it on every event it produces. Never
run a job without one, and never let one run mix tenants.

## Where each product area gets its data

| Observability area | Middleware role |
|--------------------|-----------------|
| ETL Monitoring | `pipelines/etl_sync.py` — Talend, Boomi, Databricks run status |
| Cloud / cost | Pull CUR / billing exports multi-account |
| AI cost & usage | Pull provider usage (OpenAI, Anthropic, …) |
| Alerts | Ingested events feed clustering and RCA in the backend |

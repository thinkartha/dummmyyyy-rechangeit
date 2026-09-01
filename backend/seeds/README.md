# Demo database

A throwaway Postgres with real problems in it, for exercising the database-monitoring
page against something other than sample rows.

```sh
docker run -d --name lhb-demo-db \
  -e POSTGRES_USER=lhb -e POSTGRES_PASSWORD=lhbdemo -e POSTGRES_DB=commerce \
  -p 55432:5432 postgres:16-alpine

docker exec -i lhb-demo-db psql -U lhb -d commerce < backend/seeds/demo_commerce.sql
```

Then register it under **Integrations → Databases**, or from a shell:

```sh
curl -X POST localhost:8000/api/v1/databases \
  -H 'Authorization: Bearer <token>' -H 'Content-Type: application/json' \
  -d '{"name":"commerce","dsn":"postgresql://lhb:lhbdemo@127.0.0.1:55432/commerce"}'
```

## What is wrong with it, on purpose

| Finding | Where | What was done to it |
|---|---|---|
| Schema drift | `prod.orders` ↔ `stage.orders` | `currency` exists only in prod, `promo_code` only in stage, `status` and `total` have different types |
| Schema drift | `prod.customers` ↔ `stage.customers` | soft-delete column added to prod only |
| Volume drop | `prod.daily_events` | 900 rows/day for 57 days, then 55/day for the last four |
| Duplicate index | `prod.orders` | `idx_orders_customer` and `idx_orders_customer_dup` on the same column |
| Redundant index | `prod.orders` | `(status)` is a prefix of `(status, placed_at)` |
| Unused index | several | never scanned since the last statistics reset |
| Duplicate rows | `prod.payments` | 120 rows inserted twice, byte for byte |
| No primary key | `prod.payments`, `prod.audit_log` | nothing rejects a repeat |

`prod.order_items` loads at a steady rate and is deliberately clean — a detector that
flags it flags everything.

The database is left **operationally healthy**: connections, latency and cache hit
ratio are all fine, so `/databases/health` reports green while `/databases/findings`
reports thirteen problems. That gap is the point of the page.

Tear down with `docker rm -f lhb-demo-db`. Nothing here is meant to outlive a demo —
the password is in this file.

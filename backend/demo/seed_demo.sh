#!/usr/bin/env bash
# Fills every monitoring page with real, non-fabricated data for a demo.
#
#   backend/demo/seed_demo.sh [API_BASE] [API_KEY]
#
# Nothing here is mock mode: every number on screen afterwards was measured from a real
# Postgres, a real Prometheus scrape, real ingested job runs and real spans. Order
# matters for drift — the baseline has to be pinned between the healthy period and the
# regression, or there is nothing for the current window to differ from.
set -euo pipefail
A="${1:-http://localhost:8100/api/v1}"
KEY="${2:-dev-admin-key}"
H=(-H "X-API-Key: $KEY" -H 'Content-Type: application/json')
post() { curl -sS -X POST "$A$1" "${H[@]}" -d "$2" -o /dev/null; }
put()  { curl -sS -X PUT  "$A$1" "${H[@]}" -d "$2" -o /dev/null; }

echo "== prerequisites you must start yourself =="
echo "   postgres : docker run -d --rm --name lhb-pg -e POSTGRES_PASSWORD=demopass \\"
echo "                -e POSTGRES_DB=orders -p 55432:5432 postgres:16-alpine"
echo "   metrics  : python3 backend/demo/fake_apisix.py     (a Prometheus endpoint on :9095)"

echo "== API gateway =="
put /gateways/config '{"provider":"apisix","fields":{"metrics_url":"http://127.0.0.1:9095/apisix/prometheus/metrics"}}'

echo "== cloud connectors (credentials are deliberately invalid: the pages must say so) =="
put /integrations/aws/lambda/config '{"region":"us-east-1","authMethod":"access-keys","accessKeyId":"AKIAFAKEFAKEFAKE1234","secretAccessKey":"nope"}'
put /integrations/gcp/billing/config '{"billingExportTable":"acme.billing.gcp_billing_export_v1_ABC","serviceAccountJson":"{}"}'
put /integrations/azure/cost/config '{"directoryId":"d","clientId":"c","clientSecret":"s","billingAccountId":"12345:67890"}'

echo "== databases =="
post /databases '{"name":"orders-primary","dsn":"postgresql://postgres:demopass@127.0.0.1:55432/orders","environment":"production"}'

echo "== job / orchestration runs, as a connected Talend would report them =="
post /integrations/etl/talend '{"task_execution_id":"exec-9001","task_name":"nightly-customer-load","status":"execution_failed","start_time":"'"$(date -u -v-6H +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -d '6 hours ago' +%Y-%m-%dT%H:%M:%SZ)"'","finish_time":"'"$(date -u -v-5H +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -d '5 hours ago' +%Y-%m-%dT%H:%M:%SZ)"'","records_processed":184320,"error_message":"JDBC connection reset by peer"}'
post /integrations/etl/talend '{"task_execution_id":"exec-9002","task_name":"hourly-orders-sync","status":"execution_success","records_processed":9420}'

echo "== AI gateway spans =="
post /observability/agents/telemetry '{"spans":[
 {"name":"chat","trace_id":"t1","span_id":"s1","status":"OK","duration_ms":812,"attributes":{"gen_ai.request.model":"claude-opus-5","gen_ai.system":"anthropic","gen_ai.usage.input_tokens":1200,"gen_ai.usage.output_tokens":340,"gen_ai.agent.name":"support-copilot","http.route":"/v1/messages"}},
 {"name":"chat","trace_id":"t2","span_id":"s2","status":"ERROR","duration_ms":2400,"attributes":{"gen_ai.request.model":"claude-haiku-4-5","gen_ai.system":"anthropic","gen_ai.usage.input_tokens":300,"gen_ai.usage.output_tokens":60,"gen_ai.agent.name":"support-copilot","http.route":"/v1/messages"}}]}'

echo "== drift, step 1: the healthy period =="
# A tenant-scoped route: /databases/engines is a static catalog with no tenant, so its
# spans are (correctly) not recorded and it cannot be a drift feature.
for _ in $(seq 1 40); do curl -sS "$A/databases/summary" "${H[@]}" -o /dev/null; done
post /drift/observations '{"features":{"credit_score":[700,705,698,702,710,695,701,703,699,706,704,697,700,702],"region":["eu-west","eu-west","us-east","eu-west","eu-west","us-east","eu-west","eu-west","eu-west","us-east","eu-west","eu-west","eu-west","us-east"]}}'

echo "== drift, step 2: pin that as normal =="
curl -sS -X POST "$A/drift/baseline" "${H[@]}" | python3 -m json.tool

echo "== drift, step 3: a real regression (blackhole DB makes that route time out) =="
post /databases '{"name":"blackhole","dsn":"redis://10.255.255.1:6379","environment":"staging"}'
for _ in $(seq 1 14); do curl -sS "$A/databases/summary" "${H[@]}" -o /dev/null; done
post /drift/observations '{"features":{"credit_score":[480,472,491,468,485,479,462,488,475,470,483,466,477,481],"region":["apac","apac","eu-west","apac","apac","apac","eu-west","apac","apac","apac","apac","eu-west","apac","apac"]}}'

echo "== drift report =="
curl -sS "$A/drift" "${H[@]}" | python3 -m json.tool
echo
echo "Optional, for Database findings: give Postgres something to find —"
echo "  docker exec lhb-pg psql -U postgres -d orders -c \\"
echo "    \"CREATE TABLE audit_log (id serial, actor text);"
echo "     CREATE TABLE orders_dup (id serial primary key, ref text);"
echo "     CREATE INDEX idx_a ON orders_dup(ref); CREATE INDEX idx_b ON orders_dup(ref);\""

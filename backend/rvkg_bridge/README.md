# rvkg-bridge

API Gateway access logs and AI-agent spans → per-route latency rollups → the
rv-aiknowledge graph → a question like *"why is checkout slow"* answered with a trail.

```
CloudWatch access logs ─┐
                        ├─► http_span ─► agent_telemetry ─► rollup per route ─┬─► push_facts (topology)
AI agent (LLM spans) ───┘                                                     └─► index_artifact (slow routes only)
                                                                                        │
                                                        engine.query_graph(["why is checkout slow"]) ◄┘
```

| file | what |
|---|---|
| `producers.py` | AWS API Gateway access logs (CloudWatch or synthetic) + a small AI agent, both writing spans |
| `bridge.py` | rollup → facts for every route, a document for the breaching ones |
| `test_e2e.py` | the whole path; the graph test skips without Mongo + Neo4j |

## Run it

```bash
bash backend/rvkg_bridge/run.sh          # the whole pipeline, end to end
bash backend/rvkg_bridge/run.sh test     # the test suite
```

That starts Mongo + Neo4j in Docker, generates API Gateway logs and agent traffic,
builds the graph and asks it three latency questions. Nothing to configure.

Two optional environment variables:

| | |
|---|---|
| `OPENAI_API_KEY` | real model calls in the agent, and cosine scoring instead of keyword. Without it everything still runs; the ranking just does not mean anything. |
| `RVKG_PATH` | where your rv-aiknowledge checkout is. Defaults to `~/Desktop/rv-aiknowledge`. |

Stop the stores with
`docker compose -f backend/rvkg_bridge/docker-compose.yml down`.

## Against real AWS

```bash
python3 backend/rvkg_bridge/producers.py --log-group /aws/apigateway/prod --hours 1
python3 backend/rvkg_bridge/bridge.py --tenant demo-tenant --org acme --project prod
```

Needs JSON access logging enabled on the stage, `logs:FilterLogEvents` on the group,
boto3, and the same `MONGODB_URI` / `NEO4J_URI` exports `run.sh` sets. Also DynamoDB:
without it the span store is per-process memory and the second command sees nothing the
first wrote. That is why the demo runs in one process.

## Knobs

`RVKG_SLOW_MS` (default 500) is the p95 above which a route earns a document. Facts are
written for every route regardless — the topology is what lets traversal connect two
routes through a shared upstream, and it costs no LLM call. At the default the
synthetic `GET /v1/catalog` (312 ms p95, the gateway-overhead story) stays undocumented
and so unanswerable; `RVKG_SLOW_MS=250` brings it in.

Without `OPENAI_API_KEY` there are no embeddings, so search falls back to keyword hit
ratio: every result scores ~0.5 and ranking between documents is flat. The path works,
the ordering does not mean anything. Set the key before reading anything into scores.

## Staying current

A route keeps its report once it has one, even after it stops breaching — it is
re-indexed with a "within its objective" verdict instead of quietly dropping out of the
loop. Without that the graph answers "why is checkout slow" from a window that no
longer exists. Re-indexing an unchanged report is content-hash cached, so this costs an
LLM call only in windows where the numbers actually moved.

With `OPENAI_API_KEY` set, the flipped verdict sentence is what the claim extractor and
the contradiction judge act on: the older "is breaching its latency objective" claim is
retired by birth timestamp rather than left to argue with the new one.

A route absent from a window keeps its report untouched. Absence is not recovery — a
quiet hour and a deleted endpoint look identical from here.

## Not done

Polling, not streaming. A Kinesis subscription on the log group is the production
answer; a 5-minute cron over `producers.py` covers a bridge that summarises 5-minute
windows anyway. Add it when the lag hurts.

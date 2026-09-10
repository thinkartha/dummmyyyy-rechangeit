#!/usr/bin/env bash
# Everything, in one command:
#
#   bash backend/rvkg_bridge/run.sh          the pipeline, end to end
#   bash backend/rvkg_bridge/run.sh test     the test suite against the same stores
#
# Starts the two stores, feeds in API Gateway logs and agent spans, builds the graph,
# and asks it a latency question. Add an OPENAI_API_KEY to the environment for real
# model calls and real cosine scoring; without one it still runs end to end.
set -euo pipefail
cd "$(dirname "$0")/../.."

# Ports match docker-compose.yml. directConnection is required: atlas-local advertises
# its replica set under the container's hostname, which the host cannot resolve.
# rv-aiknowledge is a sibling checkout, not a pip install. Override RVKG_PATH if yours
# lives elsewhere.
export RVKG_PATH="${RVKG_PATH:-$HOME/Desktop/rv-aiknowledge}"
if [ ! -d "$RVKG_PATH/rvkg" ]; then
  echo "no rv-aiknowledge checkout at $RVKG_PATH — set RVKG_PATH to yours" >&2
  exit 1
fi

export MONGODB_URI="mongodb://localhost:27018/rvkg?directConnection=true"
export NEO4J_URI="bolt://localhost:7688"
export NEO4J_USER="neo4j"
export NEO4J_PASSWORD="rvkglocal"

echo "==> starting Mongo + Neo4j"
docker compose -f backend/rvkg_bridge/docker-compose.yml up -d --wait

if [ "${1:-}" = "test" ]; then
  echo "==> running the tests"
  python3 -m pytest backend/rvkg_bridge/test_e2e.py -q
else
  echo "==> running the pipeline"
  python3 backend/rvkg_bridge/bridge.py --demo "$@"
fi

echo
echo "Stores are still up. Stop them with:"
echo "  docker compose -f backend/rvkg_bridge/docker-compose.yml down"

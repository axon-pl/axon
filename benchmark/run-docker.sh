#!/usr/bin/env bash
# Rebuild and run the benchmark suite in Docker (pinned Node 20).
# Always builds first so track scripts and deps are never stale.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
docker compose -f benchmark/docker-compose.yml build
exec docker compose -f benchmark/docker-compose.yml run --rm bench "$@"

#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${TEST_DATABASE_URL:-}" ]]; then
  echo "TEST_DATABASE_URL is required for release verification." >&2
  exit 1
fi

case "$TEST_DATABASE_URL" in
  *"@127.0.0.1:"*"/otiz_test"*|*"@localhost:"*"/otiz_test"*) ;;
  *)
    echo "Refusing to run release verification against a non-local or non-otiz_test database." >&2
    exit 1
    ;;
esac

export DATABASE_URL="$TEST_DATABASE_URL"
export BASE_URL="${BASE_URL:-http://127.0.0.1:3123}"
PORT="${PORT:-3123}"
LOG_FILE="${RELEASE_SERVER_LOG:-/tmp/otiz-release-server.log}"
SERVER_PID=""

cleanup() {
  if [[ -n "$SERVER_PID" ]]; then
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

pnpm db:baseline:test
pnpm test
pnpm lint
pnpm typecheck
pnpm build

pnpm --filter @otiz/web exec next start --hostname 127.0.0.1 --port "$PORT" >"$LOG_FILE" 2>&1 &
SERVER_PID=$!

for _ in $(seq 1 30); do
  if curl -fsS --max-time 2 "$BASE_URL/api/health" >/dev/null 2>&1; then
    break
  fi
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    cat "$LOG_FILE" >&2
    echo "Release server exited before becoming healthy." >&2
    exit 1
  fi
  sleep 1
done

curl -fsS --max-time 5 "$BASE_URL/api/health" >/dev/null || {
  cat "$LOG_FILE" >&2
  echo "Release server did not become healthy." >&2
  exit 1
}

pnpm smoke:production
pnpm smoke:ux
pnpm smoke:localization
pnpm smoke:investor

echo "PASS release artifact, runtime, database, routes, and localization gates"

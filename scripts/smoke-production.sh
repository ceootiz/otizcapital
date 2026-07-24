#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:3123}"
BODY="$(mktemp)"
trap 'rm -f "$BODY"' EXIT

STATUS="$(curl -sS --max-time 10 -o "$BODY" -w '%{http_code}' "$BASE_URL/api/health")"
[[ "$STATUS" == "200" ]] || {
  echo "FAIL health returned HTTP $STATUS" >&2
  cat "$BODY" >&2
  exit 1
}

node -e '
const fs = require("fs");
const body = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
if (body.ok !== true || typeof body.timestamp !== "string") process.exit(1);
' "$BODY" || {
  echo "FAIL health response is not operational" >&2
  exit 1
}

echo "PASS production health and database probe"

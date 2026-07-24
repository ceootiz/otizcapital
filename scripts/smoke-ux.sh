#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:3123}"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

for locale in en ru de es zh; do
  for route in "" apply about legal; do
    suffix="${route:+/$route}"
    file="$TMP_DIR/${locale}-${route:-home}.html"
    status="$(curl -sS --max-time 15 -o "$file" -w '%{http_code}' "$BASE_URL/$locale$suffix")"
    [[ "$status" == "200" ]] || {
      echo "FAIL /$locale$suffix returned HTTP $status" >&2
      exit 1
    }
    grep -Eiq '<main|<body' "$file" || {
      echo "FAIL /$locale$suffix did not return an HTML application shell" >&2
      exit 1
    }
    if grep -Eiq 'Internal Server Error|Application error: a server-side exception|MISSING_TRANSLATION' "$file"; then
      echo "FAIL /$locale$suffix contains a runtime or translation failure" >&2
      exit 1
    fi
  done
done

echo "PASS public UX routes for all supported locales"

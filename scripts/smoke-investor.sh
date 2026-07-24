#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:3123}"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

for locale in en ru de es zh; do
  login_status="$(curl -sS --max-time 10 -o "$TMP_DIR/login-$locale.html" -w '%{http_code}' "$BASE_URL/$locale/investor/login")"
  [[ "$login_status" == "200" ]] || {
    echo "FAIL /$locale/investor/login returned HTTP $login_status" >&2
    exit 1
  }

  headers="$TMP_DIR/dashboard-$locale.headers"
  dashboard_status="$(curl -sS --max-time 10 -D "$headers" -o /dev/null -w '%{http_code}' "$BASE_URL/$locale/investor/dashboard")"
  [[ "$dashboard_status" == "307" || "$dashboard_status" == "308" ]] || {
    echo "FAIL protected dashboard returned HTTP $dashboard_status for $locale" >&2
    exit 1
  }
  tr -d '\r' < "$headers" | grep -Eiq "^location: .*/$locale/investor/login$" || {
    echo "FAIL protected dashboard did not redirect to the $locale investor login" >&2
    exit 1
  }
done

for endpoint in deposits withdrawals; do
  status="$(curl -sS --max-time 10 -o "$TMP_DIR/$endpoint.json" -w '%{http_code}' "$BASE_URL/api/investor/$endpoint")"
  [[ "$status" == "401" ]] || {
    echo "FAIL unauthenticated /api/investor/$endpoint returned HTTP $status" >&2
    exit 1
  }
done

echo "PASS investor login and unauthenticated boundaries"

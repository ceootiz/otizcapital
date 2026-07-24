#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:3123}"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

for locale in en ru de es zh; do
  file="$TMP_DIR/$locale.html"
  status="$(curl -sS --max-time 15 -H "Accept-Language: $locale" -o "$file" -w '%{http_code}' "$BASE_URL/$locale")"
  [[ "$status" == "200" ]] || {
    echo "FAIL localized homepage $locale returned HTTP $status" >&2
    exit 1
  }
  grep -Fq "/$locale/apply" "$file" || {
    echo "FAIL localized homepage $locale does not retain locale navigation" >&2
    exit 1
  }
  if grep -Eiq 'translation missing|missing translation|MISSING_TRANSLATION|undefined</' "$file"; then
    echo "FAIL localized homepage $locale exposes a translation placeholder" >&2
    exit 1
  fi
done

echo "PASS locale routing and translation placeholder checks"

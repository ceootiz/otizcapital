#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${TEST_DATABASE_URL:-}" ]]; then
  echo "TEST_DATABASE_URL is required." >&2
  exit 1
fi

case "$TEST_DATABASE_URL" in
  *"@127.0.0.1:"*"/otiz_test"*|*"@localhost:"*"/otiz_test"*) ;;
  *)
    echo "Refusing to reset a non-local or non-otiz_test database." >&2
    exit 1
    ;;
esac

export DATABASE_URL="$TEST_DATABASE_URL"

pnpm exec prisma validate
pnpm exec prisma migrate reset --force --skip-seed
pnpm exec prisma migrate status

# Repeating the reset proves that the baseline is deterministic and recoverable
# on a disposable database. This command is guarded above and cannot target Neon.
pnpm exec prisma migrate reset --force --skip-seed
pnpm exec prisma migrate status

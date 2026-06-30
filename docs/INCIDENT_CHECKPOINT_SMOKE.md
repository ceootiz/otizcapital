# Incident checkpoint smoke

This smoke check verifies the local operational incident and checkpoint-health workflow without using GitHub, remotes, external APIs, or production credentials.

It is part of the repeatable local RC checkpoint process documented in `docs/OTIZ_CAPITAL_FOUNDATION_RC.md`.

## What it checks

Admin flow:

- Admin login/session bootstrap.
- `/en/admin/incidents` renders.
- `/api/admin/incidents` returns a list.
- Incident source filters work.
- A safe, LOW severity smoke incident is created in the local dev database.
- The smoke incident detail endpoint returns sanitized metadata, lifecycle, audit events, and triage actions.
- The first triage action points to a valid admin page.
- Acknowledge and resolve actions work on the smoke-created incident.
- `/api/admin/checkpoint-health` returns valid JSON with incident metrics and `overallStatus`.
- `/en/admin/checkpoint-health` renders the operational cards.

Investor/access flow:

- Unauthenticated requests are blocked from admin incident/checkpoint APIs.
- Investor login/session bootstrap uses an existing ACTIVE investor from the local database.
- Investor is blocked from incident and checkpoint admin APIs.
- Investor dashboard does not expose incident center copy, triage actions, raw metadata JSON, sanitized metadata preview, related audit events, or ledger audit trail text.

## Start the dev server

Run this in one terminal from the `otiz-capital` project root:

```bash
ADMIN_PASSWORD=otiz-local-admin \
ADMIN_SESSION_SECRET=otiz-local-admin-secret \
INVESTOR_SESSION_SECRET=otiz-local-investor-secret \
INVESTOR_ACCESS_CODE=otiz-demo \
pnpm --filter @otiz/web exec next dev -p 3123
```

The smoke script does not start the dev server itself. This keeps the script focused on verification and avoids hiding server startup failures.

## Run the smoke

In another terminal:

```bash
pnpm smoke:incidents
```

Equivalent direct invocation:

```bash
bash scripts/smoke-incident-checkpoint.sh
```

## Environment variables

- `BASE_URL`: target app URL. Default: `http://127.0.0.1:3123`.
- `LOCALE`: locale path segment. Default: `en`.
- `ADMIN_PASSWORD`: admin login password. Default: `otiz-local-admin`.
- `INVESTOR_ACCESS_CODE`: investor MVP access code. Default: `otiz-demo`.
- `SMOKE_DIR`: temp output directory. Default: `/tmp/otiz-incident-checkpoint-smoke`.

Example:

```bash
BASE_URL=http://127.0.0.1:3124 pnpm smoke:incidents
```

## PASS states

The smoke passes when:

- Admin incident and checkpoint endpoints are reachable with admin session.
- Admin-only endpoints reject unauthenticated and investor sessions.
- A smoke-created incident can be viewed, acknowledged, resolved, and linked through triage actions.
- Checkpoint health returns a valid `overallStatus` and incident summary.
- Investor dashboard does not expose internal incident/audit/metadata surfaces.

## Why CRITICAL checkpoint health can pass locally

Local dev data intentionally includes incomplete reports, broken reconciliation cases, stale snapshots, critical risk examples, and unresolved incidents. For this smoke, `CRITICAL` is a valid checkpoint-health state as long as the API shape is valid and the operational metrics are present.

The smoke verifies that the control plane reports the state correctly; it does not require local demo data to be healthy.

## Data mutation policy

The script does not modify product code or existing incident records. It creates one LOW/manual smoke incident in the local database, then acknowledges and resolves that same incident via the public admin APIs. This leaves an auditable resolved smoke record and avoids corrupting existing operational incidents.

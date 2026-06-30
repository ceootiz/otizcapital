#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:3123}"
LOCALE="${LOCALE:-en}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-otiz-local-admin}"
INVESTOR_ACCESS_CODE="${INVESTOR_ACCESS_CODE:-otiz-demo}"
SMOKE_DIR="${SMOKE_DIR:-/tmp/otiz-incident-checkpoint-smoke}"
ADMIN_COOKIE="$SMOKE_DIR/admin.cookie"
INVESTOR_COOKIE="$SMOKE_DIR/investor.cookie"
mkdir -p "$SMOKE_DIR"

PASS_COUNT=0
SKIP_COUNT=0

pass() { printf 'PASS %s\n' "$1"; PASS_COUNT=$((PASS_COUNT + 1)); }
skip() { printf 'SKIP %s\n' "$1"; SKIP_COUNT=$((SKIP_COUNT + 1)); }
fail() { printf 'FAIL %s\n' "$1" >&2; exit 1; }

request() {
  local method="$1"
  local url="$2"
  local output="$3"
  shift 3
  curl -sS -X "$method" "$url" -o "$output" -w '%{http_code}' "$@"
}

json_assert() {
  local file="$1"
  local expression="$2"
  local label="$3"
  node -e "const fs=require('fs'); const j=JSON.parse(fs.readFileSync(process.argv[1], 'utf8')); if (!($expression)) process.exit(1);" "$file" || fail "$label"
  pass "$label"
}

html_excludes() {
  local file="$1"
  local label="$2"
  shift 2
  node -e "const fs=require('fs'); const html=fs.readFileSync(process.argv[1], 'utf8'); const terms=process.argv.slice(2); const hit=terms.filter((term)=>html.includes(term)); if (hit.length) { console.error(hit.join(', ')); process.exit(1); }" "$file" "$@" || fail "$label"
  pass "$label"
}

printf 'Incident/checkpoint smoke against %s\n' "$BASE_URL"

STATUS=$(request GET "$BASE_URL/api/admin/incidents" "$SMOKE_DIR/unauth-incidents.json")
[[ "$STATUS" == "401" ]] || fail "unauthenticated admin incidents blocked (got $STATUS)"
pass "unauthenticated admin incidents blocked"

STATUS=$(request GET "$BASE_URL/api/admin/checkpoint-health" "$SMOKE_DIR/unauth-health.json")
[[ "$STATUS" == "401" ]] || fail "unauthenticated checkpoint health blocked (got $STATUS)"
pass "unauthenticated checkpoint health blocked"

STATUS=$(request POST "$BASE_URL/api/admin/login" "$SMOKE_DIR/admin-login.json" -c "$ADMIN_COOKIE" -H 'Content-Type: application/json' -d "{\"password\":\"$ADMIN_PASSWORD\"}")
[[ "$STATUS" == "200" ]] || fail "admin login failed (got $STATUS). Start dev server and set ADMIN_PASSWORD if needed."
json_assert "$SMOKE_DIR/admin-login.json" "j.ok === true" "admin login/session bootstrap"

CSRF_TOKEN=$(awk '/admin_csrf_token/ { print $NF; found=1 } END { if (!found) exit 1 }' "$ADMIN_COOKIE") || fail "admin csrf cookie present"
pass "admin csrf cookie present"

STATUS=$(request GET "$BASE_URL/$LOCALE/admin/incidents" "$SMOKE_DIR/admin-incidents.html" -b "$ADMIN_COOKIE")
[[ "$STATUS" == "200" ]] || fail "admin incidents page opens (got $STATUS)"
node -e "const html=require('fs').readFileSync(process.argv[1], 'utf8'); if (!html.includes('Incident center') || !html.includes('Details')) process.exit(1);" "$SMOKE_DIR/admin-incidents.html" || fail "admin incidents page renders incident center"
pass "admin incidents page opens"

STATUS=$(request GET "$BASE_URL/api/admin/incidents?limit=200" "$SMOKE_DIR/incidents.json" -b "$ADMIN_COOKIE")
[[ "$STATUS" == "200" ]] || fail "admin incidents API opens (got $STATUS)"
json_assert "$SMOKE_DIR/incidents.json" "j.ok === true && Array.isArray(j.data)" "admin incidents API returns list"

STATUS=$(request GET "$BASE_URL/api/admin/incidents?source=manual&limit=10" "$SMOKE_DIR/incidents-manual.json" -b "$ADMIN_COOKIE")
[[ "$STATUS" == "200" ]] || fail "incident source filter works (got $STATUS)"
json_assert "$SMOKE_DIR/incidents-manual.json" "j.ok === true && Array.isArray(j.data) && j.data.every((item)=>item.source === 'manual')" "incident source filter works"

INVESTOR_EMAIL=$(node <<'NODE'
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const investor = await prisma.investor.findFirst({ where: { status: 'ACTIVE' }, orderBy: { createdAt: 'desc' }, select: { id: true, email: true } });
  if (investor?.email) console.log(investor.email);
})().finally(() => prisma.$disconnect());
NODE
)

SMOKE_INCIDENT_ID=$(INVESTOR_EMAIL="$INVESTOR_EMAIL" node <<'NODE'
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const investor = process.env.INVESTOR_EMAIL
    ? await prisma.investor.findFirst({ where: { email: process.env.INVESTOR_EMAIL }, select: { id: true } })
    : null;
  const now = new Date();
  const incident = await prisma.operationalIncident.create({
    data: {
      incidentType: 'SMOKE_INCIDENT_CHECKPOINT',
      severity: 'LOW',
      status: 'OPEN',
      title: `Smoke incident checkpoint ${now.toISOString()}`,
      summary: 'Local smoke incident used to verify incident detail, triage actions, acknowledge, and resolve flows.',
      investorId: investor?.id ?? null,
      source: 'manual',
      detectedAt: now,
      metadataJson: JSON.stringify({ smoke: true, source: 'smoke-incident-checkpoint', createdAt: now.toISOString() })
    }
  });
  await prisma.auditLog.create({
    data: {
      actor: 'smoke-script',
      action: 'CREATE_OPERATIONAL_INCIDENT',
      entityType: 'OperationalIncident',
      entityId: incident.id,
      beforeJson: null,
      afterJson: JSON.stringify({ id: incident.id, incidentType: incident.incidentType, source: incident.source, severity: incident.severity, status: incident.status, investorId: incident.investorId })
    }
  });
  console.log(incident.id);
})().finally(() => prisma.$disconnect());
NODE
)
[[ -n "$SMOKE_INCIDENT_ID" ]] || fail "safe smoke incident created"
pass "safe smoke incident created: $SMOKE_INCIDENT_ID"

STATUS=$(request GET "$BASE_URL/api/admin/incidents/$SMOKE_INCIDENT_ID?locale=$LOCALE" "$SMOKE_DIR/incident-detail.json" -b "$ADMIN_COOKIE")
[[ "$STATUS" == "200" ]] || fail "incident detail endpoint opens (got $STATUS)"
json_assert "$SMOKE_DIR/incident-detail.json" "j.ok === true && j.data.incident.id === '$SMOKE_INCIDENT_ID' && Array.isArray(j.data.lifecycle) && Array.isArray(j.data.auditEvents)" "incident detail includes lifecycle and audit events"
json_assert "$SMOKE_DIR/incident-detail.json" "Array.isArray(j.data.triageActions) && j.data.triageActions.length > 0" "incident detail includes triage actions"
json_assert "$SMOKE_DIR/incident-detail.json" "!JSON.stringify(j).match(/metadataJson|csrf|token|secret/i)" "incident detail metadata is sanitized"

TRIAGE_HREF=$(node -e "const j=require(process.argv[1]); console.log(j.data.triageActions[0].href);" "$SMOKE_DIR/incident-detail.json")
STATUS=$(request GET "$BASE_URL$TRIAGE_HREF" "$SMOKE_DIR/triage-target.html" -b "$ADMIN_COOKIE")
[[ "$STATUS" == "200" ]] || fail "triage action target opens (got $STATUS for $TRIAGE_HREF)"
pass "triage action target opens"

STATUS=$(request POST "$BASE_URL/api/admin/incidents/$SMOKE_INCIDENT_ID/acknowledge" "$SMOKE_DIR/ack.json" -b "$ADMIN_COOKIE" -H 'Content-Type: application/json' -H "x-csrf-token: $CSRF_TOKEN" -d '{}')
[[ "$STATUS" == "200" ]] || fail "acknowledge works on smoke incident (got $STATUS)"
json_assert "$SMOKE_DIR/ack.json" "j.ok === true && j.data.status === 'ACKNOWLEDGED'" "acknowledge works on smoke incident"

STATUS=$(request POST "$BASE_URL/api/admin/incidents/$SMOKE_INCIDENT_ID/resolve" "$SMOKE_DIR/resolve.json" -b "$ADMIN_COOKIE" -H 'Content-Type: application/json' -H "x-csrf-token: $CSRF_TOKEN" -d '{}')
[[ "$STATUS" == "200" ]] || fail "resolve works on smoke incident (got $STATUS)"
json_assert "$SMOKE_DIR/resolve.json" "j.ok === true && j.data.status === 'RESOLVED'" "resolve works on smoke incident"

STATUS=$(request GET "$BASE_URL/api/admin/checkpoint-health" "$SMOKE_DIR/checkpoint-health.json" -b "$ADMIN_COOKIE")
[[ "$STATUS" == "200" ]] || fail "checkpoint health API opens (got $STATUS)"
json_assert "$SMOKE_DIR/checkpoint-health.json" "j.ok === true && j.data && typeof j.data.overallStatus === 'string' && j.data.metrics && j.data.metrics.incidents" "checkpoint health JSON includes incidents summary"
node -e "const j=require(process.argv[1]); const valid=['HEALTHY','ATTENTION','CRITICAL']; if (!valid.includes(j.data.overallStatus)) process.exit(1); console.log('INFO checkpoint overallStatus=' + j.data.overallStatus + ' score=' + j.data.score);" "$SMOKE_DIR/checkpoint-health.json" || fail "checkpoint health state is valid"
pass "checkpoint health state is valid, including CRITICAL dev data"

STATUS=$(request GET "$BASE_URL/$LOCALE/admin/checkpoint-health" "$SMOKE_DIR/checkpoint-health.html" -b "$ADMIN_COOKIE")
[[ "$STATUS" == "200" ]] || fail "checkpoint health page opens (got $STATUS)"
node -e "const html=require('fs').readFileSync(process.argv[1], 'utf8'); if (!html.includes('Readiness') || !html.includes('Reconciliation') || !html.includes('Snapshot integrity')) process.exit(1);" "$SMOKE_DIR/checkpoint-health.html" || fail "checkpoint health page renders operational cards"
pass "checkpoint health page opens"

if [[ -n "$INVESTOR_EMAIL" ]]; then
  STATUS=$(request POST "$BASE_URL/api/investor/login" "$SMOKE_DIR/investor-login.json" -c "$INVESTOR_COOKIE" -H 'Content-Type: application/json' -d "{\"email\":\"$INVESTOR_EMAIL\",\"accessCode\":\"$INVESTOR_ACCESS_CODE\"}")
  [[ "$STATUS" == "200" ]] || fail "investor login/session bootstrap failed for $INVESTOR_EMAIL (got $STATUS)"
  json_assert "$SMOKE_DIR/investor-login.json" "j.ok === true" "investor login/session bootstrap"

  STATUS=$(request GET "$BASE_URL/api/admin/incidents?limit=10" "$SMOKE_DIR/investor-blocked-incidents.json" -b "$INVESTOR_COOKIE")
  [[ "$STATUS" == "401" || "$STATUS" == "403" ]] || fail "investor blocked from incidents API (got $STATUS)"
  pass "investor blocked from incidents API"

  STATUS=$(request GET "$BASE_URL/api/admin/checkpoint-health" "$SMOKE_DIR/investor-blocked-health.json" -b "$INVESTOR_COOKIE")
  [[ "$STATUS" == "401" || "$STATUS" == "403" ]] || fail "investor blocked from checkpoint health API (got $STATUS)"
  pass "investor blocked from checkpoint health API"

  STATUS=$(request GET "$BASE_URL/api/admin/incidents/$SMOKE_INCIDENT_ID?locale=$LOCALE" "$SMOKE_DIR/investor-blocked-detail.json" -b "$INVESTOR_COOKIE")
  [[ "$STATUS" == "401" || "$STATUS" == "403" ]] || fail "investor blocked from incident detail API (got $STATUS)"
  pass "investor blocked from incident detail API"

  STATUS=$(request GET "$BASE_URL/$LOCALE/investor/dashboard" "$SMOKE_DIR/investor-dashboard.html" -b "$INVESTOR_COOKIE")
  [[ "$STATUS" == "200" ]] || fail "investor dashboard opens (got $STATUS)"
  html_excludes "$SMOKE_DIR/investor-dashboard.html" "investor dashboard hides incident internals" 'Incident center' 'Triage actions' 'metadataJson' 'Sanitized metadata preview' 'Related audit events' 'Ledger audit trail'
else
  skip "investor login and investor safety checks skipped: no ACTIVE investor email found"
fi

printf 'SUMMARY PASS=%s SKIP=%s\n' "$PASS_COUNT" "$SKIP_COUNT"

# OTIZ CAPITAL Foundation RC Checkpoint

## 1. Current status

- Branch: `feature/proof-requirements-guide`
- Latest commit at checkpoint start: `ca5dfa27 refactor: share admin navigation component`
- RC readiness: `100%` for local verification gate expectations after the latest PASS cycle (`pnpm verify` and `pnpm --filter @otiz/web build`).
- Repository mode: local-only. GitHub is intentionally not used at this checkpoint.
- Push status: not pushed.
- Remote warning: current `origin` points to `https://github.com/ceootiz/Purchase-Updater.git`. Do not push Otiz Capital work to this remote. Create or confirm the correct Otiz Capital repository before any push.
- Operational checkpoint note: dev database health may return `CRITICAL` because local seed/test data intentionally contains incomplete reports, broken reconciliation examples, pending notifications, and proof gaps. This does not block the foundation RC while verification passes.

## Repeatable local RC checks

Run these checks from the `otiz-capital` project root before treating a local checkpoint as RC-ready.

### 1. Full verification

```bash
pnpm verify
pnpm --filter @otiz/web build
```

### 2. Start dev server

Use a separate terminal and keep it running while smoke checks execute:

```bash
ADMIN_PASSWORD=otiz-local-admin \
ADMIN_SESSION_SECRET=otiz-local-admin-secret \
INVESTOR_SESSION_SECRET=otiz-local-investor-secret \
INVESTOR_ACCESS_CODE=otiz-demo \
pnpm --filter @otiz/web exec next dev -p 3123
```

### 3. Incident/operator smoke

```bash
pnpm smoke:incidents
```

### 4. Expected PASS

- `pnpm verify` passes.
- `pnpm --filter @otiz/web build` passes.
- `pnpm smoke:incidents` reports `SUMMARY PASS=...`.
- Checkpoint health can be `CRITICAL` in dev data and still pass if JSON structure, access control, triage actions, and investor-safety checks pass.

### 5. Warnings

- GitHub remote is not confirmed.
- Do not push until the correct Otiz Capital repository exists.
- Do not use current `origin` if it points to `Purchase-Updater`.
- Run these checks only from `otiz-capital`.
- Do not stage generated artifacts such as `.next/`, `node_modules/`, or `tsconfig.tsbuildinfo`.

## 2. Implemented foundation

### Investor Dashboard

- Investor MVP login/session flow.
- DB-backed dashboard summary.
- Active allocations list and allocation detail pages.
- Investor-safe allocation risk and proof health visibility.
- Published monthly reports and report detail pages.
- Withdrawal visibility based on real `WithdrawalRequest` records.

### Admin Allocations Manager

- Admin allocation list and detail pages.
- Managed allocation creation and updates.
- Allocation lifecycle/status controls.
- Proof metadata placeholders.
- Investor-visible preview boundaries.

### Withdrawals / Payout lifecycle

- `WithdrawalRequest` model and lifecycle.
- Admin controls for approve, reject, schedule, mark paid, and cancel.
- Investor-safe withdrawal page.
- Dashboard payout summary integration.
- Masked destination only, no full payment details stored or exposed.

### Monthly Reports

- Admin-created monthly reports.
- Draft, published, and archived states.
- Investor report list and detail pages show only own published reports.
- Admin report detail supports editing draft reports, publishing, unpublishing, and explicit snapshot regeneration.

### Report Allocation Linkage

- `MonthlyReportAllocation` join layer.
- Draft reports can explicitly link allocations.
- Published reports cannot have linkage silently changed.
- Snapshot generation uses linked allocations instead of live portfolio sweep.

### Proof Completeness V2

- Allocation proof completeness score `0-100`.
- States: `VERIFIED`, `PARTIAL`, `INCOMPLETE`, `HIGH_RISK`.
- Required/recommended category awareness through readiness policy.
- Admin-safe missing proof guidance.
- Investor-safe proof health summary.

### Readiness Gate

- Typed monthly report readiness evaluation.
- Blocking issues, warnings, score, state, and publish allowance.
- Publish gate blocks critical failures.
- Warning acknowledgment flow for publish when allowed by policy.
- Readiness snapshot frozen at publish time.

### Readiness Policy Settings

- Configurable readiness policy model.
- Active policy affects required proof categories and minimum proof completeness threshold.
- Policy activation audit events.
- Admin settings page and policy audit viewer.
- Published reports keep frozen policy snapshot.

### Reconciliation Engine

- Three-ledger reconciliation foundation:
  - Inventory ledger.
  - Cash ledger.
  - Investor liability ledger.
- Allocation and report reconciliation calculations.
- Exceptions and status scoring: `BALANCED`, `WARNING`, `BROKEN`.
- Investor-safe reconciliation summaries in frozen report snapshots.

### Ledger Entry Admin UI

- Admin form for creating ledger entries on allocation detail.
- Ledger type, entry type, amount, quantity, source, and metadata validation.
- Entries affect reconciliation summary.
- Creation writes audit event.

### Ledger Reversal / Correction

- Ledger entries are treated as immutable.
- Mistakes are corrected through reversal entries and optional corrected entries.
- Reversal entries net mathematically into reconciliation.
- No direct ledger history mutation.

### Ledger Audit Trail

- Admin audit trail for original, reversal, and correction chains.
- Sanitized metadata preview.
- Investor does not see raw reversal mechanics.

### Ledger Filters

- Admin filters for ledger type, entry type, source type, reversal status, date range, amount range, and description/source query.
- Filtering does not change full-ledger reconciliation totals.

### Ledger CSV Export + Export Audit

- Filtered ledger CSV export endpoint.
- CSV escaping and formula injection protection.
- No raw `metadataJson` in CSV.
- CSV exports write `EXPORT_LEDGER_CSV` audit events with sanitized export context only.

### Risk Engine V1

- Allocation and portfolio risk scoring.
- Risk levels: `LOW`, `MODERATE`, `ELEVATED`, `HIGH`, `CRITICAL`.
- Inventory, cash, proof, operational, and concentration risk inputs.
- Risk integrated into readiness, report snapshotting, admin allocation detail, and investor-safe views.

### Risk Timeline + Filters + Details

- Risk evaluation events and timeline APIs.
- Admin timeline source filters.
- Sanitized event details with score/level diffs and factor changes.
- Manual `Evaluate risk now` action records a timeline event.
- Investor never sees raw risk timeline internals.

### Admin Checkpoint Health

- Admin-only `/[locale]/admin/checkpoint-health` page.
- Admin-only `/api/admin/checkpoint-health` endpoint.
- Aggregates readiness, reconciliation, risk, withdrawals, proof completeness, notifications, and snapshot integrity.
- Produces overall status, score, issue list, recommended actions, and timestamp.

### Shared Admin Navigation

- Shared `AdminNavigation` component.
- Centralized admin links for existing routes:
  - Applications.
  - Investors.
  - Allocations.
  - Withdrawals.
  - Readiness policy.
  - Checkpoint health.
- Investor navigation remains separate and does not expose admin links.

## 3. Trust architecture summary

The trust layer is structured as an operational chain:

1. Allocation is created and managed by admin.
2. Proof placeholders and proof metadata are attached to the allocation.
3. Proof Completeness V2 evaluates evidence quality against active policy.
4. Three-ledger reconciliation checks inventory, cash, and investor liability consistency.
5. Risk Engine V1 evaluates operational, proof, cash, inventory, and concentration risk.
6. Monthly report readiness evaluates linked allocations, proof completeness, reconciliation, risk, policy, and snapshot freshness.
7. Publish gate freezes report snapshots when publication is allowed.
8. Investor report detail reads investor-safe frozen data only.

This keeps investor trust visibility tied to actual managed operational records instead of live mutable admin internals.

## 4. Snapshot immutability guarantees

Published investor reports are expected to rely on frozen snapshots:

- Proof snapshot is stored at report snapshot/regeneration time.
- Reconciliation snapshot is stored at report snapshot/regeneration time.
- Risk snapshot is stored at report snapshot/regeneration time.
- Readiness snapshot is stored at publish time.
- Policy snapshot is stored at publish time.
- Investor report detail reads frozen data.
- Live proof changes do not silently change published investor reports.
- Live ledger/reconciliation changes do not silently change published investor reports.
- Live risk evaluations do not silently change published investor reports.
- Active policy changes do not rewrite old published report snapshots.

## 5. Access control guarantees

Implemented access boundaries include:

- Admin-only APIs require admin session.
- Admin mutations require CSRF where applicable.
- Investor routes require investor session.
- Investors can view only their own allocations, reports, withdrawals, and dashboard data.
- Investors cannot access admin APIs.
- Investor-safe views exclude admin-only internals.
- Raw ledger metadata is not exposed to investor views.
- Hidden proofs are not exposed to investor views.
- Rejected/internal proof details are not exposed to investor views.
- Readiness internals are not exposed to investor views.
- Risk timeline and raw risk event details are not exposed to investor views.
- Audit metadata is not exposed to investor views.
- CSV export is admin-only.

## 6. Operational controls

Current operational control layer includes:

- Audit events for admin state changes.
- Audit events for readiness policy changes.
- Audit events for ledger entry creation and reversal.
- Audit events for CSV exports without storing CSV contents.
- Immutable ledger principle: reversal/correction instead of direct mutation.
- Readiness publish gate.
- Configurable readiness policy and policy snapshotting.
- Risk evaluation events and risk timeline.
- Manual risk evaluation action.
- Checkpoint health dashboard for operational queue visibility.
- Notification event foundation and disabled outbound delivery by default.

## 7. Known limitations

- GitHub push has not been performed.
- Current `origin` points to `https://github.com/ceootiz/Purchase-Updater.git`; this remote must not be used for Otiz Capital.
- Generated artifacts remain untracked locally:
  - `.next/`
  - `node_modules/`
  - `tsconfig.tsbuildinfo`
- SQLite remains local/dev MVP storage.
- No real payment execution.
- No real file upload or cloud storage.
- No legal/KYC production integration.
- No marketplace API integrations.
- No PDF generation.
- No production deployment.
- No full user/role system yet.
- Admin auth is still password-only MVP.
- Dev data may return `CRITICAL` checkpoint state because incomplete records and test operational exceptions exist locally.

## 8. Next recommended stages

1. Create a proper Otiz Capital GitHub repository or fix `origin` after explicit confirmation.
2. Clean `.gitignore` and generated artifact handling so `.next`, `node_modules`, and `tsconfig.tsbuildinfo` stay safely out of git status.
3. Introduce an App Router admin route-group layout for shared admin shell/navigation.
4. Add a legal room / trust center for non-dashboard investor-facing disclosures.
5. Add PDF monthly report export from frozen snapshots.
6. Add file storage and redaction pipeline for proof artifacts.
7. Add KYC/AML workflow with explicit sensitive data boundaries.
8. Add production deployment checklist for database, secrets, auth hardening, backups, and observability.

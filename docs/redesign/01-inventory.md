# Repository inventory

**Checkout:** `ceootiz/otizcapital`, branch `redesign/coinsphere-adaptation`, baseline commit `e454952757da853e4ae1829fcc03160de56496d8`.

**Frontend:** 45 page files; 2 layouts; 45 TSX components under `apps/web/components`; six shared primitives under `packages/ui/src`. **Backend:** 98 API route handlers. No cron or workflow-specific database jobs were found in the inspected app routes.

## Frontend routes

| Route | Audience / purpose | Existing entrypoint | Data/action notes | Redesign status |
|---|---|---|---|---|
| `/{locale}/about` | Public company information | `apps/web/app/[locale]/about/page.tsx` | Localized page content; home also reads optional DB overrides | Shared theme applied; mobile/desktop smoke passed; route-specific review pending |
| `/{locale}/admin/allocations/{id}` | Administration: [id] | `apps/web/app/[locale]/admin/allocations/[id]/page.tsx` | Admin session + database/API | Shared theme applied; mobile/desktop smoke passed; route-specific review pending |
| `/{locale}/admin/allocations` | Administration: allocations | `apps/web/app/[locale]/admin/allocations/page.tsx` | Admin session + database/API | Shared theme applied; mobile/desktop smoke passed; route-specific review pending |
| `/{locale}/admin/applications` | Administration: applications | `apps/web/app/[locale]/admin/applications/page.tsx` | Admin session + database/API | Shared theme applied; mobile/desktop smoke passed; route-specific review pending |
| `/{locale}/admin/checkpoint-health` | Administration: checkpoint health | `apps/web/app/[locale]/admin/checkpoint-health/page.tsx` | Admin session + database/API | Shared theme applied; mobile/desktop smoke passed; route-specific review pending |
| `/{locale}/admin/content` | Administration: content | `apps/web/app/[locale]/admin/content/page.tsx` | Admin session + database/API | Shared theme applied; mobile/desktop smoke passed; route-specific review pending |
| `/{locale}/admin/dashboard` | Administration: dashboard | `apps/web/app/[locale]/admin/dashboard/page.tsx` | Admin session + database/API | Shared theme applied; mobile/desktop smoke passed; route-specific review pending |
| `/{locale}/admin/deposit-addresses` | Administration: deposit addresses | `apps/web/app/[locale]/admin/deposit-addresses/page.tsx` | Admin session + database/API | Shared theme applied; mobile/desktop smoke passed; route-specific review pending |
| `/{locale}/admin/incidents` | Administration: incidents | `apps/web/app/[locale]/admin/incidents/page.tsx` | Admin session + database/API | Shared theme applied; mobile/desktop smoke passed; route-specific review pending |
| `/{locale}/admin/investors/{id}` | Administration: [id] | `apps/web/app/[locale]/admin/investors/[id]/page.tsx` | Admin session + database/API | Shared theme applied; mobile/desktop smoke passed; route-specific review pending |
| `/{locale}/admin/investors` | Administration: investors | `apps/web/app/[locale]/admin/investors/page.tsx` | Admin session + database/API | Shared theme applied; mobile/desktop smoke passed; route-specific review pending |
| `/{locale}/admin/login` | Administration: login | `apps/web/app/[locale]/admin/login/page.tsx` | Admin session + database/API | Shared theme applied; mobile/desktop smoke passed; route-specific review pending |
| `/{locale}/admin/promo-codes` | Administration: promo codes | `apps/web/app/[locale]/admin/promo-codes/page.tsx` | Admin session + database/API | Shared theme applied; mobile/desktop smoke passed; route-specific review pending |
| `/{locale}/admin/referrals` | Administration: referrals | `apps/web/app/[locale]/admin/referrals/page.tsx` | Admin session + database/API | Shared theme applied; mobile/desktop smoke passed; route-specific review pending |
| `/{locale}/admin/reports/{id}` | Administration: [id] | `apps/web/app/[locale]/admin/reports/[id]/page.tsx` | Admin session + database/API | Shared theme applied; mobile/desktop smoke passed; route-specific review pending |
| `/{locale}/admin/settings/contact` | Administration: contact | `apps/web/app/[locale]/admin/settings/contact/page.tsx` | Admin session + database/API | Shared theme applied; mobile/desktop smoke passed; route-specific review pending |
| `/{locale}/admin/settings/readiness-policy` | Administration: readiness policy | `apps/web/app/[locale]/admin/settings/readiness-policy/page.tsx` | Admin session + database/API | Shared theme applied; mobile/desktop smoke passed; route-specific review pending |
| `/{locale}/admin/setup-2fa` | Administration: setup 2fa | `apps/web/app/[locale]/admin/setup-2fa/page.tsx` | Admin session + database/API | Shared theme applied; mobile/desktop smoke passed; route-specific review pending |
| `/{locale}/admin/withdrawals` | Administration: withdrawals | `apps/web/app/[locale]/admin/withdrawals/page.tsx` | Admin session + database/API | Shared theme applied; mobile/desktop smoke passed; route-specific review pending |
| `/{locale}/apply` | Investor application: apply | `apps/web/app/[locale]/apply/page.tsx` | Application form + investor-application API | Shared theme applied; mobile/desktop smoke passed; route-specific review pending |
| `/{locale}/apply/status` | Investor application: status | `apps/web/app/[locale]/apply/status/page.tsx` | Application form + investor-application API | Shared theme applied; mobile/desktop smoke passed; route-specific review pending |
| `/{locale}/arbitrage/dashboard` | Referral partner account: dashboard | `apps/web/app/[locale]/arbitrage/dashboard/page.tsx` | Partner session + database/API | Shared theme applied; mobile/desktop smoke passed; route-specific review pending |
| `/{locale}/arbitrage/login` | Referral partner account: login | `apps/web/app/[locale]/arbitrage/login/page.tsx` | Partner session + database/API | Shared theme applied; mobile/desktop smoke passed; route-specific review pending |
| `/{locale}/arbitrage/register` | Referral partner account: register | `apps/web/app/[locale]/arbitrage/register/page.tsx` | Partner session + database/API | Shared theme applied; mobile/desktop smoke passed; route-specific review pending |
| `/{locale}/calculator` | Public calculator | `apps/web/app/[locale]/calculator/page.tsx` | Existing calculator logic | Shared theme applied; mobile/desktop smoke passed; route-specific review pending |
| `/{locale}/contact` | Public contact | `apps/web/app/[locale]/contact/page.tsx` | Localized page content; home also reads optional DB overrides | Shared theme applied; mobile/desktop smoke passed; route-specific review pending |
| `/{locale}/investor/allocations/{id}` | Investor account: [id] | `apps/web/app/[locale]/investor/allocations/[id]/page.tsx` | Investor session + database/API | Shared theme applied; mobile/desktop smoke passed; route-specific review pending |
| `/{locale}/investor/allocations` | Investor account: allocations | `apps/web/app/[locale]/investor/allocations/page.tsx` | Investor session + database/API | Shared theme applied; mobile/desktop smoke passed; route-specific review pending |
| `/{locale}/investor/dashboard` | Investor account: dashboard | `apps/web/app/[locale]/investor/dashboard/page.tsx` | Investor session + database/API | Shared theme applied; mobile/desktop smoke passed; route-specific review pending |
| `/{locale}/investor/deposit` | Investor account: deposit | `apps/web/app/[locale]/investor/deposit/page.tsx` | Investor session + database/API | Shared theme applied; mobile/desktop smoke passed; route-specific review pending |
| `/{locale}/investor/documents` | Investor account: documents | `apps/web/app/[locale]/investor/documents/page.tsx` | Investor session + database/API | Shared theme applied; mobile/desktop smoke passed; route-specific review pending |
| `/{locale}/investor/forgot-password` | Investor account: forgot password | `apps/web/app/[locale]/investor/forgot-password/page.tsx` | Investor session + database/API | Shared theme applied; mobile/desktop smoke passed; route-specific review pending |
| `/{locale}/investor/history` | Investor account: history | `apps/web/app/[locale]/investor/history/page.tsx` | Investor session + database/API | Shared theme applied; mobile/desktop smoke passed; route-specific review pending |
| `/{locale}/investor/login` | Investor account: login | `apps/web/app/[locale]/investor/login/page.tsx` | Investor session + database/API | Shared theme applied; mobile/desktop smoke passed; route-specific review pending |
| `/{locale}/investor/reinvest` | Investor account: reinvest | `apps/web/app/[locale]/investor/reinvest/page.tsx` | Investor session + database/API | Shared theme applied; mobile/desktop smoke passed; route-specific review pending |
| `/{locale}/investor/reports/{id}` | Investor account: [id] | `apps/web/app/[locale]/investor/reports/[id]/page.tsx` | Investor session + database/API | Shared theme applied; mobile/desktop smoke passed; route-specific review pending |
| `/{locale}/investor/reports` | Investor account: reports | `apps/web/app/[locale]/investor/reports/page.tsx` | Investor session + database/API | Shared theme applied; mobile/desktop smoke passed; route-specific review pending |
| `/{locale}/investor/reset-password` | Investor account: reset password | `apps/web/app/[locale]/investor/reset-password/page.tsx` | Investor session + database/API | Shared theme applied; mobile/desktop smoke passed; route-specific review pending |
| `/{locale}/investor/settings` | Investor account: settings | `apps/web/app/[locale]/investor/settings/page.tsx` | Investor session + database/API | Shared theme applied; mobile/desktop smoke passed; route-specific review pending |
| `/{locale}/investor/withdrawals` | Investor account: withdrawals | `apps/web/app/[locale]/investor/withdrawals/page.tsx` | Investor session + database/API | Shared theme applied; mobile/desktop smoke passed; route-specific review pending |
| `/{locale}/legal` | Public legal documents | `apps/web/app/[locale]/legal/page.tsx` | Localized page content; home also reads optional DB overrides | Shared theme applied; mobile/desktop smoke passed; route-specific review pending |
| `/{locale}` | Localized public landing page | `apps/web/app/[locale]/page.tsx` | Localized page content; home also reads optional DB overrides | Russian home redesign complete; route smoke passed |
| `/banking/demo` | Separate labeled banking demo product | `apps/web/app/banking/demo/page.tsx` | Explicitly labeled local demo | Separate demo; visually unchanged, route smoke passed |
| `/banking` | Separate labeled banking demo product | `apps/web/app/banking/page.tsx` | Explicitly labeled local demo | Separate demo; visually unchanged, route smoke passed |
| `/` | Localized public landing page | `apps/web/app/page.tsx` | Localized page content; home also reads optional DB overrides | Shared theme applied; mobile/desktop smoke passed; route-specific review pending |

## API route inventory

| Route | Existing handler | Domain |
|---|---|---|
| `/api/admin/allocations/{id}/notify` | `apps/web/app/api/admin/allocations/[id]/notify/route.ts` | admin |
| `/api/admin/allocations` | `apps/web/app/api/admin/allocations/route.ts` | admin |
| `/api/admin/checkpoint-health` | `apps/web/app/api/admin/checkpoint-health/route.ts` | admin |
| `/api/admin/content` | `apps/web/app/api/admin/content/route.ts` | admin |
| `/api/admin/deposit-addresses/{id}` | `apps/web/app/api/admin/deposit-addresses/[id]/route.ts` | admin |
| `/api/admin/deposit-addresses` | `apps/web/app/api/admin/deposit-addresses/route.ts` | admin |
| `/api/admin/deposits/{id}` | `apps/web/app/api/admin/deposits/[id]/route.ts` | admin |
| `/api/admin/export` | `apps/web/app/api/admin/export/route.ts` | admin |
| `/api/admin/incidents/{id}/acknowledge` | `apps/web/app/api/admin/incidents/[id]/acknowledge/route.ts` | admin |
| `/api/admin/incidents/{id}/resolve` | `apps/web/app/api/admin/incidents/[id]/resolve/route.ts` | admin |
| `/api/admin/incidents/{id}` | `apps/web/app/api/admin/incidents/[id]/route.ts` | admin |
| `/api/admin/incidents` | `apps/web/app/api/admin/incidents/route.ts` | admin |
| `/api/admin/investors/{id}/deposits` | `apps/web/app/api/admin/investors/[id]/deposits/route.ts` | admin |
| `/api/admin/investors/{id}/report-template` | `apps/web/app/api/admin/investors/[id]/report-template/route.ts` | admin |
| `/api/admin/investors/{id}/reports/{reportId}/download` | `apps/web/app/api/admin/investors/[id]/reports/[reportId]/download/route.ts` | admin |
| `/api/admin/investors/{id}/reports` | `apps/web/app/api/admin/investors/[id]/reports/route.ts` | admin |
| `/api/admin/investors/{id}/reports/upload` | `apps/web/app/api/admin/investors/[id]/reports/upload/route.ts` | admin |
| `/api/admin/login` | `apps/web/app/api/admin/login/route.ts` | admin |
| `/api/admin/logout` | `apps/web/app/api/admin/logout/route.ts` | admin |
| `/api/admin/notifications/process` | `apps/web/app/api/admin/notifications/process/route.ts` | admin |
| `/api/admin/promo-codes/{id}` | `apps/web/app/api/admin/promo-codes/[id]/route.ts` | admin |
| `/api/admin/promo-codes` | `apps/web/app/api/admin/promo-codes/route.ts` | admin |
| `/api/admin/readiness-policy/{id}/activate` | `apps/web/app/api/admin/readiness-policy/[id]/activate/route.ts` | admin |
| `/api/admin/readiness-policy/{id}` | `apps/web/app/api/admin/readiness-policy/[id]/route.ts` | admin |
| `/api/admin/readiness-policy/audit` | `apps/web/app/api/admin/readiness-policy/audit/route.ts` | admin |
| `/api/admin/readiness-policy` | `apps/web/app/api/admin/readiness-policy/route.ts` | admin |
| `/api/admin/referrals/arbitrageurs/{id}` | `apps/web/app/api/admin/referrals/arbitrageurs/[id]/route.ts` | admin |
| `/api/admin/referrals/backfill-codes` | `apps/web/app/api/admin/referrals/backfill-codes/route.ts` | admin |
| `/api/admin/referrals/commissions/{id}` | `apps/web/app/api/admin/referrals/commissions/[id]/route.ts` | admin |
| `/api/admin/referrals/program` | `apps/web/app/api/admin/referrals/program/route.ts` | admin |
| `/api/admin/settings/contact` | `apps/web/app/api/admin/settings/contact/route.ts` | admin |
| `/api/admin/withdrawals/{id}` | `apps/web/app/api/admin/withdrawals/[id]/route.ts` | admin |
| `/api/admin/withdrawals` | `apps/web/app/api/admin/withdrawals/route.ts` | admin |
| `/api/admin/withdrawals/summary` | `apps/web/app/api/admin/withdrawals/summary/route.ts` | admin |
| `/api/admin/yield` | `apps/web/app/api/admin/yield/route.ts` | admin |
| `/api/allocation-proofs/{id}` | `apps/web/app/api/allocation-proofs/[id]/route.ts` | allocation-proofs |
| `/api/allocations/{id}/proofs` | `apps/web/app/api/allocations/[id]/proofs/route.ts` | allocations |
| `/api/allocations/{id}/reconciliation/{entryId}/audit-trail` | `apps/web/app/api/allocations/[id]/reconciliation/[entryId]/audit-trail/route.ts` | allocations |
| `/api/allocations/{id}/reconciliation/{entryId}/reverse` | `apps/web/app/api/allocations/[id]/reconciliation/[entryId]/reverse/route.ts` | allocations |
| `/api/allocations/{id}/reconciliation/export` | `apps/web/app/api/allocations/[id]/reconciliation/export/route.ts` | allocations |
| `/api/allocations/{id}/reconciliation` | `apps/web/app/api/allocations/[id]/reconciliation/route.ts` | allocations |
| `/api/allocations/{id}/risk/evaluate` | `apps/web/app/api/allocations/[id]/risk/evaluate/route.ts` | allocations |
| `/api/allocations/{id}/risk` | `apps/web/app/api/allocations/[id]/risk/route.ts` | allocations |
| `/api/allocations/{id}/risk/timeline` | `apps/web/app/api/allocations/[id]/risk/timeline/route.ts` | allocations |
| `/api/allocations/{id}` | `apps/web/app/api/allocations/[id]/route.ts` | allocations |
| `/api/arbitrage/login` | `apps/web/app/api/arbitrage/login/route.ts` | arbitrage |
| `/api/arbitrage/logout` | `apps/web/app/api/arbitrage/logout/route.ts` | arbitrage |
| `/api/arbitrage/register` | `apps/web/app/api/arbitrage/register/route.ts` | arbitrage |
| `/api/audit-logs` | `apps/web/app/api/audit-logs/route.ts` | audit-logs |
| `/api/health` | `apps/web/app/api/health/route.ts` | health |
| `/api/investor/auth-method` | `apps/web/app/api/investor/auth-method/route.ts` | investor |
| `/api/investor/deposits` | `apps/web/app/api/investor/deposits/route.ts` | investor |
| `/api/investor/documents/{id}/download` | `apps/web/app/api/investor/documents/[id]/download/route.ts` | investor |
| `/api/investor/documents/{id}/sign` | `apps/web/app/api/investor/documents/[id]/sign/route.ts` | investor |
| `/api/investor/documents/download-all` | `apps/web/app/api/investor/documents/download-all/route.ts` | investor |
| `/api/investor/documents` | `apps/web/app/api/investor/documents/route.ts` | investor |
| `/api/investor/forgot-password` | `apps/web/app/api/investor/forgot-password/route.ts` | investor |
| `/api/investor/login` | `apps/web/app/api/investor/login/route.ts` | investor |
| `/api/investor/logout` | `apps/web/app/api/investor/logout/route.ts` | investor |
| `/api/investor/notifications/mark-read` | `apps/web/app/api/investor/notifications/mark-read/route.ts` | investor |
| `/api/investor/notifications` | `apps/web/app/api/investor/notifications/route.ts` | investor |
| `/api/investor/payments` | `apps/web/app/api/investor/payments/route.ts` | investor |
| `/api/investor/referrals` | `apps/web/app/api/investor/referrals/route.ts` | investor |
| `/api/investor/reports/files/{id}` | `apps/web/app/api/investor/reports/files/[id]/route.ts` | investor |
| `/api/investor/reports/files` | `apps/web/app/api/investor/reports/files/route.ts` | investor |
| `/api/investor/reset-password` | `apps/web/app/api/investor/reset-password/route.ts` | investor |
| `/api/investor/reset-password/validate` | `apps/web/app/api/investor/reset-password/validate/route.ts` | investor |
| `/api/investor/settings/export-pdf` | `apps/web/app/api/investor/settings/export-pdf/route.ts` | investor |
| `/api/investor/settings/notifications` | `apps/web/app/api/investor/settings/notifications/route.ts` | investor |
| `/api/investor/settings/password` | `apps/web/app/api/investor/settings/password/route.ts` | investor |
| `/api/investor/settings/sessions` | `apps/web/app/api/investor/settings/sessions/route.ts` | investor |
| `/api/investor/settings/sessions/terminate` | `apps/web/app/api/investor/settings/sessions/terminate/route.ts` | investor |
| `/api/investor/wallets/{id}/default` | `apps/web/app/api/investor/wallets/[id]/default/route.ts` | investor |
| `/api/investor/wallets/{id}` | `apps/web/app/api/investor/wallets/[id]/route.ts` | investor |
| `/api/investor/wallets` | `apps/web/app/api/investor/wallets/route.ts` | investor |
| `/api/investor/withdrawals` | `apps/web/app/api/investor/withdrawals/route.ts` | investor |
| `/api/investor-applications/{id}` | `apps/web/app/api/investor-applications/[id]/route.ts` | investor-applications |
| `/api/investor-applications/{id}/status` | `apps/web/app/api/investor-applications/[id]/status/route.ts` | investor-applications |
| `/api/investor-applications/export.csv` | `apps/web/app/api/investor-applications/export.csv/route.ts` | investor-applications |
| `/api/investor-applications/queue-counts` | `apps/web/app/api/investor-applications/queue-counts/route.ts` | investor-applications |
| `/api/investor-applications` | `apps/web/app/api/investor-applications/route.ts` | investor-applications |
| `/api/investors/{id}/allocations` | `apps/web/app/api/investors/[id]/allocations/route.ts` | investors |
| `/api/investors/{id}/reports` | `apps/web/app/api/investors/[id]/reports/route.ts` | investors |
| `/api/investors/{id}/risk` | `apps/web/app/api/investors/[id]/risk/route.ts` | investors |
| `/api/investors/{id}` | `apps/web/app/api/investors/[id]/route.ts` | investors |
| `/api/investors/from-application` | `apps/web/app/api/investors/from-application/route.ts` | investors |
| `/api/monthly-reports/{id}/allocations/{allocationId}` | `apps/web/app/api/monthly-reports/[id]/allocations/[allocationId]/route.ts` | monthly-reports |
| `/api/monthly-reports/{id}/allocations` | `apps/web/app/api/monthly-reports/[id]/allocations/route.ts` | monthly-reports |
| `/api/monthly-reports/{id}/readiness` | `apps/web/app/api/monthly-reports/[id]/readiness/route.ts` | monthly-reports |
| `/api/monthly-reports/{id}/reconciliation` | `apps/web/app/api/monthly-reports/[id]/reconciliation/route.ts` | monthly-reports |
| `/api/monthly-reports/{id}/regenerate-snapshot` | `apps/web/app/api/monthly-reports/[id]/regenerate-snapshot/route.ts` | monthly-reports |
| `/api/monthly-reports/{id}/risk` | `apps/web/app/api/monthly-reports/[id]/risk/route.ts` | monthly-reports |
| `/api/monthly-reports/{id}/risk/timeline` | `apps/web/app/api/monthly-reports/[id]/risk/timeline/route.ts` | monthly-reports |
| `/api/monthly-reports/{id}` | `apps/web/app/api/monthly-reports/[id]/route.ts` | monthly-reports |
| `/api/notification-events` | `apps/web/app/api/notification-events/route.ts` | notification-events |
| `/api/notification-events/summary` | `apps/web/app/api/notification-events/summary/route.ts` | notification-events |
| `/api/settings/contact` | `apps/web/app/api/settings/contact/route.ts` | settings |
| `/api/stats/investors` | `apps/web/app/api/stats/investors/route.ts` | stats |

## Existing layouts and shared interface

- `apps/web/app/[locale]/admin/layout.tsx`
- `apps/web/app/layout.tsx`

- Public/investor/admin pages share `apps/web/app/layout.tsx` and `apps/web/app/globals.css`. The landing page is composed in `apps/web/components/home/home-page.tsx`; the current dashboard collage is `hero-dashboard.tsx`.
- Admin pages have an additional localized admin layout at `apps/web/app/[locale]/admin/layout.tsx`.
- Investor screens are composed in `apps/web/components/investor/investor-pages.tsx` and `investor-actions.tsx`; page wrappers live in `apps/web/app/[locale]/investor`.
- Referral partner screens use `apps/web/components/arbitrage/arbitrage-shell.tsx` and related forms/dashboard components.
- The separate banking product uses `apps/web/components/banking/*` and inline literal light-theme colors.
- Shared primitives: `packages/ui/src/{accordion,badge,button,card,confirm-dialog,separator}.tsx`.

## Backend, authorization, and business data

- Prisma schema: `prisma/schema.prisma`; models include investor applications, investors, allocations, ledger entries, reports, proofs, withdrawals, documents, sessions, notification events, incidents, referrals, and admin configuration.
- API handlers cover admin CRUD/actions, investor auth/account, applications, allocations/risk/reconciliation, reports, documents, withdrawals, notifications, referrals, and health/contact endpoints. Full handler paths are listed above.
- Admin sessions use signed cookies, CSRF checks, and rate limiting (`apps/web/lib/admin-session.ts`). Investor auth uses signed sessions validated against DB session rows; referral partners use a signed cookie session. Middleware performs locale routing and protected page gates.
- Existing financial calculations and data handling are outside this visual change scope; no API, schema, authentication, or calculation changes are planned.
- Homepage metrics and supply rows are static content constants and were not found to be API-backed. They are excluded from the redesigned public dashboard.
- `apps/web/app/banking/*` is a distinct microbusiness banking demo, not an OTIZ investment route; its demo content remains explicitly labeled and isolated.

## Baseline and limitations

- Git checkout was clean before starting; work proceeds on `redesign/coinsphere-adaptation`.
- `pnpm prisma generate` succeeded in the current environment. Baseline `/ru` returned HTTP 200.
- Baseline screenshots: `screenshots/baseline-desktop.png` (1440 × 1100) and `screenshots/baseline-mobile.png` (390 × 844).
- Browser available: Chromium + Playwright. No deployment command or preview credential/configuration has yet been confirmed.

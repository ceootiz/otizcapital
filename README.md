# OTIZ CAPITAL Frontend Foundation

Premium Next.js frontend foundation for OTIZ CAPITAL, built around real electronics commerce operations, marketplace sales, logistics proof, allocation reporting, and institutional trust.

## Structure

- `apps/web` - Next.js App Router application
- `packages/ui` - shadcn-style reusable UI primitives
- `packages/lib` - shared utilities, i18n, content, and commerce data

## Local development

```bash
pnpm install
pnpm dev
```

Then open `http://localhost:3000/en`.

## Design direction

Private Bank x Apple x Commerce Infrastructure: matte graphite surfaces, warm gold accents, restrained glass layers, calm reveal motion, minimal charts, proof-led operational copy, and no crypto/trading aesthetics.

## Investor applications backend MVP

This MVP uses Prisma with SQLite for local investor application storage. It is intentionally small: no full user/role system, password-only MVP admin auth, no CRM automation, no KYC document storage, and no outbound notifications yet.

### DB setup

Create a local environment file from the example:

```bash
cp .env.example .env
```

The default development database is SQLite:

```env
DATABASE_URL="file:./dev.db"
```

### Prisma commands

```bash
pnpm install
pnpm prisma generate
pnpm prisma migrate dev --name init
```

The migration creates the `InvestorApplication` table with application status tracking.

### Submit an application

Open the localized application page:

```bash
pnpm --filter @otiz/web dev
# http://localhost:3000/en/apply
```

The form posts to:

```text
POST /api/investor-applications
```

The client uses the API by default. A localStorage fallback remains isolated for temporary API/network downtime only.

### View admin applications

The MVP admin route is protected by password-only admin auth, signed session cookies, CSRF checks, and login rate limiting:

```text
/en/admin/applications
/ru/admin/applications
```

The admin page reads from:

```text
GET /api/investor-applications
```

Filtering by status, priority, source, overdue next action, and search are supported. Paginated responses include `pageInfo` and CRM `summary` metrics.

## Production hardening for MVP admin access

Admin access remains a password-only MVP guard. It is intentionally not a full user, role, or SSO system yet, but the production defaults should be treated like real credentials.

### Required admin environment variables

Set these values before deploying:

```bash
ADMIN_PASSWORD="use-a-long-unique-password"
ADMIN_SESSION_SECRET="use-a-random-session-secret"
ADMIN_LOGIN_RATE_LIMIT_WINDOW_MS="900000"
ADMIN_LOGIN_RATE_LIMIT_MAX_ATTEMPTS="5"
```

Generate a session secret with:

```bash
openssl rand -base64 32
```

`ADMIN_PASSWORD` must not be empty in any environment. In production, `ADMIN_PASSWORD="change-me"` is blocked and login is refused.

`ADMIN_SESSION_SECRET` signs admin sessions. In production it is required. In development only, the app can use a fallback secret so local MVP testing does not stall, but that fallback is not safe for deployed environments.

### Admin security model

The MVP admin area uses:

- password-only login
- 8-hour signed HTTP-only session cookie
- readable CSRF cookie paired with the signed session
- `X-CSRF-Token` on admin mutations
- in-memory login rate limiting by forwarded IP

This protects the local MVP flow, but it is not a replacement for a full admin identity system.

### Database note

SQLite is still the local development MVP database. Before production, move investor applications and audit logs to a managed production database, add backups, and add operational monitoring.

## CRM/SLA configuration

Manager queues and SLA indicators are configurable through environment variables. Empty, missing, non-numeric, or non-positive values safely fall back to defaults.

```bash
FIRST_CONTACT_SLA_HOURS="24"
NEXT_ACTION_DUE_SOON_HOURS="24"
HIGH_VALUE_LEAD_AMOUNT="25000"
STALE_LEAD_DAYS="7"
```

These values control:

- `FIRST_CONTACT_SLA_HOURS`: when a new, uncontacted lead becomes first-contact overdue
- `NEXT_ACTION_DUE_SOON_HOURS`: the forward-looking due-soon window for open next actions
- `HIGH_VALUE_LEAD_AMOUNT`: the allocation threshold for high-value lead flags and queues
- `STALE_LEAD_DAYS`: when open, inactive leads enter the stale workflow queue

The admin CRM displays the active rules in the read-only `Current CRM rules` block. Restart the Next.js server after changing these values.

## Admin CRM v1

The protected admin applications page now includes a lightweight CRM workflow for investor leads:

- status updates with audit history
- priority tracking: `LOW`, `NORMAL`, `HIGH`, `VIP`
- manager notes
- source labels
- next action text and due date
- summary cards for new, contacted, approved, high/VIP, overdue, and planned allocation total
- filters for status, priority, source search, and overdue next actions

The CRM remains intentionally small. There is no full role system, no investor dashboard, and no outbound email or Telegram automation yet.

## Notifications foundation

Investor application and status-change events are now written to an internal `NotificationEvent` ledger.

Current MVP behavior:

- new investor applications create `INVESTOR_APPLICATION_CREATED` events
- application status changes create `APPLICATION_STATUS_CHANGED` events
- events use `channel=INTERNAL`
- events start with `status=PENDING`
- admin detail view can read recent notification events per application

Outbound delivery is intentionally not implemented yet. There are no email, Telegram, webhook, or third-party notification API calls in this foundation. Future delivery workers can process `NotificationEvent` rows and update `status`, `processedAt`, and `error` without changing the lead capture or admin CRM flow.

### Notification worker MVP

The admin CRM includes a protected notification processor abstraction:

```text
POST /api/admin/notifications/process
GET /api/notification-events/summary
```

The processor requires an admin session and CSRF token. It reads pending notification events, applies channel/type routing, and updates each row with a terminal MVP status.

Delivery is disabled by default:

```bash
NOTIFICATIONS_DELIVERY_ENABLED="false"
```

With delivery disabled, `INTERNAL` events are marked `SKIPPED` with `Internal event recorded only`, while `EMAIL` and `TELEGRAM` events are marked `SKIPPED` with `Outbound delivery disabled`. Even if the flag is changed later, this MVP does not call email, Telegram, webhook, SMTP, or third-party APIs until provider adapters are explicitly added.

### Notification providers

Notification delivery is routed through provider interfaces, but every real outbound adapter is intentionally disabled in this MVP.

Available interfaces and providers:

- `NotificationProvider`: base provider contract with `canHandle`, `buildMessage`, and `send`
- `EmailProvider`: future email channel contract
- `TelegramProvider`: future Telegram channel contract
- `InternalNotificationProvider`: records internal events only and marks them `SKIPPED`
- `DisabledEmailProvider`: handles `EMAIL` events and marks them `SKIPPED`
- `DisabledTelegramProvider`: handles `TELEGRAM` events and marks them `SKIPPED`

Provider configuration placeholders:

```bash
NOTIFICATIONS_DELIVERY_ENABLED="false"
EMAIL_PROVIDER="disabled"
TELEGRAM_PROVIDER="disabled"
TELEGRAM_BOT_TOKEN=""
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASSWORD=""
```

The `NotificationProviderRegistry` selects a provider by event channel. If no provider can handle the event, the processor marks it `FAILED` with a clear reason. No provider currently sends email, Telegram, SMTP, webhook, or third-party requests.

### Notification templates

Notification copy lives in:

```text
packages/database/src/notifications/templates.ts
```

Supported template types:

- `INVESTOR_APPLICATION_CREATED`
- `APPLICATION_STATUS_CHANGED`
- `NEXT_ACTION_DUE`
- `SLA_BREACH`
- `APPLICATION_APPROVED`
- `APPLICATION_REJECTED`

Each template returns `subject`, `text`, optional `html`, and optional `telegramText`. Copy should stay premium, calm, operational, and proof-oriented: no hype, no financial promises, and no pressure language.

Providers build messages from the template registry. If an event type has no template, processing fails safely with `Missing notification template` so the issue is visible in admin. Delivery remains disabled by default; templates only power internal previews and future provider readiness.

### Notification template safety tests

Template safety tests run with Vitest:

```bash
pnpm test
```

The tests cover all six supported notification templates, snapshot the approved subject/text copy, require non-empty `subject`, `text`, and `telegramText`, and block hype or financial-promise language such as `guaranteed`, `risk-free`, `passive income`, `high yield`, `moon`, or `urgent invest now`.

## Pre-deploy verification

Run the CI-ready verification command from the repository root before shipping:

```bash
pnpm verify
```

This runs the notification template safety tests, web lint, web typecheck, and production build. For a faster local sanity check, use:

```bash
pnpm verify:quick
```

## CI verification

GitHub Actions runs `pnpm verify` on pull requests and pushes to `main` through `.github/workflows/verify.yml`.

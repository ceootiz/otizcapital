# Sentry error monitoring

Sentry (`@sentry/nextjs`) is wired into the web app but **inert by default**. Nothing
is sent, logged, or initialized unless **both** conditions hold:

1. `SENTRY_DSN` is set, and
2. `NODE_ENV === "production"`.

In development, in preview, or without a DSN, `Sentry.init()` is never called — no
network traffic, no console output, no overhead.

## Files

- `sentry.server.config.ts` — Node.js runtime (API routes, RSC).
- `sentry.client.config.ts` — browser.
- `sentry.edge.config.ts` — edge runtime (middleware/edge routes).
- `instrumentation.ts` — loads the server/edge config per runtime + `onRequestError`.
- `next.config.mjs` — wrapped with `withSentryConfig` (injects the client config,
  registers instrumentation, and tunnels browser events through `/monitoring`).

## Behavior

- `tracesSampleRate: 0.1` (10% performance traces).
- 404s (`NEXT_NOT_FOUND`), redirects (`NEXT_REDIRECT`), and aborted/cancelled
  requests are dropped via `ignoreErrors` + `beforeSend` so they never register as
  errors.
- Browser events tunnel through the same-origin `/monitoring` route, so the strict
  CSP and ad-blockers do not drop them. Sentry ingest hosts are also allowed in
  `connect-src` as a fallback.

## To activate

1. Create a project at sentry.io and copy its DSN.
2. Set the env var in production:

   ```bash
   vercel env add SENTRY_DSN production
   # paste the DSN when prompted
   ```

   The variable already exists as an **empty** value in the Vercel project (added so
   the build never warns about a missing var). Update it with the real DSN.

3. (Optional) To upload source maps for readable stack traces, set
   `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` and pass them to
   `withSentryConfig`. Left unset today, so builds skip source-map upload silently.

4. Redeploy. Errors from production will appear in the Sentry dashboard.

## To disable

Remove or blank `SENTRY_DSN`. No code changes required.

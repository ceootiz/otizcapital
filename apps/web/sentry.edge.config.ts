// Sentry edge-runtime initialization (middleware / edge routes).
//
// NO-OP unless SENTRY_DSN is set AND NODE_ENV === "production". Mirrors the
// server config so edge-executed code is covered when monitoring is activated.
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN;

if (dsn && process.env.NODE_ENV === "production") {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    ignoreErrors: ["NEXT_NOT_FOUND", "NEXT_REDIRECT", "AbortError", "The operation was aborted"]
  });
}

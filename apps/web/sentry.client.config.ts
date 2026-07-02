// Sentry browser initialization.
//
// This is a NO-OP unless SENTRY_DSN is set AND NODE_ENV === "production". When
// the DSN is absent, Sentry.init() is never called — no network traffic, no
// console output, no overhead. To activate monitoring, set SENTRY_DSN in
// production (see SENTRY.md). NEXT_PUBLIC_SENTRY_DSN is checked first so the DSN
// can be exposed to the browser build when desired.
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

if (dsn && process.env.NODE_ENV === "production") {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    // Common browser noise + cancelled/aborted requests are not incidents.
    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with undelivered notifications",
      "AbortError",
      "The operation was aborted",
      "The user aborted a request",
      "Non-Error promise rejection captured",
      "NEXT_NOT_FOUND",
      "NEXT_REDIRECT"
    ],
    beforeSend(event, hint) {
      const error = hint?.originalException as { name?: string; digest?: string } | undefined;
      const digest = typeof error?.digest === "string" ? error.digest : "";
      if (digest.startsWith("NEXT_NOT_FOUND") || digest.startsWith("NEXT_REDIRECT")) {
        return null;
      }
      if (error?.name === "AbortError") {
        return null;
      }
      return event;
    }
  });
}

// Sentry server-side (Node.js runtime) initialization.
//
// This is a NO-OP unless SENTRY_DSN is set AND NODE_ENV === "production". When
// the DSN is absent, Sentry.init() is never called, so there is no network
// traffic, no console output, and no runtime overhead. To activate monitoring,
// set the SENTRY_DSN environment variable in production (see SENTRY.md).
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN;

if (dsn && process.env.NODE_ENV === "production") {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    // Control-flow "errors" and cancelled requests are noise, not incidents.
    ignoreErrors: [
      "NEXT_NOT_FOUND",
      "NEXT_REDIRECT",
      "AbortError",
      "The operation was aborted",
      "ResponseAborted",
      "The user aborted a request"
    ],
    beforeSend(event, hint) {
      const error = hint?.originalException as { digest?: string; name?: string } | undefined;
      const digest = typeof error?.digest === "string" ? error.digest : "";
      // Drop Next.js not-found (404) and redirect control-flow throws, plus
      // aborted/cancelled requests, so they never register as errors.
      if (digest.startsWith("NEXT_NOT_FOUND") || digest.startsWith("NEXT_REDIRECT")) {
        return null;
      }
      if (error?.name === "AbortError" || error?.name === "ResponseAborted") {
        return null;
      }
      return event;
    }
  });
}

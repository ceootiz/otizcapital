// Next.js instrumentation hook. Loads the correct Sentry config per runtime.
// The config modules themselves no-op unless SENTRY_DSN is set in production, so
// this import is inert (no side effects) when monitoring is not configured.
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Captures errors thrown in nested React Server Components (Next.js 14.2+/15).
export const onRequestError = Sentry.captureRequestError;

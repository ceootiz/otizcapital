// Generic count-per-request in-memory rate limiter shared across public API
// routes. Each call counts one hit against a (bucket, key) window.
// In-memory = per serverless instance (best-effort); use a shared store
// (Redis/Upstash) for hard guarantees across instances.

type RateEntry = { count: number; resetAt: number };

declare global {
  var __otizRateLimitStore: Map<string, RateEntry> | undefined;
}

const store = globalThis.__otizRateLimitStore ?? new Map<string, RateEntry>();
globalThis.__otizRateLimitStore = store;

function cleanup(now: number) {
  if (store.size < 5000) return;
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) store.delete(key);
  }
}

export function clientIpFromRequest(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("cf-connecting-ip")?.trim() ||
    "local"
  );
}

// Counts one hit; returns whether it is allowed and, if not, the seconds until reset.
export function hitRateLimit(
  bucket: string,
  key: string,
  options: { windowMs: number; max: number }
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  cleanup(now);

  const storeKey = `${bucket}:${key}`;
  const current = store.get(storeKey);

  if (!current || current.resetAt <= now) {
    store.set(storeKey, { count: 1, resetAt: now + options.windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  current.count += 1;

  if (current.count > options.max) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

// Standard 429 response with a Retry-After header.
export function rateLimitedResponse(retryAfterSeconds: number) {
  return new Response(JSON.stringify({ ok: false, error: "Too many requests. Please try again later." }), {
    status: 429,
    headers: { "Content-Type": "application/json", "Retry-After": String(retryAfterSeconds) }
  });
}

// Per-session rate limiter for admin API mutations (not just login).
// Default: 100 requests / minute keyed by the admin session's CSRF token.
type MutationRateEntry = {
  count: number;
  resetAt: number;
};

declare global {
  var __otizAdminMutationRate: Map<string, MutationRateEntry> | undefined;
}

const store = globalThis.__otizAdminMutationRate ?? new Map<string, MutationRateEntry>();
globalThis.__otizAdminMutationRate = store;

function readPositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function getWindowMs() {
  return readPositiveInteger(process.env.ADMIN_MUTATION_RATE_LIMIT_WINDOW_MS, 1000 * 60);
}

function getMaxRequests() {
  return readPositiveInteger(process.env.ADMIN_MUTATION_RATE_LIMIT_MAX, 100);
}

function cleanup() {
  if (store.size < 1000) return;
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) store.delete(key);
  }
}

export function checkAdminMutationRateLimit(sessionKey: string) {
  cleanup();
  const now = Date.now();
  const current = store.get(sessionKey);

  if (!current || current.resetAt <= now) {
    store.set(sessionKey, { count: 1, resetAt: now + getWindowMs() });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  current.count += 1;

  if (current.count > getMaxRequests()) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

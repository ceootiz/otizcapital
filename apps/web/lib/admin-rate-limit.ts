type RateLimitEntry = {
  attempts: number;
  resetAt: number;
};

declare global {
  var __otizAdminLoginAttempts: Map<string, RateLimitEntry> | undefined;
}

const loginAttempts = globalThis.__otizAdminLoginAttempts ?? new Map<string, RateLimitEntry>();
globalThis.__otizAdminLoginAttempts = loginAttempts;

function readPositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
}

function getWindowMs() {
  return readPositiveInteger(process.env.ADMIN_LOGIN_RATE_LIMIT_WINDOW_MS, 1000 * 60 * 15);
}

function getMaxAttempts() {
  return readPositiveInteger(process.env.ADMIN_LOGIN_RATE_LIMIT_MAX_ATTEMPTS, 3);
}

// After the max is hit, the IP is locked out for this long (default 1 hour).
function getLockoutMs() {
  return readPositiveInteger(process.env.ADMIN_LOGIN_LOCKOUT_MS, 1000 * 60 * 60);
}

function getClientKey(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  const cloudflareIp = request.headers.get("cf-connecting-ip")?.trim();

  return forwardedFor || realIp || cloudflareIp || "local";
}

function getEntry(request: Request) {
  const key = getClientKey(request);
  const now = Date.now();
  const current = loginAttempts.get(key);

  if (!current || current.resetAt <= now) {
    const fresh = { attempts: 0, resetAt: now + getWindowMs() };
    loginAttempts.set(key, fresh);
    return { key, entry: fresh };
  }

  return { key, entry: current };
}

function cleanupExpiredEntries() {
  if (loginAttempts.size < 1000) {
    return;
  }

  const now = Date.now();

  for (const [key, entry] of loginAttempts.entries()) {
    if (entry.resetAt <= now) {
      loginAttempts.delete(key);
    }
  }
}

export function checkAdminLoginRateLimit(request: Request) {
  cleanupExpiredEntries();

  const { entry } = getEntry(request);
  const maxAttempts = getMaxAttempts();

  if (entry.attempts >= maxAttempts) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - Date.now()) / 1000)) };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

export function recordAdminLoginFailure(request: Request) {
  const { entry } = getEntry(request);
  entry.attempts += 1;

  // Lockout: once the attempt ceiling is reached, extend the window to a full
  // lockout period (default 1 hour) for this IP.
  if (entry.attempts >= getMaxAttempts()) {
    entry.resetAt = Date.now() + getLockoutMs();
  }
}

export function resetAdminLoginRateLimit(request: Request) {
  loginAttempts.delete(getClientKey(request));
}

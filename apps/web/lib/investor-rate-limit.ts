type RateLimitEntry = {
  attempts: number;
  resetAt: number;
};

declare global {
  var __otizInvestorLoginAttempts: Map<string, RateLimitEntry> | undefined;
}

const loginAttempts = globalThis.__otizInvestorLoginAttempts ?? new Map<string, RateLimitEntry>();
globalThis.__otizInvestorLoginAttempts = loginAttempts;

function readPositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
}

function getWindowMs() {
  return readPositiveInteger(process.env.INVESTOR_LOGIN_RATE_LIMIT_WINDOW_MS, 1000 * 60 * 15);
}

function getMaxAttempts() {
  return readPositiveInteger(process.env.INVESTOR_LOGIN_RATE_LIMIT_MAX_ATTEMPTS, 10);
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

export function checkInvestorLoginRateLimit(request: Request) {
  cleanupExpiredEntries();

  const { entry } = getEntry(request);
  const maxAttempts = getMaxAttempts();

  if (entry.attempts >= maxAttempts) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - Date.now()) / 1000)) };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

export function recordInvestorLoginFailure(request: Request) {
  const { entry } = getEntry(request);
  entry.attempts += 1;
}

export function resetInvestorLoginRateLimit(request: Request) {
  loginAttempts.delete(getClientKey(request));
}

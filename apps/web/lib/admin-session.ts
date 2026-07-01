import crypto from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { checkAdminMutationRateLimit } from "./admin-mutation-rate-limit";

const ADMIN_SESSION_COOKIE = "admin_session";
export const ADMIN_CSRF_COOKIE = "admin_csrf_token";
export const ADMIN_CSRF_HEADER = "x-csrf-token";

const ADMIN_ACTOR = "admin";
// Hardened: 4h TTL (was 8h) for a shorter attack window.
const SESSION_TTL_MS = 1000 * 60 * 60 * 4;
const MAX_ADMIN_BODY_BYTES = 64 * 1024; // reject admin request bodies > 64KB
const DEV_SESSION_SECRET = "otiz-capital-dev-admin-session-secret";

let warnedAboutDevSecret = false;

type AdminSessionPayload = {
  actor: string;
  csrfToken: string;
  ip: string;
  uaHash: string;
  expiresAt: number;
  issuedAt: number;
};

type CsrfResult =
  | { ok: true; session: AdminSessionPayload }
  | { ok: false; status: 401 | 403 | 413 | 429; error: string };

// Binds a session to the client's IP + a hash of the User-Agent. Verified on
// every request; a change invalidates the session (defense against token theft).
function getClientFingerprint() {
  const headerStore = headers();
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerStore.get("x-real-ip")?.trim() ||
    headerStore.get("cf-connecting-ip")?.trim() ||
    "unknown";
  const userAgent = headerStore.get("user-agent") || "unknown";
  const uaHash = crypto.createHash("sha256").update(userAgent).digest("base64url").slice(0, 24);
  return { ip, uaHash };
}

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || "";
}

function getAdminSessionSecret() {
  const configuredSecret = process.env.ADMIN_SESSION_SECRET || "";

  if (configuredSecret) {
    return configuredSecret;
  }

  if (isProduction()) {
    return "";
  }

  if (!warnedAboutDevSecret) {
    warnedAboutDevSecret = true;
    console.warn("[otiz-admin] ADMIN_SESSION_SECRET is not set. Using development-only fallback session secret.");
  }

  return DEV_SESSION_SECRET;
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(encodedPayload: string) {
  const secret = getAdminSessionSecret();

  if (!secret) {
    return null;
  }

  return crypto.createHmac("sha256", secret).update(`admin-session.${encodedPayload}`).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function getAdminPasswordConfigurationError() {
  const configuredPassword = getAdminPassword();

  if (!configuredPassword) {
    return "ADMIN_PASSWORD is not configured.";
  }

  if (isProduction() && configuredPassword === "change-me") {
    return "ADMIN_PASSWORD must be changed in production.";
  }

  return null;
}

function getAdminSessionSecretConfigurationError() {
  if (isProduction() && !process.env.ADMIN_SESSION_SECRET) {
    return "ADMIN_SESSION_SECRET is required in production.";
  }

  return null;
}

export function getAdminLoginConfigurationError() {
  return getAdminPasswordConfigurationError() || getAdminSessionSecretConfigurationError();
}

export function verifyAdminPassword(password: string) {
  const configuredPassword = getAdminPassword();

  if (getAdminPasswordConfigurationError() || !password) {
    return false;
  }

  return safeEqual(password, configuredPassword);
}

function createToken(payload: AdminSessionPayload) {
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = signPayload(encodedPayload);

  if (!signature) {
    return null;
  }

  return `${encodedPayload}.${signature}`;
}

function verifyToken(token: string): AdminSessionPayload | null {
  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signPayload(encodedPayload);

  if (!expectedSignature || !safeEqual(signature, expectedSignature)) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as AdminSessionPayload;

    if (payload.actor !== ADMIN_ACTOR || !payload.csrfToken || payload.expiresAt < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function createAdminSession() {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const csrfToken = crypto.randomBytes(32).toString("base64url");
  const { ip, uaHash } = getClientFingerprint();
  const token = createToken({ actor: ADMIN_ACTOR, csrfToken, ip, uaHash, expiresAt, issuedAt: Date.now() });

  if (!token) {
    return false;
  }

  const cookieOptions = {
    sameSite: "lax" as const,
    secure: isProduction(),
    path: "/",
    expires: new Date(expiresAt)
  };

  cookies().set(ADMIN_SESSION_COOKIE, token, {
    ...cookieOptions,
    httpOnly: true
  });

  cookies().set(ADMIN_CSRF_COOKIE, csrfToken, {
    ...cookieOptions,
    httpOnly: false
  });

  return true;
}

export function clearAdminSession() {
  const cookieOptions = {
    sameSite: "lax" as const,
    secure: isProduction(),
    path: "/",
    expires: new Date(0)
  };

  cookies().set(ADMIN_SESSION_COOKIE, "", {
    ...cookieOptions,
    httpOnly: true
  });

  cookies().set(ADMIN_CSRF_COOKIE, "", {
    ...cookieOptions,
    httpOnly: false
  });
}

export function getAdminSession() {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const payload = verifyToken(token);

  if (!payload) {
    return null;
  }

  // IP + User-Agent binding: a mismatch invalidates the session.
  const fingerprint = getClientFingerprint();
  if (payload.ip !== fingerprint.ip || payload.uaHash !== fingerprint.uaHash) {
    return null;
  }

  return payload;
}

export function verifyAdminCsrfToken(request: Request): CsrfResult {
  const session = getAdminSession();

  if (!session) {
    return { ok: false, status: 401, error: "Unauthorized." };
  }

  // Reject oversized request bodies (defense against resource-exhaustion).
  const contentLength = Number(request.headers.get("content-length") || "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_ADMIN_BODY_BYTES) {
    return { ok: false, status: 413, error: "Request body too large." };
  }

  const headerToken = request.headers.get(ADMIN_CSRF_HEADER) || "";
  const cookieToken = cookies().get(ADMIN_CSRF_COOKIE)?.value || "";

  if (!headerToken || !cookieToken || !safeEqual(headerToken, cookieToken) || !safeEqual(headerToken, session.csrfToken)) {
    return { ok: false, status: 403, error: "Invalid admin request." };
  }

  // Per-session mutation rate limit (100 req/min): applies to every mutating
  // admin API route that goes through this CSRF gate.
  const rate = checkAdminMutationRateLimit(session.csrfToken);
  if (!rate.allowed) {
    return { ok: false, status: 429, error: "Too many requests. Please slow down." };
  }

  return { ok: true, session };
}

// Strips null bytes and control characters from a string input (shared admin sanitizer).
export function sanitizeAdminInput(value: unknown, maxLength = 2000): string {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, maxLength);
}

export function requireAdminSession(locale: string) {
  const session = getAdminSession();

  if (!session) {
    redirect(`/${locale}/admin/login`);
  }

  return session;
}

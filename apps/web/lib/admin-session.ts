import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const ADMIN_SESSION_COOKIE = "admin_session";
export const ADMIN_CSRF_COOKIE = "admin_csrf_token";
export const ADMIN_CSRF_HEADER = "x-csrf-token";

const ADMIN_ACTOR = "admin";
const SESSION_TTL_MS = 1000 * 60 * 60 * 8;
const DEV_SESSION_SECRET = "otiz-capital-dev-admin-session-secret";

let warnedAboutDevSecret = false;

type AdminSessionPayload = {
  actor: string;
  csrfToken: string;
  expiresAt: number;
  issuedAt: number;
};

type CsrfResult =
  | { ok: true; session: AdminSessionPayload }
  | { ok: false; status: 401 | 403; error: string };

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
  const token = createToken({ actor: ADMIN_ACTOR, csrfToken, expiresAt, issuedAt: Date.now() });

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

  return verifyToken(token);
}

export function verifyAdminCsrfToken(request: Request): CsrfResult {
  const session = getAdminSession();

  if (!session) {
    return { ok: false, status: 401, error: "Unauthorized." };
  }

  const headerToken = request.headers.get(ADMIN_CSRF_HEADER) || "";
  const cookieToken = cookies().get(ADMIN_CSRF_COOKIE)?.value || "";

  if (!headerToken || !cookieToken || !safeEqual(headerToken, cookieToken) || !safeEqual(headerToken, session.csrfToken)) {
    return { ok: false, status: 403, error: "Invalid admin request." };
  }

  return { ok: true, session };
}

export function requireAdminSession(locale: string) {
  const session = getAdminSession();

  if (!session) {
    redirect(`/${locale}/admin/login`);
  }

  return session;
}

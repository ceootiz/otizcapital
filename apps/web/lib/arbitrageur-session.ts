import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Arbitrageur (referral partner) cabinet session. Mirrors the investor session's
// HMAC-signed cookie, but is cookie-only — there is no DB session table for
// arbitrageurs (no remote-termination requirement), so validity is: signature
// valid + not expired + the account still ACTIVE (re-checked in the API gate).

const ARBITRAGEUR_SESSION_COOKIE = "arbitrageur_session";
const ARBITRAGEUR_ACTOR = "arbitrageur";
export const ARBITRAGEUR_SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
const DEV_SESSION_SECRET = "otiz-capital-dev-arbitrageur-session-secret";

let warnedAboutDevSecret = false;

type ArbitrageurSessionPayload = {
  actor: string;
  arbitrageurId: string;
  email: string;
  expiresAt: number;
  issuedAt: number;
};

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function getSessionSecret() {
  const configuredSecret =
    process.env.ARBITRAGEUR_SESSION_SECRET || process.env.INVESTOR_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET || "";

  if (configuredSecret) return configuredSecret;
  if (isProduction()) return "";

  if (!warnedAboutDevSecret) {
    warnedAboutDevSecret = true;
    console.warn("[otiz-arbitrageur] ARBITRAGEUR_SESSION_SECRET is not set. Using development-only fallback session secret.");
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
  const secret = getSessionSecret();
  if (!secret) return null;
  return crypto.createHmac("sha256", secret).update(`arbitrageur-session.${encodedPayload}`).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function createToken(payload: ArbitrageurSessionPayload) {
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = signPayload(encodedPayload);
  if (!signature) return null;
  return `${encodedPayload}.${signature}`;
}

function verifyToken(token: string): ArbitrageurSessionPayload | null {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  const expectedSignature = signPayload(encodedPayload);
  if (!expectedSignature || !safeEqual(signature, expectedSignature)) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as ArbitrageurSessionPayload;
    if (payload.actor !== ARBITRAGEUR_ACTOR || !payload.arbitrageurId || !payload.email || payload.expiresAt < Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function createArbitrageurSession(input: { arbitrageurId: string; email: string }) {
  const expiresAt = Date.now() + ARBITRAGEUR_SESSION_TTL_MS;
  const token = createToken({
    actor: ARBITRAGEUR_ACTOR,
    arbitrageurId: input.arbitrageurId,
    email: input.email,
    expiresAt,
    issuedAt: Date.now()
  });
  if (!token) return false;

  cookies().set(ARBITRAGEUR_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction(),
    path: "/",
    expires: new Date(expiresAt)
  });
  return true;
}

export function clearArbitrageurSession() {
  cookies().set(ARBITRAGEUR_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction(),
    path: "/",
    expires: new Date(0)
  });
}

export function getArbitrageurSession() {
  const token = cookies().get(ARBITRAGEUR_SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

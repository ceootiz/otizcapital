import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { findInvestorById } from "@otiz/database";

const INVESTOR_SESSION_COOKIE = "investor_session";
const INVESTOR_ACTOR = "investor";
// "Remember me": investor sessions persist for 30 days (admin sessions stay short).
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const DEV_SESSION_SECRET = "otiz-capital-dev-investor-session-secret";

let warnedAboutDevSecret = false;

type InvestorSessionPayload = {
  actor: string;
  investorId: string;
  email: string;
  expiresAt: number;
  issuedAt: number;
};

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function getInvestorSessionSecret() {
  const configuredSecret = process.env.INVESTOR_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET || "";

  if (configuredSecret) {
    return configuredSecret;
  }

  if (isProduction()) {
    return "";
  }

  if (!warnedAboutDevSecret) {
    warnedAboutDevSecret = true;
    console.warn("[otiz-investor] INVESTOR_SESSION_SECRET is not set. Using development-only fallback session secret.");
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
  const secret = getInvestorSessionSecret();

  if (!secret) {
    return null;
  }

  return crypto.createHmac("sha256", secret).update(`investor-session.${encodedPayload}`).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function createToken(payload: InvestorSessionPayload) {
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = signPayload(encodedPayload);

  if (!signature) {
    return null;
  }

  return `${encodedPayload}.${signature}`;
}

function verifyToken(token: string): InvestorSessionPayload | null {
  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signPayload(encodedPayload);

  if (!expectedSignature || !safeEqual(signature, expectedSignature)) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as InvestorSessionPayload;

    if (payload.actor !== INVESTOR_ACTOR || !payload.investorId || !payload.email || payload.expiresAt < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function getInvestorAccessCode() {
  if (process.env.INVESTOR_ACCESS_CODE) {
    return process.env.INVESTOR_ACCESS_CODE;
  }

  return isProduction() ? "" : "otiz-demo";
}

export function verifyInvestorAccessCode(accessCode: string) {
  const configuredCode = getInvestorAccessCode();

  if (!configuredCode || !accessCode) {
    return false;
  }

  return safeEqual(accessCode, configuredCode);
}

export function createInvestorSession(input: { investorId: string; email: string }) {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const token = createToken({
    actor: INVESTOR_ACTOR,
    investorId: input.investorId,
    email: input.email,
    expiresAt,
    issuedAt: Date.now()
  });

  if (!token) {
    return false;
  }

  cookies().set(INVESTOR_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction(),
    path: "/",
    expires: new Date(expiresAt)
  });

  return true;
}

export function clearInvestorSession() {
  cookies().set(INVESTOR_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction(),
    path: "/",
    expires: new Date(0)
  });
}

export function getInvestorSession() {
  const token = cookies().get(INVESTOR_SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  return verifyToken(token);
}

export async function requireInvestorSession(locale: string) {
  const session = getInvestorSession();

  if (!session) {
    redirect(`/${locale}/investor/login`);
  }

  const investor = await findInvestorById(session.investorId);

  if (!investor || investor.email !== session.email || investor.status !== "ACTIVE") {
    clearInvestorSession();
    redirect(`/${locale}/investor/login`);
  }

  return investor;
}

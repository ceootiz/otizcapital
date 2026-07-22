import crypto from "node:crypto";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createInvestorSessionRecord, findInvestorByEmail, serializeInvestor } from "@otiz/database";
import { createInvestorSession, INVESTOR_SESSION_TTL_MS, verifyInvestorAccessCode } from "@/lib/investor-session";
import { checkInvestorLoginRateLimit, recordInvestorLoginFailure, resetInvestorLoginRateLimit } from "@/lib/investor-rate-limit";

export const dynamic = "force-dynamic";

function clientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

function sanitizeString(value: unknown, maxLength = 160) {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function isEmail(value: string) {
  return /^\S+@\S+\.\S+$/.test(value);
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export async function POST(request: Request) {
  const rateLimit = checkInvestorLoginRateLimit(request);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many login attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const email = sanitizeString(payload?.email, 180).toLowerCase();
  // Keep accepting the old accessCode field for already-open browser tabs, but
  // the current UI always submits one password field. For accounts without a
  // permanent password, the approval credential acts as the first temporary
  // password. Once a bcrypt hash exists, only that password is accepted.
  const password = typeof payload?.password === "string" ? payload.password.slice(0, 200) : "";
  const legacyAccessCode = sanitizeString(payload?.accessCode, 120);
  const credential = password || legacyAccessCode;

  if (!isEmail(email)) {
    return NextResponse.json({ ok: false, error: "A valid investor email is required." }, { status: 422 });
  }

  const investor = await findInvestorByEmail(email);

  if (!investor) {
    recordInvestorLoginFailure(request);
    return NextResponse.json({ ok: false, error: "Invalid email or password." }, { status: 401 });
  }

  const matches = investor.passwordHash
    ? Boolean(password) && await bcrypt.compare(password, investor.passwordHash)
    : investor.personalAccessCode
      ? Boolean(credential) && safeEqual(credential, investor.personalAccessCode)
      : verifyInvestorAccessCode(credential);

  if (!matches) {
    recordInvestorLoginFailure(request);
    return NextResponse.json({ ok: false, error: "Invalid email or password." }, { status: 401 });
  }

  if (investor.status !== "ACTIVE") {
    recordInvestorLoginFailure(request);
    return NextResponse.json({ ok: false, error: "Investor access is not active." }, { status: 403 });
  }

  const sessionRow = await createInvestorSessionRecord({
    investorId: investor.id,
    ip: clientIp(request),
    userAgent: (request.headers.get("user-agent") || "unknown").slice(0, 400),
    expiresAt: new Date(Date.now() + INVESTOR_SESSION_TTL_MS)
  });

  if (!createInvestorSession({ investorId: investor.id, email: investor.email, sessionId: sessionRow.id })) {
    return NextResponse.json({ ok: false, error: "Investor session is not available." }, { status: 500 });
  }

  resetInvestorLoginRateLimit(request);

  return NextResponse.json({ ok: true, data: serializeInvestor(investor) });
}

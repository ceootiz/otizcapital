import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { consumePasswordResetToken, getPasswordResetToken } from "@otiz/database";
import { clientIpFromRequest, hitRateLimit, rateLimitedResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

function sanitizeToken(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, 200);
}

export async function POST(request: Request) {
  // Modest per-IP limit against reset brute-forcing (tokens are 32 random bytes,
  // so guessing is already infeasible; this is belt-and-suspenders).
  const ip = clientIpFromRequest(request);
  const ipLimit = hitRateLimit("investor-reset-ip", ip, { windowMs: 60 * 60 * 1000, max: 20 });
  if (!ipLimit.allowed) {
    return rateLimitedResponse(ipLimit.retryAfterSeconds);
  }

  const payload = (await request.json().catch(() => null)) as { token?: unknown; newPassword?: unknown } | null;
  const token = sanitizeToken(payload?.token);
  // Password is length-bounded only (never whitespace-normalized) so it hashes
  // byte-for-byte.
  const newPassword = typeof payload?.newPassword === "string" ? payload.newPassword.slice(0, 200) : "";

  if (!token) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const record = await getPasswordResetToken(token);

  if (!record) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }
  if (record.usedAt) {
    return NextResponse.json({ ok: false, error: "used" }, { status: 400 });
  }
  if (record.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ ok: false, error: "expired" }, { status: 400 });
  }
  if (record.investor.status !== "ACTIVE") {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  if (newPassword.length < 8) {
    return NextResponse.json({ ok: false, error: "PASSWORD_TOO_SHORT" }, { status: 400 });
  }
  if (newPassword.length > 200) {
    return NextResponse.json({ ok: false, error: "PASSWORD_TOO_LONG" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  // Sets the new hash, marks this token used, and invalidates all other unused
  // tokens for the investor (single transaction).
  const consumed = await consumePasswordResetToken({ investorId: record.investorId, token, passwordHash });
  if (!consumed) {
    return NextResponse.json({ ok: false, error: "used" }, { status: 409 });
  }

  return NextResponse.json({ ok: true });
}

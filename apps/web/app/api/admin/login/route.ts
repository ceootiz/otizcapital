import { NextResponse } from "next/server";
import { createAdminSession, getAdminLoginConfigurationError, verifyAdminPassword } from "@/lib/admin-session";
import { checkAdminLoginRateLimit, recordAdminLoginFailure, resetAdminLoginRateLimit } from "@/lib/admin-rate-limit";

const LOGIN_ERROR = "Unable to sign in.";

export async function POST(request: Request) {
  const rateLimit = checkAdminLoginRateLimit(request);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many login attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  const configurationError = getAdminLoginConfigurationError();

  if (configurationError) {
    console.error(`[otiz-admin] ${configurationError}`);
    return NextResponse.json({ ok: false, error: "Admin login is not configured." }, { status: 503 });
  }

  const payload = (await request.json().catch(() => null)) as { password?: string } | null;

  if (!payload?.password || !verifyAdminPassword(payload.password)) {
    recordAdminLoginFailure(request);
    return NextResponse.json({ ok: false, error: LOGIN_ERROR }, { status: 401 });
  }

  if (!createAdminSession()) {
    return NextResponse.json({ ok: false, error: "Admin login is not configured." }, { status: 503 });
  }

  resetAdminLoginRateLimit(request);

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { createAuditLogEntry } from "@otiz/database";
import { createAdminSession, getAdminLoginConfigurationError, verifyAdminPassword } from "@/lib/admin-session";
import { checkAdminLoginRateLimit, recordAdminLoginFailure, resetAdminLoginRateLimit } from "@/lib/admin-rate-limit";
import { isAdminTotpEnabled, verifyAdminTotp } from "@/lib/admin-totp";

export const dynamic = "force-dynamic";

const LOGIN_ERROR = "Unable to sign in.";

function clientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

async function auditLogin(request: Request, action: "ADMIN_LOGIN_SUCCESS" | "ADMIN_LOGIN_FAILURE", detail?: string) {
  const ip = clientIp(request);
  await createAuditLogEntry({
    actor: "admin",
    action,
    entityType: "AdminSession",
    entityId: ip,
    afterJson: JSON.stringify({ ip, userAgent: request.headers.get("user-agent") || "unknown", detail: detail ?? null })
  });
}

export async function POST(request: Request) {
  const rateLimit = checkAdminLoginRateLimit(request);

  if (!rateLimit.allowed) {
    await auditLogin(request, "ADMIN_LOGIN_FAILURE", "rate-limited");
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

  const payload = (await request.json().catch(() => null)) as { password?: string; totpCode?: string } | null;

  if (!payload?.password || !verifyAdminPassword(payload.password)) {
    recordAdminLoginFailure(request);
    await auditLogin(request, "ADMIN_LOGIN_FAILURE", "bad-password");
    return NextResponse.json({ ok: false, error: LOGIN_ERROR }, { status: 401 });
  }

  // Second factor (only when ADMIN_TOTP_SECRET is configured).
  if (isAdminTotpEnabled()) {
    const totpCode = typeof payload.totpCode === "string" ? payload.totpCode.trim() : "";

    if (!totpCode) {
      // Password is valid; prompt for the 2FA code without counting a failure.
      return NextResponse.json({ ok: false, totpRequired: true, error: "Enter your 2FA code." }, { status: 401 });
    }

    if (!verifyAdminTotp(totpCode)) {
      recordAdminLoginFailure(request);
      await auditLogin(request, "ADMIN_LOGIN_FAILURE", "bad-totp");
      return NextResponse.json({ ok: false, totpRequired: true, error: "Invalid 2FA code." }, { status: 401 });
    }
  }

  if (!createAdminSession()) {
    return NextResponse.json({ ok: false, error: "Admin login is not configured." }, { status: 503 });
  }

  resetAdminLoginRateLimit(request);
  await auditLogin(request, "ADMIN_LOGIN_SUCCESS");

  return NextResponse.json({ ok: true });
}

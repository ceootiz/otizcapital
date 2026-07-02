import { NextResponse } from "next/server";
import { getPasswordResetToken } from "@otiz/database";
import { clientIpFromRequest, hitRateLimit, rateLimitedResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// GET: check a reset token before rendering the reset form. Returns
// { valid, error?: "invalid" | "expired" | "used" } so the page can show the
// right state without exposing any account detail.
export async function GET(request: Request) {
  const ip = clientIpFromRequest(request);
  const ipLimit = hitRateLimit("investor-reset-validate-ip", ip, { windowMs: 60 * 60 * 1000, max: 60 });
  if (!ipLimit.allowed) {
    return rateLimitedResponse(ipLimit.retryAfterSeconds);
  }

  const url = new URL(request.url);
  const token = (url.searchParams.get("token") || "").trim().slice(0, 200);

  if (!token) {
    return NextResponse.json({ valid: false, error: "invalid" });
  }

  const record = await getPasswordResetToken(token);

  if (!record || record.investor.status !== "ACTIVE") {
    return NextResponse.json({ valid: false, error: "invalid" });
  }
  if (record.usedAt) {
    return NextResponse.json({ valid: false, error: "used" });
  }
  if (record.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ valid: false, error: "expired" });
  }

  return NextResponse.json({ valid: true });
}

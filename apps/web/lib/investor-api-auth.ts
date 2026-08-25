import { NextResponse } from "next/server";
import { headers, type UnsafeUnwrappedHeaders } from "next/headers";
import { findInvestorById } from "@otiz/database";
import { clearInvestorSession, getValidatedInvestorSession } from "@/lib/investor-session";
import { hitRateLimit } from "@/lib/rate-limit";
import { isTrustedRequestOrigin } from "@/lib/request-origin";

// Shared gate for investor API routes: DB-validated session + active investor +
// a 60 requests/minute per-session rate limit.
export async function requireInvestorApi() {
  const requestHeaders = headers() as unknown as UnsafeUnwrappedHeaders;
  if (!isTrustedRequestOrigin(
    requestHeaders.get("origin"),
    requestHeaders.get("x-forwarded-host") || requestHeaders.get("host"),
    requestHeaders.get("x-forwarded-proto")
  )) {
    return { ok: false as const, status: 403 as const, error: "Invalid request origin." };
  }

  const session = await getValidatedInvestorSession();
  if (!session) return { ok: false as const, status: 401 as const, error: "Unauthorized." };

  const investor = await findInvestorById(session.investorId);
  if (!investor || investor.email !== session.email || investor.status !== "ACTIVE") {
    clearInvestorSession();
    return { ok: false as const, status: 401 as const, error: "Unauthorized." };
  }

  const rl = hitRateLimit("investor-api", session.sessionId, { windowMs: 60_000, max: 60 });
  if (!rl.allowed) {
    return { ok: false as const, status: 429 as const, error: "Too many requests. Please slow down.", retryAfterSeconds: rl.retryAfterSeconds };
  }

  return { ok: true as const, investor, session };
}

// Builds the error response for a failed requireInvestorApi (adds Retry-After on 429).
export function investorApiErrorResponse(auth: { status: number; error: string; retryAfterSeconds?: number }) {
  const headers: Record<string, string> = {};
  if (auth.status === 429 && auth.retryAfterSeconds) headers["Retry-After"] = String(auth.retryAfterSeconds);
  return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status, headers });
}

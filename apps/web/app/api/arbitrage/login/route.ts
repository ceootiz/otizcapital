import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { findArbitrageurByEmail } from "@otiz/database";
import { createArbitrageurSession } from "@/lib/arbitrageur-session";
import { clientIpFromRequest, hitRateLimit, rateLimitedResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// Arbitrageur cabinet login. Only ACTIVE (admin-approved) accounts may sign in;
// PENDING and SUSPENDED accounts get a specific, non-enumerating message.
export async function POST(request: Request) {
  const limit = hitRateLimit("arbitrage-login", clientIpFromRequest(request), { windowMs: 15 * 60 * 1000, max: 10 });
  if (!limit.allowed) return rateLimitedResponse(limit.retryAfterSeconds);

  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const email = typeof payload?.email === "string" ? payload.email.trim().toLowerCase() : "";
  const password = typeof payload?.password === "string" ? payload.password : "";
  if (!email || !password) {
    return NextResponse.json({ ok: false, error: "INVALID_CREDENTIALS" }, { status: 401 });
  }

  const arbitrageur = await findArbitrageurByEmail(email);
  const matches = arbitrageur?.passwordHash ? await bcrypt.compare(password, arbitrageur.passwordHash) : false;
  if (!arbitrageur || !matches) {
    return NextResponse.json({ ok: false, error: "INVALID_CREDENTIALS" }, { status: 401 });
  }

  if (arbitrageur.status === "PENDING") {
    return NextResponse.json({ ok: false, error: "ACCOUNT_PENDING" }, { status: 403 });
  }
  if (arbitrageur.status !== "ACTIVE") {
    return NextResponse.json({ ok: false, error: "ACCOUNT_SUSPENDED" }, { status: 403 });
  }

  if (!createArbitrageurSession({ arbitrageurId: arbitrageur.id, email: arbitrageur.email })) {
    return NextResponse.json({ ok: false, error: "SESSION_UNAVAILABLE" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

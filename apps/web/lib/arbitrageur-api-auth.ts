import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { findArbitrageurById } from "@otiz/database";
import { clearArbitrageurSession, getArbitrageurSession } from "./arbitrageur-session";
import { hitRateLimit } from "./rate-limit";

// Server-component guard for the arbitrageur cabinet: redirects to login unless
// the signed session maps to an existing ACTIVE account. Returns the account.
export async function requireArbitrageurPage(locale: string) {
  const session = getArbitrageurSession();
  if (!session) redirect(`/${locale}/arbitrage/login`);

  const arbitrageur = await findArbitrageurById(session.arbitrageurId);
  if (!arbitrageur || arbitrageur.email !== session.email || arbitrageur.status !== "ACTIVE") {
    redirect(`/${locale}/arbitrage/login`);
  }
  return arbitrageur;
}

type ArbitrageurApiFailure = { ok: false; status: 401 | 429; error: string; retryAfterSeconds?: number };

// API gate for arbitrageur cabinet routes: valid signed session + the account
// still exists and is ACTIVE + a per-account rate limit. A PENDING/SUSPENDED
// account is treated as unauthorized and its cookie cleared.
export async function requireArbitrageurApi() {
  const session = getArbitrageurSession();
  if (!session) return { ok: false as const, status: 401 as const, error: "Unauthorized." } satisfies ArbitrageurApiFailure;

  const arbitrageur = await findArbitrageurById(session.arbitrageurId);
  if (!arbitrageur || arbitrageur.email !== session.email || arbitrageur.status !== "ACTIVE") {
    clearArbitrageurSession();
    return { ok: false as const, status: 401 as const, error: "Unauthorized." } satisfies ArbitrageurApiFailure;
  }

  const rl = hitRateLimit("arbitrageur-api", arbitrageur.id, { windowMs: 60_000, max: 60 });
  if (!rl.allowed) {
    return {
      ok: false as const,
      status: 429 as const,
      error: "Too many requests. Please slow down.",
      retryAfterSeconds: rl.retryAfterSeconds
    } satisfies ArbitrageurApiFailure;
  }

  return { ok: true as const, arbitrageur };
}

export function arbitrageurApiErrorResponse(failure: ArbitrageurApiFailure) {
  const headers = failure.retryAfterSeconds ? { "Retry-After": String(failure.retryAfterSeconds) } : undefined;
  return NextResponse.json({ ok: false, error: failure.error }, { status: failure.status, headers });
}

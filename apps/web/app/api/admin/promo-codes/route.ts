import { NextResponse } from "next/server";
import { createPromoCode, listPromoCodes, serializePromoCode } from "@otiz/database";
import { getAdminSession, verifyAdminCsrfToken } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

// GET /api/admin/promo-codes — list all promo codes for the admin manager.
export async function GET() {
  if (!getAdminSession()) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const promos = await listPromoCodes();
  return NextResponse.json({ ok: true, data: promos.map(serializePromoCode) });
}

// POST /api/admin/promo-codes — create a new promo code.
//   { code, yieldRateOverride, maxUses: number|null, expiresAt: ISO|null, isActive }
export async function POST(request: Request) {
  const csrf = verifyAdminCsrfToken(request);
  if (!csrf.ok) return NextResponse.json({ ok: false, error: csrf.error }, { status: csrf.status });

  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!payload) return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 422 });

  const code = typeof payload.code === "string" ? payload.code : "";
  const yieldRateOverride = Number(payload.yieldRateOverride);
  if (!Number.isFinite(yieldRateOverride)) {
    return NextResponse.json({ ok: false, error: "RATE_INVALID" }, { status: 422 });
  }

  let maxUses: number | null = null;
  if (payload.maxUses !== null && payload.maxUses !== undefined && payload.maxUses !== "") {
    const num = Number(payload.maxUses);
    if (!Number.isFinite(num) || num < 0) {
      return NextResponse.json({ ok: false, error: "Max uses must be a positive number." }, { status: 422 });
    }
    maxUses = Math.floor(num);
  }

  let expiresAt: Date | null = null;
  if (typeof payload.expiresAt === "string" && payload.expiresAt.trim() !== "") {
    const parsed = new Date(payload.expiresAt);
    if (Number.isNaN(parsed.getTime())) {
      return NextResponse.json({ ok: false, error: "Invalid expiry date." }, { status: 422 });
    }
    expiresAt = parsed;
  }

  const isActive = payload.isActive !== false;

  const result = await createPromoCode({ code, yieldRateOverride, maxUses, expiresAt, isActive });
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true, data: serializePromoCode(result.promo) });
}

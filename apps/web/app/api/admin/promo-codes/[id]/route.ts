import { NextResponse } from "next/server";
import { deletePromoCode, serializePromoCode, updatePromoCode } from "@otiz/database";
import { verifyAdminCsrfToken } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

// PATCH /api/admin/promo-codes/[id] — update rate, max uses, expiry, or active flag.
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const csrf = verifyAdminCsrfToken(request);
  if (!csrf.ok) return NextResponse.json({ ok: false, error: csrf.error }, { status: csrf.status });

  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!payload) return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 422 });

  const partial: {
    yieldRateOverride?: number;
    maxUses?: number | null;
    expiresAt?: Date | null;
    isActive?: boolean;
  } = {};

  if (payload.yieldRateOverride !== undefined) {
    const num = Number(payload.yieldRateOverride);
    if (!Number.isFinite(num) || num < 0) {
      return NextResponse.json({ ok: false, error: "RATE_INVALID" }, { status: 422 });
    }
    partial.yieldRateOverride = num;
  }

  if (payload.maxUses !== undefined) {
    if (payload.maxUses === null || payload.maxUses === "") {
      partial.maxUses = null;
    } else {
      const num = Number(payload.maxUses);
      if (!Number.isFinite(num) || num < 0) {
        return NextResponse.json({ ok: false, error: "Max uses must be a positive number." }, { status: 422 });
      }
      partial.maxUses = Math.floor(num);
    }
  }

  if (payload.expiresAt !== undefined) {
    if (payload.expiresAt === null || payload.expiresAt === "") {
      partial.expiresAt = null;
    } else if (typeof payload.expiresAt === "string") {
      const parsed = new Date(payload.expiresAt);
      if (Number.isNaN(parsed.getTime())) {
        return NextResponse.json({ ok: false, error: "Invalid expiry date." }, { status: 422 });
      }
      partial.expiresAt = parsed;
    }
  }

  if (typeof payload.isActive === "boolean") {
    partial.isActive = payload.isActive;
  }

  const updated = await updatePromoCode(params.id, partial);
  if (!updated) {
    return NextResponse.json({ ok: false, error: "Promo code not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, data: serializePromoCode(updated) });
}

// DELETE /api/admin/promo-codes/[id] — remove a promo code.
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const csrf = verifyAdminCsrfToken(request);
  if (!csrf.ok) return NextResponse.json({ ok: false, error: csrf.error }, { status: csrf.status });

  const deleted = await deletePromoCode(params.id);
  if (!deleted) {
    return NextResponse.json({ ok: false, error: "Promo code not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

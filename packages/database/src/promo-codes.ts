import { Prisma, type PromoCode } from "@prisma/client";
import { prisma } from "./client";

// Promo codes granting a custom annual yield rate (percent, e.g. 60 = 60%/yr).
// Applied on the /apply form; consumed (usedCount++) when the application is
// approved and the override is copied onto the Investor.

export type SerializedPromoCode = {
  id: string;
  code: string;
  yieldRateOverride: number;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
};

export function serializePromoCode(promo: PromoCode): SerializedPromoCode {
  return {
    id: promo.id,
    code: promo.code,
    yieldRateOverride: Number(promo.yieldRateOverride),
    maxUses: promo.maxUses,
    usedCount: promo.usedCount,
    expiresAt: promo.expiresAt ? promo.expiresAt.toISOString() : null,
    isActive: promo.isActive,
    createdAt: promo.createdAt.toISOString()
  };
}

export type PromoValidationReason = "NOT_FOUND" | "INACTIVE" | "EXPIRED" | "MAXED_OUT";
export type PromoValidation = { ok: true; promo: PromoCode } | { ok: false; reason: PromoValidationReason };

// Normalizes a user-entered code (trim + uppercase) so lookups are consistent.
export function normalizePromoCode(code: unknown): string {
  return typeof code === "string" ? code.trim().toUpperCase() : "";
}

export async function validatePromoCode(code: string): Promise<PromoValidation> {
  const normalized = normalizePromoCode(code);
  if (!normalized) return { ok: false, reason: "NOT_FOUND" };
  const promo = await prisma.promoCode.findUnique({ where: { code: normalized } });
  if (!promo) return { ok: false, reason: "NOT_FOUND" };
  if (!promo.isActive) return { ok: false, reason: "INACTIVE" };
  if (promo.expiresAt && promo.expiresAt.getTime() < Date.now()) return { ok: false, reason: "EXPIRED" };
  if (promo.maxUses != null && promo.usedCount >= promo.maxUses) return { ok: false, reason: "MAXED_OUT" };
  return { ok: true, promo };
}

// Re-validates and atomically increments usedCount. The conditional updateMany
// guards the maxUses ceiling against concurrent approvals. Returns the promo
// (pre-increment) on success, or null if invalid/exhausted.
export async function consumePromoCode(code: string): Promise<PromoCode | null> {
  const validation = await validatePromoCode(code);
  if (!validation.ok) return null;
  const promo = validation.promo;
  const result = await prisma.promoCode.updateMany({
    where: { id: promo.id, isActive: true, ...(promo.maxUses != null ? { usedCount: { lt: promo.maxUses } } : {}) },
    data: { usedCount: { increment: 1 } }
  });
  if (result.count === 0) return null;
  return promo;
}

// --- Admin CRUD ------------------------------------------------------------

export async function listPromoCodes() {
  return prisma.promoCode.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getPromoCodeById(id: string) {
  return prisma.promoCode.findUnique({ where: { id } });
}

export type CreatePromoResult = { ok: true; promo: PromoCode } | { ok: false; status: number; error: string };

export async function createPromoCode(input: {
  code: string;
  yieldRateOverride: number;
  maxUses: number | null;
  expiresAt: Date | null;
  isActive: boolean;
}): Promise<CreatePromoResult> {
  const code = normalizePromoCode(input.code);
  if (!code) return { ok: false, status: 422, error: "CODE_REQUIRED" };
  if (!Number.isFinite(input.yieldRateOverride) || input.yieldRateOverride <= 0) {
    return { ok: false, status: 422, error: "RATE_INVALID" };
  }
  const existing = await prisma.promoCode.findUnique({ where: { code } });
  if (existing) return { ok: false, status: 409, error: "CODE_EXISTS" };
  const promo = await prisma.promoCode.create({
    data: {
      code,
      yieldRateOverride: new Prisma.Decimal(input.yieldRateOverride),
      maxUses: input.maxUses,
      expiresAt: input.expiresAt,
      isActive: input.isActive
    }
  });
  return { ok: true, promo };
}

export async function updatePromoCode(
  id: string,
  input: Partial<{ yieldRateOverride: number; maxUses: number | null; expiresAt: Date | null; isActive: boolean }>
): Promise<PromoCode | null> {
  const existing = await prisma.promoCode.findUnique({ where: { id } });
  if (!existing) return null;
  return prisma.promoCode.update({
    where: { id },
    data: {
      ...(input.yieldRateOverride !== undefined ? { yieldRateOverride: new Prisma.Decimal(input.yieldRateOverride) } : {}),
      ...(input.maxUses !== undefined ? { maxUses: input.maxUses } : {}),
      ...(input.expiresAt !== undefined ? { expiresAt: input.expiresAt } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {})
    }
  });
}

export async function deletePromoCode(id: string): Promise<boolean> {
  const existing = await prisma.promoCode.findUnique({ where: { id } });
  if (!existing) return false;
  await prisma.promoCode.delete({ where: { id } });
  return true;
}

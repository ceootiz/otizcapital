import { Prisma, type KycVerification } from "@prisma/client";
import { prisma } from "./client";

// ---------------------------------------------------------------------------
// KYC verification — FOUNDATION only.
//
// This module models identity-verification state so a real provider
// (Sumsub/Onfido/etc.) can be plugged in later. It deliberately does NOT gate
// any existing flow (deposits, withdrawals): nothing here is read by those code
// paths yet. What it gives the next batch: a stable status machine, provider
// slots, and a validated transition guard to build the provider webhook on.
// ---------------------------------------------------------------------------

// Statuses as config, not magic strings scattered across the code.
export const KYC_STATUS = {
  NOT_STARTED: "NOT_STARTED",
  PENDING: "PENDING",
  VERIFIED: "VERIFIED",
  REJECTED: "REJECTED"
} as const;

export type KycStatus = (typeof KYC_STATUS)[keyof typeof KYC_STATUS];

// Allowed forward transitions. A verified investor is terminal; a rejected one
// may retry (→ PENDING). The map is the single source of truth for what moves
// are legal, so the guard and any future UI stay consistent.
const KYC_TRANSITIONS: Record<KycStatus, KycStatus[]> = {
  [KYC_STATUS.NOT_STARTED]: [KYC_STATUS.PENDING],
  [KYC_STATUS.PENDING]: [KYC_STATUS.VERIFIED, KYC_STATUS.REJECTED],
  [KYC_STATUS.REJECTED]: [KYC_STATUS.PENDING],
  [KYC_STATUS.VERIFIED]: []
};

// Pure guard — unit-tested directly. A no-op (from === to) is not a valid
// transition; callers should not re-issue the current status.
export function isValidKycTransition(from: KycStatus, to: KycStatus): boolean {
  return KYC_TRANSITIONS[from]?.includes(to) ?? false;
}

export type SerializedKyc = {
  status: KycStatus;
  provider: string | null;
  externalId: string | null;
  reviewNote: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  updatedAt: string;
};

export function serializeKyc(record: KycVerification): SerializedKyc {
  return {
    status: record.status as KycStatus,
    provider: record.provider,
    externalId: record.externalId,
    reviewNote: record.reviewNote,
    submittedAt: record.submittedAt?.toISOString() ?? null,
    reviewedAt: record.reviewedAt?.toISOString() ?? null,
    updatedAt: record.updatedAt.toISOString()
  };
}

// Returns the investor's KYC record, lazily creating a NOT_STARTED one the first
// time it is read. Idempotent under a race via the unique investorId constraint.
export async function getOrCreateKycVerification(investorId: string): Promise<KycVerification> {
  const existing = await prisma.kycVerification.findUnique({ where: { investorId } });
  if (existing) return existing;
  try {
    return await prisma.kycVerification.create({ data: { investorId } });
  } catch (error) {
    // A concurrent create won the race — return the row it wrote.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const row = await prisma.kycVerification.findUnique({ where: { investorId } });
      if (row) return row;
    }
    throw error;
  }
}

export type KycTransitionInput = {
  investorId: string;
  to: KycStatus;
  provider?: string | null;
  externalId?: string | null;
  reviewNote?: string | null;
};

// Moves an investor's KYC to a new status, enforcing the transition map and
// stamping the relevant timestamp (submittedAt on → PENDING, reviewedAt on a
// terminal review). Throws on an illegal transition so a caller can surface it.
export async function transitionKycStatus(input: KycTransitionInput): Promise<KycVerification> {
  const record = await getOrCreateKycVerification(input.investorId);
  const from = record.status as KycStatus;

  if (!isValidKycTransition(from, input.to)) {
    throw new Error(`Invalid KYC transition: ${from} → ${input.to}`);
  }

  const data: Prisma.KycVerificationUpdateInput = { status: input.to };
  if (input.provider !== undefined) data.provider = input.provider;
  if (input.externalId !== undefined) data.externalId = input.externalId;
  if (input.reviewNote !== undefined) data.reviewNote = input.reviewNote;
  if (input.to === KYC_STATUS.PENDING) data.submittedAt = new Date();
  if (input.to === KYC_STATUS.VERIFIED || input.to === KYC_STATUS.REJECTED) data.reviewedAt = new Date();

  return prisma.kycVerification.update({ where: { investorId: input.investorId }, data });
}

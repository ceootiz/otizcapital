import { Prisma, type DepositNotification } from "@prisma/client";
import { prisma } from "./client";

// Investor-submitted "I sent a deposit" claims, reviewed by the admin.

export const DEPOSIT_NOTIFICATION_STATUSES = ["PENDING", "CONFIRMED", "REJECTED"] as const;
export type DepositNotificationStatus = (typeof DEPOSIT_NOTIFICATION_STATUSES)[number];

export const DEPOSIT_NETWORKS = ["BTC", "ETH", "USDT TRC20", "USDT ERC20", "USDT BEP20"] as const;

export const DEPOSIT_VERIFICATION_STATUSES = ["VERIFIED", "FAILED", "SKIPPED", "API_ERROR"] as const;
export type DepositVerificationStatus = (typeof DEPOSIT_VERIFICATION_STATUSES)[number];

export type SerializedDepositNotification = {
  id: string;
  investorId: string;
  amount: number;
  network: string;
  txHash: string | null;
  note: string | null;
  status: string;
  adminNote: string | null;
  reviewedAt: string | null;
  verificationStatus: string | null;
  verificationData: unknown;
  createdAt: string;
};

export function serializeDepositNotification(record: DepositNotification): SerializedDepositNotification {
  return {
    id: record.id,
    investorId: record.investorId,
    amount: Number(record.amount),
    network: record.network,
    txHash: record.txHash,
    note: record.note,
    status: record.status,
    adminNote: record.adminNote,
    reviewedAt: record.reviewedAt ? record.reviewedAt.toISOString() : null,
    verificationStatus: record.verificationStatus ?? null,
    verificationData: record.verificationData ?? null,
    createdAt: record.createdAt.toISOString()
  };
}

// Fetch a single claim (used by the confirm route to read txHash/network before
// running on-chain verification).
export async function getDepositNotificationById(id: string) {
  return prisma.depositNotification.findUnique({ where: { id } });
}

export async function createDepositNotification(input: {
  investorId: string;
  amount: number;
  network: string;
  txHash: string | null;
  note: string | null;
}) {
  return prisma.depositNotification.create({
    data: {
      investorId: input.investorId,
      amount: new Prisma.Decimal(input.amount),
      network: input.network,
      txHash: input.txHash,
      note: input.note
    }
  });
}

export async function listDepositNotificationsForInvestor(investorId: string) {
  return prisma.depositNotification.findMany({ where: { investorId }, orderBy: { createdAt: "desc" } });
}

// Review a pending claim. updateMany guards the PENDING → decided transition so
// a double-click or stale tab cannot re-decide an already-reviewed claim.
export async function reviewDepositNotification(input: {
  id: string;
  status: Exclude<DepositNotificationStatus, "PENDING">;
  adminNote: string | null;
  reviewedBy: string;
  verificationStatus?: DepositVerificationStatus | null;
  verificationData?: unknown;
}) {
  return prisma.$transaction(async (transaction) => {
    const reviewedAt = new Date();
    const result = await transaction.depositNotification.updateMany({
      where: { id: input.id, status: "PENDING" },
      data: {
        status: input.status,
        adminNote: input.adminNote,
        reviewedBy: input.reviewedBy,
        reviewedAt,
        ...(input.verificationStatus !== undefined ? { verificationStatus: input.verificationStatus } : {}),
        ...(input.verificationData !== undefined ? { verificationData: (input.verificationData ?? Prisma.JsonNull) as Prisma.InputJsonValue } : {})
      }
    });
    const record = await transaction.depositNotification.findUnique({ where: { id: input.id } });

    if (record && result.count > 0) {
      if (input.status === "CONFIRMED") {
        await transaction.ledgerEntry.create({
          data: {
            ledgerType: "INVESTOR_BALANCE",
            investorId: record.investorId,
            entryType: "DEPOSIT",
            amount: record.amount.toString(),
            currency: "USD",
            occurredAt: reviewedAt,
            sourceType: "DEPOSIT_NOTIFICATION",
            sourceId: record.id,
            description: `Confirmed deposit via ${record.network}`,
            createdBy: input.reviewedBy
          }
        });
      }

      await transaction.auditLog.create({
        data: {
          actor: input.reviewedBy,
          action: input.status === "CONFIRMED" ? "CONFIRM_DEPOSIT" : "REJECT_DEPOSIT",
          entityType: "DepositNotification",
          entityId: record.id,
          beforeJson: JSON.stringify({ status: "PENDING" }),
          afterJson: JSON.stringify({ status: record.status, amount: record.amount.toString(), investorId: record.investorId })
        }
      });
    }

    return { updated: result.count > 0, record };
  });
}

import { Prisma, type DepositNotification } from "@prisma/client";
import { prisma } from "./client";

// Investor-submitted "I sent a deposit" claims, reviewed by the admin.

export const DEPOSIT_NOTIFICATION_STATUSES = ["PENDING", "CONFIRMED", "REJECTED"] as const;
export type DepositNotificationStatus = (typeof DEPOSIT_NOTIFICATION_STATUSES)[number];

export const DEPOSIT_NETWORKS = ["BTC", "ETH", "USDT TRC20", "USDT ERC20", "USDT BEP20"] as const;

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
    createdAt: record.createdAt.toISOString()
  };
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
}) {
  const result = await prisma.depositNotification.updateMany({
    where: { id: input.id, status: "PENDING" },
    data: { status: input.status, adminNote: input.adminNote, reviewedBy: input.reviewedBy, reviewedAt: new Date() }
  });
  const record = await prisma.depositNotification.findUnique({ where: { id: input.id }, include: { investor: true } });
  return { updated: result.count > 0, record };
}

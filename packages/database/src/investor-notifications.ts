import type { InvestorNotification } from "@prisma/client";
import { prisma } from "./client";

export const INVESTOR_NOTIFICATION_TYPES = [
  "ALLOCATION_UPDATED",
  "ALLOCATION_COMPLETED",
  "REPORT_PUBLISHED",
  "WITHDRAWAL_APPROVED",
  "WITHDRAWAL_PAID",
  "WITHDRAWAL_REJECTED"
] as const;

export type InvestorNotificationType = (typeof INVESTOR_NOTIFICATION_TYPES)[number];

export type SerializedInvestorNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  linkHref: string | null;
  createdAt: string;
};

export function serializeInvestorNotification(record: InvestorNotification): SerializedInvestorNotification {
  return {
    id: record.id,
    type: record.type,
    title: record.title,
    body: record.body,
    isRead: record.isRead,
    linkHref: record.linkHref,
    createdAt: record.createdAt.toISOString()
  };
}

// Best-effort: notifications must never break the admin action that triggers them.
export async function createInvestorNotification(input: {
  investorId: string;
  type: InvestorNotificationType | string;
  title: string;
  body: string;
  linkHref?: string | null;
}) {
  try {
    return await prisma.investorNotification.create({
      data: {
        investorId: input.investorId,
        type: input.type,
        title: input.title,
        body: input.body,
        linkHref: input.linkHref ?? null
      }
    });
  } catch {
    return null;
  }
}

export async function listInvestorNotifications(investorId: string, limit = 20) {
  return prisma.investorNotification.findMany({
    where: { investorId },
    orderBy: { createdAt: "desc" },
    take: limit
  });
}

export async function countUnreadInvestorNotifications(investorId: string) {
  return prisma.investorNotification.count({ where: { investorId, isRead: false } });
}

export async function markAllInvestorNotificationsRead(investorId: string) {
  return prisma.investorNotification.updateMany({ where: { investorId, isRead: false }, data: { isRead: true } });
}

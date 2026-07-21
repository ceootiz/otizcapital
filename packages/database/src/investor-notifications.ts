import { Prisma, type InvestorNotification } from "@prisma/client";
import { prisma } from "./client";

export const INVESTOR_NOTIFICATION_TYPES = [
  "ALLOCATION_UPDATED",
  "ALLOCATION_COMPLETED",
  "REPORT_PUBLISHED",
  "WITHDRAWAL_APPROVED",
  "WITHDRAWAL_SCHEDULED",
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

export type InvestorNotificationSearchOptions = {
  query?: string;
  type?: string;
  isRead?: boolean;
  from?: Date;
  ids?: string[];
  page?: number;
  pageSize?: number;
};

export async function searchInvestorNotifications(investorId: string, options: InvestorNotificationSearchOptions = {}) {
  const page = Math.max(1, Math.floor(options.page ?? 1));
  const pageSize = Math.min(20, Math.max(1, Math.floor(options.pageSize ?? 8)));
  const query = options.query?.trim().slice(0, 100);
  const where: Prisma.InvestorNotificationWhereInput = {
    investorId,
    ...(options.type ? { type: options.type } : {}),
    ...(typeof options.isRead === "boolean" ? { isRead: options.isRead } : {}),
    ...(options.from ? { createdAt: { gte: options.from } } : {}),
    ...(options.ids ? { id: { in: options.ids } } : {}),
    ...(query
      ? {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { body: { contains: query, mode: "insensitive" } }
          ]
        }
      : {})
  };

  const [rows, total] = await Promise.all([
    prisma.investorNotification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.investorNotification.count({ where })
  ]);

  return {
    rows,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize))
  };
}

export async function countUnreadInvestorNotifications(investorId: string) {
  return prisma.investorNotification.count({ where: { investorId, isRead: false } });
}

export async function markAllInvestorNotificationsRead(investorId: string) {
  return prisma.investorNotification.updateMany({ where: { investorId, isRead: false }, data: { isRead: true } });
}

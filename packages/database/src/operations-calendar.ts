import { prisma } from "./client";

export type OperationsCalendarRange = "today" | "week" | "month";
export type OperationsCalendarItemType = "APPLICATION" | "DEAL_PAYOUT" | "WITHDRAWAL";

export type OperationsCalendarItem = {
  id: string;
  type: OperationsCalendarItemType;
  at: string;
  title: string;
  detail: string;
  status: string;
  href: string;
};

export function getOperationsCalendarWindow(range: OperationsCalendarRange, now = new Date()) {
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + (range === "today" ? 1 : range === "week" ? 7 : 30));
  return { start, end };
}

export async function listOperationsCalendarItems(range: OperationsCalendarRange, now = new Date()): Promise<OperationsCalendarItem[]> {
  const { start, end } = getOperationsCalendarWindow(range, now);
  const dateWindow = { gte: start, lt: end };

  const [applications, allocations, withdrawals] = await Promise.all([
    prisma.investorApplication.findMany({
      where: { nextActionAt: dateWindow, status: { notIn: ["APPROVED", "REJECTED", "ARCHIVED"] } },
      select: { id: true, fullName: true, nextAction: true, nextActionAt: true, priority: true },
      orderBy: { nextActionAt: "asc" }
    }),
    prisma.allocation.findMany({
      where: { expectedPayoutAt: dateWindow, status: { notIn: ["COMPLETED", "CANCELED", "LOSS"] } },
      select: { id: true, supplyCode: true, expectedPayoutAt: true, payoutStatus: true, investor: { select: { fullName: true } } },
      orderBy: { expectedPayoutAt: "asc" }
    }),
    prisma.withdrawalRequest.findMany({
      where: { scheduledFor: dateWindow, status: { in: ["APPROVED", "SCHEDULED"] } },
      select: { id: true, amount: true, currency: true, scheduledFor: true, status: true, investor: { select: { fullName: true } } },
      orderBy: { scheduledFor: "asc" }
    })
  ]);

  return [
    ...applications.flatMap((application) => application.nextActionAt ? [{
      id: `application:${application.id}`,
      type: "APPLICATION" as const,
      at: application.nextActionAt.toISOString(),
      title: application.fullName,
      detail: application.nextAction || "Application follow-up",
      status: application.priority,
      href: "/admin/applications"
    }] : []),
    ...allocations.flatMap((allocation) => allocation.expectedPayoutAt ? [{
      id: `allocation:${allocation.id}`,
      type: "DEAL_PAYOUT" as const,
      at: allocation.expectedPayoutAt.toISOString(),
      title: allocation.supplyCode,
      detail: allocation.investor.fullName,
      status: allocation.payoutStatus,
      href: `/admin/allocations/${allocation.id}`
    }] : []),
    ...withdrawals.flatMap((withdrawal) => withdrawal.scheduledFor ? [{
      id: `withdrawal:${withdrawal.id}`,
      type: "WITHDRAWAL" as const,
      at: withdrawal.scheduledFor.toISOString(),
      title: withdrawal.investor.fullName,
      detail: `${withdrawal.amount} ${withdrawal.currency}`,
      status: withdrawal.status,
      href: "/admin/withdrawals"
    }] : [])
  ].sort((left, right) => left.at.localeCompare(right.at));
}

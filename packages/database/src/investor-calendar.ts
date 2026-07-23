import { prisma } from "./client";

export type InvestorCalendarItemType = "DEAL_PAYOUT" | "WITHDRAWAL" | "REPORT";

export type InvestorCalendarItem = {
  id: string;
  type: InvestorCalendarItemType;
  title: string;
  description: string;
  date: string;
  href: string;
};

type CalendarAllocation = {
  id: string;
  investorId: string;
  supplyCode: string;
  productName: string;
  status: string;
  expectedPayoutAt: Date | null;
  expectedCycleDays: number | null;
  startedAt: Date | null;
  createdAt: Date;
};

type CalendarWithdrawal = {
  id: string;
  investorId: string;
  amount: string;
  currency: string;
  status: string;
  scheduledFor: Date | null;
};

type CalendarReport = {
  id: string;
  investorId: string;
  month: string;
  title: string;
  status: string;
  publishedAt: Date | null;
};

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export function buildInvestorCalendarItems(input: {
  investorId: string;
  allocations: CalendarAllocation[];
  withdrawals: CalendarWithdrawal[];
  reports: CalendarReport[];
}): InvestorCalendarItem[] {
  const items: InvestorCalendarItem[] = [];

  for (const allocation of input.allocations) {
    if (allocation.investorId !== input.investorId || ["CANCELED", "LOSS"].includes(allocation.status)) continue;
    const date = allocation.expectedPayoutAt ??
      (allocation.expectedCycleDays ? addDays(allocation.startedAt ?? allocation.createdAt, allocation.expectedCycleDays) : null);
    if (!date) continue;
    items.push({
      id: `allocation:${allocation.id}`,
      type: "DEAL_PAYOUT",
      title: allocation.supplyCode,
      description: allocation.productName,
      date: date.toISOString(),
      href: `/investor/allocations/${allocation.id}`
    });
  }

  for (const withdrawal of input.withdrawals) {
    if (withdrawal.investorId !== input.investorId || !withdrawal.scheduledFor || !["APPROVED", "SCHEDULED", "PAID"].includes(withdrawal.status)) continue;
    items.push({
      id: `withdrawal:${withdrawal.id}`,
      type: "WITHDRAWAL",
      title: `${withdrawal.currency} ${withdrawal.amount}`,
      description: withdrawal.status,
      date: withdrawal.scheduledFor.toISOString(),
      href: "/investor/withdrawals"
    });
  }

  for (const report of input.reports) {
    if (report.investorId !== input.investorId || report.status !== "PUBLISHED" || !report.publishedAt) continue;
    items.push({
      id: `report:${report.id}`,
      type: "REPORT",
      title: report.title,
      description: report.month,
      date: report.publishedAt.toISOString(),
      href: `/investor/reports/${report.id}`
    });
  }

  return items.sort((left, right) => new Date(left.date).getTime() - new Date(right.date).getTime());
}

export async function getInvestorCalendarItems(investorId: string) {
  const [allocations, withdrawals, reports] = await Promise.all([
    prisma.allocation.findMany({
      where: { investorId },
      select: { id: true, investorId: true, supplyCode: true, productName: true, status: true, expectedPayoutAt: true, expectedCycleDays: true, startedAt: true, createdAt: true }
    }),
    prisma.withdrawalRequest.findMany({
      where: { investorId },
      select: { id: true, investorId: true, amount: true, currency: true, status: true, scheduledFor: true }
    }),
    prisma.monthlyReport.findMany({
      where: { investorId, status: "PUBLISHED" },
      select: { id: true, investorId: true, month: true, title: true, status: true, publishedAt: true }
    })
  ]);

  return buildInvestorCalendarItems({ investorId, allocations, withdrawals, reports });
}

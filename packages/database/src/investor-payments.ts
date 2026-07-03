import { Prisma, type InvestorPayment } from "@prisma/client";
import { prisma } from "./client";

// Structured payment rows extracted from uploaded XLSX reports.

export type InvestorPaymentRowInput = {
  month: string;
  period: string | null;
  profit: number;
  payout: number;
  reinvested: number;
  roiPercent: number | null;
};

export type SerializedInvestorPayment = {
  id: string;
  month: string;
  period: string | null;
  profit: number;
  payout: number;
  reinvested: number;
  roiPercent: number | null;
  createdAt: string;
};

export function serializeInvestorPayment(record: InvestorPayment): SerializedInvestorPayment {
  return {
    id: record.id,
    month: record.month,
    period: record.period,
    profit: Number(record.profit),
    payout: Number(record.payout),
    reinvested: Number(record.reinvested),
    roiPercent: record.roiPercent === null ? null : Number(record.roiPercent),
    createdAt: record.createdAt.toISOString()
  };
}

// Bulk-insert the rows parsed from one uploaded workbook.
export async function createInvestorPaymentsFromReport(input: {
  investorId: string;
  fileReportId: string;
  rows: InvestorPaymentRowInput[];
}) {
  if (input.rows.length === 0) return { count: 0 };
  return prisma.investorPayment.createMany({
    data: input.rows.map((row) => ({
      investorId: input.investorId,
      fileReportId: input.fileReportId,
      month: row.month,
      period: row.period,
      profit: new Prisma.Decimal(row.profit),
      payout: new Prisma.Decimal(row.payout),
      reinvested: new Prisma.Decimal(row.reinvested),
      roiPercent: row.roiPercent === null ? null : new Prisma.Decimal(row.roiPercent),
      source: "XLSX_REPORT"
    }))
  });
}

// Newest month-lines first (createdAt desc groups by upload, month desc within).
export async function listInvestorPayments(investorId: string) {
  return prisma.investorPayment.findMany({
    where: { investorId },
    orderBy: [{ createdAt: "desc" }, { month: "desc" }]
  });
}

export async function getInvestorPaymentTotals(investorId: string) {
  const result = await prisma.investorPayment.aggregate({
    where: { investorId },
    _sum: { profit: true, payout: true, reinvested: true }
  });
  return {
    profit: Number(result._sum.profit ?? 0),
    payout: Number(result._sum.payout ?? 0),
    reinvested: Number(result._sum.reinvested ?? 0)
  };
}

// Per-file-report extracted-row counts for the admin reports list.
export async function countPaymentsByFileReport(investorId: string): Promise<Record<string, number>> {
  const groups = await prisma.investorPayment.groupBy({
    by: ["fileReportId"],
    where: { investorId, fileReportId: { not: null } },
    _count: { _all: true }
  });
  return Object.fromEntries(groups.map((group) => [group.fileReportId as string, group._count._all]));
}

// Best-effort matcher: does a free-text month label ("Июль 2026", "July 2026",
// "2026-07", "07.2026") refer to the given date's month? Used by the admin
// dashboard's "payouts this month" widget.
const RU_MONTHS = [
  ["январь", "января"], ["февраль", "февраля"], ["март", "марта"], ["апрель", "апреля"],
  ["май", "мая"], ["июнь", "июня"], ["июль", "июля"], ["август", "августа"],
  ["сентябрь", "сентября"], ["октябрь", "октября"], ["ноябрь", "ноября"], ["декабрь", "декабря"]
];
const EN_MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

export function monthLabelMatchesDate(label: string, date: Date): boolean {
  const normalized = label.trim().toLowerCase();
  const year = String(date.getUTCFullYear());
  if (!normalized.includes(year)) return false;
  const monthIndex = date.getUTCMonth();
  const mm = String(monthIndex + 1).padStart(2, "0");
  if (RU_MONTHS[monthIndex].some((name) => normalized.includes(name))) return true;
  if (normalized.includes(EN_MONTHS[monthIndex]) || normalized.includes(EN_MONTHS[monthIndex].slice(0, 3))) return true;
  return normalized.includes(`${year}-${mm}`) || normalized.includes(`${mm}.${year}`) || normalized.includes(`${monthIndex + 1}.${year}`);
}

// Sum of extracted payouts whose month label matches the given date's month.
export async function getExpectedPayoutsForMonth(date: Date): Promise<number> {
  const rows = await prisma.investorPayment.findMany({ select: { month: true, payout: true } });
  return rows
    .filter((row) => monthLabelMatchesDate(row.month, date))
    .reduce((sum, row) => sum + Number(row.payout), 0);
}

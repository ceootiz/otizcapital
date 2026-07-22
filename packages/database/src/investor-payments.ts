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
  autoCredit: boolean;
  actor: string;
}) {
  if (input.rows.length === 0) return { count: 0, creditedAmount: 0, duplicatesSkipped: 0 };

  return prisma.$transaction(async (transaction) => {
    let count = 0;
    let creditedAmount = 0;
    let duplicatesSkipped = 0;

    for (const row of input.rows) {
      const profit = new Prisma.Decimal(row.profit);
      const payout = new Prisma.Decimal(row.payout);
      const reinvested = new Prisma.Decimal(row.reinvested);
      const duplicate = await transaction.investorPayment.findFirst({
        where: {
          investorId: input.investorId,
          month: row.month,
          period: row.period,
          profit,
          payout,
          reinvested
        },
        select: { id: true }
      });

      if (duplicate) {
        duplicatesSkipped += 1;
        continue;
      }

      const payment = await transaction.investorPayment.create({
        data: {
          investorId: input.investorId,
          fileReportId: input.fileReportId,
          month: row.month,
          period: row.period,
          profit,
          payout,
          reinvested,
          roiPercent: row.roiPercent === null ? null : new Prisma.Decimal(row.roiPercent),
          source: "XLSX_REPORT"
        }
      });
      count += 1;

      if (input.autoCredit && row.profit > 0) {
        await transaction.ledgerEntry.upsert({
          where: { id: `balance-profit-${payment.id}` },
          update: {},
          create: {
            id: `balance-profit-${payment.id}`,
            ledgerType: "INVESTOR_BALANCE",
            investorId: input.investorId,
            entryType: "PROFIT",
            amount: String(row.profit),
            currency: "USD",
            occurredAt: new Date(),
            sourceType: "INVESTOR_PAYMENT",
            sourceId: payment.id,
            description: `Retained profit from ${row.month}`,
            createdBy: input.actor
          }
        });
        creditedAmount += row.profit;
      }
    }

    if (creditedAmount > 0) {
      await transaction.auditLog.create({
        data: {
          actor: input.actor,
          action: "AUTO_CREDIT_REPORT_PROFIT",
          entityType: "InvestorFileReport",
          entityId: input.fileReportId,
          afterJson: JSON.stringify({ investorId: input.investorId, creditedAmount })
        }
      });
    }

    return { count, creditedAmount: Number(creditedAmount.toFixed(2)), duplicatesSkipped };
  });
}

export type ReportProfitCreditSummary = {
  profitTotal: number;
  creditedProfit: number;
  uncreditedProfit: number;
};

export function summarizeReportProfitCredits(
  payments: Array<{ id: string; fileReportId: string | null; profit: unknown }>,
  credits: Array<{ sourceId: string | null; amount: unknown }>
): Record<string, ReportProfitCreditSummary> {
  const creditedByPayment = new Map(credits.map((credit) => [credit.sourceId, Number(credit.amount)]));
  const summaries: Record<string, ReportProfitCreditSummary> = {};

  for (const payment of payments) {
    if (!payment.fileReportId) continue;
    const summary = summaries[payment.fileReportId] ?? { profitTotal: 0, creditedProfit: 0, uncreditedProfit: 0 };
    const profit = Number(payment.profit);
    const credited = creditedByPayment.get(payment.id) ?? 0;
    summary.profitTotal += profit;
    summary.creditedProfit += credited;
    summary.uncreditedProfit += Math.max(0, profit - credited);
    summaries[payment.fileReportId] = summary;
  }

  return Object.fromEntries(Object.entries(summaries).map(([id, summary]) => [id, {
    profitTotal: Number(summary.profitTotal.toFixed(2)),
    creditedProfit: Number(summary.creditedProfit.toFixed(2)),
    uncreditedProfit: Number(summary.uncreditedProfit.toFixed(2))
  }]));
}

export async function getReportProfitCreditSummaries(investorId: string): Promise<Record<string, ReportProfitCreditSummary>> {
  const payments = await prisma.investorPayment.findMany({
    where: { investorId, fileReportId: { not: null } },
    select: { id: true, fileReportId: true, profit: true }
  });
  const paymentIds = payments.map((payment) => payment.id);
  const credits = paymentIds.length > 0
    ? await prisma.ledgerEntry.findMany({
        where: {
          investorId,
          ledgerType: "INVESTOR_BALANCE",
          entryType: "PROFIT",
          sourceType: "INVESTOR_PAYMENT",
          sourceId: { in: paymentIds },
          isReversal: false,
          voidedAt: null
        },
        select: { sourceId: true, amount: true }
      })
    : [];
  return summarizeReportProfitCredits(payments, credits);
}

export async function creditInvestorReportProfit(input: {
  investorId: string;
  fileReportId: string;
  actor: string;
}) {
  return prisma.$transaction(async (transaction) => {
    const report = await transaction.investorFileReport.findFirst({
      where: { id: input.fileReportId, investorId: input.investorId },
      select: { id: true, month: true }
    });
    if (!report) return { ok: false as const, status: 404 as const, error: "Report not found." };

    const payments = await transaction.investorPayment.findMany({
      where: { investorId: input.investorId, fileReportId: report.id },
      select: { id: true, month: true, profit: true }
    });
    let creditedAmount = 0;

    for (const payment of payments) {
      const profit = Number(payment.profit);
      if (profit <= 0) continue;
      const ledgerId = `balance-profit-${payment.id}`;
      const existing = await transaction.ledgerEntry.findUnique({ where: { id: ledgerId }, select: { id: true } });
      if (existing) continue;
      await transaction.ledgerEntry.create({
        data: {
          id: ledgerId,
          ledgerType: "INVESTOR_BALANCE",
          investorId: input.investorId,
          entryType: "PROFIT",
          amount: String(profit),
          currency: "USD",
          occurredAt: new Date(),
          sourceType: "INVESTOR_PAYMENT",
          sourceId: payment.id,
          description: `Retained profit from ${payment.month}`,
          createdBy: input.actor
        }
      });
      creditedAmount += profit;
    }

    if (creditedAmount > 0) {
      await transaction.auditLog.create({
        data: {
          actor: input.actor,
          action: "MANUAL_CREDIT_REPORT_PROFIT",
          entityType: "InvestorFileReport",
          entityId: report.id,
          afterJson: JSON.stringify({ investorId: input.investorId, creditedAmount })
        }
      });
    }

    return { ok: true as const, creditedAmount: Number(creditedAmount.toFixed(2)) };
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

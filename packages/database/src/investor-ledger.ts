import { prisma } from "./client";
import { maskInvestorName } from "./referrals";

export const INVESTOR_LEDGER_ENTRY_TYPES = ["DEPOSIT", "DEAL", "PROFIT", "REINVESTMENT", "WITHDRAWAL", "REFERRAL_BONUS"] as const;
export type InvestorLedgerEntryType = (typeof INVESTOR_LEDGER_ENTRY_TYPES)[number];
export type InvestorLedgerDirection = "IN" | "OUT" | "NEUTRAL";

export type InvestorLedgerEntry = {
  id: string;
  type: InvestorLedgerEntryType;
  direction: InvestorLedgerDirection;
  amount: number;
  currency: string;
  occurredAt: string;
  detail: string | null;
  sourceType: "DEPOSIT_NOTIFICATION" | "ALLOCATION" | "INVESTOR_PAYMENT" | "WITHDRAWAL_REQUEST" | "REFERRAL_COMMISSION";
  sourceId: string;
  status: string | null;
  href: string;
};

export type InvestorLedgerFilters = {
  type?: string | null;
  from?: string | Date | null;
  to?: string | Date | null;
  page?: string | number | null;
  pageSize?: string | number | null;
};

export type InvestorLedgerPage = {
  entries: InvestorLedgerEntry[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  filters: { type: InvestorLedgerEntryType | null; from: string | null; to: string | null };
};

type LedgerInput = {
  investorId: string;
  deposits: Array<{ id: string; investorId: string; amount: unknown; network: string; status: string; reviewedAt: Date | null; createdAt: Date }>;
  allocations: Array<{ id: string; investorId: string; allocationAmount: unknown; productName: string; supplyCode: string; currency: string; status: string; startedAt: Date | null; createdAt: Date }>;
  payments: Array<{ id: string; investorId: string; fileReportId: string | null; month: string; profit: unknown; reinvested: unknown; createdAt: Date }>;
  withdrawals: Array<{ id: string; investorId: string; amount: unknown; currency: string; status: string; requestedAt: Date; scheduledFor: Date | null; paidAt: Date | null; createdAt: Date }>;
  commissions: Array<{ id: string; investorReferrerId: string | null; commissionAmount: unknown; status: string; createdAt: Date; referredInvestorName: string }>;
};

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 10000;

function amount(value: unknown) {
  const parsed = Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function iso(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function integer(value: string | number | null | undefined, fallback: number) {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
}

function normalizedFilters(filters: InvestorLedgerFilters) {
  return {
    type: INVESTOR_LEDGER_ENTRY_TYPES.includes(filters.type as InvestorLedgerEntryType) ? filters.type as InvestorLedgerEntryType : null,
    from: iso(filters.from),
    to: iso(filters.to),
    page: Math.max(1, integer(filters.page, 1)),
    pageSize: Math.max(1, Math.min(MAX_PAGE_SIZE, integer(filters.pageSize, DEFAULT_PAGE_SIZE)))
  };
}

export function buildInvestorLedger(input: LedgerInput, filters: InvestorLedgerFilters = {}): InvestorLedgerPage {
  const entries: InvestorLedgerEntry[] = [];

  for (const record of input.deposits) {
    if (record.investorId !== input.investorId) continue;
    entries.push({
      id: `deposit:${record.id}`,
      type: "DEPOSIT",
      direction: record.status === "CONFIRMED" ? "IN" : "NEUTRAL",
      amount: amount(record.amount),
      currency: record.network.toUpperCase().includes("USDT") ? "USDT" : "USD",
      occurredAt: iso(record.reviewedAt) ?? record.createdAt.toISOString(),
      detail: record.network,
      sourceType: "DEPOSIT_NOTIFICATION",
      sourceId: record.id,
      status: record.status,
      href: "/investor/deposit"
    });
  }

  for (const record of input.allocations) {
    if (record.investorId !== input.investorId) continue;
    entries.push({
      id: `deal:${record.id}`,
      type: "DEAL",
      direction: "NEUTRAL",
      amount: amount(record.allocationAmount),
      currency: record.currency || "USD",
      occurredAt: iso(record.startedAt) ?? record.createdAt.toISOString(),
      detail: record.productName || record.supplyCode,
      sourceType: "ALLOCATION",
      sourceId: record.id,
      status: record.status,
      href: `/investor/allocations/${record.id}`
    });
  }

  for (const record of input.payments) {
    if (record.investorId !== input.investorId) continue;
    const occurredAt = record.createdAt.toISOString();
    const profit = amount(record.profit);
    const reinvested = amount(record.reinvested);
    if (profit !== 0) entries.push({ id: `profit:${record.id}`, type: "PROFIT", direction: "IN", amount: profit, currency: "USD", occurredAt, detail: record.month, sourceType: "INVESTOR_PAYMENT", sourceId: record.fileReportId ?? record.id, status: null, href: "/investor/reports" });
    if (reinvested !== 0) entries.push({ id: `reinvest:${record.id}`, type: "REINVESTMENT", direction: "NEUTRAL", amount: reinvested, currency: "USD", occurredAt, detail: record.month, sourceType: "INVESTOR_PAYMENT", sourceId: record.fileReportId ?? record.id, status: null, href: "/investor/reinvest" });
  }

  for (const record of input.withdrawals) {
    if (record.investorId !== input.investorId) continue;
    entries.push({
      id: `withdrawal:${record.id}`,
      type: "WITHDRAWAL",
      direction: record.status === "PAID" ? "OUT" : "NEUTRAL",
      amount: amount(record.amount),
      currency: record.currency || "USD",
      occurredAt: iso(record.paidAt) ?? iso(record.scheduledFor) ?? record.requestedAt.toISOString(),
      detail: null,
      sourceType: "WITHDRAWAL_REQUEST",
      sourceId: record.id,
      status: record.status,
      href: "/investor/withdrawals"
    });
  }

  for (const record of input.commissions) {
    if (record.investorReferrerId !== input.investorId) continue;
    entries.push({
      id: `referral:${record.id}`,
      type: "REFERRAL_BONUS",
      direction: "IN",
      amount: amount(record.commissionAmount),
      currency: "USD",
      occurredAt: record.createdAt.toISOString(),
      detail: maskInvestorName(record.referredInvestorName),
      sourceType: "REFERRAL_COMMISSION",
      sourceId: record.id,
      status: record.status,
      href: "/investor/dashboard"
    });
  }

  const sameMomentOrder: Record<InvestorLedgerEntryType, number> = { DEPOSIT: 0, DEAL: 1, PROFIT: 2, REINVESTMENT: 3, WITHDRAWAL: 4, REFERRAL_BONUS: 5 };
  entries.sort((left, right) => right.occurredAt.localeCompare(left.occurredAt) || sameMomentOrder[left.type] - sameMomentOrder[right.type] || right.id.localeCompare(left.id));
  const applied = normalizedFilters(filters);
  const filtered = entries.filter((entry) => {
    if (applied.type && entry.type !== applied.type) return false;
    if (applied.from && entry.occurredAt < applied.from) return false;
    if (applied.to && entry.occurredAt > applied.to) return false;
    return true;
  });
  const pageCount = Math.max(1, Math.ceil(filtered.length / applied.pageSize));
  const page = Math.min(applied.page, pageCount);
  const start = (page - 1) * applied.pageSize;

  return {
    entries: filtered.slice(start, start + applied.pageSize),
    total: filtered.length,
    page,
    pageSize: applied.pageSize,
    pageCount,
    filters: { type: applied.type, from: applied.from, to: applied.to }
  };
}

export async function getInvestorLedger(investorId: string, filters: InvestorLedgerFilters = {}) {
  const [deposits, allocations, payments, withdrawals, commissions] = await Promise.all([
    prisma.depositNotification.findMany({ where: { investorId } }),
    prisma.allocation.findMany({ where: { investorId } }),
    prisma.investorPayment.findMany({ where: { investorId } }),
    prisma.withdrawalRequest.findMany({ where: { investorId } }),
    prisma.referralCommission.findMany({ where: { investorReferrerId: investorId }, include: { referredInvestor: { select: { fullName: true } } } })
  ]);

  return buildInvestorLedger({
    investorId,
    deposits,
    allocations,
    payments,
    withdrawals,
    commissions: commissions.map((record) => ({ ...record, referredInvestorName: record.referredInvestor.fullName }))
  }, filters);
}

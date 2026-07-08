import { prisma } from "./client";
import { maskInvestorName } from "./referrals";

// ---------------------------------------------------------------------------
// Unified investor transaction ledger (Feature 1)
//
// An investor's account operations live across five source tables (deposits,
// allocations, monthly payment rows, withdrawals, referral commissions). This
// module projects those sources into ONE chronological feed at read time — no
// materialized table — so the ledger can never drift from its sources when a
// withdrawal is paid, a deposit is rejected, or a payment row is corrected.
//
// The projection is a pure function (`buildInvestorLedger`) over already-loaded
// records, mirroring the codebase's other read-model builders
// (`buildInvestorDashboardData`, `buildInvestorPayoutSummary`) so the business
// logic is unit-testable without a database. `getInvestorLedger` is the thin
// DB-facing wrapper.
//
// The normalized `InvestorLedgerEntry` shape is intentionally what a future
// materialized `InvestorLedgerEntry` table would store, so a later switch to
// persistence (or the Batch-2 export) can reuse this shape unchanged.
// ---------------------------------------------------------------------------

export const INVESTOR_LEDGER_ENTRY_TYPES = [
  "DEPOSIT",
  "ALLOCATION",
  "YIELD",
  "REINVEST",
  "WITHDRAWAL",
  "REFERRAL"
] as const;
export type InvestorLedgerEntryType = (typeof INVESTOR_LEDGER_ENTRY_TYPES)[number];

// Display hint only — NOT an accounting truth. Drives sign/color in the UI.
export const INVESTOR_LEDGER_DIRECTIONS = ["IN", "OUT", "NEUTRAL"] as const;
export type InvestorLedgerDirection = (typeof INVESTOR_LEDGER_DIRECTIONS)[number];

// Source table each entry was projected from (kept machine-readable so an
// export or a future materialization can trace an entry back to its origin).
export const INVESTOR_LEDGER_SOURCE_TYPES = [
  "DEPOSIT_NOTIFICATION",
  "ALLOCATION",
  "INVESTOR_PAYMENT",
  "WITHDRAWAL_REQUEST",
  "REFERRAL_COMMISSION"
] as const;
export type InvestorLedgerSourceType = (typeof INVESTOR_LEDGER_SOURCE_TYPES)[number];

// Pagination bounds (no magic numbers — clamped in normalizeFilters).
export const INVESTOR_LEDGER_DEFAULT_PAGE_SIZE = 20;
export const INVESTOR_LEDGER_MAX_PAGE_SIZE = 100;

export type InvestorLedgerEntry = {
  // Stable, unique across sources: `${sourceType}:${sourceId}[:${facet}]`.
  id: string;
  type: InvestorLedgerEntryType;
  direction: InvestorLedgerDirection;
  amount: number;
  currency: string;
  occurredAt: string; // ISO
  // Neutral, locale-agnostic detail (network / product / month label / masked
  // referred name). The UI localizes the *type* into a label; this is the
  // human-readable specifier under it.
  detail: string | null;
  sourceType: InvestorLedgerSourceType;
  sourceId: string;
  // Source status where it carries meaning (withdrawal / referral lifecycle).
  status: string | null;
};

export type InvestorLedgerFilters = {
  type?: string | null;
  from?: Date | string | null;
  to?: Date | string | null;
  page?: number | string | null;
  pageSize?: number | string | null;
};

export type AppliedInvestorLedgerFilters = {
  type: InvestorLedgerEntryType | null;
  from: string | null;
  to: string | null;
  page: number;
  pageSize: number;
};

export type InvestorLedgerPage = {
  entries: InvestorLedgerEntry[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  appliedFilters: AppliedInvestorLedgerFilters;
};

// --- Source record shapes (accept loosely-typed money/date fields like the
// other read-model builders, and normalize internally). ---

export type LedgerDepositRecord = {
  id: string;
  investorId: string;
  amount: unknown;
  network: string;
  status: string;
  reviewedAt: Date | null;
  createdAt: Date;
};

export type LedgerAllocationRecord = {
  id: string;
  investorId: string;
  allocationAmount: unknown;
  productName: string;
  supplyCode: string;
  currency: string;
  status: string;
  startedAt: Date | null;
  createdAt: Date;
};

export type LedgerPaymentRecord = {
  id: string;
  investorId: string;
  month: string;
  profit: unknown;
  reinvested: unknown;
  createdAt: Date;
};

export type LedgerWithdrawalRecord = {
  id: string;
  investorId: string;
  amount: unknown;
  currency: string;
  status: string;
  requestedAt: Date;
  scheduledFor: Date | null;
  paidAt: Date | null;
  createdAt: Date;
};

export type LedgerCommissionRecord = {
  id: string;
  investorReferrerId: string | null;
  // Referral level (1 = direct). Defaults to 1 for forward-compatibility with
  // the pre-multi-level schema; the investor feed only ever shows level 1.
  level?: number | null;
  commissionAmount: unknown;
  currency?: string | null;
  status: string;
  createdAt: Date;
  referredInvestorName: string;
};

export type BuildInvestorLedgerInput = {
  investorId: string;
  deposits: LedgerDepositRecord[];
  allocations: LedgerAllocationRecord[];
  payments: LedgerPaymentRecord[];
  withdrawals: LedgerWithdrawalRecord[];
  commissions: LedgerCommissionRecord[];
};

function toNumber(value: unknown): number {
  if (value === null || value === undefined || value === "") return 0;
  const numeric = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
}

function toIso(value: Date | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizeDate(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizeInt(value: number | string | null | undefined, fallback: number): number {
  const numeric = Number(value ?? fallback);
  return Number.isFinite(numeric) ? Math.trunc(numeric) : fallback;
}

export function normalizeInvestorLedgerFilters(filters: InvestorLedgerFilters = {}): AppliedInvestorLedgerFilters {
  const type = INVESTOR_LEDGER_ENTRY_TYPES.includes(filters.type as InvestorLedgerEntryType)
    ? (filters.type as InvestorLedgerEntryType)
    : null;
  const pageSize = Math.max(
    1,
    Math.min(INVESTOR_LEDGER_MAX_PAGE_SIZE, normalizeInt(filters.pageSize, INVESTOR_LEDGER_DEFAULT_PAGE_SIZE))
  );
  const page = Math.max(1, normalizeInt(filters.page, 1));
  return {
    type,
    from: normalizeDate(filters.from),
    to: normalizeDate(filters.to),
    page,
    pageSize
  };
}

// --- Per-source projections. Each guards `investorId` as defense-in-depth so a
// mis-scoped query can never leak another investor's row into the feed. ---

function projectDeposits(records: LedgerDepositRecord[], investorId: string): InvestorLedgerEntry[] {
  return records
    .filter((record) => record.investorId === investorId && record.status === "CONFIRMED")
    .map((record) => ({
      id: `DEPOSIT_NOTIFICATION:${record.id}`,
      type: "DEPOSIT" as const,
      direction: "IN" as const,
      amount: toNumber(record.amount),
      currency: "USD",
      occurredAt: toIso(record.reviewedAt) ?? toIso(record.createdAt) ?? new Date().toISOString(),
      detail: record.network,
      sourceType: "DEPOSIT_NOTIFICATION" as const,
      sourceId: record.id,
      status: record.status
    }));
}

function projectAllocations(records: LedgerAllocationRecord[], investorId: string): InvestorLedgerEntry[] {
  return records
    .filter((record) => record.investorId === investorId)
    .map((record) => ({
      id: `ALLOCATION:${record.id}`,
      type: "ALLOCATION" as const,
      direction: "NEUTRAL" as const,
      amount: toNumber(record.allocationAmount),
      currency: record.currency || "USD",
      occurredAt: toIso(record.startedAt) ?? toIso(record.createdAt) ?? new Date().toISOString(),
      detail: record.productName || record.supplyCode,
      sourceType: "ALLOCATION" as const,
      sourceId: record.id,
      status: record.status
    }));
}

// Each monthly payment row can carry both accrued profit and a reinvested
// portion; they become two distinct feed entries (YIELD + REINVEST). The
// `payout` figure is intentionally NOT projected — withdrawals are the single
// source of truth for money-out, avoiding double counting.
function projectPayments(records: LedgerPaymentRecord[], investorId: string): InvestorLedgerEntry[] {
  const entries: InvestorLedgerEntry[] = [];
  for (const record of records) {
    if (record.investorId !== investorId) continue;
    const occurredAt = toIso(record.createdAt) ?? new Date().toISOString();
    const profit = toNumber(record.profit);
    const reinvested = toNumber(record.reinvested);
    if (profit !== 0) {
      entries.push({
        id: `INVESTOR_PAYMENT:${record.id}:YIELD`,
        type: "YIELD",
        direction: "IN",
        amount: profit,
        currency: "USD",
        occurredAt,
        detail: record.month,
        sourceType: "INVESTOR_PAYMENT",
        sourceId: record.id,
        status: null
      });
    }
    if (reinvested !== 0) {
      entries.push({
        id: `INVESTOR_PAYMENT:${record.id}:REINVEST`,
        type: "REINVEST",
        direction: "NEUTRAL",
        amount: reinvested,
        currency: "USD",
        occurredAt,
        detail: record.month,
        sourceType: "INVESTOR_PAYMENT",
        sourceId: record.id,
        status: null
      });
    }
  }
  return entries;
}

function projectWithdrawals(records: LedgerWithdrawalRecord[], investorId: string): InvestorLedgerEntry[] {
  return records
    .filter((record) => record.investorId === investorId)
    .map((record) => ({
      id: `WITHDRAWAL_REQUEST:${record.id}`,
      type: "WITHDRAWAL" as const,
      // Only a genuinely paid withdrawal is money-out; pending/rejected stay
      // neutral so a rejected request never reads as a debit.
      direction: (record.status === "PAID" ? "OUT" : "NEUTRAL") as InvestorLedgerDirection,
      amount: toNumber(record.amount),
      currency: record.currency || "USD",
      occurredAt:
        toIso(record.paidAt) ??
        toIso(record.scheduledFor) ??
        toIso(record.requestedAt) ??
        toIso(record.createdAt) ??
        new Date().toISOString(),
      detail: null,
      sourceType: "WITHDRAWAL_REQUEST" as const,
      sourceId: record.id,
      status: record.status
    }));
}

// Referral bonuses this investor earned as a referrer. Only DIRECT (level 1)
// commissions surface to the investor — second-level bonuses are admin-only.
function projectCommissions(records: LedgerCommissionRecord[], investorId: string): InvestorLedgerEntry[] {
  return records
    .filter((record) => record.investorReferrerId === investorId && (record.level ?? 1) === 1)
    .map((record) => ({
      id: `REFERRAL_COMMISSION:${record.id}`,
      type: "REFERRAL" as const,
      direction: "IN" as const,
      amount: toNumber(record.commissionAmount),
      currency: record.currency || "USD",
      occurredAt: toIso(record.createdAt) ?? new Date().toISOString(),
      detail: maskInvestorName(record.referredInvestorName),
      sourceType: "REFERRAL_COMMISSION" as const,
      sourceId: record.id,
      status: record.status
    }));
}

// Newest first; ties broken by id so ordering is deterministic across calls.
function compareEntries(left: InvestorLedgerEntry, right: InvestorLedgerEntry): number {
  if (left.occurredAt !== right.occurredAt) return left.occurredAt < right.occurredAt ? 1 : -1;
  return left.id < right.id ? 1 : left.id > right.id ? -1 : 0;
}

export function projectInvestorLedgerEntries(input: BuildInvestorLedgerInput): InvestorLedgerEntry[] {
  return [
    ...projectDeposits(input.deposits, input.investorId),
    ...projectAllocations(input.allocations, input.investorId),
    ...projectPayments(input.payments, input.investorId),
    ...projectWithdrawals(input.withdrawals, input.investorId),
    ...projectCommissions(input.commissions, input.investorId)
  ].sort(compareEntries);
}

export function buildInvestorLedger(
  input: BuildInvestorLedgerInput,
  filters: InvestorLedgerFilters = {}
): InvestorLedgerPage {
  const applied = normalizeInvestorLedgerFilters(filters);
  const all = projectInvestorLedgerEntries(input);

  const filtered = all.filter((entry) => {
    if (applied.type && entry.type !== applied.type) return false;
    if (applied.from && entry.occurredAt < applied.from) return false;
    if (applied.to && entry.occurredAt > applied.to) return false;
    return true;
  });

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / applied.pageSize));
  const page = Math.min(applied.page, pageCount);
  const start = (page - 1) * applied.pageSize;
  const entries = filtered.slice(start, start + applied.pageSize);

  return { entries, total, page, pageSize: applied.pageSize, pageCount, appliedFilters: { ...applied, page } };
}

// DB-facing wrapper: loads only the signed-in investor's own rows (every source
// is indexed by investorId) and hands them to the pure builder.
export async function getInvestorLedger(
  investorId: string,
  filters: InvestorLedgerFilters = {}
): Promise<InvestorLedgerPage> {
  const [deposits, allocations, payments, withdrawals, commissions] = await Promise.all([
    prisma.depositNotification.findMany({ where: { investorId, status: "CONFIRMED" } }),
    prisma.allocation.findMany({ where: { investorId } }),
    prisma.investorPayment.findMany({ where: { investorId } }),
    prisma.withdrawalRequest.findMany({ where: { investorId } }),
    prisma.referralCommission.findMany({
      // Only this investor's DIRECT (level 1) referral bonuses reach the feed;
      // second-level bonuses are admin-only.
      where: { investorReferrerId: investorId, level: 1 },
      include: { referredInvestor: { select: { fullName: true } } }
    })
  ]);

  return buildInvestorLedger(
    {
      investorId,
      deposits,
      allocations,
      payments,
      withdrawals,
      commissions: commissions.map((commission) => ({
        id: commission.id,
        investorReferrerId: commission.investorReferrerId,
        level: commission.level,
        commissionAmount: commission.commissionAmount,
        status: commission.status,
        createdAt: commission.createdAt,
        referredInvestorName: commission.referredInvestor.fullName
      }))
    },
    filters
  );
}

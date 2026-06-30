import { Prisma } from "@prisma/client";
import { prisma } from "./client";

export const LEDGER_TYPES = ["INVENTORY", "CASH", "INVESTOR_LIABILITY"] as const;
export const LEDGER_SOURCE_TYPES = ["ALLOCATION", "WITHDRAWAL_REQUEST", "MONTHLY_REPORT", "MANUAL_ADJUSTMENT", "MARKETPLACE_SETTLEMENT", "PROOF_ARTIFACT", "OTHER"] as const;
export const RECONCILIATION_STATUSES = ["BALANCED", "WARNING", "BROKEN"] as const;
export const LEDGER_REVERSAL_STATUSES = ["ALL", "ORIGINAL_ONLY", "REVERSALS_ONLY", "REVERSED_ONLY", "CORRECTED_ONLY"] as const;

export type LedgerType = (typeof LEDGER_TYPES)[number];
export type LedgerSourceType = (typeof LEDGER_SOURCE_TYPES)[number];
export type ReconciliationStatus = (typeof RECONCILIATION_STATUSES)[number];
export type LedgerReversalStatus = (typeof LEDGER_REVERSAL_STATUSES)[number];

export type LedgerEntryInput = {
  id?: string;
  ledgerType: string;
  allocationId?: string | null;
  investorId?: string | null;
  monthlyReportId?: string | null;
  entryType: string;
  amount: string;
  currency?: string;
  quantity?: number | null;
  unitCost?: string | null;
  occurredAt?: Date | string;
  sourceType: string;
  sourceId?: string | null;
  description: string;
  metadataJson?: string | null;
  createdBy?: string;
  isReversal?: boolean;
  reversesLedgerEntryId?: string | null;
  reversalReason?: string | null;
  correctedByLedgerEntryId?: string | null;
  voidedAt?: Date | string | null;
  voidedBy?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

export type CreateLedgerEntryInput = Omit<LedgerEntryInput, "id" | "createdAt" | "updatedAt"> & {
  createdBy: string;
};

export type ReconciliationException = {
  id: string;
  severity: "BLOCKING" | "WARNING";
  message: string;
};

export type InventoryLedgerSummary = {
  purchased: number;
  received: number;
  sold: number;
  returned: number;
  remainingAdjustment: number;
  remaining: number;
  inventoryVariance: number;
};

export type CashLedgerSummary = {
  cashIn: number;
  supplierPayments: number;
  logisticsCosts: number;
  marketplaceSettlements: number;
  marketplaceFees: number;
  refunds: number;
  payouts: number;
  reinvestments: number;
  netCashPosition: number;
};

export type InvestorLiabilityLedgerSummary = {
  capitalAllocated: number;
  profitAccrued: number;
  payoutsApproved: number;
  payoutsPaid: number;
  reinvested: number;
  lossesRecognized: number;
  liabilityAdjustments: number;
  liabilityOutstanding: number;
  deferredUnpaidShare: number;
};

export type ReconciliationLedgerSummary = {
  inventory: InventoryLedgerSummary;
  cash: CashLedgerSummary;
  investorLiability: InvestorLiabilityLedgerSummary;
};

export type AllocationReconciliation = {
  allocationId: string;
  status: ReconciliationStatus;
  score: number;
  blockingIssues: ReconciliationException[];
  warnings: ReconciliationException[];
  metrics: {
    entryCount: number;
    latestEntryAt: string | null;
  };
  ledgerSummary: ReconciliationLedgerSummary;
  latestLedgerEntries: SerializedLedgerEntry[];
};

export type InvestorSafeReconciliationSummary = {
  status: ReconciliationStatus;
  score: number;
  capitalDeployed: string;
  capitalReturned: string;
  payoutStatus: string;
  inventoryProgressSummary: string;
  exceptionNotice: string | null;
};

export type MonthlyReportReconciliation = {
  monthlyReportId: string;
  status: ReconciliationStatus;
  score: number;
  snapshotExists: boolean;
  linkedAllocationCount: number;
  blockingIssues: ReconciliationException[];
  warnings: ReconciliationException[];
  allocationSummaries: Array<{
    allocationId: string;
    supplyCode: string;
    productName: string;
    status: ReconciliationStatus;
    score: number;
  }>;
  ledgerSummary: ReconciliationLedgerSummary;
};

export type ReconciliationSnapshot = {
  generatedAt: string;
  allocations: Array<{
    allocationId: string;
    status: ReconciliationStatus;
    score: number;
    ledgerSummary: ReconciliationLedgerSummary;
    investorSafeSummary: InvestorSafeReconciliationSummary;
    exceptionSummary: {
      blockingIssueCount: number;
      warningCount: number;
    };
  }>;
  portfolioTotals: ReconciliationLedgerSummary;
  exceptionsSummary: {
    blockingIssueCount: number;
    warningCount: number;
  };
};

export type SerializedLedgerEntry = {
  id: string;
  ledgerType: string;
  allocationId: string | null;
  investorId: string | null;
  monthlyReportId: string | null;
  entryType: string;
  amount: string;
  currency: string;
  quantity: number | null;
  unitCost: string | null;
  occurredAt: string;
  sourceType: string;
  sourceId: string | null;
  description: string;
  metadataJson: string | null;
  createdBy: string;
  isReversal: boolean;
  reversesLedgerEntryId: string | null;
  reversalReason: string | null;
  correctedByLedgerEntryId: string | null;
  voidedAt: string | null;
  voidedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LedgerEntryAuditTrailRecord = Omit<SerializedLedgerEntry, "metadataJson"> & {
  metadataPreview: string | null;
  statusFlags: {
    isOriginal: boolean;
    isReversal: boolean;
    isReversed: boolean;
    isCorrected: boolean;
  };
};

export type LedgerEntryAuditTrail = {
  requestedEntry: LedgerEntryAuditTrailRecord;
  originalEntry: LedgerEntryAuditTrailRecord;
  reversalEntries: LedgerEntryAuditTrailRecord[];
  correctionEntry: LedgerEntryAuditTrailRecord | null;
  auditEvents: Array<{
    id: string;
    actor: string;
    action: string;
    entityType: string;
    entityId: string;
    beforePreview: string | null;
    afterPreview: string | null;
    createdAt: string;
  }>;
};

export type LedgerEntryFilters = {
  ledgerType?: string | null;
  entryType?: string | null;
  sourceType?: string | null;
  reversalStatus?: string | null;
  dateFrom?: Date | string | null;
  dateTo?: Date | string | null;
  minAmount?: string | number | null;
  maxAmount?: string | number | null;
  query?: string | null;
  limit?: string | number | null;
};

export type AppliedLedgerEntryFilters = {
  ledgerType: string | null;
  entryType: string | null;
  sourceType: string | null;
  reversalStatus: LedgerReversalStatus;
  dateFrom: string | null;
  dateTo: string | null;
  minAmount: string | null;
  maxAmount: string | null;
  query: string | null;
  limit: number;
};

type LedgerEntryLike = LedgerEntryInput & {
  id?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

const ZERO_SUMMARY: ReconciliationLedgerSummary = {
  inventory: { purchased: 0, received: 0, sold: 0, returned: 0, remainingAdjustment: 0, remaining: 0, inventoryVariance: 0 },
  cash: { cashIn: 0, supplierPayments: 0, logisticsCosts: 0, marketplaceSettlements: 0, marketplaceFees: 0, refunds: 0, payouts: 0, reinvestments: 0, netCashPosition: 0 },
  investorLiability: { capitalAllocated: 0, profitAccrued: 0, payoutsApproved: 0, payoutsPaid: 0, reinvested: 0, lossesRecognized: 0, liabilityAdjustments: 0, liabilityOutstanding: 0, deferredUnpaidShare: 0 }
};

function toNumber(value: string | number | null | undefined) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function toIso(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function negateDecimalString(value: string | null | undefined) {
  const numeric = toNumber(value);
  if (numeric === 0) return "0";
  return String(-numeric);
}

function sanitizeMetadataValue(value: unknown, depth = 0): unknown {
  if (depth > 3) return "[nested]";
  if (value === null || value === undefined) return value;
  if (typeof value === "string") return value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, 120);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.slice(0, 8).map((item) => sanitizeMetadataValue(item, depth + 1));
  if (typeof value === "object") {
    const sanitized: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>).slice(0, 16)) {
      sanitized[key] = /password|secret|token|credential|private|bank|account|routing|iban|card|wallet|address|destination/i.test(key)
        ? "[redacted]"
        : sanitizeMetadataValue(item, depth + 1);
    }
    return sanitized;
  }
  return String(value).slice(0, 120);
}

export function sanitizeMetadataPreview(value: string | null | undefined) {
  if (!value) return null;
  try {
    return JSON.stringify(sanitizeMetadataValue(JSON.parse(value))).slice(0, 800);
  } catch {
    return value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, 400);
  }
}

function cloneSummary(): ReconciliationLedgerSummary {
  return JSON.parse(JSON.stringify(ZERO_SUMMARY)) as ReconciliationLedgerSummary;
}

function addSummary(left: ReconciliationLedgerSummary, right: ReconciliationLedgerSummary) {
  const next = cloneSummary();
  for (const key of Object.keys(next.inventory) as Array<keyof InventoryLedgerSummary>) next.inventory[key] = left.inventory[key] + right.inventory[key];
  for (const key of Object.keys(next.cash) as Array<keyof CashLedgerSummary>) next.cash[key] = left.cash[key] + right.cash[key];
  for (const key of Object.keys(next.investorLiability) as Array<keyof InvestorLiabilityLedgerSummary>) next.investorLiability[key] = left.investorLiability[key] + right.investorLiability[key];
  return next;
}

function quantityFor(entries: LedgerEntryLike[], type: string) {
  return entries.filter((entry) => entry.entryType === type).reduce((sum, entry) => sum + (entry.quantity ?? 0), 0);
}

function amountFor(entries: LedgerEntryLike[], type: string) {
  return entries.filter((entry) => entry.entryType === type).reduce((sum, entry) => sum + toNumber(entry.amount), 0);
}

function latestEntryAt(entries: LedgerEntryLike[]) {
  return entries
    .map((entry) => toIso(entry.occurredAt ?? entry.createdAt))
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1) ?? null;
}

function computeScore(blockingIssues: ReconciliationException[], warnings: ReconciliationException[]) {
  return Math.max(0, 100 - blockingIssues.length * 25 - warnings.length * 10);
}

function statusFromIssues(blockingIssues: ReconciliationException[], warnings: ReconciliationException[]): ReconciliationStatus {
  if (blockingIssues.length) return "BROKEN";
  if (warnings.length) return "WARNING";
  return "BALANCED";
}

function normalizeOptionalString(value: string | null | undefined, maxLength = 160) {
  if (!value) return null;
  const normalized = value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
  return normalized && normalized !== "ALL" ? normalized : null;
}

function normalizeDateFilter(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeAmountFilter(value: string | number | null | undefined) {
  if (value === undefined || value === null || value === "") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? String(numeric) : null;
}

function normalizeLimit(value: string | number | null | undefined) {
  const numeric = Number(value ?? 50);
  if (!Number.isFinite(numeric)) return 50;
  return Math.max(1, Math.min(200, Math.trunc(numeric)));
}

export function normalizeLedgerEntryFilters(filters: LedgerEntryFilters = {}): AppliedLedgerEntryFilters {
  const reversalStatus = LEDGER_REVERSAL_STATUSES.includes(filters.reversalStatus as LedgerReversalStatus)
    ? filters.reversalStatus as LedgerReversalStatus
    : "ALL";
  const dateFrom = normalizeDateFilter(filters.dateFrom);
  const dateTo = normalizeDateFilter(filters.dateTo);
  return {
    ledgerType: LEDGER_TYPES.includes(filters.ledgerType as LedgerType) ? filters.ledgerType as LedgerType : null,
    entryType: normalizeOptionalString(filters.entryType, 80),
    sourceType: LEDGER_SOURCE_TYPES.includes(filters.sourceType as LedgerSourceType) ? filters.sourceType as LedgerSourceType : null,
    reversalStatus,
    dateFrom: dateFrom?.toISOString() ?? null,
    dateTo: dateTo?.toISOString() ?? null,
    minAmount: normalizeAmountFilter(filters.minAmount),
    maxAmount: normalizeAmountFilter(filters.maxAmount),
    query: normalizeOptionalString(filters.query, 160),
    limit: normalizeLimit(filters.limit)
  };
}

function matchesAmountRange(entry: { amount: string }, filters: AppliedLedgerEntryFilters) {
  const amount = toNumber(entry.amount);
  const minAmount = filters.minAmount === null ? null : toNumber(filters.minAmount);
  const maxAmount = filters.maxAmount === null ? null : toNumber(filters.maxAmount);
  if (minAmount !== null && amount < minAmount) return false;
  if (maxAmount !== null && amount > maxAmount) return false;
  return true;
}

export function serializeLedgerEntry(record: LedgerEntryInput & { id: string; createdAt: Date | string; updatedAt: Date | string; occurredAt: Date | string }): SerializedLedgerEntry {
  return {
    id: record.id,
    ledgerType: record.ledgerType,
    allocationId: record.allocationId ?? null,
    investorId: record.investorId ?? null,
    monthlyReportId: record.monthlyReportId ?? null,
    entryType: record.entryType,
    amount: record.amount,
    currency: record.currency ?? "USD",
    quantity: record.quantity ?? null,
    unitCost: record.unitCost ?? null,
    occurredAt: toIso(record.occurredAt) ?? new Date().toISOString(),
    sourceType: record.sourceType,
    sourceId: record.sourceId ?? null,
    description: record.description,
    metadataJson: record.metadataJson ?? null,
    createdBy: record.createdBy ?? "system",
    isReversal: Boolean(record.isReversal),
    reversesLedgerEntryId: record.reversesLedgerEntryId ?? null,
    reversalReason: record.reversalReason ?? null,
    correctedByLedgerEntryId: record.correctedByLedgerEntryId ?? null,
    voidedAt: toIso(record.voidedAt),
    voidedBy: record.voidedBy ?? null,
    createdAt: toIso(record.createdAt) ?? new Date().toISOString(),
    updatedAt: toIso(record.updatedAt) ?? new Date().toISOString()
  };
}

function serializeLedgerEntryAuditTrailRecord(
  record: LedgerEntryInput & { id: string; createdAt: Date | string; updatedAt: Date | string; occurredAt: Date | string },
  context: { originalId: string; reversedEntryIds: Set<string> }
): LedgerEntryAuditTrailRecord {
  const { metadataJson: _metadataJson, ...serialized } = serializeLedgerEntry(record);
  return {
    ...serialized,
    metadataPreview: sanitizeMetadataPreview(record.metadataJson),
    statusFlags: {
      isOriginal: record.id === context.originalId && !record.isReversal,
      isReversal: Boolean(record.isReversal),
      isReversed: Boolean(record.voidedAt) || context.reversedEntryIds.has(record.id),
      isCorrected: Boolean(record.correctedByLedgerEntryId)
    }
  };
}

export function getInvestorSafeReconciliationSummary(reconciliation: AllocationReconciliation): InvestorSafeReconciliationSummary {
  const inventory = reconciliation.ledgerSummary.inventory;
  const liability = reconciliation.ledgerSummary.investorLiability;

  return {
    status: reconciliation.status,
    score: reconciliation.score,
    capitalDeployed: String(liability.capitalAllocated),
    capitalReturned: String(liability.payoutsPaid + liability.reinvested),
    payoutStatus: liability.payoutsPaid > 0 ? "Paid or partially paid" : liability.payoutsApproved > 0 ? "Approved" : "Not ready",
    inventoryProgressSummary: `${inventory.received} received, ${inventory.sold} sold, ${inventory.remaining} remaining`,
    exceptionNotice: reconciliation.status === "BROKEN"
      ? "A material reconciliation exception is under manager review."
      : reconciliation.status === "WARNING"
        ? "Some reconciliation items are still under operational review."
        : null
  };
}

export function calculateAllocationReconciliationFromEntries(input: { allocationId: string; allocationStatus?: string | null; entries: LedgerEntryLike[] }): AllocationReconciliation {
  const entries = input.entries.filter((entry) => !entry.allocationId || entry.allocationId === input.allocationId);
  const summary = cloneSummary();
  summary.inventory.purchased = quantityFor(entries, "UNITS_PURCHASED");
  summary.inventory.received = quantityFor(entries, "UNITS_RECEIVED");
  summary.inventory.sold = quantityFor(entries, "UNITS_SOLD");
  summary.inventory.returned = quantityFor(entries, "UNITS_RETURNED");
  summary.inventory.remainingAdjustment = quantityFor(entries, "UNITS_REMAINING_ADJUSTMENT");
  summary.inventory.remaining = summary.inventory.received - summary.inventory.sold - summary.inventory.returned + summary.inventory.remainingAdjustment;
  summary.inventory.inventoryVariance = summary.inventory.purchased - summary.inventory.received;
  summary.cash.cashIn = amountFor(entries, "INVESTOR_CASH_IN");
  summary.cash.supplierPayments = amountFor(entries, "SUPPLIER_PAYMENT");
  summary.cash.logisticsCosts = amountFor(entries, "LOGISTICS_COST");
  summary.cash.marketplaceSettlements = amountFor(entries, "MARKETPLACE_SETTLEMENT");
  summary.cash.marketplaceFees = amountFor(entries, "MARKETPLACE_FEE");
  summary.cash.refunds = amountFor(entries, "REFUND");
  summary.cash.payouts = amountFor(entries, "PAYOUT");
  summary.cash.reinvestments = amountFor(entries, "REINVESTMENT");
  summary.cash.netCashPosition = summary.cash.cashIn + summary.cash.marketplaceSettlements + summary.cash.refunds - summary.cash.supplierPayments - summary.cash.logisticsCosts - summary.cash.marketplaceFees - summary.cash.payouts - summary.cash.reinvestments;
  summary.investorLiability.capitalAllocated = amountFor(entries, "CAPITAL_ALLOCATED");
  summary.investorLiability.profitAccrued = amountFor(entries, "PROFIT_ACCRUED");
  summary.investorLiability.payoutsApproved = amountFor(entries, "PAYOUT_APPROVED");
  summary.investorLiability.payoutsPaid = amountFor(entries, "PAYOUT_PAID");
  summary.investorLiability.reinvested = amountFor(entries, "REINVESTED");
  summary.investorLiability.lossesRecognized = amountFor(entries, "LOSS_RECOGNIZED");
  summary.investorLiability.liabilityAdjustments = amountFor(entries, "LIABILITY_ADJUSTMENT");
  summary.investorLiability.liabilityOutstanding = summary.investorLiability.capitalAllocated + summary.investorLiability.profitAccrued + summary.investorLiability.liabilityAdjustments - summary.investorLiability.payoutsPaid - summary.investorLiability.reinvested - summary.investorLiability.lossesRecognized;
  summary.investorLiability.deferredUnpaidShare = Math.max(0, summary.investorLiability.profitAccrued - summary.investorLiability.payoutsApproved - summary.investorLiability.reinvested - summary.investorLiability.lossesRecognized);

  const blockingIssues: ReconciliationException[] = [];
  const warnings: ReconciliationException[] = [];

  if (summary.inventory.received > summary.inventory.purchased) blockingIssues.push({ id: "received-exceeds-purchased", severity: "BLOCKING", message: "Received units exceed purchased units." });
  if (summary.inventory.sold > summary.inventory.received - summary.inventory.returned) blockingIssues.push({ id: "sold-exceeds-available", severity: "BLOCKING", message: "Sold units exceed received units less returns." });
  if (summary.inventory.remaining < 0) blockingIssues.push({ id: "negative-remaining-inventory", severity: "BLOCKING", message: "Remaining inventory is negative." });
  if (summary.investorLiability.payoutsPaid > summary.investorLiability.payoutsApproved) blockingIssues.push({ id: "paid-exceeds-approved", severity: "BLOCKING", message: "Paid payout exceeds approved payout." });
  if (summary.investorLiability.payoutsApproved > summary.investorLiability.profitAccrued + summary.investorLiability.capitalAllocated) blockingIssues.push({ id: "approved-exceeds-liability-base", severity: "BLOCKING", message: "Approved payout exceeds accrued share plus capital base." });
  if (summary.cash.supplierPayments > 0 && summary.inventory.purchased === 0) warnings.push({ id: "supplier-payment-without-purchased-units", severity: "WARNING", message: "Supplier payment exists without purchased units." });
  if (summary.cash.marketplaceSettlements > 0 && summary.inventory.sold === 0) warnings.push({ id: "settlement-without-sold-units", severity: "WARNING", message: "Marketplace settlement exists without sold units." });
  if (input.allocationStatus === "COMPLETED" && (summary.inventory.remaining !== 0 || blockingIssues.length > 0 || warnings.length > 0)) warnings.push({ id: "completed-allocation-not-balanced", severity: "WARNING", message: "Allocation is completed but reconciliation is not fully balanced." });

  const sortedEntries = [...entries].sort((left, right) => (toIso(right.occurredAt) ?? "").localeCompare(toIso(left.occurredAt) ?? ""));

  return {
    allocationId: input.allocationId,
    status: statusFromIssues(blockingIssues, warnings),
    score: computeScore(blockingIssues, warnings),
    blockingIssues,
    warnings,
    metrics: { entryCount: entries.length, latestEntryAt: latestEntryAt(entries) },
    ledgerSummary: summary,
    latestLedgerEntries: sortedEntries.slice(0, 8).filter((entry): entry is LedgerEntryInput & { id: string; createdAt: Date | string; updatedAt: Date | string; occurredAt: Date | string } => Boolean(entry.id && entry.occurredAt && entry.createdAt && entry.updatedAt)).map(serializeLedgerEntry)
  };
}

export async function createLedgerEntry(input: CreateLedgerEntryInput) {
  return prisma.$transaction(async (transaction) => {
    const allocation = input.allocationId ? await transaction.allocation.findUnique({ where: { id: input.allocationId } }) : null;
    if (input.allocationId && !allocation) return { ok: false as const, status: 404 as const, error: "Allocation not found." };

    const investorId = input.investorId ?? allocation?.investorId ?? null;
    const entry = await transaction.ledgerEntry.create({
      data: {
        ledgerType: input.ledgerType,
        allocationId: input.allocationId ?? null,
        investorId,
        monthlyReportId: input.monthlyReportId ?? null,
        entryType: input.entryType,
        amount: input.amount,
        currency: input.currency || "USD",
        quantity: input.quantity ?? null,
        unitCost: input.unitCost ?? null,
        occurredAt: input.occurredAt ? new Date(input.occurredAt) : new Date(),
        sourceType: input.sourceType,
        sourceId: input.sourceId ?? null,
        description: input.description,
        metadataJson: input.metadataJson ?? null,
        createdBy: input.createdBy,
        isReversal: Boolean(input.isReversal),
        reversesLedgerEntryId: input.reversesLedgerEntryId ?? null,
        reversalReason: input.reversalReason ?? null,
        correctedByLedgerEntryId: input.correctedByLedgerEntryId ?? null,
        voidedAt: input.voidedAt ? new Date(input.voidedAt) : null,
        voidedBy: input.voidedBy ?? null
      }
    });

    await transaction.auditLog.create({
      data: {
        actor: input.createdBy,
        action: "CREATE_LEDGER_ENTRY",
        entityType: "LedgerEntry",
        entityId: entry.id,
        beforeJson: null,
        afterJson: JSON.stringify({ ledgerType: entry.ledgerType, allocationId: entry.allocationId, investorId: entry.investorId, monthlyReportId: entry.monthlyReportId, entryType: entry.entryType, amount: entry.amount, quantity: entry.quantity, sourceType: entry.sourceType })
      }
    });

    return { ok: true as const, entry };
  });
}

export async function reverseLedgerEntry(input: { ledgerEntryId: string; reversalReason: string; actor: string; allocationId?: string | null }) {
  const reason = input.reversalReason.trim();
  if (!reason) return { ok: false as const, status: 422 as const, error: "reversalReason is required." };

  return prisma.$transaction(async (transaction) => {
    const original = await transaction.ledgerEntry.findUnique({ where: { id: input.ledgerEntryId } });
    if (!original) return { ok: false as const, status: 404 as const, error: "Ledger entry not found." };
    if (input.allocationId && original.allocationId !== input.allocationId) return { ok: false as const, status: 404 as const, error: "Ledger entry not found for allocation." };
    if (original.isReversal) return { ok: false as const, status: 409 as const, error: "Reversal entries cannot be reversed." };

    const existingReversal = await transaction.ledgerEntry.findFirst({
      where: { reversesLedgerEntryId: original.id, isReversal: true }
    });
    if (existingReversal) return { ok: false as const, status: 409 as const, error: "Ledger entry has already been reversed." };

    const reversal = await transaction.ledgerEntry.create({
      data: {
        ledgerType: original.ledgerType,
        allocationId: original.allocationId,
        investorId: original.investorId,
        monthlyReportId: original.monthlyReportId,
        entryType: original.entryType,
        amount: negateDecimalString(original.amount),
        currency: original.currency,
        quantity: original.quantity === null ? null : -original.quantity,
        unitCost: original.unitCost,
        occurredAt: new Date(),
        sourceType: original.sourceType,
        sourceId: original.sourceId,
        description: `Reversal of ${original.id}: ${reason}`,
        metadataJson: original.metadataJson,
        createdBy: input.actor,
        isReversal: true,
        reversesLedgerEntryId: original.id,
        reversalReason: reason
      }
    });

    await transaction.ledgerEntry.update({
      where: { id: original.id },
      data: {
        voidedAt: new Date(),
        voidedBy: input.actor
      }
    });

    await transaction.auditLog.create({
      data: {
        actor: input.actor,
        action: "REVERSE_LEDGER_ENTRY",
        entityType: "LedgerEntry",
        entityId: original.id,
        beforeJson: JSON.stringify({ ledgerEntryId: original.id, amount: original.amount, quantity: original.quantity }),
        afterJson: JSON.stringify({ reversalLedgerEntryId: reversal.id, reversalReason: reason, amount: reversal.amount, quantity: reversal.quantity })
      }
    });

    return { ok: true as const, original, reversal };
  });
}

export async function createCorrectingLedgerEntry(input: { ledgerEntryId: string; reversalReason: string; correction: CreateLedgerEntryInput; actor: string; allocationId?: string | null }) {
  const reason = input.reversalReason.trim();
  if (!reason) return { ok: false as const, status: 422 as const, error: "reversalReason is required." };

  return prisma.$transaction(async (transaction) => {
    const original = await transaction.ledgerEntry.findUnique({ where: { id: input.ledgerEntryId } });
    if (!original) return { ok: false as const, status: 404 as const, error: "Ledger entry not found." };
    if (input.allocationId && original.allocationId !== input.allocationId) return { ok: false as const, status: 404 as const, error: "Ledger entry not found for allocation." };
    if (original.isReversal) return { ok: false as const, status: 409 as const, error: "Reversal entries cannot be corrected." };
    const existingReversal = await transaction.ledgerEntry.findFirst({ where: { reversesLedgerEntryId: original.id, isReversal: true } });
    if (existingReversal) return { ok: false as const, status: 409 as const, error: "Ledger entry has already been reversed." };

    const reversal = await transaction.ledgerEntry.create({
      data: {
        ledgerType: original.ledgerType,
        allocationId: original.allocationId,
        investorId: original.investorId,
        monthlyReportId: original.monthlyReportId,
        entryType: original.entryType,
        amount: negateDecimalString(original.amount),
        currency: original.currency,
        quantity: original.quantity === null ? null : -original.quantity,
        unitCost: original.unitCost,
        occurredAt: new Date(),
        sourceType: original.sourceType,
        sourceId: original.sourceId,
        description: `Correction reversal of ${original.id}: ${reason}`,
        metadataJson: original.metadataJson,
        createdBy: input.actor,
        isReversal: true,
        reversesLedgerEntryId: original.id,
        reversalReason: reason
      }
    });

    const correction = await transaction.ledgerEntry.create({
      data: {
        ledgerType: input.correction.ledgerType,
        allocationId: input.correction.allocationId ?? original.allocationId,
        investorId: input.correction.investorId ?? original.investorId,
        monthlyReportId: input.correction.monthlyReportId ?? original.monthlyReportId,
        entryType: input.correction.entryType,
        amount: input.correction.amount,
        currency: input.correction.currency || original.currency,
        quantity: input.correction.quantity ?? null,
        unitCost: input.correction.unitCost ?? null,
        occurredAt: input.correction.occurredAt ? new Date(input.correction.occurredAt) : new Date(),
        sourceType: input.correction.sourceType,
        sourceId: input.correction.sourceId ?? null,
        description: input.correction.description,
        metadataJson: input.correction.metadataJson ?? null,
        createdBy: input.actor
      }
    });

    await transaction.ledgerEntry.update({
      where: { id: original.id },
      data: {
        correctedByLedgerEntryId: correction.id,
        voidedAt: new Date(),
        voidedBy: input.actor
      }
    });

    await transaction.auditLog.create({
      data: {
        actor: input.actor,
        action: "CORRECT_LEDGER_ENTRY",
        entityType: "LedgerEntry",
        entityId: original.id,
        beforeJson: JSON.stringify({ ledgerEntryId: original.id }),
        afterJson: JSON.stringify({ reversalLedgerEntryId: reversal.id, correctionLedgerEntryId: correction.id, reversalReason: reason })
      }
    });

    return { ok: true as const, original, reversal, correction };
  });
}

export async function getLedgerEntryAuditTrail(ledgerEntryId: string): Promise<LedgerEntryAuditTrail | null> {
  const requestedEntry = await prisma.ledgerEntry.findUnique({ where: { id: ledgerEntryId } });
  if (!requestedEntry) return null;

  const originalEntry = requestedEntry.isReversal && requestedEntry.reversesLedgerEntryId
    ? await prisma.ledgerEntry.findUnique({ where: { id: requestedEntry.reversesLedgerEntryId } })
    : await prisma.ledgerEntry.findFirst({ where: { correctedByLedgerEntryId: requestedEntry.id } }) ?? requestedEntry;

  if (!originalEntry) return null;

  const [reversals, correction] = await Promise.all([
    prisma.ledgerEntry.findMany({ where: { reversesLedgerEntryId: originalEntry.id }, orderBy: [{ occurredAt: "asc" }, { createdAt: "asc" }] }),
    originalEntry.correctedByLedgerEntryId ? prisma.ledgerEntry.findUnique({ where: { id: originalEntry.correctedByLedgerEntryId } }) : Promise.resolve(null)
  ]);
  const relatedEntryIds = [originalEntry.id, requestedEntry.id, correction?.id, ...reversals.map((entry) => entry.id)].filter((id): id is string => Boolean(id));
  const audits = await prisma.auditLog.findMany({
    where: { entityType: "LedgerEntry", entityId: { in: relatedEntryIds } },
    orderBy: { createdAt: "asc" }
  });
  const reversedEntryIds = new Set(reversals.map((entry) => entry.reversesLedgerEntryId).filter((id): id is string => Boolean(id)));
  const context = { originalId: originalEntry.id, reversedEntryIds };

  return {
    requestedEntry: serializeLedgerEntryAuditTrailRecord(requestedEntry, context),
    originalEntry: serializeLedgerEntryAuditTrailRecord(originalEntry, context),
    reversalEntries: reversals.map((entry) => serializeLedgerEntryAuditTrailRecord(entry, context)),
    correctionEntry: correction ? serializeLedgerEntryAuditTrailRecord(correction, context) : null,
    auditEvents: audits.map((audit) => ({
      id: audit.id,
      actor: audit.actor,
      action: audit.action,
      entityType: audit.entityType,
      entityId: audit.entityId,
      beforePreview: sanitizeMetadataPreview(audit.beforeJson),
      afterPreview: sanitizeMetadataPreview(audit.afterJson),
      createdAt: toIso(audit.createdAt) ?? new Date().toISOString()
    }))
  };
}

export async function getReversibleLedgerEntriesForAllocation(allocationId: string) {
  const entries = await prisma.ledgerEntry.findMany({ where: { allocationId }, orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }] });
  const reversedIds = new Set(entries.filter((entry) => entry.isReversal && entry.reversesLedgerEntryId).map((entry) => entry.reversesLedgerEntryId as string));
  return entries.filter((entry) => !entry.isReversal && !reversedIds.has(entry.id));
}

export async function getLedgerEntriesForAllocation(allocationId: string, filters: LedgerEntryFilters = {}) {
  const appliedFilters = normalizeLedgerEntryFilters(filters);
  const where: Prisma.LedgerEntryWhereInput = { allocationId };
  if (appliedFilters.ledgerType) where.ledgerType = appliedFilters.ledgerType;
  if (appliedFilters.entryType) where.entryType = appliedFilters.entryType;
  if (appliedFilters.sourceType) where.sourceType = appliedFilters.sourceType;
  if (appliedFilters.dateFrom || appliedFilters.dateTo) {
    where.occurredAt = {
      ...(appliedFilters.dateFrom ? { gte: new Date(appliedFilters.dateFrom) } : {}),
      ...(appliedFilters.dateTo ? { lte: new Date(appliedFilters.dateTo) } : {})
    };
  }
  if (appliedFilters.query) {
    where.OR = [
      { description: { contains: appliedFilters.query } },
      { sourceId: { contains: appliedFilters.query } }
    ];
  }
  if (appliedFilters.reversalStatus === "ORIGINAL_ONLY") where.isReversal = false;
  if (appliedFilters.reversalStatus === "REVERSALS_ONLY") where.isReversal = true;
  if (appliedFilters.reversalStatus === "REVERSED_ONLY") {
    where.isReversal = false;
    where.voidedAt = { not: null };
  }
  if (appliedFilters.reversalStatus === "CORRECTED_ONLY") {
    where.isReversal = false;
    where.correctedByLedgerEntryId = { not: null };
  }

  const preLimit = appliedFilters.minAmount !== null || appliedFilters.maxAmount !== null ? Math.max(appliedFilters.limit * 5, 200) : appliedFilters.limit;
  const entries = await prisma.ledgerEntry.findMany({
    where,
    orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }],
    take: Math.min(preLimit, 1000)
  });
  const filteredEntries = entries
    .filter((entry) => matchesAmountRange(entry, appliedFilters))
    .slice(0, appliedFilters.limit)
    .map(serializeLedgerEntry);
  return { entries: filteredEntries, appliedFilters };
}

const LEDGER_CSV_COLUMNS = [
  "occurredAt",
  "ledgerType",
  "entryType",
  "amount",
  "currency",
  "quantity",
  "unitCost",
  "sourceType",
  "sourceId",
  "description",
  "isReversal",
  "reversesLedgerEntryId",
  "correctedByLedgerEntryId",
  "createdAt"
] as const;

function csvValue(value: string | number | boolean | null | undefined) {
  let text = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@]/.test(text.trimStart())) text = `'${text}`;
  const escaped = text.replace(/"/g, "\"\"");
  return /[",\r\n]/.test(escaped) ? `"${escaped}"` : escaped;
}

export function exportLedgerEntriesToCsv(entries: SerializedLedgerEntry[]) {
  const rows = entries.map((entry) => [
    entry.occurredAt,
    entry.ledgerType,
    entry.entryType,
    entry.amount,
    entry.currency,
    entry.quantity,
    entry.unitCost,
    entry.sourceType,
    entry.sourceId,
    entry.description,
    entry.isReversal,
    entry.reversesLedgerEntryId,
    entry.correctedByLedgerEntryId,
    entry.createdAt
  ].map(csvValue).join(","));
  return `${LEDGER_CSV_COLUMNS.join(",")}\n${rows.join("\n")}${rows.length ? "\n" : ""}`;
}

export async function getLedgerEntriesForInvestor(investorId: string) {
  return prisma.ledgerEntry.findMany({ where: { investorId }, orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }] });
}

export async function getLedgerEntriesForMonthlyReport(monthlyReportId: string) {
  return prisma.ledgerEntry.findMany({ where: { monthlyReportId }, orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }] });
}

export async function calculateAllocationReconciliation(allocationId: string) {
  const allocation = await prisma.allocation.findUnique({ where: { id: allocationId }, include: { ledgerEntries: true } });
  if (!allocation) return null;
  return calculateAllocationReconciliationFromEntries({ allocationId: allocation.id, allocationStatus: allocation.status, entries: allocation.ledgerEntries });
}

export async function calculateInvestorReconciliation(investorId: string) {
  const allocations = await prisma.allocation.findMany({ where: { investorId }, include: { ledgerEntries: true } });
  const reconciliations = allocations.map((allocation) => calculateAllocationReconciliationFromEntries({ allocationId: allocation.id, allocationStatus: allocation.status, entries: allocation.ledgerEntries }));
  const ledgerSummary = reconciliations.reduce((summary, reconciliation) => addSummary(summary, reconciliation.ledgerSummary), cloneSummary());
  const blockingIssues = reconciliations.flatMap((item) => item.blockingIssues);
  const warnings = reconciliations.flatMap((item) => item.warnings);
  return {
    investorId,
    status: statusFromIssues(blockingIssues, warnings),
    score: reconciliations.length ? Math.round(reconciliations.reduce((sum, item) => sum + item.score, 0) / reconciliations.length) : 100,
    allocationCount: reconciliations.length,
    blockingIssues,
    warnings,
    ledgerSummary,
    allocations: reconciliations
  };
}

export async function calculateMonthlyReportReconciliation(monthlyReportId: string): Promise<MonthlyReportReconciliation | null> {
  const report = await prisma.monthlyReport.findUnique({
    where: { id: monthlyReportId },
    include: {
      allocations: {
        include: {
          allocation: { include: { ledgerEntries: true } }
        }
      }
    }
  });
  if (!report) return null;

  const reconciliations = report.allocations
    .filter((link) => link.allocation.investorId === report.investorId)
    .map((link) => ({ link, reconciliation: calculateAllocationReconciliationFromEntries({ allocationId: link.allocation.id, allocationStatus: link.allocation.status, entries: link.allocation.ledgerEntries }) }));
  const ledgerSummary = reconciliations.reduce((summary, item) => addSummary(summary, item.reconciliation.ledgerSummary), cloneSummary());
  const blockingIssues = reconciliations.flatMap((item) => item.reconciliation.blockingIssues);
  const warnings = reconciliations.flatMap((item) => item.reconciliation.warnings);
  const snapshotExists = Boolean(parseReconciliationSnapshot(report.proofSummaryJson));
  if (report.status === "PUBLISHED" && !snapshotExists) blockingIssues.push({ id: "published-report-without-reconciliation-snapshot", severity: "BLOCKING", message: "Monthly report is published without a reconciliation snapshot." });

  return {
    monthlyReportId,
    status: statusFromIssues(blockingIssues, warnings),
    score: reconciliations.length ? Math.round(reconciliations.reduce((sum, item) => sum + item.reconciliation.score, 0) / reconciliations.length) : 100,
    snapshotExists,
    linkedAllocationCount: reconciliations.length,
    blockingIssues,
    warnings,
    allocationSummaries: reconciliations.map((item) => ({ allocationId: item.link.allocation.id, supplyCode: item.link.allocation.supplyCode, productName: item.link.allocation.productName, status: item.reconciliation.status, score: item.reconciliation.score })),
    ledgerSummary
  };
}

export async function getReconciliationExceptions(input: { allocationId?: string; investorId?: string; monthlyReportId?: string }) {
  if (input.allocationId) {
    const reconciliation = await calculateAllocationReconciliation(input.allocationId);
    return reconciliation ? [...reconciliation.blockingIssues, ...reconciliation.warnings] : [];
  }
  if (input.monthlyReportId) {
    const reconciliation = await calculateMonthlyReportReconciliation(input.monthlyReportId);
    return reconciliation ? [...reconciliation.blockingIssues, ...reconciliation.warnings] : [];
  }
  if (input.investorId) {
    const reconciliation = await calculateInvestorReconciliation(input.investorId);
    return [...reconciliation.blockingIssues, ...reconciliation.warnings];
  }
  return [];
}

export function parseReconciliationSnapshot(value: string | null): ReconciliationSnapshot | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    const snapshot = parsed.reconciliationSummary;
    if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) return null;
    const record = snapshot as ReconciliationSnapshot;
    return typeof record.generatedAt === "string" && Array.isArray(record.allocations) ? record : null;
  } catch {
    return null;
  }
}

export async function buildReconciliationSnapshot(monthlyReportId: string, client: Pick<Prisma.TransactionClient, "monthlyReport" | "monthlyReportAllocation"> = prisma): Promise<ReconciliationSnapshot> {
  const linkedAllocations = await client.monthlyReportAllocation.findMany({
    where: { monthlyReportId },
    include: { allocation: { include: { ledgerEntries: true } } },
    orderBy: [{ includedAt: "asc" }]
  });

  const reconciliations = linkedAllocations.map((link) => calculateAllocationReconciliationFromEntries({ allocationId: link.allocation.id, allocationStatus: link.allocation.status, entries: link.allocation.ledgerEntries }));
  const portfolioTotals = reconciliations.reduce((summary, reconciliation) => addSummary(summary, reconciliation.ledgerSummary), cloneSummary());
  const blockingIssueCount = reconciliations.reduce((sum, reconciliation) => sum + reconciliation.blockingIssues.length, 0);
  const warningCount = reconciliations.reduce((sum, reconciliation) => sum + reconciliation.warnings.length, 0);

  return {
    generatedAt: new Date().toISOString(),
    allocations: reconciliations.map((reconciliation) => ({
      allocationId: reconciliation.allocationId,
      status: reconciliation.status,
      score: reconciliation.score,
      ledgerSummary: reconciliation.ledgerSummary,
      investorSafeSummary: getInvestorSafeReconciliationSummary(reconciliation),
      exceptionSummary: {
        blockingIssueCount: reconciliation.blockingIssues.length,
        warningCount: reconciliation.warnings.length
      }
    })),
    portfolioTotals,
    exceptionsSummary: { blockingIssueCount, warningCount }
  };
}

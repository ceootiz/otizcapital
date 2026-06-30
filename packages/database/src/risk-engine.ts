import { Prisma } from "@prisma/client";
import { prisma } from "./client";
import { calculateAllocationProofCompletenessFromInput, type ProofCompletenessBreakdown, type ProofCompletenessProofInput } from "./proof-completeness";
import { getActiveReadinessPolicy, getSafeDefaultReadinessPolicy, type SerializedReadinessPolicy } from "./readiness-policies";
import { calculateAllocationReconciliationFromEntries, type LedgerEntryInput } from "./reconciliation";

export const RISK_LEVELS_V1 = ["LOW", "MODERATE", "ELEVATED", "HIGH", "CRITICAL"] as const;
export type RiskLevelV1 = (typeof RISK_LEVELS_V1)[number];
export type RiskFactorSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type RiskFactorCategory = "INVENTORY" | "CASH" | "PROOF" | "OPERATIONAL" | "CONCENTRATION" | "PAYOUT" | "RECONCILIATION";

export type RiskFactor = {
  id: string;
  category: RiskFactorCategory;
  severity: RiskFactorSeverity;
  label: string;
  description: string;
  investorVisible: boolean;
};

export type InvestorSafeRiskSummary = {
  score: number;
  level: RiskLevelV1;
  summary: string;
  visibleFactors: string[];
};

export type AllocationRisk = {
  allocationId: string;
  score: number;
  level: RiskLevelV1;
  riskFactors: RiskFactor[];
  blockingIssues: RiskFactor[];
  warnings: RiskFactor[];
  investorSafeSummary: InvestorSafeRiskSummary;
  adminSummary: string;
  recommendedActions: string[];
  proofCompleteness: ProofCompletenessBreakdown | null;
};

export type PortfolioRisk = {
  investorId: string;
  score: number;
  level: RiskLevelV1;
  riskFactors: RiskFactor[];
  blockingIssues: RiskFactor[];
  warnings: RiskFactor[];
  investorSafeSummary: InvestorSafeRiskSummary;
  adminSummary: string;
  recommendedActions: string[];
  allocationRisks: AllocationRisk[];
};

export type RiskSnapshot = {
  generatedAt: string;
  portfolioRisk: PortfolioRisk;
  allocations: Array<{
    allocationId: string;
    supplyCode: string;
    productName: string;
    risk: AllocationRisk;
    investorSafeSummary: InvestorSafeRiskSummary;
  }>;
  materialRiskEvents: Array<{
    allocationId: string;
    severity: RiskFactorSeverity;
    category: RiskFactorCategory;
    label: string;
    investorSafeSummary: string;
  }>;
};

export const RISK_AUDIT_ACTIONS = [
  "EVALUATE_ALLOCATION_RISK",
  "EVALUATE_REPORT_RISK",
  "RISK_LEVEL_CHANGED",
  "RISK_BLOCKING_ISSUE_CREATED",
  "RISK_BLOCKING_ISSUE_RESOLVED"
] as const;

export type RiskAuditAction = (typeof RISK_AUDIT_ACTIONS)[number];
export type RiskTimelineSource = "manual_evaluation" | "report_snapshot" | "readiness_gate";
export type RiskTimelineEventSource = RiskTimelineSource | "unknown";
export const RISK_TIMELINE_SOURCE_FILTERS = ["all", "manual_evaluation", "report_snapshot", "readiness_gate", "unknown"] as const;
export type RiskTimelineSourceFilter = (typeof RISK_TIMELINE_SOURCE_FILTERS)[number];
export type RiskTimelineFilters = {
  source?: string | null;
  limit?: string | number | null;
};
export type RiskTimelineAppliedFilters = {
  source: RiskTimelineSourceFilter;
  limit: number;
};

export type RiskFactorSummary = {
  id: string;
  category: RiskFactorCategory;
  severity: RiskFactorSeverity;
  label: string;
};

export type RiskComparableSnapshot = {
  level: RiskLevelV1;
  score: number;
  riskFactors: RiskFactorSummary[];
  blockingIssues: RiskFactorSummary[];
};

export type RiskSnapshotDiff = {
  previousLevel: RiskLevelV1 | null;
  currentLevel: RiskLevelV1;
  previousScore: number | null;
  currentScore: number;
  newRiskFactors: RiskFactorSummary[];
  resolvedRiskFactors: RiskFactorSummary[];
  newBlockingIssues: RiskFactorSummary[];
  resolvedBlockingIssues: RiskFactorSummary[];
};

export type RiskTimelineEvent = {
  id: string;
  actor: string;
  action: RiskAuditAction;
  entityType: "Allocation" | "MonthlyReport";
  entityId: string;
  createdAt: string;
  source: RiskTimelineEventSource;
  summary: string;
  risk: RiskComparableSnapshot | null;
  diff: RiskSnapshotDiff | null;
  details: RiskTimelineEventDetails;
};

export type RiskTimelineEventDetails = {
  previousLevel: RiskLevelV1 | null;
  currentLevel: RiskLevelV1 | null;
  previousScore: number | null;
  currentScore: number | null;
  newFactors: RiskFactorSummary[];
  resolvedFactors: RiskFactorSummary[];
  newBlockingIssues: RiskFactorSummary[];
  resolvedBlockingIssues: RiskFactorSummary[];
  source: RiskTimelineEventSource;
  actor: string;
  summary: string;
};

export type RiskTimelineResult = {
  events: RiskTimelineEvent[];
  appliedFilters: RiskTimelineAppliedFilters;
};

type AllocationRiskInput = {
  id: string;
  investorId: string;
  supplyCode?: string;
  productName?: string;
  status: string;
  allocationAmount?: string | number | null;
  riskLevel?: string | null;
  expectedCycleDays?: number | null;
  expectedPayoutAt?: Date | string | null;
  startedAt?: Date | string | null;
  completedAt?: Date | string | null;
  createdAt?: Date | string | null;
  payoutStatus?: string | null;
  proofs?: ProofCompletenessProofInput[];
  ledgerEntries?: LedgerEntryInput[];
  monthlyReportLinkCount?: number;
};

type PortfolioAllocationInput = AllocationRiskInput & {
  investorId: string;
};

const ACTIVE_ALLOCATION_STATUSES = new Set(["DRAFT", "PURCHASING", "SHIPPING", "RECEIVED", "SELLING"]);
const TERMINAL_ALLOCATION_STATUSES = new Set(["COMPLETED", "CANCELED", "LOSS"]);

function toNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return 0;
  const numeric = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
}

function asDate(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysBetween(start: Date | null, end: Date) {
  if (!start) return 0;
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 86_400_000));
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function riskLevelFromScore(score: number): RiskLevelV1 {
  if (score >= 85) return "CRITICAL";
  if (score >= 65) return "HIGH";
  if (score >= 45) return "ELEVATED";
  if (score >= 25) return "MODERATE";
  return "LOW";
}

function severityWeight(severity: RiskFactorSeverity) {
  if (severity === "CRITICAL") return 35;
  if (severity === "HIGH") return 25;
  if (severity === "MEDIUM") return 14;
  return 7;
}

function makeFactor(id: string, category: RiskFactorCategory, severity: RiskFactorSeverity, label: string, description: string, investorVisible = false): RiskFactor {
  return { id, category, severity, label, description, investorVisible };
}

function sanitizeRiskString(value: unknown, maxLength = 160) {
  if (typeof value !== "string" && typeof value !== "number") return "";
  return String(value)
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function factorSummary(factor: RiskFactor | RiskFactorSummary): RiskFactorSummary {
  return {
    id: sanitizeRiskString(factor.id, 120),
    category: factor.category,
    severity: factor.severity,
    label: sanitizeRiskString(factor.label, 160)
  };
}

function uniqueFactorSummaries(factors: Array<RiskFactor | RiskFactorSummary>) {
  const seen = new Set<string>();
  return factors
    .map(factorSummary)
    .filter((factor) => {
      const key = `${factor.id}:${factor.category}:${factor.label}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return Boolean(factor.id || factor.label);
    })
    .slice(0, 24);
}

function factorKey(factor: RiskFactorSummary) {
  return `${factor.id}:${factor.category}:${factor.label}`;
}

function isRiskSnapshot(value: AllocationRisk | PortfolioRisk | RiskSnapshot | RiskComparableSnapshot): value is RiskSnapshot {
  return "portfolioRisk" in value;
}

function isPortfolioRisk(value: AllocationRisk | PortfolioRisk | RiskComparableSnapshot): value is PortfolioRisk {
  return "allocationRisks" in value;
}

function toRiskComparable(value: AllocationRisk | PortfolioRisk | RiskSnapshot | RiskComparableSnapshot): RiskComparableSnapshot {
  if ("riskFactors" in value && "blockingIssues" in value && !("adminSummary" in value)) {
    return {
      level: value.level,
      score: value.score,
      riskFactors: uniqueFactorSummaries(value.riskFactors),
      blockingIssues: uniqueFactorSummaries(value.blockingIssues)
    };
  }

  const risk = isRiskSnapshot(value) ? value.portfolioRisk : isPortfolioRisk(value) ? value : value;
  return {
    level: risk.level,
    score: risk.score,
    riskFactors: uniqueFactorSummaries(risk.riskFactors),
    blockingIssues: uniqueFactorSummaries(risk.blockingIssues)
  };
}

function parseJsonObject(value: string | null) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

function parseRiskComparable(value: unknown): RiskComparableSnapshot | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const level = parseRiskLevel(record.level);
  if (!level || typeof record.score !== "number") return null;
  return {
    level,
    score: Math.max(0, Math.min(100, Math.round(record.score))),
    riskFactors: parseFactorSummaries(record.riskFactors),
    blockingIssues: parseFactorSummaries(record.blockingIssues)
  };
}

function parseRiskAuditPayload(value: string | null) {
  const parsed = parseJsonObject(value);
  if (!parsed) return null;
  return {
    source: normalizeRiskTimelineEventSource(parsed.source),
    summary: sanitizeRiskTimelineText(typeof parsed.summary === "string" ? parsed.summary : "Risk evaluation recorded.", 260),
    risk: parseRiskComparable(parsed.risk),
    diff: parseRiskDiff(parsed.diff)
  };
}

function normalizeRiskTimelineEventSource(value: unknown): RiskTimelineEventSource {
  return typeof value === "string" && value !== "all" && RISK_TIMELINE_SOURCE_FILTERS.includes(value as RiskTimelineSourceFilter)
    ? value as RiskTimelineEventSource
    : "unknown";
}

function normalizeRiskTimelineFilterSource(value: unknown): RiskTimelineSourceFilter {
  return typeof value === "string" && RISK_TIMELINE_SOURCE_FILTERS.includes(value as RiskTimelineSourceFilter)
    ? value as RiskTimelineSourceFilter
    : "all";
}

function normalizeRiskTimelineFilters(filters: RiskTimelineFilters = {}): RiskTimelineAppliedFilters {
  const source = normalizeRiskTimelineFilterSource(filters.source || "all");
  const parsedLimit = filters.limit === undefined || filters.limit === null || filters.limit === "" ? 20 : Number(filters.limit);
  const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(Math.trunc(parsedLimit), 1), 100) : 20;
  return { source, limit };
}

function sanitizeRiskTimelineText(value: string, maxLength: number) {
  const sanitized = sanitizeRiskString(value, maxLength)
    .replace(/\b(metadataJson|bankAccount|secretToken|session|csrf)\b/gi, "[redacted]")
    .replace(/\s+/g, " ")
    .trim();
  return sanitized || "Risk audit event recorded.";
}

function sanitizeRiskTimelineFactor(factor: RiskFactorSummary): RiskFactorSummary {
  return {
    ...factor,
    id: sanitizeRiskTimelineText(String(factor.id || "risk-factor"), 90),
    label: sanitizeRiskTimelineText(String(factor.label || "Risk factor"), 140)
  };
}

function parseFactorSummaries(value: unknown): RiskFactorSummary[] {
  if (!Array.isArray(value)) return [];
  return uniqueFactorSummaries(value.filter((item): item is RiskFactorSummary => Boolean(item) && typeof item === "object" && !Array.isArray(item)) as RiskFactorSummary[]).map(sanitizeRiskTimelineFactor);
}

function parseRiskDiff(value: unknown): RiskSnapshotDiff | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const currentLevel = parseRiskLevel(record.currentLevel);
  if (!currentLevel) return null;
  const previousLevel = parseRiskLevel(record.previousLevel);
  return {
    previousLevel,
    currentLevel,
    previousScore: typeof record.previousScore === "number" ? record.previousScore : null,
    currentScore: typeof record.currentScore === "number" ? record.currentScore : 0,
    newRiskFactors: parseFactorSummaries(record.newRiskFactors),
    resolvedRiskFactors: parseFactorSummaries(record.resolvedRiskFactors),
    newBlockingIssues: parseFactorSummaries(record.newBlockingIssues),
    resolvedBlockingIssues: parseFactorSummaries(record.resolvedBlockingIssues)
  };
}

function recommendedActionForFactor(factor: RiskFactor) {
  if (factor.category === "INVENTORY") return "Review inventory ledger quantities and reconcile purchased, received, sold, returned, and remaining units.";
  if (factor.category === "CASH") return "Review cash ledger source entries for supplier payments, settlements, fees, refunds, and payouts.";
  if (factor.category === "PROOF") return "Add or review required investor-visible proof placeholders before reporting.";
  if (factor.category === "PAYOUT") return "Review payout approval, scheduled payout, and paid payout ledger entries.";
  if (factor.category === "CONCENTRATION") return "Review concentration exposure before adding more capital to this operational cycle.";
  if (factor.category === "OPERATIONAL") return "Review manual adjustments, corrections, reversals, and stale operational timestamps.";
  return "Review reconciliation issues before publishing or investor reporting.";
}

function makeInvestorSafeSummary(level: RiskLevelV1, score: number, factors: RiskFactor[]): InvestorSafeRiskSummary {
  const visibleFactors = factors
    .filter((factor) => factor.investorVisible)
    .slice(0, 4)
    .map((factor) => factor.label);
  const summary =
    level === "LOW"
      ? "Operational risk is currently low based on available commerce, proof, and payout controls."
      : level === "MODERATE"
        ? "Operational risk is being monitored as the commerce cycle progresses."
        : level === "ELEVATED"
          ? "Operational risk is elevated and remains under manager review."
          : level === "HIGH"
            ? "Operational risk is high and requires manager review before reporting decisions."
            : "Operational risk is critical and requires resolution before standard reporting.";

  return {
    score,
    level,
    summary,
    visibleFactors: visibleFactors.length ? visibleFactors : ["Standard operational monitoring"]
  };
}

export function getInvestorSafeRiskSummary(risk: Pick<AllocationRisk | PortfolioRisk, "score" | "level" | "riskFactors">): InvestorSafeRiskSummary {
  return makeInvestorSafeSummary(risk.level, risk.score, risk.riskFactors);
}

export function calculateAllocationRiskFromInput(input: {
  allocation: AllocationRiskInput;
  policy?: SerializedReadinessPolicy;
  now?: Date;
}): AllocationRisk {
  const now = input.now ?? new Date();
  const policy = input.policy ?? getSafeDefaultReadinessPolicy();
  const allocation = input.allocation;
  const ledgerEntries = allocation.ledgerEntries ?? [];
  const proofs = allocation.proofs ?? [];
  const reconciliation = calculateAllocationReconciliationFromEntries({
    allocationId: allocation.id,
    allocationStatus: allocation.status,
    entries: ledgerEntries
  });
  const proofCompleteness = calculateAllocationProofCompletenessFromInput({
    allocationId: allocation.id,
    investorId: allocation.investorId,
    proofs,
    monthlyReportLinkCount: allocation.monthlyReportLinkCount ?? 0,
    policy
  });
  const factors: RiskFactor[] = [];
  const summary = reconciliation.ledgerSummary;
  const allocationAmount = toNumber(allocation.allocationAmount);
  const anchorDate = asDate(allocation.startedAt) ?? asDate(allocation.createdAt);
  const expectedPayoutAt = asDate(allocation.expectedPayoutAt) ?? (anchorDate && allocation.expectedCycleDays ? addDays(anchorDate, allocation.expectedCycleDays) : null);
  const ageDays = daysBetween(anchorDate, now);
  const expectedCycleDays = allocation.expectedCycleDays ?? 45;
  const reversalCount = ledgerEntries.filter((entry) => entry.isReversal).length;
  const correctionCount = ledgerEntries.filter((entry) => entry.correctedByLedgerEntryId || entry.voidedAt).length;
  const manualAdjustmentCount = ledgerEntries.filter((entry) => entry.sourceType === "MANUAL_ADJUSTMENT").length;

  if (summary.inventory.remaining < 0) factors.push(makeFactor("negative-remaining-inventory", "INVENTORY", "CRITICAL", "Negative remaining inventory", "Inventory ledger indicates fewer than zero remaining units.", true));
  if (summary.inventory.inventoryVariance < 0) factors.push(makeFactor("inventory-variance", "INVENTORY", "HIGH", "Inventory variance", "Purchased, received, sold, returned, and remaining quantities do not align.", true));
  if (summary.inventory.received > summary.inventory.purchased && summary.inventory.purchased > 0) factors.push(makeFactor("received-exceeds-purchased", "INVENTORY", "CRITICAL", "Received exceeds purchased", "Received units exceed purchased units in the inventory ledger.", true));
  if (summary.inventory.purchased > 0 && summary.inventory.received === 0 && !["DRAFT", "PURCHASING"].includes(allocation.status)) factors.push(makeFactor("missing-received-units", "INVENTORY", "HIGH", "Missing received units", "Allocation moved past procurement without received inventory evidence.", true));
  if (summary.inventory.received > summary.inventory.sold && ageDays > Math.max(expectedCycleDays + 14, 60) && !TERMINAL_ALLOCATION_STATUSES.has(allocation.status)) factors.push(makeFactor("unsold-aging", "INVENTORY", "MEDIUM", "Unsold inventory aging", "Received units remain unsold beyond the expected operational cycle.", true));

  if (summary.cash.netCashPosition < -Math.max(allocationAmount * 0.5, 1000)) factors.push(makeFactor("negative-cash-position", "CASH", "HIGH", "Negative cash position", "Cash ledger shows a materially negative net cash position.", false));
  if (summary.cash.supplierPayments > 0 && summary.inventory.received === 0 && summary.inventory.purchased === 0) factors.push(makeFactor("supplier-payment-without-inventory", "CASH", "HIGH", "Supplier payment without inventory", "Supplier payments exist without purchased or received units.", false));
  if (summary.cash.marketplaceSettlements > 0 && summary.inventory.sold === 0) factors.push(makeFactor("settlement-without-sold-units", "CASH", "HIGH", "Settlement without sold units", "Marketplace settlement exists without corresponding sold units.", true));
  if (summary.cash.refunds > Math.max(summary.cash.marketplaceSettlements * 0.25, 500)) factors.push(makeFactor("refund-spike", "CASH", "MEDIUM", "Refund spike", "Refund volume is high compared with marketplace settlements.", true));
  if (summary.cash.marketplaceFees > Math.max(summary.cash.marketplaceSettlements * 0.15, 300)) factors.push(makeFactor("excessive-fees", "CASH", "MEDIUM", "Elevated marketplace fees", "Marketplace fees are high compared with settlement volume.", false));
  if (summary.investorLiability.payoutsPaid > summary.investorLiability.payoutsApproved) factors.push(makeFactor("payout-paid-exceeds-approved", "PAYOUT", "CRITICAL", "Payout paid exceeds approved", "Paid payout ledger exceeds approved payout ledger.", true));
  if (summary.investorLiability.payoutsApproved > summary.investorLiability.profitAccrued + summary.investorLiability.capitalAllocated) factors.push(makeFactor("payout-approved-exceeds-liability", "PAYOUT", "CRITICAL", "Payout approval exceeds liability", "Approved payout exceeds recorded capital and accrued investor share.", true));

  if (proofCompleteness.score < policy.minimumProofCompletenessScore) factors.push(makeFactor("low-proof-completeness", "PROOF", "HIGH", "Low proof completeness", "Proof completeness is below the active readiness policy threshold.", true));
  if (proofCompleteness.missingRequiredCategories.length > 0) factors.push(makeFactor("missing-required-proofs", "PROOF", "CRITICAL", "Missing required proof categories", "Required proof categories are not investor-visible yet.", true));
  if (proofCompleteness.hiddenProofCount > 0 && policy.blockOnHiddenInvestorLeakRisk) factors.push(makeFactor("hidden-critical-proofs", "PROOF", "HIGH", "Hidden proof artifacts present", "Hidden proof artifacts are excluded from investor-visible evidence and require review.", false));
  if (proofCompleteness.unreviewedProofCount > 0 && policy.blockOnUnreviewedCriticalArtifacts) factors.push(makeFactor("unreviewed-proof-artifacts", "PROOF", "HIGH", "Unreviewed proof artifacts", "Proof artifacts remain pending review under the active policy.", false));

  if (reconciliation.status === "BROKEN") factors.push(makeFactor("broken-reconciliation", "RECONCILIATION", "CRITICAL", "Broken reconciliation", "Three-ledger reconciliation has blocking issues.", true));
  if (reconciliation.status === "WARNING") factors.push(makeFactor("reconciliation-warning", "RECONCILIATION", "HIGH", "Reconciliation warning", "Three-ledger reconciliation has operational warnings.", true));
  if (reversalCount >= 3) factors.push(makeFactor("excessive-reversals", "OPERATIONAL", "HIGH", "Excessive ledger reversals", "Ledger has repeated reversal entries that require manager review.", false));
  if (correctionCount >= 3) factors.push(makeFactor("excessive-corrections", "OPERATIONAL", "HIGH", "Excessive ledger corrections", "Ledger has repeated correction or voiding activity.", false));
  if (manualAdjustmentCount >= 4) factors.push(makeFactor("manual-adjustment-volume", "OPERATIONAL", "MEDIUM", "Manual adjustment volume", "Manual adjustment volume is above the expected operational baseline.", false));
  if (expectedPayoutAt && expectedPayoutAt.getTime() < now.getTime() && ACTIVE_ALLOCATION_STATUSES.has(allocation.status)) factors.push(makeFactor("overdue-expected-payout", "PAYOUT", "HIGH", "Expected payout overdue", "Expected payout timing has passed while the allocation remains active.", true));
  if (allocation.riskLevel === "ELEVATED") factors.push(makeFactor("manager-elevated-risk", "OPERATIONAL", "MEDIUM", "Manager marked elevated", "The allocation is manually marked as elevated risk.", true));
  if (allocationAmount >= 25_000) factors.push(makeFactor("large-allocation-exposure", "CONCENTRATION", "MEDIUM", "Large allocation exposure", "Allocation size is above the high-value operational threshold.", true));

  const score = Math.min(100, factors.reduce((sum, factor) => sum + severityWeight(factor.severity), 0));
  const level = riskLevelFromScore(score);
  const blockingIssues = factors.filter((factor) => factor.severity === "CRITICAL");
  const warnings = factors.filter((factor) => factor.severity !== "CRITICAL");
  const recommendedActions = Array.from(new Set(factors.map(recommendedActionForFactor))).slice(0, 6);
  const investorSafeSummary = makeInvestorSafeSummary(level, score, factors);

  return {
    allocationId: allocation.id,
    score,
    level,
    riskFactors: factors,
    blockingIssues,
    warnings,
    investorSafeSummary,
    adminSummary: factors.length ? `${factors.length} operational risk signal(s) detected across ${Array.from(new Set(factors.map((factor) => factor.category))).join(", ")}.` : "No material operational risk signals detected.",
    recommendedActions: recommendedActions.length ? recommendedActions : ["Continue standard monitoring for inventory, cash, proof, payout, and reconciliation controls."],
    proofCompleteness
  };
}

export function calculatePortfolioRiskFromAllocations(input: {
  investorId: string;
  allocations: PortfolioAllocationInput[];
  policy?: SerializedReadinessPolicy;
  now?: Date;
}): PortfolioRisk {
  const allocations = input.allocations.filter((allocation) => allocation.investorId === input.investorId);
  const allocationRisks = allocations.map((allocation) => calculateAllocationRiskFromInput({ allocation, policy: input.policy, now: input.now }));
  const factors: RiskFactor[] = allocationRisks.flatMap((risk) => risk.riskFactors.map((factor) => ({ ...factor, id: `${risk.allocationId}:${factor.id}` })));
  const totalExposure = allocations.reduce((sum, allocation) => sum + toNumber(allocation.allocationAmount), 0);
  const largestExposure = allocations.reduce((max, allocation) => Math.max(max, toNumber(allocation.allocationAmount)), 0);
  const activeExposure = allocations.filter((allocation) => !TERMINAL_ALLOCATION_STATUSES.has(allocation.status)).reduce((sum, allocation) => sum + toNumber(allocation.allocationAmount), 0);

  if (totalExposure > 0 && largestExposure / totalExposure >= 0.6 && allocations.length > 1) {
    factors.push(makeFactor("investor-concentration", "CONCENTRATION", "HIGH", "Investor concentration", "A single allocation represents most of the investor exposure.", true));
  }
  if (activeExposure >= 50_000) {
    factors.push(makeFactor("active-exposure-concentration", "CONCENTRATION", "MEDIUM", "High active exposure", "Active managed exposure is above the portfolio monitoring threshold.", true));
  }

  const averageRisk = allocationRisks.length ? allocationRisks.reduce((sum, risk) => sum + risk.score, 0) / allocationRisks.length : 0;
  const maxRisk = allocationRisks.reduce((max, risk) => Math.max(max, risk.score), 0);
  const portfolioOnlyScore = factors.slice(allocationRisks.flatMap((risk) => risk.riskFactors).length).reduce((sum, factor) => sum + severityWeight(factor.severity), 0);
  const score = Math.min(100, Math.round(Math.max(averageRisk, maxRisk * 0.75) + portfolioOnlyScore));
  const level = riskLevelFromScore(score);
  const blockingIssues = factors.filter((factor) => factor.severity === "CRITICAL");
  const warnings = factors.filter((factor) => factor.severity !== "CRITICAL");
  const recommendedActions = Array.from(new Set(factors.map(recommendedActionForFactor))).slice(0, 6);

  return {
    investorId: input.investorId,
    score,
    level,
    riskFactors: factors,
    blockingIssues,
    warnings,
    investorSafeSummary: makeInvestorSafeSummary(level, score, factors),
    adminSummary: factors.length ? `${factors.length} portfolio risk signal(s) detected across ${allocations.length} allocation(s).` : "No material portfolio risk signals detected.",
    recommendedActions: recommendedActions.length ? recommendedActions : ["Continue standard portfolio monitoring."],
    allocationRisks
  };
}

export async function calculateAllocationRisk(allocationId: string, options: { policy?: SerializedReadinessPolicy; now?: Date } = {}) {
  const [allocation, policy] = await Promise.all([
    prisma.allocation.findUnique({
      where: { id: allocationId },
      include: {
        proofs: true,
        ledgerEntries: true,
        monthlyReports: { select: { id: true } }
      }
    }),
    options.policy ? Promise.resolve(options.policy) : getActiveReadinessPolicy()
  ]);
  if (!allocation) return null;

  return calculateAllocationRiskFromInput({
    allocation: {
      ...allocation,
      proofs: allocation.proofs,
      ledgerEntries: allocation.ledgerEntries,
      monthlyReportLinkCount: allocation.monthlyReports.length
    },
    policy,
    now: options.now
  });
}

export async function getAllocationRiskBreakdown(allocationId: string) {
  return calculateAllocationRisk(allocationId);
}

export async function calculatePortfolioRisk(investorId: string, options: { policy?: SerializedReadinessPolicy; now?: Date } = {}) {
  const [allocations, policy] = await Promise.all([
    prisma.allocation.findMany({
      where: { investorId },
      include: {
        proofs: true,
        ledgerEntries: true,
        monthlyReports: { select: { id: true } }
      },
      orderBy: [{ updatedAt: "desc" }]
    }),
    options.policy ? Promise.resolve(options.policy) : getActiveReadinessPolicy()
  ]);

  return calculatePortfolioRiskFromAllocations({
    investorId,
    allocations: allocations.map((allocation) => ({
      ...allocation,
      proofs: allocation.proofs,
      ledgerEntries: allocation.ledgerEntries,
      monthlyReportLinkCount: allocation.monthlyReports.length
    })),
    policy,
    now: options.now
  });
}

export async function calculateOperationalRiskAlerts(investorId?: string) {
  const where = investorId ? { investorId } : {};
  const allocations = await prisma.allocation.findMany({
    where,
    include: { proofs: true, ledgerEntries: true, monthlyReports: { select: { id: true } } },
    orderBy: [{ updatedAt: "desc" }]
  });
  const policy = await getActiveReadinessPolicy();
  return allocations
    .map((allocation) => calculateAllocationRiskFromInput({
      allocation: { ...allocation, proofs: allocation.proofs, ledgerEntries: allocation.ledgerEntries, monthlyReportLinkCount: allocation.monthlyReports.length },
      policy
    }))
    .flatMap((risk) => risk.riskFactors.filter((factor) => factor.severity === "HIGH" || factor.severity === "CRITICAL").map((factor) => ({ allocationId: risk.allocationId, ...factor })));
}

export async function getInvestorRiskSummary(investorId: string) {
  const risk = await calculatePortfolioRisk(investorId);
  return risk.investorSafeSummary;
}

export async function buildRiskSnapshot(monthlyReportId: string, client: Pick<Prisma.TransactionClient, "monthlyReport" | "monthlyReportAllocation" | "readinessPolicy"> = prisma): Promise<RiskSnapshot | null> {
  const report = await client.monthlyReport.findUnique({ where: { id: monthlyReportId }, select: { id: true, investorId: true } });
  if (!report) return null;
  const policy = await getActiveReadinessPolicy(client);
  const links = await client.monthlyReportAllocation.findMany({
    where: { monthlyReportId, allocation: { investorId: report.investorId } },
    include: {
      allocation: {
        include: {
          proofs: true,
          ledgerEntries: true,
          monthlyReports: { select: { id: true } }
        }
      }
    },
    orderBy: [{ includedAt: "asc" }]
  });
  const allocations = links.map((link) => ({
    ...link.allocation,
    proofs: link.allocation.proofs,
    ledgerEntries: link.allocation.ledgerEntries,
    monthlyReportLinkCount: link.allocation.monthlyReports.length
  }));
  const portfolioRisk = calculatePortfolioRiskFromAllocations({ investorId: report.investorId, allocations, policy });
  const riskByAllocationId = new Map(portfolioRisk.allocationRisks.map((risk) => [risk.allocationId, risk] as const));
  const materialRiskEvents = portfolioRisk.allocationRisks.flatMap((risk) =>
    risk.riskFactors
      .filter((factor) => factor.severity === "HIGH" || factor.severity === "CRITICAL")
      .slice(0, 6)
      .map((factor) => ({
        allocationId: risk.allocationId,
        severity: factor.severity,
        category: factor.category,
        label: factor.label,
        investorSafeSummary: risk.investorSafeSummary.summary
      }))
  );

  return {
    generatedAt: new Date().toISOString(),
    portfolioRisk,
    allocations: links.map((link) => {
      const risk = riskByAllocationId.get(link.allocationId) ?? calculateAllocationRiskFromInput({
        allocation: { ...link.allocation, proofs: link.allocation.proofs, ledgerEntries: link.allocation.ledgerEntries, monthlyReportLinkCount: link.allocation.monthlyReports.length },
        policy
      });
      return {
        allocationId: link.allocationId,
        supplyCode: link.allocation.supplyCode,
        productName: link.allocation.productName,
        risk,
        investorSafeSummary: risk.investorSafeSummary
      };
    }),
    materialRiskEvents
  };
}

function parseRiskLevel(value: unknown): RiskLevelV1 | null {
  return typeof value === "string" && RISK_LEVELS_V1.includes(value as RiskLevelV1) ? value as RiskLevelV1 : null;
}

export function parseInvestorSafeRiskSummary(value: unknown): InvestorSafeRiskSummary | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const level = parseRiskLevel(record.level);
  if (!level || typeof record.score !== "number") return null;
  return {
    score: record.score,
    level,
    summary: typeof record.summary === "string" ? record.summary : "Operational risk is under manager review.",
    visibleFactors: Array.isArray(record.visibleFactors) ? record.visibleFactors.filter((item): item is string => typeof item === "string").slice(0, 6) : []
  };
}

export function parseRiskSnapshot(value: string | null): RiskSnapshot | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const record = parsed as Record<string, unknown>;
    const riskSummary = record.riskSummary;
    if (!riskSummary || typeof riskSummary !== "object" || Array.isArray(riskSummary)) return null;
    return riskSummary as RiskSnapshot;
  } catch {
    return null;
  }
}

export function diffRiskSnapshots(
  previousRisk: AllocationRisk | PortfolioRisk | RiskSnapshot | RiskComparableSnapshot | null | undefined,
  currentRisk: AllocationRisk | PortfolioRisk | RiskSnapshot | RiskComparableSnapshot
): RiskSnapshotDiff {
  const previous = previousRisk ? toRiskComparable(previousRisk) : null;
  const current = toRiskComparable(currentRisk);
  const previousFactors = new Map((previous?.riskFactors ?? []).map((factor) => [factorKey(factor), factor] as const));
  const currentFactors = new Map(current.riskFactors.map((factor) => [factorKey(factor), factor] as const));
  const previousBlocking = new Map((previous?.blockingIssues ?? []).map((factor) => [factorKey(factor), factor] as const));
  const currentBlocking = new Map(current.blockingIssues.map((factor) => [factorKey(factor), factor] as const));

  return {
    previousLevel: previous?.level ?? null,
    currentLevel: current.level,
    previousScore: previous?.score ?? null,
    currentScore: current.score,
    newRiskFactors: current.riskFactors.filter((factor) => !previousFactors.has(factorKey(factor))).slice(0, 10),
    resolvedRiskFactors: (previous?.riskFactors ?? []).filter((factor) => !currentFactors.has(factorKey(factor))).slice(0, 10),
    newBlockingIssues: current.blockingIssues.filter((factor) => !previousBlocking.has(factorKey(factor))).slice(0, 10),
    resolvedBlockingIssues: (previous?.blockingIssues ?? []).filter((factor) => !currentBlocking.has(factorKey(factor))).slice(0, 10)
  };
}

export function summarizeRiskChange(diff: RiskSnapshotDiff) {
  if (!diff.previousLevel) {
    return `Initial risk evaluation recorded at ${diff.currentLevel} (${diff.currentScore}/100).`;
  }

  const changes = [
    diff.previousLevel !== diff.currentLevel || diff.previousScore !== diff.currentScore
      ? `${diff.previousLevel} ${diff.previousScore}/100 -> ${diff.currentLevel} ${diff.currentScore}/100`
      : `Risk state unchanged at ${diff.currentLevel} (${diff.currentScore}/100)`,
    diff.newRiskFactors.length ? `${diff.newRiskFactors.length} new risk factor(s)` : null,
    diff.resolvedRiskFactors.length ? `${diff.resolvedRiskFactors.length} resolved risk factor(s)` : null,
    diff.newBlockingIssues.length ? `${diff.newBlockingIssues.length} new blocking issue(s)` : null,
    diff.resolvedBlockingIssues.length ? `${diff.resolvedBlockingIssues.length} resolved blocking issue(s)` : null
  ].filter(Boolean);

  return changes.join(" · ");
}

type RiskAuditClient = Pick<Prisma.TransactionClient, "auditLog">;

async function findPreviousRiskComparable(input: {
  client: RiskAuditClient;
  entityType: "Allocation" | "MonthlyReport";
  entityId: string;
  evaluateAction: "EVALUATE_ALLOCATION_RISK" | "EVALUATE_REPORT_RISK";
}) {
  const latest = await input.client.auditLog.findFirst({
    where: {
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.evaluateAction
    },
    orderBy: { createdAt: "desc" }
  });
  return parseRiskAuditPayload(latest?.afterJson ?? null)?.risk ?? null;
}

function buildRiskAuditPayload(input: {
  source: RiskTimelineSource;
  summary: string;
  risk: RiskComparableSnapshot;
  diff: RiskSnapshotDiff;
}) {
  return JSON.stringify({
    source: input.source,
    summary: sanitizeRiskString(input.summary, 280),
    risk: input.risk,
    diff: input.diff,
    recordedAt: new Date().toISOString()
  });
}

export async function recordRiskEvaluationEvent(input: {
  entityType: "Allocation" | "MonthlyReport";
  entityId: string;
  actor: string;
  source: RiskTimelineSource;
  currentRisk: AllocationRisk | PortfolioRisk | RiskSnapshot | RiskComparableSnapshot;
  previousRisk?: AllocationRisk | PortfolioRisk | RiskSnapshot | RiskComparableSnapshot | null;
  client?: RiskAuditClient;
}) {
  const client = input.client ?? prisma;
  const entityId = sanitizeRiskString(input.entityId, 160);
  const actor = sanitizeRiskString(input.actor, 120) || "admin";
  const evaluateAction = input.entityType === "Allocation" ? "EVALUATE_ALLOCATION_RISK" : "EVALUATE_REPORT_RISK";
  const currentRisk = toRiskComparable(input.currentRisk);
  const previousRisk = input.previousRisk === undefined
    ? await findPreviousRiskComparable({ client, entityType: input.entityType, entityId, evaluateAction })
    : input.previousRisk
      ? toRiskComparable(input.previousRisk)
      : null;
  const diff = diffRiskSnapshots(previousRisk, currentRisk);
  const summary = summarizeRiskChange(diff);
  const beforeJson = previousRisk ? buildRiskAuditPayload({ source: input.source, summary: "Previous risk state.", risk: previousRisk, diff }) : null;
  const afterJson = buildRiskAuditPayload({ source: input.source, summary, risk: currentRisk, diff });
  const createdEvents = [];

  createdEvents.push(await client.auditLog.create({
    data: {
      actor,
      action: evaluateAction,
      entityType: input.entityType,
      entityId,
      beforeJson,
      afterJson
    }
  }));

  if (previousRisk && (previousRisk.level !== currentRisk.level || previousRisk.score !== currentRisk.score)) {
    createdEvents.push(await client.auditLog.create({
      data: {
        actor,
        action: "RISK_LEVEL_CHANGED",
        entityType: input.entityType,
        entityId,
        beforeJson: JSON.stringify({ risk: { level: previousRisk.level, score: previousRisk.score } }),
        afterJson: JSON.stringify({ source: input.source, summary, risk: { level: currentRisk.level, score: currentRisk.score }, diff })
      }
    }));
  }

  for (const issue of diff.newBlockingIssues.slice(0, 5)) {
    createdEvents.push(await client.auditLog.create({
      data: {
        actor,
        action: "RISK_BLOCKING_ISSUE_CREATED",
        entityType: input.entityType,
        entityId,
        beforeJson: null,
        afterJson: JSON.stringify({ source: input.source, summary: `New blocking issue: ${issue.label}`, risk: currentRisk, issue })
      }
    }));
  }

  for (const issue of diff.resolvedBlockingIssues.slice(0, 5)) {
    createdEvents.push(await client.auditLog.create({
      data: {
        actor,
        action: "RISK_BLOCKING_ISSUE_RESOLVED",
        entityType: input.entityType,
        entityId,
        beforeJson: JSON.stringify({ issue }),
        afterJson: JSON.stringify({ source: input.source, summary: `Resolved blocking issue: ${issue.label}`, risk: currentRisk, issue })
      }
    }));
  }

  return { eventCount: createdEvents.length, events: createdEvents, diff, summary };
}

function serializeRiskTimelineEvent(record: {
  id: string;
  actor: string;
  action: string;
  entityType: string;
  entityId: string;
  afterJson: string | null;
  createdAt: Date;
}): RiskTimelineEvent {
  const payload = parseRiskAuditPayload(record.afterJson);
  const actor = sanitizeRiskString(record.actor, 120) || "admin";
  const source = payload?.source ?? "unknown";
  const summary = payload?.summary ?? "Risk audit event recorded.";
  const risk = payload?.risk ?? null;
  const diff = payload?.diff ?? null;
  return {
    id: record.id,
    actor,
    action: RISK_AUDIT_ACTIONS.includes(record.action as RiskAuditAction) ? record.action as RiskAuditAction : "EVALUATE_ALLOCATION_RISK",
    entityType: record.entityType === "MonthlyReport" ? "MonthlyReport" : "Allocation",
    entityId: record.entityId,
    createdAt: record.createdAt.toISOString(),
    source,
    summary,
    risk,
    diff,
    details: buildRiskTimelineEventDetails({ actor, source, summary, risk, diff })
  };
}

function buildRiskTimelineEventDetails(input: {
  actor: string;
  source: RiskTimelineEventSource;
  summary: string;
  risk: RiskComparableSnapshot | null;
  diff: RiskSnapshotDiff | null;
}): RiskTimelineEventDetails {
  return {
    previousLevel: input.diff?.previousLevel ?? null,
    currentLevel: input.diff?.currentLevel ?? input.risk?.level ?? null,
    previousScore: input.diff?.previousScore ?? null,
    currentScore: input.diff?.currentScore ?? input.risk?.score ?? null,
    newFactors: input.diff?.newRiskFactors ?? [],
    resolvedFactors: input.diff?.resolvedRiskFactors ?? [],
    newBlockingIssues: input.diff?.newBlockingIssues ?? [],
    resolvedBlockingIssues: input.diff?.resolvedBlockingIssues ?? [],
    source: input.source,
    actor: input.actor,
    summary: input.summary
  };
}

async function getRiskTimeline(input: {
  entityType: "Allocation" | "MonthlyReport";
  entityId: string;
  filters?: RiskTimelineFilters;
}): Promise<RiskTimelineResult> {
  const appliedFilters = normalizeRiskTimelineFilters(input.filters);
  const records = await prisma.auditLog.findMany({
    where: {
      entityType: input.entityType,
      entityId: input.entityId,
      action: { in: [...RISK_AUDIT_ACTIONS] }
    },
    orderBy: { createdAt: "desc" },
    take: 300
  });
  const events = records.map(serializeRiskTimelineEvent);
  const filteredEvents = appliedFilters.source === "all"
    ? events
    : events.filter((event) => event.source === appliedFilters.source);

  return {
    events: filteredEvents.slice(0, appliedFilters.limit),
    appliedFilters
  };
}

export function getAllocationRiskTimeline(allocationId: string, filters: RiskTimelineFilters = {}) {
  return getRiskTimeline({ entityType: "Allocation", entityId: allocationId, filters });
}

export function getReportRiskTimeline(monthlyReportId: string, filters: RiskTimelineFilters = {}) {
  return getRiskTimeline({ entityType: "MonthlyReport", entityId: monthlyReportId, filters });
}

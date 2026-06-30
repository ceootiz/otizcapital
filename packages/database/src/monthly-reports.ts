import { Prisma } from "@prisma/client";
import { prisma } from "./client";
import { createNotificationEventRecord } from "./notification-events";
import { calculateAllocationProofCompletenessFromInput, type ProofCompletenessBreakdown } from "./proof-completeness";
import { getActiveReadinessPolicy } from "./readiness-policies";
import { buildReconciliationSnapshot, getInvestorSafeReconciliationSummary, parseReconciliationSnapshot, type InvestorSafeReconciliationSummary, type ReconciliationSnapshot } from "./reconciliation";
import { buildRiskSnapshot, parseInvestorSafeRiskSummary, parseRiskSnapshot, recordRiskEvaluationEvent, type InvestorSafeRiskSummary, type RiskSnapshot } from "./risk-engine";
import { syncOperationalIncidentFromReconciliation, syncOperationalIncidentFromRisk, syncOperationalIncidentFromSnapshotIntegrity } from "./operational-incidents";

export const MONTHLY_REPORT_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export type MonthlyReportStatus = (typeof MONTHLY_REPORT_STATUSES)[number];

export type ProofSummary = Record<string, number>;
export type ProofSummaryBreakdown = {
  available: ProofSummary;
  verified: ProofSummary;
  excluded: ProofSummary;
};

export type MonthlyReportSnapshotAllocation = {
  id: string;
  supplyCode: string;
  productName: string;
  marketplace: string | null;
  allocationAmount: string;
  currency: string;
  status: string;
  expectedCycleDays: number | null;
  expectedPayoutAt: string | null;
  riskLevel: string;
  estimatedResult: string | null;
  actualProfit: string | null;
  payoutStatus: string;
  reinvestDecision: string;
  updatedAt: string;
  proofSummaryBreakdown: ProofSummaryBreakdown;
  proofCompleteness: ProofCompletenessBreakdown | null;
  reconciliation: InvestorSafeReconciliationSummary | null;
  risk: InvestorSafeRiskSummary | null;
};

export type MonthlyReportSnapshot = ProofSummaryBreakdown & {
  generatedAt: string | null;
  allocations: MonthlyReportSnapshotAllocation[];
  reconciliationSummary: ReconciliationSnapshot | null;
  riskSummary: RiskSnapshot | null;
};

export type MonthlyReportRecord = {
  id: string;
  investorId: string;
  month: string;
  title: string;
  summary: string;
  performanceNote: string | null;
  payoutNote: string | null;
  proofSummaryJson: string | null;
  readinessScore: number | null;
  readinessState: string | null;
  readinessSnapshotJson: string | null;
  readinessEvaluatedAt: Date | null;
  status: string;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type MonthlyReportWithInvestor = MonthlyReportRecord & {
  investor: {
    id: string;
    fullName: string;
    email: string;
    telegram: string | null;
    status: string;
  };
};

export type MonthlyReportAllocationRecord = {
  id: string;
  monthlyReportId: string;
  allocationId: string;
  includedAt: Date;
  includedBy: string;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
  allocation: {
    id: string;
    investorId: string;
    supplyCode: string;
    productName: string;
    marketplace: string | null;
    allocationAmount: string;
    currency: string;
    status: string;
    expectedCycleDays: number | null;
    expectedPayoutAt: Date | null;
    riskLevel: string;
    estimatedResult: string | null;
    actualProfit: string | null;
    payoutStatus: string;
    reinvestDecision: string;
    updatedAt: Date;
    proofs: Array<{ id: string; status: string; type: string }>;
  };
};

export type CreateMonthlyReportInput = {
  investorId: string;
  month: string;
  title: string;
  summary: string;
  performanceNote?: string | null;
  payoutNote?: string | null;
  status: MonthlyReportStatus;
  actor: string;
};

export type UpdateMonthlyReportInput = {
  id: string;
  month?: string;
  title?: string;
  summary?: string;
  performanceNote?: string | null;
  payoutNote?: string | null;
  status?: MonthlyReportStatus;
  readinessScore?: number | null;
  readinessState?: string | null;
  readinessSnapshotJson?: string | null;
  readinessEvaluatedAt?: Date | null;
  actor: string;
};

export type RegenerateMonthlyReportProofSnapshotInput = {
  id: string;
  actor: string;
};

export type AddAllocationToMonthlyReportInput = {
  monthlyReportId: string;
  allocationId: string;
  note?: string | null;
  actor: string;
};

export type UpdateReportAllocationNoteInput = AddAllocationToMonthlyReportInput;

export type RemoveAllocationFromMonthlyReportInput = {
  monthlyReportId: string;
  allocationId: string;
  actor: string;
};

export function isMonthlyReportStatus(value: string): value is MonthlyReportStatus {
  return MONTHLY_REPORT_STATUSES.includes(value as MonthlyReportStatus);
}

export function canEditMonthlyReportFields(status: string) {
  return status === "DRAFT";
}

export function getMonthlyReportStatusAuditAction(previousStatus: string, nextStatus: string) {
  if (previousStatus !== "PUBLISHED" && nextStatus === "PUBLISHED") return "PUBLISH_MONTHLY_REPORT";
  if (previousStatus === "PUBLISHED" && nextStatus === "DRAFT") return "UNPUBLISH_MONTHLY_REPORT";
  return "UPDATE_MONTHLY_REPORT";
}

export function parseProofSummary(value: string | null): ProofSummary {
  const breakdown = parseProofSummaryBreakdown(value);
  return mergeProofSummaries(breakdown.available, breakdown.verified);
}

function emptyProofSummaryBreakdown(): ProofSummaryBreakdown {
  return { available: {}, verified: {}, excluded: {} };
}

function emptyMonthlyReportSnapshot(): MonthlyReportSnapshot {
  return { ...emptyProofSummaryBreakdown(), generatedAt: null, allocations: [], reconciliationSummary: null, riskSummary: null };
}

function normalizeProofSummary(value: unknown): ProofSummary {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([, count]) => typeof count === "number" && Number.isFinite(count) && count > 0)
      .map(([type, count]) => [type, count as number])
  );
}

function mergeProofSummaries(...summaries: ProofSummary[]) {
  return summaries.reduce<ProofSummary>((merged, summary) => {
    for (const [type, count] of Object.entries(summary)) {
      merged[type] = (merged[type] || 0) + count;
    }
    return merged;
  }, {});
}

export function parseProofSummaryBreakdown(value: string | null): ProofSummaryBreakdown {
  if (!value) return emptyProofSummaryBreakdown();
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return emptyProofSummaryBreakdown();
    const record = parsed as Record<string, unknown>;

    if ("available" in record || "verified" in record || "excluded" in record) {
      return {
        available: normalizeProofSummary(record.available),
        verified: normalizeProofSummary(record.verified),
        excluded: normalizeProofSummary(record.excluded)
      };
    }

    return {
      available: normalizeProofSummary(record),
      verified: {},
      excluded: {}
    };
  } catch {
    return emptyProofSummaryBreakdown();
  }
}

export function parseMonthlyReportSnapshot(value: string | null): MonthlyReportSnapshot {
  if (!value) return emptyMonthlyReportSnapshot();

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return emptyMonthlyReportSnapshot();
    const record = parsed as Record<string, unknown>;
    const breakdown = parseProofSummaryBreakdown(value);
    const allocations = Array.isArray(record.allocations)
      ? record.allocations
          .filter((allocation): allocation is Record<string, unknown> => Boolean(allocation) && typeof allocation === "object" && !Array.isArray(allocation))
          .map((allocation) => ({
            id: typeof allocation.id === "string" ? allocation.id : "",
            supplyCode: typeof allocation.supplyCode === "string" ? allocation.supplyCode : "",
            productName: typeof allocation.productName === "string" ? allocation.productName : "",
            marketplace: typeof allocation.marketplace === "string" ? allocation.marketplace : null,
            allocationAmount: typeof allocation.allocationAmount === "string" ? allocation.allocationAmount : "0",
            currency: typeof allocation.currency === "string" ? allocation.currency : "USD",
            status: typeof allocation.status === "string" ? allocation.status : "",
            expectedCycleDays: typeof allocation.expectedCycleDays === "number" ? allocation.expectedCycleDays : null,
            expectedPayoutAt: typeof allocation.expectedPayoutAt === "string" ? allocation.expectedPayoutAt : null,
            riskLevel: typeof allocation.riskLevel === "string" ? allocation.riskLevel : "STANDARD",
            estimatedResult: typeof allocation.estimatedResult === "string" ? allocation.estimatedResult : null,
            actualProfit: typeof allocation.actualProfit === "string" ? allocation.actualProfit : null,
            payoutStatus: typeof allocation.payoutStatus === "string" ? allocation.payoutStatus : "NOT_READY",
            reinvestDecision: typeof allocation.reinvestDecision === "string" ? allocation.reinvestDecision : "UNDECIDED",
            updatedAt: typeof allocation.updatedAt === "string" ? allocation.updatedAt : "",
            proofSummaryBreakdown: {
              available: normalizeProofSummary((allocation.proofSummaryBreakdown as Record<string, unknown> | undefined)?.available),
              verified: normalizeProofSummary((allocation.proofSummaryBreakdown as Record<string, unknown> | undefined)?.verified),
              excluded: normalizeProofSummary((allocation.proofSummaryBreakdown as Record<string, unknown> | undefined)?.excluded)
            },
            proofCompleteness: parseSnapshotProofCompleteness(allocation.proofCompleteness),
            reconciliation: parseSnapshotInvestorSafeReconciliation(allocation.reconciliation),
            risk: parseInvestorSafeRiskSummary(allocation.risk)
          }))
          .filter((allocation) => allocation.id && allocation.productName)
      : [];

    return { ...breakdown, generatedAt: typeof record.generatedAt === "string" ? record.generatedAt : null, allocations, reconciliationSummary: parseReconciliationSnapshot(value), riskSummary: parseRiskSnapshot(value) };
  } catch {
    return emptyMonthlyReportSnapshot();
  }
}

function parseSnapshotInvestorSafeReconciliation(value: unknown): InvestorSafeReconciliationSummary | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (typeof record.status !== "string" || typeof record.score !== "number") return null;
  return {
    status: record.status as InvestorSafeReconciliationSummary["status"],
    score: record.score,
    capitalDeployed: typeof record.capitalDeployed === "string" ? record.capitalDeployed : "0",
    capitalReturned: typeof record.capitalReturned === "string" ? record.capitalReturned : "0",
    payoutStatus: typeof record.payoutStatus === "string" ? record.payoutStatus : "Not ready",
    inventoryProgressSummary: typeof record.inventoryProgressSummary === "string" ? record.inventoryProgressSummary : "Inventory progress is under review.",
    exceptionNotice: typeof record.exceptionNotice === "string" ? record.exceptionNotice : null
  };
}

function parseSnapshotProofCompleteness(value: unknown): ProofCompletenessBreakdown | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (typeof record.score !== "number" || typeof record.state !== "string") return null;
  return {
    allocationId: typeof record.allocationId === "string" ? record.allocationId : "",
    score: record.score,
    state: record.state as ProofCompletenessBreakdown["state"],
    presentCategories: Array.isArray(record.presentCategories) ? record.presentCategories.filter((item): item is string => typeof item === "string") : [],
    missingRequiredCategories: Array.isArray(record.missingRequiredCategories) ? record.missingRequiredCategories.filter((item): item is string => typeof item === "string") : [],
    missingRecommendedCategories: Array.isArray(record.missingRecommendedCategories) ? record.missingRecommendedCategories.filter((item): item is string => typeof item === "string") : [],
    hiddenProofCount: typeof record.hiddenProofCount === "number" ? record.hiddenProofCount : 0,
    rejectedProofCount: typeof record.rejectedProofCount === "number" ? record.rejectedProofCount : 0,
    unreviewedProofCount: typeof record.unreviewedProofCount === "number" ? record.unreviewedProofCount : 0,
    supersededProofCount: typeof record.supersededProofCount === "number" ? record.supersededProofCount : 0,
    investorSafeSummary: typeof record.investorSafeSummary === "string" ? record.investorSafeSummary : "",
    adminWarnings: Array.isArray(record.adminWarnings) ? record.adminWarnings.filter((item): item is string => typeof item === "string") : [],
    policyThreshold: typeof record.policyThreshold === "number" ? record.policyThreshold : 0,
    components: Array.isArray(record.components)
      ? record.components
          .filter((component): component is Record<string, unknown> => Boolean(component) && typeof component === "object" && !Array.isArray(component))
          .map((component) => ({
            id: typeof component.id === "string" ? component.id : "",
            label: typeof component.label === "string" ? component.label : "",
            categories: Array.isArray(component.categories) ? component.categories.filter((item): item is string => typeof item === "string") : [],
            present: Boolean(component.present)
          }))
          .filter((component) => component.id && component.label)
      : []
  };
}

export function serializeMonthlyReport(record: MonthlyReportRecord) {
  const snapshot = parseMonthlyReportSnapshot(record.proofSummaryJson);
  const proofSummaryBreakdown = {
    available: snapshot.available,
    verified: snapshot.verified,
    excluded: snapshot.excluded
  };

  return {
    id: record.id,
    investorId: record.investorId,
    month: record.month,
    title: record.title,
    summary: record.summary,
    performanceNote: record.performanceNote,
    payoutNote: record.payoutNote,
    proofSummary: mergeProofSummaries(proofSummaryBreakdown.available, proofSummaryBreakdown.verified),
    proofSummaryBreakdown,
    allocationSnapshot: snapshot.allocations.map((allocation) => ({
      ...allocation,
      proofCompleteness: allocation.proofCompleteness
        ? {
            score: allocation.proofCompleteness.score,
            state: allocation.proofCompleteness.state,
            investorSafeSummary: allocation.proofCompleteness.investorSafeSummary,
            presentCategories: allocation.proofCompleteness.presentCategories.filter((category) => category !== "MONTHLY_REPORT_LINKAGE")
          }
        : null,
      reconciliation: allocation.reconciliation,
      risk: allocation.risk
    })),
    reconciliationSummary: snapshot.reconciliationSummary
      ? {
          generatedAt: snapshot.reconciliationSummary.generatedAt,
          portfolioTotals: snapshot.reconciliationSummary.portfolioTotals,
          exceptionsSummary: snapshot.reconciliationSummary.exceptionsSummary,
          allocations: snapshot.reconciliationSummary.allocations.map((allocation) => ({
            allocationId: allocation.allocationId,
            status: allocation.status,
            score: allocation.score,
            investorSafeSummary: allocation.investorSafeSummary,
            exceptionSummary: allocation.exceptionSummary
          }))
        }
      : null,
    riskSummary: snapshot.riskSummary
      ? {
          generatedAt: snapshot.riskSummary.generatedAt,
          portfolioRisk: {
            score: snapshot.riskSummary.portfolioRisk.score,
            level: snapshot.riskSummary.portfolioRisk.level,
            investorSafeSummary: snapshot.riskSummary.portfolioRisk.investorSafeSummary
          },
          allocations: snapshot.riskSummary.allocations.map((allocation) => ({
            allocationId: allocation.allocationId,
            supplyCode: allocation.supplyCode,
            productName: allocation.productName,
            investorSafeSummary: allocation.investorSafeSummary
          })),
          materialRiskEvents: snapshot.riskSummary.materialRiskEvents
        }
      : null,
    status: record.status,
    publishedAt: record.publishedAt?.toISOString() ?? null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

function summarizeProofs(proofs: Array<{ type: string; status: string }>) {
  return proofs.reduce<ProofSummaryBreakdown>((summary, proof) => {
    if (proof.status === "AVAILABLE") {
      summary.available[proof.type] = (summary.available[proof.type] || 0) + 1;
    } else if (proof.status === "VERIFIED") {
      summary.verified[proof.type] = (summary.verified[proof.type] || 0) + 1;
    } else {
      summary.excluded[proof.type] = (summary.excluded[proof.type] || 0) + 1;
    }
    return summary;
  }, { available: {}, verified: {}, excluded: {} });
}

export async function buildMonthlyReportSnapshotFromLinkedAllocations(monthlyReportId: string, client: Pick<Prisma.TransactionClient, "monthlyReport" | "monthlyReportAllocation" | "readinessPolicy"> = prisma) {
  const report = await client.monthlyReport.findUnique({ where: { id: monthlyReportId } });
  if (!report) return { ok: false as const, status: 404 as const, error: "Monthly report not found." };
  const policy = await getActiveReadinessPolicy(client);

  const linkedAllocations = await client.monthlyReportAllocation.findMany({
    where: {
      monthlyReportId,
      allocation: { investorId: report.investorId }
    },
    include: {
      allocation: {
        include: {
          proofs: { orderBy: { createdAt: "asc" } }
        }
      }
    },
    orderBy: [{ includedAt: "asc" }]
  });

  const snapshot = linkedAllocations.reduce<MonthlyReportSnapshot>((current, linkedAllocation) => {
    const proofSummaryBreakdown = summarizeProofs(linkedAllocation.allocation.proofs);
    const proofCompleteness = calculateAllocationProofCompletenessFromInput({
      allocationId: linkedAllocation.allocation.id,
      investorId: linkedAllocation.allocation.investorId,
      proofs: linkedAllocation.allocation.proofs,
      monthlyReportLinkCount: 1,
      policy
    });
    current.available = mergeProofSummaries(current.available, proofSummaryBreakdown.available);
    current.verified = mergeProofSummaries(current.verified, proofSummaryBreakdown.verified);
    current.excluded = mergeProofSummaries(current.excluded, proofSummaryBreakdown.excluded);
    current.allocations.push({
      id: linkedAllocation.allocation.id,
      supplyCode: linkedAllocation.allocation.supplyCode,
      productName: linkedAllocation.allocation.productName,
      marketplace: linkedAllocation.allocation.marketplace,
      allocationAmount: linkedAllocation.allocation.allocationAmount,
      currency: linkedAllocation.allocation.currency,
      status: linkedAllocation.allocation.status,
      expectedCycleDays: linkedAllocation.allocation.expectedCycleDays,
      expectedPayoutAt: linkedAllocation.allocation.expectedPayoutAt?.toISOString() ?? null,
      riskLevel: linkedAllocation.allocation.riskLevel,
      estimatedResult: linkedAllocation.allocation.estimatedResult,
      actualProfit: linkedAllocation.allocation.actualProfit,
      payoutStatus: linkedAllocation.allocation.payoutStatus,
      reinvestDecision: linkedAllocation.allocation.reinvestDecision,
      updatedAt: linkedAllocation.allocation.updatedAt.toISOString(),
      proofSummaryBreakdown,
      proofCompleteness,
      reconciliation: null,
      risk: null
    });
    return current;
  }, { ...emptyMonthlyReportSnapshot(), generatedAt: new Date().toISOString() });

  const reconciliationSummary = await buildReconciliationSnapshot(monthlyReportId, client);
  const reconciliationByAllocationId = new Map(reconciliationSummary.allocations.map((allocation) => [allocation.allocationId, allocation]));
  snapshot.reconciliationSummary = reconciliationSummary;
  snapshot.riskSummary = await buildRiskSnapshot(monthlyReportId, client);
  const riskByAllocationId = new Map(snapshot.riskSummary?.allocations.map((allocation) => [allocation.allocationId, allocation.investorSafeSummary] as const) ?? []);
  snapshot.allocations = snapshot.allocations.map((allocation) => {
    const reconciliation = reconciliationByAllocationId.get(allocation.id);
    return {
      ...allocation,
      reconciliation: reconciliation ? getInvestorSafeReconciliationSummary({ allocationId: reconciliation.allocationId, status: reconciliation.status, score: reconciliation.score, blockingIssues: [], warnings: [], metrics: { entryCount: 0, latestEntryAt: null }, ledgerSummary: reconciliation.ledgerSummary, latestLedgerEntries: [] }) : null,
      risk: riskByAllocationId.get(allocation.id) ?? null
    };
  });

  return { ok: true as const, snapshot };
}

export async function listMonthlyReportsForInvestor(investorId: string) {
  return prisma.monthlyReport.findMany({
    where: { investorId },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }]
  });
}

export async function listPublishedMonthlyReportsForInvestor(investorId: string) {
  return prisma.monthlyReport.findMany({
    where: { investorId, status: "PUBLISHED" },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }]
  });
}

export async function getMonthlyReportDetailRecord(id: string) {
  return prisma.monthlyReport.findUnique({
    where: { id },
    include: {
      investor: { select: { id: true, fullName: true, email: true, telegram: true, status: true } }
    }
  });
}

export async function getInvestorMonthlyReportDetailRecord(input: { id: string; investorId: string }) {
  return prisma.monthlyReport.findFirst({
    where: { id: input.id, investorId: input.investorId, status: "PUBLISHED" },
    include: {
      investor: { select: { id: true, fullName: true, email: true, telegram: true, status: true } }
    }
  });
}

export function serializeMonthlyReportDetail(record: MonthlyReportWithInvestor) {
  return {
    ...serializeMonthlyReport(record),
    investor: record.investor
  };
}

export function serializeMonthlyReportAllocation(record: MonthlyReportAllocationRecord) {
  return {
    id: record.id,
    monthlyReportId: record.monthlyReportId,
    allocationId: record.allocationId,
    includedAt: record.includedAt.toISOString(),
    includedBy: record.includedBy,
    note: record.note,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    allocation: {
      id: record.allocation.id,
      investorId: record.allocation.investorId,
      supplyCode: record.allocation.supplyCode,
      productName: record.allocation.productName,
      marketplace: record.allocation.marketplace,
      allocationAmount: record.allocation.allocationAmount,
      currency: record.allocation.currency,
      status: record.allocation.status,
      expectedCycleDays: record.allocation.expectedCycleDays,
      expectedPayoutAt: record.allocation.expectedPayoutAt?.toISOString() ?? null,
      riskLevel: record.allocation.riskLevel,
      estimatedResult: record.allocation.estimatedResult,
      actualProfit: record.allocation.actualProfit,
      payoutStatus: record.allocation.payoutStatus,
      reinvestDecision: record.allocation.reinvestDecision,
      updatedAt: record.allocation.updatedAt.toISOString(),
      proofCount: record.allocation.proofs.length,
      investorVisibleProofCount: record.allocation.proofs.filter((proof) => proof.status === "AVAILABLE" || proof.status === "VERIFIED").length
    }
  };
}

export async function createMonthlyReportRecord(input: CreateMonthlyReportInput) {
  return prisma.$transaction(async (transaction) => {
    const investor = await transaction.investor.findUnique({ where: { id: input.investorId } });
    if (!investor) return { ok: false as const, status: 404 as const, error: "Investor not found." };
    if (input.status === "PUBLISHED") return { ok: false as const, status: 409 as const, error: "Create reports as draft, then publish through the readiness gate." };

    const proofSummary = emptyMonthlyReportSnapshot();
    const report = await transaction.monthlyReport.create({
      data: {
        investorId: input.investorId,
        month: input.month,
        title: input.title,
        summary: input.summary,
        performanceNote: input.performanceNote || null,
        payoutNote: input.payoutNote || null,
        proofSummaryJson: JSON.stringify(proofSummary),
        readinessScore: null,
        readinessState: null,
        readinessSnapshotJson: null,
        readinessEvaluatedAt: null,
        status: input.status,
        publishedAt: null
      }
    });

    await transaction.auditLog.create({
      data: {
        actor: input.actor,
        action: "CREATE_MONTHLY_REPORT",
        entityType: "MonthlyReport",
        entityId: report.id,
        beforeJson: null,
        afterJson: JSON.stringify({ investorId: report.investorId, month: report.month, title: report.title, status: report.status, proofSummary })
      }
    });

    await createNotificationEventRecord({ type: "MONTHLY_REPORT_CREATED", channel: "INTERNAL", recipient: "admin", entityType: "MonthlyReport", entityId: report.id, payload: { investorId: investor.id, investorEmail: investor.email, month: report.month, title: report.title, status: report.status }, status: "PENDING" }, transaction);
    if (report.status === "PUBLISHED") {
      await createNotificationEventRecord({ type: "MONTHLY_REPORT_PUBLISHED", channel: "INTERNAL", recipient: "admin", entityType: "MonthlyReport", entityId: report.id, payload: { investorId: investor.id, investorEmail: investor.email, month: report.month, title: report.title }, status: "PENDING" }, transaction);
    }

    return { ok: true as const, report };
  });
}

export async function updateMonthlyReportRecord(input: UpdateMonthlyReportInput) {
  return prisma.$transaction(async (transaction) => {
    const existing = await transaction.monthlyReport.findUnique({ where: { id: input.id }, include: { investor: true } });
    if (!existing) return { ok: false as const, status: 404 as const, error: "Monthly report not found." };

    const hasFieldUpdates = input.month !== undefined || input.title !== undefined || input.summary !== undefined || input.performanceNote !== undefined || input.payoutNote !== undefined;
    if (hasFieldUpdates && !canEditMonthlyReportFields(existing.status)) {
      return { ok: false as const, status: 409 as const, error: "Return the report to draft before editing report fields." };
    }

    const proofSummary = parseProofSummaryBreakdown(existing.proofSummaryJson);
    const nextStatus = input.status ?? existing.status;
    const publishingNow = nextStatus === "PUBLISHED" && existing.status !== "PUBLISHED";
    const nextPublishedAt = nextStatus === "PUBLISHED" ? existing.publishedAt ?? new Date() : null;
    const report = await transaction.monthlyReport.update({
      where: { id: existing.id },
      data: {
        month: input.month ?? existing.month,
        title: input.title ?? existing.title,
        summary: input.summary ?? existing.summary,
        performanceNote: input.performanceNote === undefined ? existing.performanceNote : input.performanceNote,
        payoutNote: input.payoutNote === undefined ? existing.payoutNote : input.payoutNote,
        readinessScore: input.readinessScore === undefined ? existing.readinessScore : input.readinessScore,
        readinessState: input.readinessState === undefined ? existing.readinessState : input.readinessState,
        readinessSnapshotJson: input.readinessSnapshotJson === undefined ? existing.readinessSnapshotJson : input.readinessSnapshotJson,
        readinessEvaluatedAt: input.readinessEvaluatedAt === undefined ? existing.readinessEvaluatedAt : input.readinessEvaluatedAt,
        status: nextStatus,
        publishedAt: nextPublishedAt
      }
    });

    await transaction.auditLog.create({
      data: {
        actor: input.actor,
        action: getMonthlyReportStatusAuditAction(existing.status, report.status),
        entityType: "MonthlyReport",
        entityId: report.id,
        beforeJson: JSON.stringify({ month: existing.month, title: existing.title, summary: existing.summary, performanceNote: existing.performanceNote, payoutNote: existing.payoutNote, status: existing.status, publishedAt: existing.publishedAt, proofSummary }),
        afterJson: JSON.stringify({ month: report.month, title: report.title, summary: report.summary, performanceNote: report.performanceNote, payoutNote: report.payoutNote, status: report.status, proofSummary })
      }
    });

    if (publishingNow) {
      await createNotificationEventRecord({ type: "MONTHLY_REPORT_PUBLISHED", channel: "INTERNAL", recipient: "admin", entityType: "MonthlyReport", entityId: report.id, payload: { investorId: existing.investor.id, investorEmail: existing.investor.email, month: report.month, title: report.title }, status: "PENDING" }, transaction);
    }

    return { ok: true as const, report };
  });
}

export async function regenerateMonthlyReportProofSnapshotRecord(input: RegenerateMonthlyReportProofSnapshotInput) {
  return prisma.$transaction(async (transaction) => {
    const existing = await transaction.monthlyReport.findUnique({ where: { id: input.id } });
    if (!existing) return { ok: false as const, status: 404 as const, error: "Monthly report not found." };
    if (!canEditMonthlyReportFields(existing.status)) {
      return { ok: false as const, status: 409 as const, error: "Return the report to draft before regenerating the proof snapshot." };
    }

    const beforeProofSummary = parseProofSummaryBreakdown(existing.proofSummaryJson);
    const snapshotResult = await buildMonthlyReportSnapshotFromLinkedAllocations(existing.id, transaction);
    if (!snapshotResult.ok) return snapshotResult;
    const proofSummary = snapshotResult.snapshot;
    const report = await transaction.monthlyReport.update({
      where: { id: existing.id },
      data: { proofSummaryJson: JSON.stringify(proofSummary) }
    });

    await transaction.auditLog.create({
      data: {
        actor: input.actor,
        action: "REGENERATE_MONTHLY_REPORT_PROOF_SNAPSHOT",
        entityType: "MonthlyReport",
        entityId: report.id,
        beforeJson: JSON.stringify({ proofSummary: beforeProofSummary }),
        afterJson: JSON.stringify({ proofSummary })
      }
    });

    if (proofSummary.riskSummary) {
      const reportRiskAudit = await recordRiskEvaluationEvent({
        entityType: "MonthlyReport",
        entityId: report.id,
        actor: input.actor,
        source: "report_snapshot",
        currentRisk: proofSummary.riskSummary,
        client: transaction
      });
      await syncOperationalIncidentFromRisk(proofSummary.riskSummary.portfolioRisk, {
        actor: input.actor,
        investorId: existing.investorId,
        monthlyReportId: report.id,
        metadata: {
          source: "report_snapshot",
          riskEventSummary: reportRiskAudit.summary,
          newBlockingIssues: reportRiskAudit.diff.newBlockingIssues.length
        }
      }, transaction);

      for (const allocationRisk of proofSummary.riskSummary.allocations) {
        const allocationRiskAudit = await recordRiskEvaluationEvent({
          entityType: "Allocation",
          entityId: allocationRisk.allocationId,
          actor: input.actor,
          source: "report_snapshot",
          currentRisk: allocationRisk.risk,
          client: transaction
        });
        await syncOperationalIncidentFromRisk(allocationRisk.risk, {
          actor: input.actor,
          investorId: existing.investorId,
          monthlyReportId: report.id,
          metadata: {
            source: "report_snapshot",
            riskEventSummary: allocationRiskAudit.summary,
            newBlockingIssues: allocationRiskAudit.diff.newBlockingIssues.length
          }
        }, transaction);
      }
    }

    if (proofSummary.reconciliationSummary) {
      const reconciliationStatus = proofSummary.reconciliationSummary.exceptionsSummary.blockingIssueCount > 0
        ? "BROKEN"
        : proofSummary.reconciliationSummary.exceptionsSummary.warningCount > 0
          ? "WARNING"
          : "BALANCED";
      await syncOperationalIncidentFromReconciliation({
        monthlyReportId: report.id,
        status: reconciliationStatus,
        score: proofSummary.reconciliationSummary.allocations.length
          ? Math.round(proofSummary.reconciliationSummary.allocations.reduce((sum, allocation) => sum + allocation.score, 0) / proofSummary.reconciliationSummary.allocations.length)
          : 100,
        snapshotExists: true,
        linkedAllocationCount: proofSummary.reconciliationSummary.allocations.length,
        blockingIssues: Array.from({ length: proofSummary.reconciliationSummary.exceptionsSummary.blockingIssueCount }, (_, index) => ({ id: `report-blocking-${index + 1}`, severity: "BLOCKING" as const, message: "Linked allocation reconciliation has a blocking issue." })),
        warnings: Array.from({ length: proofSummary.reconciliationSummary.exceptionsSummary.warningCount }, (_, index) => ({ id: `report-warning-${index + 1}`, severity: "WARNING" as const, message: "Linked allocation reconciliation has a warning." })),
        allocationSummaries: proofSummary.reconciliationSummary.allocations.map((allocation) => ({ allocationId: allocation.allocationId, supplyCode: allocation.allocationId, productName: allocation.allocationId, status: allocation.status, score: allocation.score })),
        ledgerSummary: proofSummary.reconciliationSummary.portfolioTotals
      }, {
        actor: input.actor,
        monthlyReportId: report.id,
        investorId: existing.investorId,
        metadata: { source: "report_snapshot", snapshotGeneratedAt: proofSummary.reconciliationSummary.generatedAt }
      }, transaction);
    }

    await syncOperationalIncidentFromSnapshotIntegrity({
      reportId: report.id,
      investorId: existing.investorId,
      status: report.status,
      missingProofSnapshot: proofSummary.allocations.length === 0,
      missingReconciliationSnapshot: !proofSummary.reconciliationSummary,
      missingRiskSnapshot: !proofSummary.riskSummary,
      staleSnapshot: false,
      actor: input.actor
    }, transaction);

    return { ok: true as const, report };
  });
}

export async function getReportAllocations(monthlyReportId: string) {
  return prisma.monthlyReportAllocation.findMany({
    where: { monthlyReportId },
    include: {
      allocation: {
        select: {
          id: true,
          investorId: true,
          supplyCode: true,
          productName: true,
          marketplace: true,
          allocationAmount: true,
          currency: true,
          status: true,
          expectedCycleDays: true,
          expectedPayoutAt: true,
          riskLevel: true,
          estimatedResult: true,
          actualProfit: true,
          payoutStatus: true,
          reinvestDecision: true,
          updatedAt: true,
          proofs: { select: { id: true, status: true, type: true } }
        }
      }
    },
    orderBy: [{ includedAt: "asc" }]
  });
}

export async function getEligibleAllocationsForReport(monthlyReportId: string) {
  const report = await prisma.monthlyReport.findUnique({
    where: { id: monthlyReportId },
    select: { investorId: true, allocations: { select: { allocationId: true } } }
  });
  if (!report) return { ok: false as const, status: 404 as const, error: "Monthly report not found." };

  const linkedIds = report.allocations.map((item) => item.allocationId);
  const allocations = await prisma.allocation.findMany({
    where: {
      investorId: report.investorId,
      id: linkedIds.length ? { notIn: linkedIds } : undefined
    },
    include: {
      proofs: { select: { id: true, status: true, type: true } }
    },
    orderBy: [{ updatedAt: "desc" }]
  });

  return { ok: true as const, allocations };
}

async function requireDraftReport(monthlyReportId: string, client: Pick<Prisma.TransactionClient, "monthlyReport"> = prisma) {
  const report = await client.monthlyReport.findUnique({ where: { id: monthlyReportId } });
  if (!report) return { ok: false as const, status: 404 as const, error: "Monthly report not found." };
  if (!canEditMonthlyReportFields(report.status)) return { ok: false as const, status: 409 as const, error: "Published reports cannot change linked allocations. Return the report to draft first." };
  return { ok: true as const, report };
}

export async function addAllocationToMonthlyReport(input: AddAllocationToMonthlyReportInput) {
  return prisma.$transaction(async (transaction) => {
    const reportResult = await requireDraftReport(input.monthlyReportId, transaction);
    if (!reportResult.ok) return reportResult;

    const allocation = await transaction.allocation.findUnique({ where: { id: input.allocationId } });
    if (!allocation) return { ok: false as const, status: 404 as const, error: "Allocation not found." };
    if (allocation.investorId !== reportResult.report.investorId) return { ok: false as const, status: 409 as const, error: "Allocation belongs to another investor." };

    const existing = await transaction.monthlyReportAllocation.findUnique({
      where: { monthlyReportId_allocationId: { monthlyReportId: input.monthlyReportId, allocationId: input.allocationId } }
    });
    if (existing) return { ok: false as const, status: 409 as const, error: "Allocation is already linked to this report." };

    const link = await transaction.monthlyReportAllocation.create({
      data: {
        monthlyReportId: input.monthlyReportId,
        allocationId: input.allocationId,
        includedBy: input.actor,
        note: input.note || null
      },
      include: {
        allocation: {
          select: {
            id: true,
            investorId: true,
            supplyCode: true,
            productName: true,
            marketplace: true,
            allocationAmount: true,
            currency: true,
            status: true,
            expectedCycleDays: true,
            expectedPayoutAt: true,
            riskLevel: true,
            estimatedResult: true,
            actualProfit: true,
            payoutStatus: true,
            reinvestDecision: true,
            updatedAt: true,
            proofs: { select: { id: true, status: true, type: true } }
          }
        }
      }
    });

    await transaction.auditLog.create({
      data: {
        actor: input.actor,
        action: "ADD_ALLOCATION_TO_MONTHLY_REPORT",
        entityType: "MonthlyReport",
        entityId: input.monthlyReportId,
        beforeJson: null,
        afterJson: JSON.stringify({ allocationId: input.allocationId, note: input.note || null })
      }
    });

    return { ok: true as const, link };
  });
}

export async function removeAllocationFromMonthlyReport(input: RemoveAllocationFromMonthlyReportInput) {
  return prisma.$transaction(async (transaction) => {
    const reportResult = await requireDraftReport(input.monthlyReportId, transaction);
    if (!reportResult.ok) return reportResult;

    const existing = await transaction.monthlyReportAllocation.findUnique({
      where: { monthlyReportId_allocationId: { monthlyReportId: input.monthlyReportId, allocationId: input.allocationId } }
    });
    if (!existing) return { ok: false as const, status: 404 as const, error: "Linked allocation not found." };

    await transaction.monthlyReportAllocation.delete({ where: { id: existing.id } });
    await transaction.auditLog.create({
      data: {
        actor: input.actor,
        action: "REMOVE_ALLOCATION_FROM_MONTHLY_REPORT",
        entityType: "MonthlyReport",
        entityId: input.monthlyReportId,
        beforeJson: JSON.stringify({ allocationId: input.allocationId, note: existing.note }),
        afterJson: null
      }
    });

    return { ok: true as const };
  });
}

export async function updateReportAllocationNote(input: UpdateReportAllocationNoteInput) {
  return prisma.$transaction(async (transaction) => {
    const reportResult = await requireDraftReport(input.monthlyReportId, transaction);
    if (!reportResult.ok) return reportResult;

    const existing = await transaction.monthlyReportAllocation.findUnique({
      where: { monthlyReportId_allocationId: { monthlyReportId: input.monthlyReportId, allocationId: input.allocationId } },
      include: {
        allocation: {
          select: {
            id: true,
            investorId: true,
            supplyCode: true,
            productName: true,
            marketplace: true,
            allocationAmount: true,
            currency: true,
            status: true,
            expectedCycleDays: true,
            expectedPayoutAt: true,
            riskLevel: true,
            estimatedResult: true,
            actualProfit: true,
            payoutStatus: true,
            reinvestDecision: true,
            updatedAt: true,
            proofs: { select: { id: true, status: true, type: true } }
          }
        }
      }
    });
    if (!existing) return { ok: false as const, status: 404 as const, error: "Linked allocation not found." };

    const link = await transaction.monthlyReportAllocation.update({
      where: { id: existing.id },
      data: { note: input.note || null },
      include: {
        allocation: {
          select: {
            id: true,
            investorId: true,
            supplyCode: true,
            productName: true,
            marketplace: true,
            allocationAmount: true,
            currency: true,
            status: true,
            expectedCycleDays: true,
            expectedPayoutAt: true,
            riskLevel: true,
            estimatedResult: true,
            actualProfit: true,
            payoutStatus: true,
            reinvestDecision: true,
            updatedAt: true,
            proofs: { select: { id: true, status: true, type: true } }
          }
        }
      }
    });

    await transaction.auditLog.create({
      data: {
        actor: input.actor,
        action: "UPDATE_MONTHLY_REPORT_ALLOCATION_NOTE",
        entityType: "MonthlyReport",
        entityId: input.monthlyReportId,
        beforeJson: JSON.stringify({ allocationId: input.allocationId, note: existing.note }),
        afterJson: JSON.stringify({ allocationId: input.allocationId, note: link.note })
      }
    });

    return { ok: true as const, link };
  });
}

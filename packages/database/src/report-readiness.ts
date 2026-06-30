import { prisma } from "./client";
import { calculateAllocationProofCompletenessFromInput, type ProofCompletenessBreakdown } from "./proof-completeness";
import { getActiveReadinessPolicy, getSafeDefaultReadinessPolicy, serializeReadinessPolicySnapshot, type ReadinessPolicySnapshot, type SerializedReadinessPolicy } from "./readiness-policies";
import { calculateAllocationReconciliationFromEntries, parseReconciliationSnapshot, type AllocationReconciliation } from "./reconciliation";
import { calculateAllocationRiskFromInput, type AllocationRisk } from "./risk-engine";
import { syncOperationalIncidentFromReadiness, syncOperationalIncidentFromSnapshotIntegrity } from "./operational-incidents";

export const REPORT_READINESS_STATES = ["BLOCKED", "NEEDS_REVIEW", "READY", "READY_WITH_WARNINGS"] as const;
export type ReportReadinessState = (typeof REPORT_READINESS_STATES)[number];
export type ReportReadinessSeverity = "CRITICAL" | "HIGH" | "MEDIUM";

export type ReportReadinessIssue = {
  id: string;
  label: string;
  severity: ReportReadinessSeverity;
  passed: boolean;
  message: string;
};

export type ReportReadinessMetrics = {
  linkedAllocationCount: number;
  snapshotAllocationCount: number;
  visibleProofCount: number;
  excludedProofCount: number;
  pendingProofCount: number;
  proofCompletenessScore: number;
  reconciliationStatus: "BALANCED" | "WARNING" | "BROKEN";
  brokenReconciliationCount: number;
  warningReconciliationCount: number;
  reconciliationSnapshotGeneratedAt: string | null;
  riskScore: number;
  criticalRiskCount: number;
  highRiskCount: number;
  snapshotGeneratedAt: string | null;
  latestLinkageChangeAt: string | null;
};

export type ReportReadinessEvaluation = {
  state: ReportReadinessState;
  readinessPercentage: number;
  publishAllowed: boolean;
  requiresAcknowledgment: boolean;
  blockingIssues: ReportReadinessIssue[];
  warnings: ReportReadinessIssue[];
  checks: ReportReadinessIssue[];
  metrics: ReportReadinessMetrics;
  proofCompleteness: {
    averageScore: number;
    allocations: ProofCompletenessBreakdown[];
  };
  risk: {
    averageScore: number;
    allocations: AllocationRisk[];
  };
  policySnapshot: ReadinessPolicySnapshot;
  evaluatedAt: string;
};

type ReadinessReportInput = {
  id: string;
  investorId: string;
  status: string;
  summary: string;
  performanceNote: string | null;
  payoutNote: string | null;
  proofSummaryJson: string | null;
};

type ReadinessLinkedAllocationInput = {
  allocationId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  allocation: {
    id: string;
    investorId: string;
    status: string;
    allocationAmount?: string | number | null;
    riskLevel?: string | null;
    expectedCycleDays: number | null;
    expectedPayoutAt: Date | string | null;
    startedAt?: Date | string | null;
    completedAt?: Date | string | null;
    createdAt?: Date | string | null;
    payoutStatus?: string | null;
    proofs: Array<{
      id: string;
      type: string;
      status: string;
      proofUrl?: string | null;
    }>;
    ledgerEntries?: Array<{
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
      correctedByLedgerEntryId?: string | null;
      voidedAt?: Date | string | null;
      createdAt?: Date | string;
      updatedAt?: Date | string;
    }>;
  };
};

export type ReportReadinessInput = {
  report: ReadinessReportInput;
  linkedAllocations: ReadinessLinkedAllocationInput[];
  policy?: SerializedReadinessPolicy;
  now?: Date;
};

const VALID_ALLOCATION_STATUSES = new Set(["DRAFT", "PURCHASING", "SHIPPING", "RECEIVED", "SELLING", "COMPLETED", "CANCELED", "LOSS"]);
const ACTIVE_ALLOCATION_STATUSES = new Set(["DRAFT", "PURCHASING", "SHIPPING", "RECEIVED", "SELLING"]);
const CRITICAL_ARTIFACT_TYPES = new Set(["SHIPMENT_PROOF", "MARKETPLACE_REPORT", "PAYOUT_PROOF"]);

function asDate(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
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
    components: []
  };
}

function parseSnapshot(value: string | null) {
  if (!value) return { generatedAt: null as string | null, allocations: [] as Array<{ id: string; proofCompleteness: ProofCompletenessBreakdown | null }>, available: {} as Record<string, number>, verified: {} as Record<string, number>, excluded: {} as Record<string, number> };
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    const normalize = (source: unknown) => {
      if (!source || typeof source !== "object" || Array.isArray(source)) return {};
      return Object.fromEntries(Object.entries(source as Record<string, unknown>).filter(([, count]) => typeof count === "number" && count > 0)) as Record<string, number>;
    };
    return {
      generatedAt: typeof parsed.generatedAt === "string" ? parsed.generatedAt : null,
      allocations: Array.isArray(parsed.allocations)
        ? parsed.allocations
            .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item) && typeof (item as { id?: unknown }).id === "string")
            .map((item) => ({ id: item.id as string, proofCompleteness: parseSnapshotProofCompleteness(item.proofCompleteness) }))
        : [],
      available: normalize(parsed.available),
      verified: normalize(parsed.verified),
      excluded: normalize(parsed.excluded)
    };
  } catch {
    return { generatedAt: null, allocations: [], available: {}, verified: {}, excluded: {} };
  }
}

function countSummary(summary: Record<string, number>) {
  return Object.values(summary).reduce((sum, count) => sum + count, 0);
}

function hasBrokenReference(proofUrl: string | null | undefined) {
  if (!proofUrl) return false;
  try {
    const url = new URL(proofUrl);
    return url.protocol !== "https:" && url.protocol !== "http:";
  } catch {
    return true;
  }
}

function makeCheck(id: string, label: string, severity: ReportReadinessSeverity, passed: boolean, message: string): ReportReadinessIssue {
  return { id, label, severity, passed, message };
}

export function evaluateMonthlyReportReadinessFromInput(input: ReportReadinessInput): ReportReadinessEvaluation {
  const now = input.now ?? new Date();
  const policy = input.policy ?? getSafeDefaultReadinessPolicy();
  const snapshot = parseSnapshot(input.report.proofSummaryJson);
  const reconciliationSnapshot = parseReconciliationSnapshot(input.report.proofSummaryJson);
  const linkedAllocationIds = input.linkedAllocations.map((link) => link.allocationId);
  const uniqueLinkedAllocationIds = new Set(linkedAllocationIds);
  const latestLinkageChange = input.linkedAllocations
    .map((link) => asDate(link.updatedAt) ?? asDate(link.createdAt))
    .filter((date): date is Date => Boolean(date))
    .sort((left, right) => right.getTime() - left.getTime())[0] ?? null;
  const snapshotGeneratedAt = asDate(snapshot.generatedAt);
  const linkedProofs = input.linkedAllocations.flatMap((link) => link.allocation.proofs);
  const visibleProofs = linkedProofs.filter((proof) => proof.status === "AVAILABLE" || proof.status === "VERIFIED");
  const excludedProofs = linkedProofs.filter((proof) => proof.status !== "AVAILABLE" && proof.status !== "VERIFIED");
  const pendingProofs = linkedProofs.filter((proof) => proof.status === "PENDING");
  const visibleProofCount = visibleProofs.length;
  const excludedProofCount = excludedProofs.length;
  const pendingProofCount = pendingProofs.length;
  const snapshotCompletenessByAllocationId = new Map(snapshot.allocations.map((allocation) => [allocation.id, allocation.proofCompleteness] as const));
  const allocationProofCompleteness = input.linkedAllocations.map((link) => snapshotCompletenessByAllocationId.get(link.allocation.id) ?? calculateAllocationProofCompletenessFromInput({
    allocationId: link.allocation.id,
    investorId: link.allocation.investorId,
    proofs: link.allocation.proofs,
    monthlyReportLinkCount: 1,
    policy
  }));
  const proofCompletenessScore = allocationProofCompleteness.length === 0 ? 0 : allocationProofCompleteness.reduce((sum, item) => sum + item.score, 0) / allocationProofCompleteness.length;
  const allocationReconciliations: AllocationReconciliation[] = input.linkedAllocations.map((link) => calculateAllocationReconciliationFromEntries({
    allocationId: link.allocation.id,
    allocationStatus: link.allocation.status,
    entries: link.allocation.ledgerEntries ?? []
  }));
  const brokenReconciliationCount = allocationReconciliations.filter((item) => item.status === "BROKEN").length;
  const warningReconciliationCount = allocationReconciliations.filter((item) => item.status === "WARNING").length;
  const reconciliationStatus = brokenReconciliationCount > 0 ? "BROKEN" : warningReconciliationCount > 0 ? "WARNING" : "BALANCED";
  const allocationRisks = input.linkedAllocations.map((link) => calculateAllocationRiskFromInput({
    allocation: {
      id: link.allocation.id,
      investorId: link.allocation.investorId,
      status: link.allocation.status,
      allocationAmount: link.allocation.allocationAmount,
      riskLevel: link.allocation.riskLevel,
      expectedCycleDays: link.allocation.expectedCycleDays,
      expectedPayoutAt: link.allocation.expectedPayoutAt,
      startedAt: link.allocation.startedAt,
      completedAt: link.allocation.completedAt,
      createdAt: link.allocation.createdAt,
      payoutStatus: link.allocation.payoutStatus,
      proofs: link.allocation.proofs,
      ledgerEntries: link.allocation.ledgerEntries ?? [],
      monthlyReportLinkCount: 1
    },
    policy,
    now
  }));
  const riskScore = allocationRisks.length === 0 ? 0 : allocationRisks.reduce((sum, risk) => sum + risk.score, 0) / allocationRisks.length;
  const criticalRiskCount = allocationRisks.filter((risk) => risk.level === "CRITICAL").length;
  const highRiskCount = allocationRisks.filter((risk) => risk.level === "HIGH").length;
  const snapshotVisibleCount = countSummary(snapshot.available) + countSummary(snapshot.verified);
  const snapshotExcludedCount = countSummary(snapshot.excluded);
  const liveVisibleByType = visibleProofs.reduce<Record<string, number>>((counts, proof) => {
    counts[proof.type] = (counts[proof.type] || 0) + 1;
    return counts;
  }, {});
  const hiddenExposure = Object.entries({ ...snapshot.available, ...snapshot.verified }).some(([type, count]) => count > (liveVisibleByType[type] || 0));
  const textForDisclosure = `${input.report.summary} ${input.report.performanceNote || ""} ${input.report.payoutNote || ""}`.toLowerCase();
  const hasRiskDisclosure = ["risk", "no return", "outcome", "operational"].some((token) => textForDisclosure.includes(token));

  const checks: ReportReadinessIssue[] = [
    makeCheck("report-draft", "Report status is draft", "CRITICAL", input.report.status === "DRAFT", "Only draft reports can enter the publish gate."),
    makeCheck("linked-allocation", "At least one linked allocation exists", "CRITICAL", input.linkedAllocations.length > 0, "Link at least one allocation before publishing."),
    makeCheck("snapshot-exists", "Frozen snapshot exists", "CRITICAL", Boolean(snapshotGeneratedAt && snapshot.allocations.length > 0), "Regenerate the report snapshot from linked allocations."),
    makeCheck("reconciliation-snapshot-exists", "Reconciliation snapshot exists", "CRITICAL", Boolean(reconciliationSnapshot?.generatedAt && reconciliationSnapshot.allocations.length > 0), "Regenerate the report snapshot so reconciliation is frozen with the report."),
    makeCheck("snapshot-fresh", "Snapshot is newer than linkage changes", "CRITICAL", !policy.blockOnStaleSnapshot || Boolean(snapshotGeneratedAt && (!latestLinkageChange || snapshotGeneratedAt.getTime() >= latestLinkageChange.getTime())), "Regenerate the snapshot after the latest linkage change."),
    makeCheck("same-investor", "Linked allocations belong to the report investor", "CRITICAL", input.linkedAllocations.every((link) => link.allocation.investorId === input.report.investorId), "Remove allocations that belong to another investor."),
    makeCheck("duplicate-linkage", "No duplicate allocation linkage", "CRITICAL", uniqueLinkedAllocationIds.size === linkedAllocationIds.length, "Remove duplicate allocation linkage records."),
    makeCheck("required-proof-categories", "Required proof categories are present", "CRITICAL", allocationProofCompleteness.every((item) => item.missingRequiredCategories.length === 0), "Add required investor-visible proof categories before publishing."),
    makeCheck("critical-artifacts-reviewed", "No unreviewed critical artifacts", "CRITICAL", !policy.blockOnUnreviewedCriticalArtifacts || !pendingProofs.some((proof) => CRITICAL_ARTIFACT_TYPES.has(proof.type)), "Review pending critical proof artifacts before publishing."),
    makeCheck("hidden-proof-not-exposed", "Hidden/admin-only proofs are not exposed", "CRITICAL", !policy.blockOnHiddenInvestorLeakRisk || (!hiddenExposure && snapshotVisibleCount <= visibleProofCount), "Regenerate the snapshot and verify hidden proofs are excluded."),
    makeCheck("artifact-references-valid", "Artifact references are valid", "CRITICAL", !linkedProofs.some((proof) => hasBrokenReference(proof.proofUrl)), "Fix malformed proof references before publishing."),
    makeCheck("reconciliation-not-broken", "Linked allocations reconcile", "CRITICAL", brokenReconciliationCount === 0, "Resolve broken allocation reconciliation before publishing."),
    makeCheck("risk-not-critical", "No critical allocation risk", "CRITICAL", criticalRiskCount === 0, "Resolve critical allocation risk before publishing."),
    makeCheck("proof-completeness", "Proof completeness threshold met", "HIGH", allocationProofCompleteness.every((item) => item.score >= policy.minimumProofCompletenessScore), "Investor-visible proof coverage is below the operational threshold."),
    makeCheck("reconciliation-warnings-reviewed", "Reconciliation warnings reviewed", "HIGH", warningReconciliationCount === 0, "Review reconciliation warnings before publishing."),
    makeCheck("high-risk-reviewed", "High risk allocations reviewed", "HIGH", highRiskCount === 0, "Acknowledge high allocation risk before publishing."),
    makeCheck("warning-proof-categories", "Warning proof categories are present", "HIGH", allocationProofCompleteness.every((item) => policy.warningProofCategories.every((type) => item.presentCategories.includes(type))), "Review warning proof categories before publishing."),
    makeCheck("excluded-proof-reviewed", "Excluded proof count reviewed", "HIGH", excludedProofCount === 0 || snapshotExcludedCount >= excludedProofCount, "Regenerate or review excluded proof categories before publishing."),
    makeCheck("allocation-lifecycle-stage", "All allocations have lifecycle stage", "HIGH", input.linkedAllocations.every((link) => VALID_ALLOCATION_STATUSES.has(link.allocation.status)), "Set a valid lifecycle stage for every linked allocation."),
    makeCheck("expected-payout-valid", "Expected payout dates are valid", "HIGH", input.linkedAllocations.every((link) => !ACTIVE_ALLOCATION_STATUSES.has(link.allocation.status) || Boolean(asDate(link.allocation.expectedPayoutAt) || link.allocation.expectedCycleDays)), "Set expected payout date or cycle days for active allocations."),
    makeCheck("no-superseded-allocation", "No allocation marked cancelled incorrectly", "HIGH", input.linkedAllocations.every((link) => link.allocation.status !== "CANCELED"), "Remove cancelled/superseded allocations from the report."),
    makeCheck("report-note", "Report notes exist", "MEDIUM", Boolean(input.report.performanceNote || input.report.payoutNote), "Add operational report notes before publishing."),
    makeCheck("summary-text", "Summary text exists", "MEDIUM", Boolean(input.report.summary.trim()), "Add a report summary before publishing."),
    makeCheck("risk-disclosure", "Risk disclosure exists", "MEDIUM", hasRiskDisclosure, "Add calm operational risk disclosure language."),
    makeCheck("generated-at-consistent", "Snapshot timestamp is consistent", "MEDIUM", Boolean(snapshotGeneratedAt && snapshotGeneratedAt.getTime() <= now.getTime() + 60_000), "Regenerate the snapshot with a valid timestamp.")
  ];

  const blockingIssues = checks.filter((check) => check.severity === "CRITICAL" && !check.passed);
  const warnings = checks.filter((check) => check.severity !== "CRITICAL" && !check.passed);
  const highWarnings = warnings.filter((check) => check.severity === "HIGH");
  const passedCount = checks.filter((check) => check.passed).length;
  const state: ReportReadinessState = blockingIssues.length
    ? "BLOCKED"
    : highWarnings.length
      ? "NEEDS_REVIEW"
      : warnings.length
        ? "READY_WITH_WARNINGS"
        : "READY";
  const publishAllowed = state !== "BLOCKED" && (warnings.length === 0 || policy.allowPublishWithWarnings);

  return {
    state,
    readinessPercentage: Math.round((passedCount / checks.length) * 100),
    publishAllowed,
    requiresAcknowledgment: publishAllowed && warnings.length > 0 && policy.requireWarningAcknowledgment,
    blockingIssues,
    warnings,
    checks,
    metrics: {
      linkedAllocationCount: input.linkedAllocations.length,
      snapshotAllocationCount: snapshot.allocations.length,
      visibleProofCount,
      excludedProofCount,
      pendingProofCount,
      proofCompletenessScore: Math.round(proofCompletenessScore),
      reconciliationStatus,
      brokenReconciliationCount,
      warningReconciliationCount,
      reconciliationSnapshotGeneratedAt: reconciliationSnapshot?.generatedAt ?? null,
      riskScore: Math.round(riskScore),
      criticalRiskCount,
      highRiskCount,
      snapshotGeneratedAt: snapshot.generatedAt,
      latestLinkageChangeAt: latestLinkageChange?.toISOString() ?? null
    },
    proofCompleteness: {
      averageScore: Math.round(proofCompletenessScore),
      allocations: allocationProofCompleteness
    },
    risk: {
      averageScore: Math.round(riskScore),
      allocations: allocationRisks
    },
    policySnapshot: serializeReadinessPolicySnapshot(policy),
    evaluatedAt: now.toISOString()
  };
}

export async function evaluateMonthlyReportReadiness(reportId: string, policy?: SerializedReadinessPolicy) {
  const [report, activePolicy] = await Promise.all([
    prisma.monthlyReport.findUnique({
    where: { id: reportId },
    select: {
      id: true,
      investorId: true,
      status: true,
      summary: true,
      performanceNote: true,
      payoutNote: true,
      proofSummaryJson: true,
      allocations: {
        include: {
          allocation: {
            select: {
              id: true,
              investorId: true,
              status: true,
              allocationAmount: true,
              riskLevel: true,
              expectedCycleDays: true,
              expectedPayoutAt: true,
              startedAt: true,
              completedAt: true,
              createdAt: true,
              payoutStatus: true,
              proofs: { select: { id: true, type: true, status: true, proofUrl: true } },
              ledgerEntries: {
                select: {
                  id: true,
                  ledgerType: true,
                  allocationId: true,
                  investorId: true,
                  monthlyReportId: true,
                  entryType: true,
                  amount: true,
                  currency: true,
                  quantity: true,
                  unitCost: true,
                  occurredAt: true,
                  sourceType: true,
                  sourceId: true,
                  description: true,
                  metadataJson: true,
                  createdBy: true,
                  createdAt: true,
                  updatedAt: true
                }
              }
            }
          }
        }
      }
    }
    }),
    policy ? Promise.resolve(policy) : getActiveReadinessPolicy()
  ]);

  if (!report) return null;

  return evaluateMonthlyReportReadinessFromInput({
    report,
    linkedAllocations: report.allocations,
    policy: activePolicy
  });
}

export function resolveMonthlyReportPublishGate(evaluation: ReportReadinessEvaluation, acknowledgeWarnings: boolean) {
  if (!evaluation.publishAllowed) {
    return {
      ok: false as const,
      status: 409 as const,
      error: evaluation.state === "BLOCKED"
        ? "Publishing blocked until critical report integrity issues are resolved."
        : "Readiness policy does not allow publishing while warnings remain.",
      auditAction: "BLOCK_REPORT_PUBLISH"
    };
  }

  if (evaluation.requiresAcknowledgment && !acknowledgeWarnings) {
    return { ok: false as const, status: 409 as const, error: "This report contains warnings. Review and acknowledge them before publishing.", auditAction: null };
  }

  return {
    ok: true as const,
    auditAction: evaluation.requiresAcknowledgment
      ? evaluation.state === "NEEDS_REVIEW"
        ? "OVERRIDE_REPORT_WARNING"
        : "PUBLISH_REPORT_WITH_WARNINGS"
      : null
  };
}

export async function recordMonthlyReportReadinessAudit(input: { reportId: string; actor: string; action: string; evaluation: ReportReadinessEvaluation }) {
  await prisma.auditLog.create({
    data: {
      actor: input.actor,
      action: input.action,
      entityType: "MonthlyReport",
      entityId: input.reportId,
      beforeJson: null,
      afterJson: JSON.stringify({
        state: input.evaluation.state,
        readinessPercentage: input.evaluation.readinessPercentage,
        metrics: input.evaluation.metrics,
        policy: input.evaluation.policySnapshot,
        blockingIssueCount: input.evaluation.blockingIssues.length,
        warningCount: input.evaluation.warnings.length
      })
    }
  });

  await syncOperationalIncidentFromReadiness({
    reportId: input.reportId,
    state: input.evaluation.state,
    blockingIssueCount: input.evaluation.blockingIssues.length,
    warningCount: input.evaluation.warnings.length,
    score: input.evaluation.readinessPercentage,
    actor: input.actor,
    metadata: {
      auditAction: input.action,
      blockingIssues: input.evaluation.blockingIssues.map((issue) => issue.id),
      warnings: input.evaluation.warnings.map((issue) => issue.id)
    }
  });

  const snapshotGeneratedAt = input.evaluation.metrics.snapshotGeneratedAt ? new Date(input.evaluation.metrics.snapshotGeneratedAt) : null;
  const latestLinkageChangeAt = input.evaluation.metrics.latestLinkageChangeAt ? new Date(input.evaluation.metrics.latestLinkageChangeAt) : null;
  const staleSnapshot = Boolean(snapshotGeneratedAt && latestLinkageChangeAt && snapshotGeneratedAt.getTime() < latestLinkageChangeAt.getTime());
  const staleHours = snapshotGeneratedAt && latestLinkageChangeAt && latestLinkageChangeAt.getTime() > snapshotGeneratedAt.getTime()
    ? Math.round((latestLinkageChangeAt.getTime() - snapshotGeneratedAt.getTime()) / 3_600_000)
    : null;

  await syncOperationalIncidentFromSnapshotIntegrity({
    reportId: input.reportId,
    status: "DRAFT",
    missingProofSnapshot: input.evaluation.metrics.snapshotAllocationCount === 0,
    missingReconciliationSnapshot: !input.evaluation.metrics.reconciliationSnapshotGeneratedAt,
    missingRiskSnapshot: false,
    staleSnapshot,
    staleHours,
    actor: input.actor
  });
}

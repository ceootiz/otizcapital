import { prisma } from "./client";
import { calculateAllocationProofCompletenessFromInput } from "./proof-completeness";
import { getActiveReadinessPolicy } from "./readiness-policies";
import { calculateAllocationReconciliationFromEntries, parseReconciliationSnapshot } from "./reconciliation";
import { evaluateMonthlyReportReadinessFromInput } from "./report-readiness";
import { calculateAllocationRiskFromInput, parseRiskSnapshot, RISK_AUDIT_ACTIONS } from "./risk-engine";
import { buildIncidentSummary, getOpenOperationalIncidents, syncOperationalIncidentFromSnapshotIntegrity } from "./operational-incidents";

export const CHECKPOINT_HEALTH_STATUSES = ["HEALTHY", "ATTENTION", "CRITICAL"] as const;
export type CheckpointHealthStatus = (typeof CHECKPOINT_HEALTH_STATUSES)[number];
export type CheckpointHealthSeverity = "INFO" | "WARNING" | "CRITICAL";
export type CheckpointHealthCategory = "READINESS" | "RECONCILIATION" | "RISK" | "WITHDRAWALS" | "PROOF" | "NOTIFICATIONS" | "INCIDENTS" | "SNAPSHOT_INTEGRITY";

export type CheckpointHealthIssue = {
  id: string;
  category: CheckpointHealthCategory;
  severity: CheckpointHealthSeverity;
  title: string;
  detail: string;
  count: number;
};

export type CheckpointHealthMetrics = {
  readiness: {
    draftReportsCount: number;
    blockedReportsCount: number;
    reportsNeedingWarningAcknowledgment: number;
    staleSnapshotCount: number;
  };
  reconciliation: {
    brokenAllocationsCount: number;
    warningAllocationsCount: number;
    latestReconciliationIssueCount: number;
  };
  risk: {
    criticalRiskAllocationsCount: number;
    highRiskAllocationsCount: number;
    latestRiskEventCount: number;
    overdueRiskEvaluations: number;
  };
  withdrawals: {
    requestedCount: number;
    approvedCount: number;
    scheduledCount: number;
    overdueScheduledPayoutsCount: number;
  };
  proof: {
    averageProofCompleteness: number;
    incompleteAllocationsCount: number;
    highRiskProofGapsCount: number;
  };
  notifications: {
    available: boolean;
    pendingCount: number;
    failedCount: number;
  };
  incidents: {
    openCount: number;
    acknowledgedCount: number;
    unresolvedCount: number;
    criticalOpenCount: number;
    highOpenCount: number;
    staleUnresolvedCount: number;
    bySource: Record<string, number>;
  };
  snapshotIntegrity: {
    publishedReportsMissingProofSnapshot: number;
    publishedReportsMissingReconciliationSnapshot: number;
    publishedReportsMissingRiskSnapshot: number;
    draftReportsWithStaleSnapshot: number;
  };
};

export type CheckpointHealthSnapshot = {
  overallStatus: CheckpointHealthStatus;
  score: number;
  metrics: CheckpointHealthMetrics;
  issues: CheckpointHealthIssue[];
  recommendedActions: string[];
  lastEvaluatedAt: string;
};

const ACTIVE_ALLOCATION_STATUSES = new Set(["DRAFT", "PURCHASING", "SHIPPING", "RECEIVED", "SELLING"]);
const RISK_REVIEW_WINDOW_MS = 1000 * 60 * 60 * 24 * 7;

function makeIssue(input: CheckpointHealthIssue) {
  return input;
}

function parseJsonObject(value: string | null) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

function asDate(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseProofSnapshot(value: string | null) {
  const parsed = parseJsonObject(value);
  if (!parsed) return { generatedAt: null as Date | null, hasProofSnapshot: false };
  const generatedAt = asDate(typeof parsed.generatedAt === "string" ? parsed.generatedAt : null);
  const allocations = Array.isArray(parsed.allocations) ? parsed.allocations : [];
  const hasProofSnapshot = Boolean(generatedAt && allocations.length > 0);
  return { generatedAt, hasProofSnapshot };
}

function latestReportLinkageChange(report: { allocations: Array<{ createdAt: Date; updatedAt: Date }> }) {
  return report.allocations
    .map((link) => [link.createdAt, link.updatedAt])
    .flat()
    .sort((left, right) => right.getTime() - left.getTime())[0] ?? null;
}

function isDraftSnapshotStale(report: { status: string; proofSummaryJson: string | null; allocations: Array<{ createdAt: Date; updatedAt: Date }> }) {
  if (report.status !== "DRAFT") return false;
  const snapshot = parseProofSnapshot(report.proofSummaryJson);
  const latestLinkChange = latestReportLinkageChange(report);
  if (!latestLinkChange) return false;
  if (!snapshot.generatedAt) return true;
  return snapshot.generatedAt.getTime() < latestLinkChange.getTime();
}

function draftSnapshotStaleHours(report: { proofSummaryJson: string | null; allocations: Array<{ createdAt: Date; updatedAt: Date }> }) {
  const snapshot = parseProofSnapshot(report.proofSummaryJson);
  const latestLinkChange = latestReportLinkageChange(report);
  if (!latestLinkChange) return null;
  const snapshotTime = snapshot.generatedAt;
  if (!snapshotTime) return 0;
  if (snapshotTime.getTime() >= latestLinkChange.getTime()) return null;
  return Math.round((latestLinkChange.getTime() - snapshotTime.getTime()) / 3_600_000);
}

export function getCheckpointHealthIssues(metrics: CheckpointHealthMetrics): CheckpointHealthIssue[] {
  const issues: CheckpointHealthIssue[] = [];

  if (metrics.readiness.blockedReportsCount > 0) issues.push(makeIssue({ id: "readiness-blocked-reports", category: "READINESS", severity: "CRITICAL", title: "Blocked draft reports", detail: "Draft monthly reports have critical readiness blockers.", count: metrics.readiness.blockedReportsCount }));
  if (metrics.readiness.reportsNeedingWarningAcknowledgment > 0) issues.push(makeIssue({ id: "readiness-warning-ack", category: "READINESS", severity: "WARNING", title: "Reports need warning acknowledgment", detail: "Draft reports contain non-blocking warnings that require manager review before publish.", count: metrics.readiness.reportsNeedingWarningAcknowledgment }));
  if (metrics.readiness.staleSnapshotCount > 0) issues.push(makeIssue({ id: "readiness-stale-snapshot", category: "READINESS", severity: "WARNING", title: "Stale draft snapshots", detail: "Draft report snapshots are older than their linkage changes.", count: metrics.readiness.staleSnapshotCount }));

  if (metrics.reconciliation.brokenAllocationsCount > 0) issues.push(makeIssue({ id: "reconciliation-broken", category: "RECONCILIATION", severity: "CRITICAL", title: "Broken allocation reconciliation", detail: "One or more allocations have broken three-ledger reconciliation.", count: metrics.reconciliation.brokenAllocationsCount }));
  if (metrics.reconciliation.warningAllocationsCount > 0) issues.push(makeIssue({ id: "reconciliation-warning", category: "RECONCILIATION", severity: "WARNING", title: "Reconciliation warnings", detail: "Allocations have reconciliation warnings that should be reviewed.", count: metrics.reconciliation.warningAllocationsCount }));

  if (metrics.risk.criticalRiskAllocationsCount > 0) issues.push(makeIssue({ id: "risk-critical", category: "RISK", severity: "CRITICAL", title: "Critical risk allocations", detail: "Critical risk states should be resolved before investor reporting.", count: metrics.risk.criticalRiskAllocationsCount }));
  if (metrics.risk.highRiskAllocationsCount > 0) issues.push(makeIssue({ id: "risk-high", category: "RISK", severity: "WARNING", title: "High risk allocations", detail: "High risk states require manager review and documented action.", count: metrics.risk.highRiskAllocationsCount }));
  if (metrics.risk.overdueRiskEvaluations > 0) issues.push(makeIssue({ id: "risk-overdue-evaluations", category: "RISK", severity: "WARNING", title: "Overdue risk evaluations", detail: "Active allocations have no recent risk evaluation event.", count: metrics.risk.overdueRiskEvaluations }));

  const pendingWithdrawals = metrics.withdrawals.requestedCount + metrics.withdrawals.approvedCount + metrics.withdrawals.scheduledCount;
  if (metrics.withdrawals.overdueScheduledPayoutsCount > 0) issues.push(makeIssue({ id: "withdrawals-overdue", category: "WITHDRAWALS", severity: "CRITICAL", title: "Overdue scheduled payouts", detail: "Scheduled payout dates have passed and require manager action.", count: metrics.withdrawals.overdueScheduledPayoutsCount }));
  if (pendingWithdrawals > 0) issues.push(makeIssue({ id: "withdrawals-pending", category: "WITHDRAWALS", severity: "WARNING", title: "Pending withdrawal queue", detail: "Requested, approved, or scheduled withdrawals remain open.", count: pendingWithdrawals }));

  if (metrics.proof.highRiskProofGapsCount > 0) issues.push(makeIssue({ id: "proof-high-risk", category: "PROOF", severity: "CRITICAL", title: "High-risk proof gaps", detail: "Proof completeness has high-risk gaps on one or more allocations.", count: metrics.proof.highRiskProofGapsCount }));
  if (metrics.proof.incompleteAllocationsCount > 0) issues.push(makeIssue({ id: "proof-incomplete", category: "PROOF", severity: "WARNING", title: "Incomplete proof coverage", detail: "Allocations are below verified evidence coverage.", count: metrics.proof.incompleteAllocationsCount }));
  if (metrics.proof.averageProofCompleteness > 0 && metrics.proof.averageProofCompleteness < 70) issues.push(makeIssue({ id: "proof-average-low", category: "PROOF", severity: "WARNING", title: "Low average proof completeness", detail: "Average proof completeness is below operational target.", count: Math.round(metrics.proof.averageProofCompleteness) }));

  if (!metrics.notifications.available) issues.push(makeIssue({ id: "notifications-unavailable", category: "NOTIFICATIONS", severity: "WARNING", title: "Notification status unavailable", detail: "Notification events could not be counted safely.", count: 1 }));
  if (metrics.notifications.failedCount > 0) issues.push(makeIssue({ id: "notifications-failed", category: "NOTIFICATIONS", severity: "WARNING", title: "Failed notification events", detail: "Failed notification events need review before relying on outbound workflows.", count: metrics.notifications.failedCount }));
  if (metrics.notifications.pendingCount > 25) issues.push(makeIssue({ id: "notifications-backlog", category: "NOTIFICATIONS", severity: "WARNING", title: "Notification backlog", detail: "Pending notification events are accumulating.", count: metrics.notifications.pendingCount }));

  if (metrics.incidents.criticalOpenCount > 0) issues.push(makeIssue({ id: "incidents-critical", category: "INCIDENTS", severity: "CRITICAL", title: "Critical unresolved incidents", detail: "Critical operational incidents remain unresolved.", count: metrics.incidents.criticalOpenCount }));
  if (metrics.incidents.highOpenCount > 0) issues.push(makeIssue({ id: "incidents-high", category: "INCIDENTS", severity: "WARNING", title: "High severity incidents", detail: "High severity incidents require manager acknowledgment or resolution.", count: metrics.incidents.highOpenCount }));
  if (metrics.incidents.staleUnresolvedCount > 0) issues.push(makeIssue({ id: "incidents-stale", category: "INCIDENTS", severity: "WARNING", title: "Stale unresolved incidents", detail: "Operational incidents have remained unresolved for more than the expected review window.", count: metrics.incidents.staleUnresolvedCount }));

  const missingPublishedSnapshots = metrics.snapshotIntegrity.publishedReportsMissingProofSnapshot + metrics.snapshotIntegrity.publishedReportsMissingReconciliationSnapshot + metrics.snapshotIntegrity.publishedReportsMissingRiskSnapshot;
  if (missingPublishedSnapshots > 0) issues.push(makeIssue({ id: "snapshot-published-missing", category: "SNAPSHOT_INTEGRITY", severity: "CRITICAL", title: "Published report snapshot gaps", detail: "Published reports are missing frozen proof, reconciliation, or risk snapshots.", count: missingPublishedSnapshots }));
  if (metrics.snapshotIntegrity.draftReportsWithStaleSnapshot > 0) issues.push(makeIssue({ id: "snapshot-draft-stale", category: "SNAPSHOT_INTEGRITY", severity: "WARNING", title: "Draft reports with stale snapshots", detail: "Draft report snapshots should be regenerated before publication.", count: metrics.snapshotIntegrity.draftReportsWithStaleSnapshot }));

  return issues;
}

function recommendedActionFor(issue: CheckpointHealthIssue) {
  if (issue.category === "READINESS") return "Review draft report readiness blockers and regenerate snapshots where needed.";
  if (issue.category === "RECONCILIATION") return "Resolve allocation ledger exceptions before publishing investor reports.";
  if (issue.category === "RISK") return "Run manager risk review and document actions for high or critical allocations.";
  if (issue.category === "WITHDRAWALS") return "Clear overdue and pending withdrawal queue items with manager notes.";
  if (issue.category === "PROOF") return "Add or verify missing proof categories on affected allocations.";
  if (issue.category === "NOTIFICATIONS") return "Process notification backlog and inspect failed notification events.";
  if (issue.category === "INCIDENTS") return "Acknowledge or resolve open incidents from the incident center.";
  return "Regenerate affected report snapshots and confirm frozen investor visibility.";
}

export function buildCheckpointHealthSnapshotFromMetrics(metrics: CheckpointHealthMetrics, evaluatedAt: Date = new Date()): CheckpointHealthSnapshot {
  const issues = getCheckpointHealthIssues(metrics);
  const criticalCount = issues.filter((issue) => issue.severity === "CRITICAL").length;
  const warningCount = issues.filter((issue) => issue.severity === "WARNING").length;
  const overallStatus: CheckpointHealthStatus = criticalCount > 0 ? "CRITICAL" : warningCount > 0 ? "ATTENTION" : "HEALTHY";
  const score = Math.max(0, Math.min(100, 100 - criticalCount * 15 - warningCount * 5));
  const recommendedActions = Array.from(new Set(issues.map(recommendedActionFor))).slice(0, 6);

  return {
    overallStatus,
    score,
    metrics,
    issues,
    recommendedActions,
    lastEvaluatedAt: evaluatedAt.toISOString()
  };
}

export async function getAdminCheckpointHealthSummary(now: Date = new Date()): Promise<CheckpointHealthSnapshot> {
  const riskSince = new Date(now.getTime() - RISK_REVIEW_WINDOW_MS);
  const [reports, allocations, withdrawals, policy, latestRiskEventCount, riskEvents] = await Promise.all([
    prisma.monthlyReport.findMany({
      include: {
        allocations: {
          include: {
            allocation: { include: { proofs: true, ledgerEntries: true, monthlyReports: { select: { id: true } } } }
          }
        }
      },
      orderBy: { updatedAt: "desc" }
    }),
    prisma.allocation.findMany({ include: { proofs: true, ledgerEntries: true, monthlyReports: { select: { id: true } } }, orderBy: { updatedAt: "desc" } }),
    prisma.withdrawalRequest.findMany(),
    getActiveReadinessPolicy(),
    prisma.auditLog.count({ where: { action: { in: [...RISK_AUDIT_ACTIONS] }, createdAt: { gte: riskSince } } }),
    prisma.auditLog.findMany({ where: { action: "EVALUATE_ALLOCATION_RISK", entityType: "Allocation" }, orderBy: { createdAt: "desc" }, take: 1000 })
  ]);

  const draftReports = reports.filter((report) => report.status === "DRAFT");
  const readinessEvaluations = draftReports.map((report) => evaluateMonthlyReportReadinessFromInput({
    report: {
      id: report.id,
      investorId: report.investorId,
      status: report.status,
      summary: report.summary,
      performanceNote: report.performanceNote,
      payoutNote: report.payoutNote,
      proofSummaryJson: report.proofSummaryJson
    },
    linkedAllocations: report.allocations.map((link) => ({
      allocationId: link.allocationId,
      createdAt: link.createdAt,
      updatedAt: link.updatedAt,
      allocation: {
        ...link.allocation,
        proofs: link.allocation.proofs,
        ledgerEntries: link.allocation.ledgerEntries
      }
    })),
    policy,
    now
  }));

  const reconciliations = allocations.map((allocation) => calculateAllocationReconciliationFromEntries({ allocationId: allocation.id, allocationStatus: allocation.status, entries: allocation.ledgerEntries }));
  const risks = allocations.map((allocation) => calculateAllocationRiskFromInput({ allocation: { ...allocation, proofs: allocation.proofs, ledgerEntries: allocation.ledgerEntries, monthlyReportLinkCount: allocation.monthlyReports.length }, policy, now }));
  const proofCompleteness = allocations.map((allocation) => calculateAllocationProofCompletenessFromInput({ allocationId: allocation.id, investorId: allocation.investorId, proofs: allocation.proofs, monthlyReportLinkCount: allocation.monthlyReports.length, policy }));
  const latestRiskEventByAllocationId = new Map<string, Date>();
  for (const event of riskEvents) {
    if (!latestRiskEventByAllocationId.has(event.entityId)) latestRiskEventByAllocationId.set(event.entityId, event.createdAt);
  }

  let notifications = { available: true, pendingCount: 0, failedCount: 0 };
  try {
    const [pendingCount, failedCount] = await Promise.all([
      prisma.notificationEvent.count({ where: { status: "PENDING" } }),
      prisma.notificationEvent.count({ where: { status: "FAILED" } })
    ]);
    notifications = { available: true, pendingCount, failedCount };
  } catch {
    notifications = { available: false, pendingCount: 0, failedCount: 0 };
  }

  await Promise.all(reports.map((report) => {
    const proofSnapshot = parseProofSnapshot(report.proofSummaryJson);
    const staleSnapshot = isDraftSnapshotStale(report);
    return syncOperationalIncidentFromSnapshotIntegrity({
      reportId: report.id,
      investorId: report.investorId,
      status: report.status,
      missingProofSnapshot: report.status === "PUBLISHED" && !proofSnapshot.hasProofSnapshot,
      missingReconciliationSnapshot: report.status === "PUBLISHED" && !parseReconciliationSnapshot(report.proofSummaryJson),
      missingRiskSnapshot: report.status === "PUBLISHED" && !parseRiskSnapshot(report.proofSummaryJson),
      staleSnapshot,
      staleHours: staleSnapshot ? draftSnapshotStaleHours(report) : null,
      actor: "checkpoint-health"
    });
  }));

  const openIncidents = await getOpenOperationalIncidents();

  const metrics: CheckpointHealthMetrics = {
    readiness: {
      draftReportsCount: draftReports.length,
      blockedReportsCount: readinessEvaluations.filter((evaluation) => evaluation.state === "BLOCKED").length,
      reportsNeedingWarningAcknowledgment: readinessEvaluations.filter((evaluation) => evaluation.requiresAcknowledgment && evaluation.warnings.length > 0).length,
      staleSnapshotCount: reports.filter(isDraftSnapshotStale).length
    },
    reconciliation: {
      brokenAllocationsCount: reconciliations.filter((item) => item.status === "BROKEN").length,
      warningAllocationsCount: reconciliations.filter((item) => item.status === "WARNING").length,
      latestReconciliationIssueCount: reconciliations.reduce((sum, item) => sum + item.blockingIssues.length + item.warnings.length, 0)
    },
    risk: {
      criticalRiskAllocationsCount: risks.filter((risk) => risk.level === "CRITICAL").length,
      highRiskAllocationsCount: risks.filter((risk) => risk.level === "HIGH").length,
      latestRiskEventCount,
      overdueRiskEvaluations: allocations.filter((allocation) => ACTIVE_ALLOCATION_STATUSES.has(allocation.status) && ((latestRiskEventByAllocationId.get(allocation.id)?.getTime() ?? 0) < riskSince.getTime())).length
    },
    withdrawals: {
      requestedCount: withdrawals.filter((withdrawal) => withdrawal.status === "REQUESTED").length,
      approvedCount: withdrawals.filter((withdrawal) => withdrawal.status === "APPROVED").length,
      scheduledCount: withdrawals.filter((withdrawal) => withdrawal.status === "SCHEDULED").length,
      overdueScheduledPayoutsCount: withdrawals.filter((withdrawal) => withdrawal.status === "SCHEDULED" && withdrawal.scheduledFor && withdrawal.scheduledFor.getTime() < now.getTime()).length
    },
    proof: {
      averageProofCompleteness: proofCompleteness.length ? Math.round(proofCompleteness.reduce((sum, item) => sum + item.score, 0) / proofCompleteness.length) : 100,
      incompleteAllocationsCount: proofCompleteness.filter((item) => item.state === "INCOMPLETE" || item.state === "HIGH_RISK").length,
      highRiskProofGapsCount: proofCompleteness.filter((item) => item.state === "HIGH_RISK").length
    },
    notifications,
    incidents: buildIncidentSummary(openIncidents, now),
    snapshotIntegrity: {
      publishedReportsMissingProofSnapshot: reports.filter((report) => report.status === "PUBLISHED" && !parseProofSnapshot(report.proofSummaryJson).hasProofSnapshot).length,
      publishedReportsMissingReconciliationSnapshot: reports.filter((report) => report.status === "PUBLISHED" && !parseReconciliationSnapshot(report.proofSummaryJson)).length,
      publishedReportsMissingRiskSnapshot: reports.filter((report) => report.status === "PUBLISHED" && !parseRiskSnapshot(report.proofSummaryJson)).length,
      draftReportsWithStaleSnapshot: reports.filter(isDraftSnapshotStale).length
    }
  };

  return buildCheckpointHealthSnapshotFromMetrics(metrics, now);
}

export async function getCheckpointHealthSnapshot(now?: Date) {
  return getAdminCheckpointHealthSummary(now);
}

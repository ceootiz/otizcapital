import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

import {
  buildCheckpointHealthSnapshotFromMetrics,
  getCheckpointHealthIssues,
  type CheckpointHealthMetrics,
} from "./checkpoint-health";

function healthyMetrics(): CheckpointHealthMetrics {
  return {
    readiness: {
      draftReportsCount: 0,
      blockedReportsCount: 0,
      reportsNeedingWarningAcknowledgment: 0,
      staleSnapshotCount: 0,
    },
    reconciliation: {
      brokenAllocationsCount: 0,
      warningAllocationsCount: 0,
      latestReconciliationIssueCount: 0,
    },
    risk: {
      criticalRiskAllocationsCount: 0,
      highRiskAllocationsCount: 0,
      latestRiskEventCount: 0,
      overdueRiskEvaluations: 0,
    },
    withdrawals: {
      requestedCount: 0,
      approvedCount: 0,
      scheduledCount: 0,
      overdueScheduledPayoutsCount: 0,
    },
    proof: {
      averageProofCompleteness: 100,
      incompleteAllocationsCount: 0,
      highRiskProofGapsCount: 0,
    },
    notifications: {
      available: true,
      pendingCount: 0,
      failedCount: 0,
    },
    incidents: {
      openCount: 0,
      acknowledgedCount: 0,
      unresolvedCount: 0,
      criticalOpenCount: 0,
      highOpenCount: 0,
      staleUnresolvedCount: 0,
      bySource: {},
    },
    snapshotIntegrity: {
      publishedReportsMissingProofSnapshot: 0,
      publishedReportsMissingReconciliationSnapshot: 0,
      publishedReportsMissingRiskSnapshot: 0,
      draftReportsWithStaleSnapshot: 0,
    },
  };
}

describe("checkpoint health summary", () => {
  it("returns HEALTHY for a clean operational state", () => {
    const snapshot = buildCheckpointHealthSnapshotFromMetrics(
      healthyMetrics(),
      new Date("2026-01-01T00:00:00.000Z"),
    );

    expect(snapshot.overallStatus).toBe("HEALTHY");
    expect(snapshot.score).toBe(100);
    expect(snapshot.issues).toEqual([]);
  });

  it("raises critical health issues for broken reconciliation", () => {
    const metrics = healthyMetrics();
    metrics.reconciliation.brokenAllocationsCount = 1;

    const snapshot = buildCheckpointHealthSnapshotFromMetrics(metrics);

    expect(snapshot.overallStatus).toBe("CRITICAL");
    expect(snapshot.issues.map((issue) => issue.id)).toContain("reconciliation-broken");
  });

  it("raises critical health issues for critical allocation risk", () => {
    const metrics = healthyMetrics();
    metrics.risk.criticalRiskAllocationsCount = 2;

    const snapshot = buildCheckpointHealthSnapshotFromMetrics(metrics);

    expect(snapshot.overallStatus).toBe("CRITICAL");
    expect(snapshot.issues.map((issue) => issue.id)).toContain("risk-critical");
  });

  it("tracks pending and overdue withdrawals", () => {
    const metrics = healthyMetrics();
    metrics.withdrawals.requestedCount = 1;
    metrics.withdrawals.overdueScheduledPayoutsCount = 1;

    const issues = getCheckpointHealthIssues(metrics);

    expect(issues.map((issue) => issue.id)).toContain("withdrawals-pending");
    expect(issues.map((issue) => issue.id)).toContain("withdrawals-overdue");
    expect(buildCheckpointHealthSnapshotFromMetrics(metrics).overallStatus).toBe("CRITICAL");
  });

  it("flags published reports with missing snapshots", () => {
    const metrics = healthyMetrics();
    metrics.snapshotIntegrity.publishedReportsMissingProofSnapshot = 1;

    const snapshot = buildCheckpointHealthSnapshotFromMetrics(metrics);

    expect(snapshot.overallStatus).toBe("CRITICAL");
    expect(snapshot.issues.map((issue) => issue.id)).toContain("snapshot-published-missing");
  });

  it("handles unavailable notification metrics safely", () => {
    const metrics = healthyMetrics();
    metrics.notifications = { available: false };

    const snapshot = buildCheckpointHealthSnapshotFromMetrics(metrics);

    expect(snapshot.overallStatus).toBe("ATTENTION");
    expect(snapshot.issues.map((issue) => issue.id)).toContain("notifications-unavailable");
  });

  it("includes unresolved incidents in checkpoint health", () => {
    const metrics = healthyMetrics();
    metrics.incidents.criticalOpenCount = 1;
    metrics.incidents.unresolvedCount = 1;
    metrics.incidents.openCount = 1;

    const snapshot = buildCheckpointHealthSnapshotFromMetrics(metrics);

    expect(snapshot.overallStatus).toBe("CRITICAL");
    expect(snapshot.issues.map((issue) => issue.id)).toContain("incidents-critical");
  });

  it("keeps the API route admin guarded", () => {
    const routeSource = readFileSync("apps/web/app/api/admin/checkpoint-health/route.ts", "utf8");

    expect(routeSource).toContain("getAdminSession");
    expect(routeSource).toContain("status: 401");
    expect(routeSource).not.toContain("getInvestorSession");
  });
});

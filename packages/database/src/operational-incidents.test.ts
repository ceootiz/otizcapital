import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

import {
  autoResolveOperationalIncident,
  buildIncidentCandidateFromReconciliation,
  buildIncidentCandidateFromReadiness,
  buildIncidentCandidateFromRisk,
  buildIncidentCandidateFromSnapshotIntegrity,
  buildIncidentTriageActions,
  buildIncidentSummary,
  getOperationalIncidentDetail,
  isDuplicateUnresolvedIncident,
  syncOperationalIncidentFromRisk,
  upsertOperationalIncident,
  type CreateOperationalIncidentInput,
  type OperationalIncidentRecord,
} from "./operational-incidents";
import type { AllocationReconciliation } from "./reconciliation";
import type { AllocationRisk } from "./risk-engine";

function baseRisk(overrides: Partial<AllocationRisk> = {}): AllocationRisk {
  return {
    allocationId: "allocation-1",
    score: 92,
    level: "CRITICAL",
    riskFactors: [],
    blockingIssues: [],
    warnings: [],
    investorSafeSummary: { score: 92, level: "CRITICAL", summary: "Manager review required.", visibleFactors: [] },
    adminSummary: "Critical operational risk detected.",
    recommendedActions: [],
    proofCompleteness: null,
    ...overrides,
  };
}

function baseReconciliation(overrides: Partial<AllocationReconciliation> = {}): AllocationReconciliation {
  return {
    allocationId: "allocation-1",
    status: "BROKEN",
    score: 20,
    blockingIssues: [{ id: "sold-over-received", severity: "BLOCKING", message: "Sold units exceed received units." }],
    warnings: [],
    metrics: { entryCount: 3, latestEntryAt: "2026-01-01T00:00:00.000Z" },
    ledgerSummary: {
      inventory: { purchased: 1, received: 1, sold: 2, returned: 0, remainingAdjustment: 0, remaining: -1, inventoryVariance: -1 },
      cash: { cashIn: 0, supplierPayments: 0, logisticsCosts: 0, marketplaceSettlements: 0, marketplaceFees: 0, refunds: 0, payouts: 0, reinvestments: 0, netCashPosition: 0 },
      investorLiability: { capitalAllocated: 0, profitAccrued: 0, payoutsApproved: 0, payoutsPaid: 0, reinvested: 0, lossesRecognized: 0, liabilityAdjustments: 0, liabilityOutstanding: 0, deferredUnpaidShare: 0 },
    },
    latestLedgerEntries: [],
    ...overrides,
  };
}

function incident(overrides: Partial<OperationalIncidentRecord> = {}): OperationalIncidentRecord {
  return {
    id: "incident-1",
    incidentType: "RISK_CRITICAL",
    severity: "CRITICAL",
    status: "OPEN",
    title: "Critical risk",
    summary: "Review required.",
    allocationId: "allocation-1",
    monthlyReportId: null,
    investorId: null,
    source: "risk_engine",
    detectedAt: new Date("2026-01-01T00:00:00.000Z"),
    acknowledgedAt: null,
    acknowledgedBy: null,
    resolvedAt: null,
    resolvedBy: null,
    metadataJson: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

function makeIncidentClient(initial: OperationalIncidentRecord[] = []) {
  const incidents = [...initial];
  const auditEvents: Array<{ action: string; entityId: string; afterJson: string | null }> = [];
  const now = new Date("2026-01-01T00:00:00.000Z");
  const client = {
    operationalIncident: {
      findUnique: async ({ where }: { where: { id: string } }) => incidents.find((record) => record.id === where.id) ? {
        ...incidents.find((record) => record.id === where.id)!,
        allocation: { id: "allocation-1", supplyCode: "SUP-1", productName: "iPhone batch" },
        monthlyReport: { id: "report-1", month: "2026-05", title: "May report" },
        investor: { id: "investor-1", fullName: "Investor One", email: "investor@example.com" },
      } : null,
      findFirst: async ({ where }: { where: Record<string, unknown> }) => incidents.find((record) =>
        record.incidentType === where.incidentType
        && record.source === where.source
        && record.allocationId === where.allocationId
        && record.monthlyReportId === where.monthlyReportId
        && record.investorId === where.investorId
        && record.status !== "RESOLVED"
      ) ?? null,
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const record = incident({
          id: `incident-${incidents.length + 1}`,
          incidentType: String(data.incidentType),
          severity: String(data.severity),
          status: String(data.status ?? "OPEN"),
          title: String(data.title),
          summary: String(data.summary),
          allocationId: data.allocationId === null ? null : String(data.allocationId),
          monthlyReportId: data.monthlyReportId === null ? null : String(data.monthlyReportId),
          investorId: data.investorId === null ? null : String(data.investorId),
          source: String(data.source),
          detectedAt: data.detectedAt instanceof Date ? data.detectedAt : now,
          metadataJson: typeof data.metadataJson === "string" ? data.metadataJson : null,
          createdAt: now,
          updatedAt: now,
        });
        incidents.push(record);
        return record;
      },
      update: async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const record = incidents.find((item) => item.id === where.id);
        if (!record) throw new Error("not found");
        Object.assign(record, data, { updatedAt: now });
        return record;
      },
    },
    auditLog: {
      create: async ({ data }: { data: { action: string; entityId: string; afterJson: string | null } }) => {
        auditEvents.push(data);
        return { id: `audit-${auditEvents.length}`, ...data, createdAt: now };
      },
      findMany: async () => auditEvents.map((event, index) => ({
        id: `audit-${index + 1}`,
        actor: "system",
        action: event.action,
        entityType: "OperationalIncident",
        entityId: event.entityId,
        beforeJson: null,
        afterJson: event.afterJson,
        createdAt: now,
      })),
    },
  };
  return { client: client as never, incidents, auditEvents };
}

describe("operational incident center", () => {
  it("creates a candidate from critical risk", () => {
    const candidate = buildIncidentCandidateFromRisk(baseRisk());

    expect(candidate?.incidentType).toBe("RISK_CRITICAL");
    expect(candidate?.severity).toBe("CRITICAL");
    expect(candidate?.source).toBe("risk_engine");
  });

  it("creates a candidate from broken reconciliation", () => {
    const candidate = buildIncidentCandidateFromReconciliation(baseReconciliation());

    expect(candidate?.incidentType).toBe("RECONCILIATION_BROKEN");
    expect(candidate?.severity).toBe("CRITICAL");
    expect(candidate?.source).toBe("reconciliation");
  });

  it("does not create a duplicate unresolved incident for the same identity", () => {
    const candidate = buildIncidentCandidateFromRisk(baseRisk());

    expect(candidate).not.toBeNull();
    expect(isDuplicateUnresolvedIncident(candidate!, incident())).toBe(true);
    expect(isDuplicateUnresolvedIncident(candidate!, incident({ status: "RESOLVED" }))).toBe(false);
  });

  it("acknowledged and resolved incidents are summarized correctly", () => {
    const summary = buildIncidentSummary([
      incident({ status: "OPEN", severity: "CRITICAL" }),
      incident({ id: "incident-2", status: "ACKNOWLEDGED", severity: "HIGH", detectedAt: new Date("2025-12-27T00:00:00.000Z") }),
      incident({ id: "incident-3", status: "RESOLVED", severity: "CRITICAL" }),
    ], new Date("2026-01-01T00:00:00.000Z"));

    expect(summary.openCount).toBe(1);
    expect(summary.acknowledgedCount).toBe(1);
    expect(summary.unresolvedCount).toBe(2);
    expect(summary.criticalOpenCount).toBe(1);
    expect(summary.highOpenCount).toBe(1);
    expect(summary.staleUnresolvedCount).toBe(1);
    expect(summary.bySource.risk_engine).toBe(2);
  });

  it("creates a candidate from blocked readiness", () => {
    const candidate = buildIncidentCandidateFromReadiness({
      reportId: "report-1",
      investorId: "investor-1",
      state: "BLOCKED",
      blockingIssueCount: 2,
      warningCount: 0,
      score: 42,
    });

    expect(candidate?.incidentType).toBe("READINESS_BLOCKED");
    expect(candidate?.source).toBe("readiness");
    expect(candidate?.severity).toBe("CRITICAL");
  });

  it("creates a candidate from snapshot integrity failures", () => {
    const candidate = buildIncidentCandidateFromSnapshotIntegrity({
      reportId: "report-1",
      investorId: "investor-1",
      status: "PUBLISHED",
      missingProofSnapshot: true,
      missingReconciliationSnapshot: true,
      missingRiskSnapshot: true,
    });

    expect(candidate?.incidentType).toBe("SNAPSHOT_INTEGRITY_FAILURE");
    expect(candidate?.source).toBe("snapshot_integrity");
    expect(candidate?.severity).toBe("CRITICAL");
  });

  it("upserts duplicate unresolved incidents instead of recreating them", async () => {
    const { client, incidents } = makeIncidentClient();
    const input: CreateOperationalIncidentInput = {
      incidentType: "RECONCILIATION_BROKEN",
      source: "reconciliation",
      severity: "CRITICAL",
      title: "Broken reconciliation",
      summary: "Reconciliation is broken.",
      allocationId: "allocation-1",
    };

    const first = await upsertOperationalIncident(input, client);
    const second = await upsertOperationalIncident({ ...input, summary: "Reconciliation is still broken." }, client);

    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(second.updated).toBe(true);
    expect(incidents).toHaveLength(1);
    expect(incidents[0].summary).toBe("Reconciliation is still broken.");
  });

  it("writes auto audit events for create, update, and resolve", async () => {
    const { client, auditEvents } = makeIncidentClient();
    const input: CreateOperationalIncidentInput = {
      incidentType: "RISK_CRITICAL",
      source: "risk_engine",
      severity: "CRITICAL",
      title: "Critical risk",
      summary: "Risk is critical.",
      allocationId: "allocation-1",
    };

    const created = await upsertOperationalIncident(input, client);
    await upsertOperationalIncident({ ...input, title: "Critical risk refreshed" }, client);
    const resolved = await autoResolveOperationalIncident({
      incidentType: "RISK_CRITICAL",
      source: "risk_engine",
      allocationId: "allocation-1",
      monthlyReportId: null,
      investorId: null,
      reason: "Risk returned to normal.",
    }, client);

    expect(created.created).toBe(true);
    expect(resolved.resolved).toBe(true);
    expect(auditEvents.map((event) => event.action)).toEqual([
      "AUTO_CREATE_OPERATIONAL_INCIDENT",
      "AUTO_UPDATE_OPERATIONAL_INCIDENT",
      "AUTO_RESOLVE_OPERATIONAL_INCIDENT",
    ]);
  });

  it("auto-resolves risk incidents when risk drops below high severity", async () => {
    const { client, incidents } = makeIncidentClient();

    await syncOperationalIncidentFromRisk(baseRisk({ level: "CRITICAL", score: 96 }), {}, client);
    await syncOperationalIncidentFromRisk(baseRisk({ level: "ELEVATED", score: 50 }), {}, client);

    expect(incidents).toHaveLength(1);
    expect(incidents[0].status).toBe("RESOLVED");
  });

  it("returns sanitized incident detail with linked refs and audit lifecycle", async () => {
    const { client, incidents, auditEvents } = makeIncidentClient([
      incident({
        metadataJson: JSON.stringify({
          autoCreated: true,
          riskLevel: "CRITICAL",
          riskScore: 96,
          secretToken: "must-not-leak",
          metadataJson: "raw-data",
        }),
        investorId: "investor-1",
        monthlyReportId: "report-1",
      }),
    ]);
    auditEvents.push({
      action: "AUTO_CREATE_OPERATIONAL_INCIDENT",
      entityId: incidents[0].id,
      afterJson: JSON.stringify({
        id: incidents[0].id,
        severity: "CRITICAL",
        status: "OPEN",
        metadata: { autoCreated: true, secretToken: "must-not-leak" },
      }),
    });

    const detail = await getOperationalIncidentDetail(incidents[0].id, client);

    expect(detail?.linkedEntities.allocation?.id).toBe("allocation-1");
    expect(detail?.linkedEntities.monthlyReport?.id).toBe("report-1");
    expect(detail?.linkedEntities.investor?.id).toBe("investor-1");
    expect(detail?.metadataSummary.riskLevel).toBe("CRITICAL");
    expect(JSON.stringify(detail)).not.toContain("must-not-leak");
    expect(JSON.stringify(detail)).not.toContain("metadataJson");
    expect(detail?.auditEvents.map((event) => event.action)).toContain("AUTO_CREATE_OPERATIONAL_INCIDENT");
    expect(detail?.lifecycle.map((event) => event.label)).toContain("Created");
    expect(detail?.recommendedNextAction).toContain("risk timeline");
  });

  it("builds readiness triage actions for the report readiness panel", () => {
    const actions = buildIncidentTriageActions(incident({
      source: "readiness",
      allocationId: null,
      monthlyReportId: "report-1",
      investorId: "investor-1",
    }), "en");

    expect(actions[0]).toMatchObject({
      label: "Open report readiness",
      href: "/en/admin/reports/report-1#readiness",
      kind: "primary",
      anchor: "readiness",
    });
  });

  it("builds reconciliation triage actions for allocation reconciliation", () => {
    const actions = buildIncidentTriageActions(incident({
      source: "reconciliation",
      allocationId: "allocation-1",
      monthlyReportId: null,
    }), "en");

    expect(actions[0]).toMatchObject({
      label: "Open allocation reconciliation",
      href: "/en/admin/allocations/allocation-1#reconciliation",
      anchor: "reconciliation",
    });
  });

  it("builds risk and snapshot triage actions without broken links", () => {
    const riskActions = buildIncidentTriageActions(incident({
      source: "risk_engine",
      allocationId: null,
      monthlyReportId: "report-1",
    }), "en");
    const snapshotActions = buildIncidentTriageActions(incident({
      source: "snapshot_integrity",
      allocationId: null,
      monthlyReportId: "report-1",
    }), "en");
    const missingLinkActions = buildIncidentTriageActions(incident({
      source: "snapshot_integrity",
      allocationId: null,
      monthlyReportId: null,
      investorId: null,
    }), "en");

    expect(riskActions[0]).toMatchObject({ label: "Open report risk timeline", href: "/en/admin/reports/report-1#risk" });
    expect(snapshotActions[0]).toMatchObject({ label: "Open report snapshots", href: "/en/admin/reports/report-1#snapshots" });
    expect(missingLinkActions).toEqual([]);
  });

  it("builds proof, withdrawal, and fallback linked entity actions", () => {
    const proofActions = buildIncidentTriageActions(incident({ source: "proof_completeness", allocationId: "allocation-1" }), "en");
    const withdrawalActions = buildIncidentTriageActions(incident({ source: "withdrawal", investorId: "investor-1", allocationId: null }), "en");
    const manualActions = buildIncidentTriageActions(incident({ source: "manual", allocationId: null, monthlyReportId: null, investorId: "investor-1" }), "en");

    expect(proofActions[0]).toMatchObject({ label: "Open proof requirements", href: "/en/admin/allocations/allocation-1#proofs" });
    expect(withdrawalActions[0]).toMatchObject({ label: "Open withdrawals", href: "/en/admin/withdrawals" });
    expect(manualActions[0]).toMatchObject({ label: "Open investor", href: "/en/admin/investors/investor-1" });
  });

  it("keeps incident APIs admin guarded", () => {
    const listRoute = readFileSync("apps/web/app/api/admin/incidents/route.ts", "utf8");
    const detailRoute = readFileSync("apps/web/app/api/admin/incidents/[id]/route.ts", "utf8");
    const acknowledgeRoute = readFileSync("apps/web/app/api/admin/incidents/[id]/acknowledge/route.ts", "utf8");
    const resolveRoute = readFileSync("apps/web/app/api/admin/incidents/[id]/resolve/route.ts", "utf8");

    expect(listRoute).toContain("getAdminSession");
    expect(detailRoute).toContain("getAdminSession");
    expect(detailRoute).not.toContain("getInvestorSession");
    expect(acknowledgeRoute).toContain("verifyAdminCsrfToken");
    expect(resolveRoute).toContain("verifyAdminCsrfToken");
    expect(`${listRoute}${detailRoute}${acknowledgeRoute}${resolveRoute}`).not.toContain("getInvestorSession");
  });

  it("renders the admin Details action without exposing it to investor pages", () => {
    const adminPage = readFileSync("apps/web/components/admin/admin-incidents-page.tsx", "utf8");
    const investorDashboard = readFileSync("apps/web/app/[locale]/investor/dashboard/page.tsx", "utf8");

    expect(adminPage).toContain("Details");
    expect(adminPage).toContain("Triage actions");
    expect(adminPage).toContain("triageActions");
    expect(adminPage).toContain("IncidentDetailDrawer");
    expect(investorDashboard).not.toContain("IncidentDetailDrawer");
    expect(investorDashboard).not.toContain("Triage actions");
    expect(investorDashboard).not.toContain("Incident center");
  });

  it("keeps admin triage anchors on operational detail pages", () => {
    const allocationPage = readFileSync("apps/web/components/admin/admin-allocation-detail-page.tsx", "utf8");
    const reportPage = readFileSync("apps/web/components/admin/admin-report-detail-page.tsx", "utf8");

    expect(allocationPage).toContain('id="proofs"');
    expect(allocationPage).toContain('id="risk"');
    expect(allocationPage).toContain('id="reconciliation"');
    expect(reportPage).toContain('id="readiness"');
    expect(reportPage).toContain('id="reconciliation"');
    expect(reportPage).toContain('id="risk"');
    expect(reportPage).toContain('id="snapshots"');
  });
});

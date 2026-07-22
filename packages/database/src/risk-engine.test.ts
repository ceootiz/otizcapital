import { readdirSync, readFileSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { evaluateMonthlyReportReadinessFromInput } from "./report-readiness";
import { calculateAllocationRisk, calculateAllocationRiskFromInput, calculatePortfolioRiskFromAllocations, diffRiskSnapshots, getAllocationRiskTimeline, getReportRiskTimeline, parseInvestorSafeRiskSummary, parseRiskSnapshot, recordRiskEvaluationEvent, summarizeRiskChange, type AllocationRisk } from "./risk-engine";
import { getSafeDefaultReadinessPolicy, type SerializedReadinessPolicy } from "./readiness-policies";
import { prisma } from "./client";
import { regenerateMonthlyReportProofSnapshotRecord } from "./monthly-reports";

const databaseIt = it.runIf(process.env.OTIZ_DB_TESTS_ENABLED === "true");

const relaxedPolicy: SerializedReadinessPolicy = {
  ...getSafeDefaultReadinessPolicy(),
  id: "risk-test-policy",
  name: "Risk test policy",
  requiredProofCategories: [],
  warningProofCategories: [],
  minimumProofCompletenessScore: 0,
  source: "default"
};

const zeroLedgerSummary = {
  inventory: { purchased: 0, received: 0, sold: 0, returned: 0, remainingAdjustment: 0, remaining: 0, inventoryVariance: 0 },
  cash: { cashIn: 0, supplierPayments: 0, logisticsCosts: 0, marketplaceSettlements: 0, marketplaceFees: 0, refunds: 0, payouts: 0, reinvestments: 0, netCashPosition: 0 },
  investorLiability: { capitalAllocated: 0, profitAccrued: 0, payoutsApproved: 0, payoutsPaid: 0, reinvested: 0, lossesRecognized: 0, liabilityAdjustments: 0, liabilityOutstanding: 0, deferredUnpaidShare: 0 }
};

function readSourceTree(directory: string): string {
  try {
    return readdirSync(directory).map((entry) => {
      const path = `${directory}/${entry}`;
      const stat = statSync(path);
      if (stat.isDirectory()) return readSourceTree(path);
      return path.endsWith(".ts") || path.endsWith(".tsx") ? readFileSync(path, "utf8") : "";
    }).join("\n");
  } catch {
    return "";
  }
}

function snapshotJson(allocationId: string, generatedAt = "2026-06-10T00:00:00.000Z") {
  return JSON.stringify({
    generatedAt,
    available: {},
    verified: {},
    excluded: {},
    allocations: [{
      id: allocationId,
      proofCompleteness: {
        allocationId,
        score: 100,
        state: "VERIFIED",
        presentCategories: [],
        missingRequiredCategories: [],
        missingRecommendedCategories: [],
        hiddenProofCount: 0,
        rejectedProofCount: 0,
        unreviewedProofCount: 0,
        supersededProofCount: 0,
        investorSafeSummary: "Evidence coverage is verified.",
        adminWarnings: [],
        policyThreshold: 0
      },
      risk: {
        score: 10,
        level: "LOW",
        summary: "Operational risk is currently low based on available commerce, proof, and payout controls.",
        visibleFactors: ["Standard operational monitoring"]
      }
    }],
    reconciliationSummary: {
      generatedAt,
      allocations: [{
        allocationId,
        status: "BALANCED",
        score: 100,
        ledgerSummary: zeroLedgerSummary,
        investorSafeSummary: {
          status: "BALANCED",
          score: 100,
          capitalDeployed: "0",
          capitalReturned: "0",
          payoutStatus: "Not ready",
          inventoryProgressSummary: "Inventory progress is balanced.",
          exceptionNotice: null
        },
        exceptionSummary: { blockingIssueCount: 0, warningCount: 0 }
      }],
      portfolioTotals: zeroLedgerSummary,
      exceptionsSummary: { blockingIssueCount: 0, warningCount: 0 }
    },
    riskSummary: {
      generatedAt,
      portfolioRisk: {
        investorId: "investor-risk",
        score: 10,
        level: "LOW",
        riskFactors: [],
        blockingIssues: [],
        warnings: [],
        investorSafeSummary: {
          score: 10,
          level: "LOW",
          summary: "Operational risk is currently low based on available commerce, proof, and payout controls.",
          visibleFactors: ["Standard operational monitoring"]
        },
        adminSummary: "No material portfolio risk signals detected.",
        recommendedActions: [],
        allocationRisks: []
      },
      allocations: [],
      materialRiskEvents: []
    }
  });
}

describe("risk engine v1", () => {
  it("returns high or critical risk for negative inventory", () => {
    const risk = calculateAllocationRiskFromInput({
      allocation: {
        id: "allocation-negative-inventory",
        investorId: "investor-risk",
        status: "SELLING",
        allocationAmount: "5000",
        expectedCycleDays: 30,
        createdAt: new Date("2026-06-01T00:00:00.000Z"),
        ledgerEntries: [
          { ledgerType: "INVENTORY", allocationId: "allocation-negative-inventory", entryType: "UNITS_PURCHASED", amount: "0", quantity: 1, sourceType: "ALLOCATION", description: "Purchased" },
          { ledgerType: "INVENTORY", allocationId: "allocation-negative-inventory", entryType: "UNITS_RECEIVED", amount: "0", quantity: 1, sourceType: "ALLOCATION", description: "Received" },
          { ledgerType: "INVENTORY", allocationId: "allocation-negative-inventory", entryType: "UNITS_SOLD", amount: "0", quantity: 3, sourceType: "MARKETPLACE_SETTLEMENT", description: "Sold" }
        ]
      },
      policy: relaxedPolicy,
      now: new Date("2026-06-10T00:00:00.000Z")
    });

    expect(["HIGH", "CRITICAL"]).toContain(risk.level);
    expect(risk.riskFactors.some((factor) => factor.id === "negative-remaining-inventory")).toBe(true);
  });

  it("detects payout imbalance risk", () => {
    const risk = calculateAllocationRiskFromInput({
      allocation: {
        id: "allocation-payout-imbalance",
        investorId: "investor-risk",
        status: "COMPLETED",
        allocationAmount: "5000",
        ledgerEntries: [
          { ledgerType: "INVESTOR_LIABILITY", allocationId: "allocation-payout-imbalance", entryType: "PAYOUT_APPROVED", amount: "100", sourceType: "WITHDRAWAL_REQUEST", description: "Approved" },
          { ledgerType: "INVESTOR_LIABILITY", allocationId: "allocation-payout-imbalance", entryType: "PAYOUT_PAID", amount: "250", sourceType: "WITHDRAWAL_REQUEST", description: "Paid" }
        ]
      },
      policy: relaxedPolicy
    });

    expect(risk.riskFactors.some((factor) => factor.id === "payout-paid-exceeds-approved")).toBe(true);
    expect(risk.blockingIssues.length).toBeGreaterThan(0);
  });

  it("raises proof risk when proof completeness is below policy threshold", () => {
    const risk = calculateAllocationRiskFromInput({
      allocation: {
        id: "allocation-low-proof",
        investorId: "investor-risk",
        status: "SELLING",
        allocationAmount: "5000",
        proofs: [],
        ledgerEntries: []
      }
    });

    expect(risk.riskFactors.some((factor) => factor.id === "low-proof-completeness")).toBe(true);
    expect(risk.proofCompleteness?.score).toBeLessThan(risk.proofCompleteness?.policyThreshold ?? 0);
  });

  it("detects excessive reversals as operational risk", () => {
    const risk = calculateAllocationRiskFromInput({
      allocation: {
        id: "allocation-reversals",
        investorId: "investor-risk",
        status: "SELLING",
        allocationAmount: "5000",
        ledgerEntries: [
          { ledgerType: "CASH", allocationId: "allocation-reversals", entryType: "SUPPLIER_PAYMENT", amount: "-100", sourceType: "MANUAL_ADJUSTMENT", description: "Reversal one", isReversal: true },
          { ledgerType: "CASH", allocationId: "allocation-reversals", entryType: "SUPPLIER_PAYMENT", amount: "-100", sourceType: "MANUAL_ADJUSTMENT", description: "Reversal two", isReversal: true },
          { ledgerType: "CASH", allocationId: "allocation-reversals", entryType: "SUPPLIER_PAYMENT", amount: "-100", sourceType: "MANUAL_ADJUSTMENT", description: "Reversal three", isReversal: true }
        ]
      },
      policy: relaxedPolicy
    });

    expect(risk.riskFactors.some((factor) => factor.id === "excessive-reversals")).toBe(true);
  });

  it("aggregates portfolio risk for only that investor", () => {
    const portfolio = calculatePortfolioRiskFromAllocations({
      investorId: "investor-a",
      allocations: [
        { id: "allocation-a", investorId: "investor-a", status: "SELLING", allocationAmount: "5000", ledgerEntries: [{ ledgerType: "INVENTORY", allocationId: "allocation-a", entryType: "UNITS_SOLD", amount: "0", quantity: 3, sourceType: "MARKETPLACE_SETTLEMENT", description: "Sold without stock" }] },
        { id: "allocation-b", investorId: "investor-b", status: "SELLING", allocationAmount: "50000", ledgerEntries: [{ ledgerType: "INVESTOR_LIABILITY", allocationId: "allocation-b", entryType: "PAYOUT_PAID", amount: "10000", sourceType: "WITHDRAWAL_REQUEST", description: "Other investor paid" }] }
      ],
      policy: relaxedPolicy
    });

    expect(portfolio.allocationRisks).toHaveLength(1);
    expect(portfolio.allocationRisks[0]?.allocationId).toBe("allocation-a");
  });

  it("adds critical risk to monthly report readiness blocking issues", () => {
    const evaluation = evaluateMonthlyReportReadinessFromInput({
      policy: relaxedPolicy,
      now: new Date("2026-06-10T00:00:00.000Z"),
      report: {
        id: "report-risk-critical",
        investorId: "investor-risk",
        status: "DRAFT",
        summary: "Operational risk disclosure is included.",
        performanceNote: "Operational note.",
        payoutNote: "No payout is promised.",
        proofSummaryJson: snapshotJson("allocation-risk-critical")
      },
      linkedAllocations: [{
        allocationId: "allocation-risk-critical",
        createdAt: new Date("2026-06-01T00:00:00.000Z"),
        updatedAt: new Date("2026-06-01T00:00:00.000Z"),
        allocation: {
          id: "allocation-risk-critical",
          investorId: "investor-risk",
          status: "SELLING",
          allocationAmount: "5000",
          expectedCycleDays: 30,
          expectedPayoutAt: new Date("2026-07-01T00:00:00.000Z"),
          createdAt: new Date("2026-06-01T00:00:00.000Z"),
          proofs: [],
          ledgerEntries: [
            { ledgerType: "INVENTORY", allocationId: "allocation-risk-critical", entryType: "UNITS_RECEIVED", amount: "0", quantity: 1, sourceType: "ALLOCATION", description: "Received" },
            { ledgerType: "INVENTORY", allocationId: "allocation-risk-critical", entryType: "UNITS_SOLD", amount: "0", quantity: 5, sourceType: "MARKETPLACE_SETTLEMENT", description: "Sold" }
          ]
        }
      }]
    });

    expect(evaluation.state).toBe("BLOCKED");
    expect(evaluation.blockingIssues.some((issue) => issue.id === "risk-not-critical")).toBe(true);
    expect(evaluation.metrics.criticalRiskCount).toBeGreaterThan(0);
  });

  it("requires acknowledgment for high non-critical risk", () => {
    const evaluation = evaluateMonthlyReportReadinessFromInput({
      policy: relaxedPolicy,
      now: new Date("2026-06-10T00:00:00.000Z"),
      report: {
        id: "report-risk-high",
        investorId: "investor-risk",
        status: "DRAFT",
        summary: "Operational risk disclosure is included.",
        performanceNote: "Operational note.",
        payoutNote: "No payout is promised.",
        proofSummaryJson: snapshotJson("allocation-risk-high")
      },
      linkedAllocations: [{
        allocationId: "allocation-risk-high",
        createdAt: new Date("2026-06-01T00:00:00.000Z"),
        updatedAt: new Date("2026-06-01T00:00:00.000Z"),
        allocation: {
          id: "allocation-risk-high",
          investorId: "investor-risk",
          status: "SELLING",
          allocationAmount: "25000",
          riskLevel: "ELEVATED",
          expectedCycleDays: 30,
          expectedPayoutAt: new Date("2026-07-01T00:00:00.000Z"),
          createdAt: new Date("2026-06-01T00:00:00.000Z"),
          proofs: [],
          ledgerEntries: [
            { ledgerType: "CASH", allocationId: "allocation-risk-high", entryType: "SUPPLIER_PAYMENT", amount: "-100", sourceType: "MANUAL_ADJUSTMENT", description: "Reversal one", isReversal: true },
            { ledgerType: "CASH", allocationId: "allocation-risk-high", entryType: "SUPPLIER_PAYMENT", amount: "-100", sourceType: "MANUAL_ADJUSTMENT", description: "Reversal two", isReversal: true },
            { ledgerType: "CASH", allocationId: "allocation-risk-high", entryType: "SUPPLIER_PAYMENT", amount: "-100", sourceType: "MANUAL_ADJUSTMENT", description: "Reversal three", isReversal: true },
            { ledgerType: "CASH", allocationId: "allocation-risk-high", entryType: "LOGISTICS_COST", amount: "25", sourceType: "MANUAL_ADJUSTMENT", description: "Manual adjustment review" }
          ]
        }
      }]
    });

    expect(evaluation.state).toBe("NEEDS_REVIEW");
    expect(evaluation.requiresAcknowledgment).toBe(true);
    expect(evaluation.warnings.some((issue) => issue.id === "high-risk-reviewed")).toBe(true);
  });

  it("keeps investor summaries safe and parses frozen risk snapshots", () => {
    const summary = parseInvestorSafeRiskSummary({
      score: 67,
      level: "HIGH",
      summary: "Operational risk is high and requires manager review before reporting decisions.",
      visibleFactors: ["Expected payout overdue"]
    });
    const frozen = snapshotJson("allocation-frozen-risk");
    const snapshot = parseRiskSnapshot(frozen);
    const recalculated = calculateAllocationRiskFromInput({
      allocation: {
        id: "allocation-frozen-risk",
        investorId: "investor-risk",
        status: "SELLING",
        allocationAmount: "5000",
        ledgerEntries: [{ ledgerType: "INVENTORY", allocationId: "allocation-frozen-risk", entryType: "UNITS_SOLD", amount: "0", quantity: 5, sourceType: "MARKETPLACE_SETTLEMENT", description: "New issue after snapshot" }]
      },
      policy: relaxedPolicy
    });

    expect(summary?.visibleFactors.join(" ")).not.toContain("MANUAL_ADJUSTMENT");
    expect(snapshot?.portfolioRisk.level).toBe("LOW");
    expect(recalculated.level).not.toBe(snapshot?.portfolioRisk.level);
    expect(frozen).not.toContain("metadataJson");
  });

  it("diffs risk snapshots for level, factor, and blocking issue changes", () => {
    const previous = calculateAllocationRiskFromInput({
      allocation: {
        id: "allocation-risk-diff",
        investorId: "investor-risk",
        status: "SELLING",
        allocationAmount: "5000",
        proofs: [],
        ledgerEntries: []
      },
      policy: relaxedPolicy
    });
    const current = calculateAllocationRiskFromInput({
      allocation: {
        id: "allocation-risk-diff",
        investorId: "investor-risk",
        status: "SELLING",
        allocationAmount: "5000",
        ledgerEntries: [
          { ledgerType: "INVESTOR_LIABILITY", allocationId: "allocation-risk-diff", entryType: "PAYOUT_APPROVED", amount: "100", sourceType: "WITHDRAWAL_REQUEST", description: "Approved" },
          { ledgerType: "INVESTOR_LIABILITY", allocationId: "allocation-risk-diff", entryType: "PAYOUT_PAID", amount: "250", sourceType: "WITHDRAWAL_REQUEST", description: "Paid" }
        ]
      },
      policy: relaxedPolicy
    });

    const diff = diffRiskSnapshots(previous, current);
    const reverseDiff = diffRiskSnapshots(current, previous);

    expect(diff.previousLevel).toBe(previous.level);
    expect(diff.currentLevel).toBe(current.level);
    expect(diff.newRiskFactors.some((factor) => factor.id === "payout-paid-exceeds-approved")).toBe(true);
    expect(diff.newBlockingIssues.some((factor) => factor.id === "payout-paid-exceeds-approved")).toBe(true);
    expect(reverseDiff.resolvedRiskFactors.some((factor) => factor.id === "payout-paid-exceeds-approved")).toBe(true);
    expect(reverseDiff.resolvedBlockingIssues.some((factor) => factor.id === "payout-paid-exceeds-approved")).toBe(true);
    expect(summarizeRiskChange(diff)).toContain("new risk factor");
  });

  databaseIt("records sanitized risk timeline metadata", async () => {
    const entityId = `risk-sanitized-${Date.now()}-${Math.round(Math.random() * 100000)}`;
    const sensitiveRisk: AllocationRisk = {
      allocationId: entityId,
      score: 100,
      level: "CRITICAL",
      riskFactors: [{
        id: "raw-ledger-risk",
        category: "CASH",
        severity: "CRITICAL",
        label: "Sensitive cash variance",
        description: "Do not leak bankAccount=123 metadataJson secretToken.",
        investorVisible: false
      }],
      blockingIssues: [{
        id: "raw-ledger-risk",
        category: "CASH",
        severity: "CRITICAL",
        label: "Sensitive cash variance",
        description: "Do not leak bankAccount=123 metadataJson secretToken.",
        investorVisible: false
      }],
      warnings: [],
      investorSafeSummary: {
        score: 100,
        level: "CRITICAL",
        summary: "Operational risk is critical and requires resolution before standard reporting.",
        visibleFactors: ["Standard operational monitoring"]
      },
      adminSummary: "Sensitive admin summary should not be required for timeline metadata.",
      recommendedActions: ["Review source records."],
      proofCompleteness: null
    };

    await recordRiskEvaluationEvent({
      entityType: "Allocation",
      entityId,
      actor: "admin",
      source: "manual_evaluation",
      currentRisk: sensitiveRisk
    });

    const event = await prisma.auditLog.findFirst({ where: { entityType: "Allocation", entityId, action: "EVALUATE_ALLOCATION_RISK" }, orderBy: { createdAt: "desc" } });
    expect(event?.afterJson).toContain("Sensitive cash variance");
    expect(event?.afterJson).not.toContain("bankAccount");
    expect(event?.afterJson).not.toContain("secretToken");
    expect(event?.afterJson).not.toContain("metadataJson");

    const timeline = await getAllocationRiskTimeline(entityId);
    const evaluationEvent = timeline.events.find((eventItem) => eventItem.action === "EVALUATE_ALLOCATION_RISK");
    expect(evaluationEvent?.risk?.level).toBe("CRITICAL");
    expect(evaluationEvent?.diff?.newBlockingIssues[0]?.label).toBe("Sensitive cash variance");
    expect(evaluationEvent?.details.currentLevel).toBe("CRITICAL");
    expect(evaluationEvent?.details.currentScore).toBe(100);
    expect(evaluationEvent?.details.newBlockingIssues[0]?.label).toBe("Sensitive cash variance");
    expect(JSON.stringify(evaluationEvent?.details)).not.toContain("bankAccount");
    expect(JSON.stringify(evaluationEvent?.details)).not.toContain("secretToken");
    expect(JSON.stringify(evaluationEvent?.details)).not.toContain("metadataJson");
  });

  databaseIt("includes sanitized risk timeline event details for level, score, and factor diffs", async () => {
    const entityId = `risk-details-${Date.now()}-${Math.round(Math.random() * 100000)}`;
    await prisma.auditLog.create({
      data: {
        actor: "admin",
        action: "EVALUATE_ALLOCATION_RISK",
        entityType: "Allocation",
        entityId,
        afterJson: JSON.stringify({
          source: "manual_evaluation",
          summary: "Risk details changed without raw metadataJson ledger notes.",
          risk: {
            level: "HIGH",
            score: 74,
            riskFactors: [{ id: "new-proof-risk", category: "PROOF", severity: "HIGH", label: "Missing proof" }],
            blockingIssues: [{ id: "new-blocker", category: "CASH", severity: "CRITICAL", label: "Payout imbalance" }]
          },
          diff: {
            previousLevel: "MODERATE",
            currentLevel: "HIGH",
            previousScore: 45,
            currentScore: 74,
            newRiskFactors: [{ id: "new-proof-risk", category: "PROOF", severity: "HIGH", label: "Missing proof" }],
            resolvedRiskFactors: [{ id: "old-aging-risk", category: "INVENTORY", severity: "MEDIUM", label: "Aging resolved" }],
            newBlockingIssues: [{ id: "new-blocker", category: "CASH", severity: "CRITICAL", label: "Payout imbalance" }],
            resolvedBlockingIssues: [{ id: "old-blocker", category: "OPERATIONAL", severity: "HIGH", label: "Correction reviewed" }]
          }
        })
      }
    });

    const timeline = await getAllocationRiskTimeline(entityId, { source: "manual_evaluation" });
    const event = timeline.events[0];

    expect(event?.details.previousLevel).toBe("MODERATE");
    expect(event?.details.currentLevel).toBe("HIGH");
    expect(event?.details.previousScore).toBe(45);
    expect(event?.details.currentScore).toBe(74);
    expect(event?.details.newFactors[0]?.label).toBe("Missing proof");
    expect(event?.details.resolvedFactors[0]?.label).toBe("Aging resolved");
    expect(event?.details.newBlockingIssues[0]?.label).toBe("Payout imbalance");
    expect(event?.details.resolvedBlockingIssues[0]?.label).toBe("Correction reviewed");
    expect(JSON.stringify(event?.details)).not.toContain("metadataJson");
  });

  databaseIt("filters risk timelines by source, unknown source, and capped limit", async () => {
    const entityId = `risk-filter-${Date.now()}-${Math.round(Math.random() * 100000)}`;
    const safeRisk: AllocationRisk = {
      allocationId: entityId,
      score: 12,
      level: "LOW",
      riskFactors: [],
      blockingIssues: [],
      warnings: [],
      investorSafeSummary: {
        score: 12,
        level: "LOW",
        summary: "Operational risk is currently low based on available controls.",
        visibleFactors: ["Standard operational monitoring"]
      },
      adminSummary: "No material risk signals detected.",
      recommendedActions: [],
      proofCompleteness: null
    };

    await recordRiskEvaluationEvent({
      entityType: "Allocation",
      entityId,
      actor: "admin",
      source: "manual_evaluation",
      currentRisk: safeRisk
    });
    await recordRiskEvaluationEvent({
      entityType: "Allocation",
      entityId,
      actor: "admin",
      source: "report_snapshot",
      currentRisk: safeRisk
    });
    await prisma.auditLog.create({
      data: {
        actor: "admin",
        action: "EVALUATE_ALLOCATION_RISK",
        entityType: "Allocation",
        entityId,
        afterJson: JSON.stringify({
          source: "external_or_missing",
          summary: "Unknown source risk evaluation",
          risk: { level: "LOW", score: 12, riskFactors: [], blockingIssues: [] },
          diff: {
            previousLevel: null,
            currentLevel: "LOW",
            previousScore: null,
            currentScore: 12,
            newRiskFactors: [],
            resolvedRiskFactors: [],
            newBlockingIssues: [],
            resolvedBlockingIssues: []
          }
        })
      }
    });

    const manualTimeline = await getAllocationRiskTimeline(entityId, { source: "manual_evaluation" });
    const snapshotTimeline = await getAllocationRiskTimeline(entityId, { source: "report_snapshot" });
    const unknownTimeline = await getAllocationRiskTimeline(entityId, { source: "unknown" });
    const cappedTimeline = await getAllocationRiskTimeline(entityId, { limit: "500" });

    expect(manualTimeline.appliedFilters).toEqual({ source: "manual_evaluation", limit: 20 });
    expect(manualTimeline.events.every((event) => event.source === "manual_evaluation")).toBe(true);
    expect(snapshotTimeline.events.every((event) => event.source === "report_snapshot")).toBe(true);
    expect(unknownTimeline.events.every((event) => event.source === "unknown")).toBe(true);
    expect(unknownTimeline.events.some((event) => event.summary === "Unknown source risk evaluation")).toBe(true);
    expect(cappedTimeline.appliedFilters.limit).toBe(100);
    expect(cappedTimeline.appliedFilters.source).toBe("all");
  });

  it("keeps risk timeline details controls admin-only in source", () => {
    const adminAllocationSource = readFileSync("apps/web/components/admin/admin-allocation-detail-page.tsx", "utf8");
    const adminReportSource = readFileSync("apps/web/components/admin/admin-report-detail-page.tsx", "utf8");
    const investorSource = `${readSourceTree("apps/web/app/[locale]/investor")}\n${readSourceTree("apps/web/components/investor")}`;

    // The details toggle is now localized (button renders {t.DETAILS}/{t.details}
    // with an English "Details" label), so scan for the localized markup + label
    // rather than the old hard-coded button text.
    expect(adminAllocationSource).toContain(">{t.DETAILS}</Button>");
    expect(adminAllocationSource).toContain('DETAILS: "Details"');
    expect(adminReportSource).toContain(">{t.details}</Button>");
    expect(adminReportSource).toContain('details: "Details"');
    expect(investorSource).not.toContain("Risk timeline");
    expect(investorSource).not.toContain("No detailed diff stored for this event.");
    expect(investorSource).not.toContain("Manual evaluation");
  });

  databaseIt("records risk timeline events on report snapshot regeneration without page-load spam", async () => {
    const suffix = `${Date.now()}-${Math.round(Math.random() * 100000)}`;
    const investor = await prisma.investor.create({ data: { fullName: "Risk Timeline Investor", email: `risk-timeline-${suffix}@example.com`, status: "ACTIVE" } });
    const allocation = await prisma.allocation.create({ data: { investorId: investor.id, supplyCode: `RISK-TL-${suffix}`, productName: "Risk timeline batch", allocationAmount: "5000", status: "SELLING" } });
    await prisma.ledgerEntry.createMany({
      data: [
        { ledgerType: "INVENTORY", allocationId: allocation.id, investorId: investor.id, entryType: "UNITS_RECEIVED", amount: "0", currency: "USD", quantity: 1, occurredAt: new Date("2026-06-01T00:00:00.000Z"), sourceType: "ALLOCATION", description: "Received", createdBy: "admin" },
        { ledgerType: "INVENTORY", allocationId: allocation.id, investorId: investor.id, entryType: "UNITS_SOLD", amount: "0", currency: "USD", quantity: 5, occurredAt: new Date("2026-06-02T00:00:00.000Z"), sourceType: "MARKETPLACE_SETTLEMENT", description: "Sold", createdBy: "admin" }
      ]
    });
    const report = await prisma.monthlyReport.create({ data: { investorId: investor.id, month: "2026-06", title: "Risk timeline report", summary: "Operational report with risk timeline.", status: "DRAFT", proofSummaryJson: JSON.stringify({}) } });
    await prisma.monthlyReportAllocation.create({ data: { monthlyReportId: report.id, allocationId: allocation.id, includedBy: "admin" } });

    const beforePageLoadCount = await prisma.auditLog.count({ where: { entityType: "Allocation", entityId: allocation.id, action: "EVALUATE_ALLOCATION_RISK" } });
    await calculateAllocationRisk(allocation.id);
    await calculateAllocationRisk(allocation.id);
    const afterPageLoadCount = await prisma.auditLog.count({ where: { entityType: "Allocation", entityId: allocation.id, action: "EVALUATE_ALLOCATION_RISK" } });
    expect(afterPageLoadCount).toBe(beforePageLoadCount);

    const result = await regenerateMonthlyReportProofSnapshotRecord({ id: report.id, actor: "admin" });
    expect(result.ok).toBe(true);

    const allocationTimeline = await getAllocationRiskTimeline(allocation.id);
    const reportTimeline = await getReportRiskTimeline(report.id);
    expect(allocationTimeline.events.some((event) => event.action === "EVALUATE_ALLOCATION_RISK" && event.source === "report_snapshot")).toBe(true);
    expect(reportTimeline.events.some((event) => event.action === "EVALUATE_REPORT_RISK" && event.source === "report_snapshot")).toBe(true);
  });

  databaseIt("records manual risk evaluation without mutating published investor report snapshots", async () => {
    const suffix = `${Date.now()}-${Math.round(Math.random() * 100000)}`;
    const investor = await prisma.investor.create({ data: { fullName: "Manual Risk Investor", email: `manual-risk-${suffix}@example.com`, status: "ACTIVE" } });
    const allocation = await prisma.allocation.create({ data: { investorId: investor.id, supplyCode: `MANUAL-RISK-${suffix}`, productName: "Manual risk batch", allocationAmount: "5000", status: "SELLING" } });
    await prisma.ledgerEntry.createMany({
      data: [
        { ledgerType: "INVENTORY", allocationId: allocation.id, investorId: investor.id, entryType: "UNITS_RECEIVED", amount: "0", currency: "USD", quantity: 1, occurredAt: new Date("2026-06-01T00:00:00.000Z"), sourceType: "ALLOCATION", description: "Received", createdBy: "admin" },
        { ledgerType: "INVENTORY", allocationId: allocation.id, investorId: investor.id, entryType: "UNITS_SOLD", amount: "0", currency: "USD", quantity: 3, occurredAt: new Date("2026-06-02T00:00:00.000Z"), sourceType: "MARKETPLACE_SETTLEMENT", description: "Sold", createdBy: "admin" }
      ]
    });
    const frozenSnapshot = snapshotJson(allocation.id, "2026-06-10T00:00:00.000Z");
    const report = await prisma.monthlyReport.create({
      data: {
        investorId: investor.id,
        month: "2026-06",
        title: "Published frozen risk report",
        summary: "Published investor report snapshot.",
        status: "PUBLISHED",
        publishedAt: new Date("2026-06-10T00:00:00.000Z"),
        proofSummaryJson: frozenSnapshot
      }
    });

    const risk = await calculateAllocationRisk(allocation.id);
    expect(risk).not.toBeNull();
    if (!risk) throw new Error("Expected risk evaluation");

    await recordRiskEvaluationEvent({
      entityType: "Allocation",
      entityId: allocation.id,
      actor: "admin",
      source: "manual_evaluation",
      currentRisk: risk
    });

    const timeline = await getAllocationRiskTimeline(allocation.id);
    const reportAfterEvaluation = await prisma.monthlyReport.findUnique({ where: { id: report.id } });
    expect(timeline.events.some((event) => event.action === "EVALUATE_ALLOCATION_RISK" && event.source === "manual_evaluation")).toBe(true);
    expect(reportAfterEvaluation?.proofSummaryJson).toBe(frozenSnapshot);
    expect(parseRiskSnapshot(reportAfterEvaluation?.proofSummaryJson ?? null)?.portfolioRisk.level).toBe("LOW");
  });
});

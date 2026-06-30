import { describe, expect, it } from "vitest";
import { canEditMonthlyReportFields, getMonthlyReportStatusAuditAction, parseMonthlyReportSnapshot, parseProofSummary, parseProofSummaryBreakdown, serializeMonthlyReport } from "./monthly-reports";

const createdAt = new Date("2026-05-01T10:00:00.000Z");
const updatedAt = new Date("2026-05-02T10:00:00.000Z");

describe("monthly report proof snapshots", () => {
  it("keeps available, verified, and excluded proof counts from the stored snapshot", () => {
    const snapshot = JSON.stringify({
      available: { SHIPMENT_PROOF: 1, MARKETPLACE_REPORT: 2 },
      verified: { WAREHOUSE_MEDIA: 1 },
      excluded: { PAYOUT_PROOF: 1, SERIAL_VERIFICATION: 1 }
    });

    expect(parseProofSummaryBreakdown(snapshot)).toEqual({
      available: { SHIPMENT_PROOF: 1, MARKETPLACE_REPORT: 2 },
      verified: { WAREHOUSE_MEDIA: 1 },
      excluded: { PAYOUT_PROOF: 1, SERIAL_VERIFICATION: 1 }
    });
    expect(parseProofSummary(snapshot)).toEqual({
      SHIPMENT_PROOF: 1,
      MARKETPLACE_REPORT: 2,
      WAREHOUSE_MEDIA: 1
    });
  });

  it("supports legacy flat snapshots without counting excluded proofs", () => {
    const snapshot = JSON.stringify({ SHIPMENT_PROOF: 1, MARKETPLACE_REPORT: 1 });

    expect(parseProofSummaryBreakdown(snapshot)).toEqual({
      available: { SHIPMENT_PROOF: 1, MARKETPLACE_REPORT: 1 },
      verified: {},
      excluded: {}
    });
  });

  it("serializes detail-safe proof summaries from proofSummaryJson only", () => {
    const serialized = serializeMonthlyReport({
      id: "report-test-id",
      investorId: "investor-test-id",
      month: "May 2026",
      title: "May operational report",
      summary: "Stored monthly reporting summary.",
      performanceNote: "Operational performance note.",
      payoutNote: "Payout review note.",
      proofSummaryJson: JSON.stringify({
        available: { SHIPMENT_PROOF: 1 },
        verified: { MARKETPLACE_REPORT: 1 },
        excluded: { PURCHASE_INVOICE: 2 }
      }),
      readinessScore: null,
      readinessState: null,
      readinessSnapshotJson: null,
      readinessEvaluatedAt: null,
      status: "PUBLISHED",
      publishedAt: updatedAt,
      createdAt,
      updatedAt
    });

    expect(serialized.proofSummary).toEqual({ SHIPMENT_PROOF: 1, MARKETPLACE_REPORT: 1 });
    expect(serialized.proofSummaryBreakdown.excluded).toEqual({ PURCHASE_INVOICE: 2 });
  });

  it("keeps draft editing and publication audit transitions explicit", () => {
    expect(canEditMonthlyReportFields("DRAFT")).toBe(true);
    expect(canEditMonthlyReportFields("PUBLISHED")).toBe(false);
    expect(getMonthlyReportStatusAuditAction("DRAFT", "PUBLISHED")).toBe("PUBLISH_MONTHLY_REPORT");
    expect(getMonthlyReportStatusAuditAction("PUBLISHED", "DRAFT")).toBe("UNPUBLISH_MONTHLY_REPORT");
    expect(getMonthlyReportStatusAuditAction("DRAFT", "DRAFT")).toBe("UPDATE_MONTHLY_REPORT");
  });

  it("keeps linked allocation summaries inside the frozen snapshot", () => {
    const snapshot = JSON.stringify({
      available: { SHIPMENT_PROOF: 1 },
      verified: { MARKETPLACE_REPORT: 1 },
      excluded: { PAYOUT_PROOF: 1 },
      allocations: [
        {
          id: "allocation-a",
          supplyCode: "SUP-A",
          productName: "iPhone managed batch",
          marketplace: "Marketplace ops",
          allocationAmount: "12000",
          currency: "USD",
          status: "SELLING",
          expectedCycleDays: 45,
          expectedPayoutAt: "2026-06-30T00:00:00.000Z",
          riskLevel: "MONITORED",
          estimatedResult: "900",
          actualProfit: null,
          payoutStatus: "NOT_READY",
          reinvestDecision: "UNDECIDED",
          updatedAt: "2026-05-20T00:00:00.000Z",
          proofSummaryBreakdown: {
            available: { SHIPMENT_PROOF: 1 },
            verified: { MARKETPLACE_REPORT: 1 },
            excluded: { PAYOUT_PROOF: 1 }
          },
          proofCompleteness: {
            allocationId: "allocation-a",
            score: 75,
            state: "PARTIAL",
            presentCategories: ["SHIPMENT_PROOF", "MARKETPLACE_REPORT"],
            missingRequiredCategories: [],
            missingRecommendedCategories: ["PAYOUT_PROOF"],
            hiddenProofCount: 0,
            rejectedProofCount: 0,
            unreviewedProofCount: 0,
            supersededProofCount: 0,
            investorSafeSummary: "Evidence coverage is partially available.",
            adminWarnings: ["Internal warning should not be serialized to investor report output."],
            policyThreshold: 50,
            components: []
          }
        }
      ]
    });

    const parsed = parseMonthlyReportSnapshot(snapshot);

    expect(parsed.allocations).toHaveLength(1);
    expect(parsed.allocations[0]?.id).toBe("allocation-a");
    expect(parsed.allocations[0]?.proofSummaryBreakdown.available).toEqual({ SHIPMENT_PROOF: 1 });
    expect(parsed.allocations[0]?.proofSummaryBreakdown.verified).toEqual({ MARKETPLACE_REPORT: 1 });
    expect(parsed.allocations[0]?.proofSummaryBreakdown.excluded).toEqual({ PAYOUT_PROOF: 1 });
    expect(parsed.allocations[0]?.proofCompleteness?.score).toBe(75);
  });

  it("serializes investor-visible report detail from frozen allocation snapshot only", () => {
    const serialized = serializeMonthlyReport({
      id: "report-snapshot-id",
      investorId: "investor-test-id",
      month: "June 2026",
      title: "June operational report",
      summary: "Frozen report summary.",
      performanceNote: null,
      payoutNote: null,
      proofSummaryJson: JSON.stringify({
        available: { SHIPMENT_PROOF: 1 },
        verified: {},
        excluded: { WAREHOUSE_MEDIA: 1 },
        allocations: [
          {
            id: "allocation-frozen",
            supplyCode: "SUP-FROZEN",
            productName: "Frozen allocation batch",
            marketplace: null,
            allocationAmount: "10000",
            currency: "USD",
            status: "SHIPPING",
            expectedCycleDays: 30,
            expectedPayoutAt: null,
            riskLevel: "STANDARD",
            estimatedResult: null,
            actualProfit: null,
            payoutStatus: "NOT_READY",
            reinvestDecision: "UNDECIDED",
            updatedAt: "2026-06-01T00:00:00.000Z",
            proofSummaryBreakdown: {
              available: { SHIPMENT_PROOF: 1 },
              verified: {},
              excluded: { WAREHOUSE_MEDIA: 1 }
            },
            proofCompleteness: {
              allocationId: "allocation-frozen",
              score: 50,
              state: "PARTIAL",
              presentCategories: ["SHIPMENT_PROOF"],
              missingRequiredCategories: [],
              missingRecommendedCategories: ["MARKETPLACE_REPORT"],
              hiddenProofCount: 1,
              rejectedProofCount: 0,
              unreviewedProofCount: 0,
              supersededProofCount: 0,
              investorSafeSummary: "Evidence coverage is partially available.",
              adminWarnings: ["Hidden proof excluded."],
              policyThreshold: 50,
              components: []
            }
          }
        ]
      }),
      readinessScore: null,
      readinessState: null,
      readinessSnapshotJson: null,
      readinessEvaluatedAt: null,
      status: "PUBLISHED",
      publishedAt: updatedAt,
      createdAt,
      updatedAt
    });

    expect(serialized.proofSummary).toEqual({ SHIPMENT_PROOF: 1 });
    expect(serialized.allocationSnapshot).toHaveLength(1);
    expect(serialized.allocationSnapshot[0]?.productName).toBe("Frozen allocation batch");
    expect(serialized.allocationSnapshot[0]?.proofSummaryBreakdown.excluded).toEqual({ WAREHOUSE_MEDIA: 1 });
    expect(serialized.allocationSnapshot[0]?.proofCompleteness).toEqual({
      score: 50,
      state: "PARTIAL",
      investorSafeSummary: "Evidence coverage is partially available.",
      presentCategories: ["SHIPMENT_PROOF"]
    });
    expect(JSON.stringify(serialized.allocationSnapshot[0]?.proofCompleteness)).not.toContain("Hidden proof excluded");
  });
});

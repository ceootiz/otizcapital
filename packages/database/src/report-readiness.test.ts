import { describe, expect, it } from "vitest";
import { evaluateMonthlyReportReadinessFromInput, resolveMonthlyReportPublishGate, type ReportReadinessInput } from "./report-readiness";
import { getSafeDefaultReadinessPolicy, parseReadinessPolicyCategoriesJson, type SerializedReadinessPolicy } from "./readiness-policies";

const now = new Date("2026-06-10T12:00:00.000Z");

function baseInput(overrides: Partial<ReportReadinessInput> = {}): ReportReadinessInput {
  const linkedAt = new Date("2026-06-10T10:00:00.000Z");
  return {
    now,
    report: {
      id: "report-a",
      investorId: "investor-a",
      status: "DRAFT",
      summary: "Operational report summary with risk context and no return promise.",
      performanceNote: "Operations reviewed with risk disclosure.",
      payoutNote: null,
      proofSummaryJson: JSON.stringify({
        generatedAt: "2026-06-10T11:00:00.000Z",
        available: { SHIPMENT_PROOF: 1, PURCHASE_INVOICE: 1, WAREHOUSE_MEDIA: 1, PAYOUT_PROOF: 1 },
        verified: { MARKETPLACE_REPORT: 1, SERIAL_VERIFICATION: 1 },
        excluded: {},
        allocations: [{ id: "allocation-a" }],
        reconciliationSummary: { generatedAt: "2026-06-10T11:00:00.000Z", allocations: [{ allocationId: "allocation-a", status: "BALANCED", score: 100, ledgerSummary: { inventory: { purchased: 0, received: 0, sold: 0, returned: 0, remainingAdjustment: 0, remaining: 0, inventoryVariance: 0 }, cash: { cashIn: 0, supplierPayments: 0, logisticsCosts: 0, marketplaceSettlements: 0, marketplaceFees: 0, refunds: 0, payouts: 0, reinvestments: 0, netCashPosition: 0 }, investorLiability: { capitalAllocated: 0, profitAccrued: 0, payoutsApproved: 0, payoutsPaid: 0, reinvested: 0, lossesRecognized: 0, liabilityAdjustments: 0, liabilityOutstanding: 0, deferredUnpaidShare: 0 } }, investorSafeSummary: { status: "BALANCED", score: 100, capitalDeployed: "0", capitalReturned: "0", payoutStatus: "Not ready", inventoryProgressSummary: "0 received, 0 sold, 0 remaining", exceptionNotice: null }, exceptionSummary: { blockingIssueCount: 0, warningCount: 0 } }], portfolioTotals: { inventory: { purchased: 0, received: 0, sold: 0, returned: 0, remainingAdjustment: 0, remaining: 0, inventoryVariance: 0 }, cash: { cashIn: 0, supplierPayments: 0, logisticsCosts: 0, marketplaceSettlements: 0, marketplaceFees: 0, refunds: 0, payouts: 0, reinvestments: 0, netCashPosition: 0 }, investorLiability: { capitalAllocated: 0, profitAccrued: 0, payoutsApproved: 0, payoutsPaid: 0, reinvested: 0, lossesRecognized: 0, liabilityAdjustments: 0, liabilityOutstanding: 0, deferredUnpaidShare: 0 } }, exceptionsSummary: { blockingIssueCount: 0, warningCount: 0 } }
      })
    },
    linkedAllocations: [
      {
        allocationId: "allocation-a",
        createdAt: linkedAt,
        updatedAt: linkedAt,
        allocation: {
          id: "allocation-a",
          investorId: "investor-a",
          status: "SELLING",
          expectedCycleDays: 30,
          expectedPayoutAt: null,
          proofs: [
            { id: "proof-a", type: "SHIPMENT_PROOF", status: "AVAILABLE", proofUrl: null },
            { id: "proof-b", type: "MARKETPLACE_REPORT", status: "VERIFIED", proofUrl: "https://example.invalid/report" },
            { id: "proof-c", type: "PURCHASE_INVOICE", status: "AVAILABLE", proofUrl: null },
            { id: "proof-d", type: "WAREHOUSE_MEDIA", status: "AVAILABLE", proofUrl: null },
            { id: "proof-e", type: "SERIAL_VERIFICATION", status: "VERIFIED", proofUrl: null },
            { id: "proof-f", type: "PAYOUT_PROOF", status: "AVAILABLE", proofUrl: null }
          ]
        }
      }
    ],
    ...overrides
  };
}

function policy(overrides: Partial<SerializedReadinessPolicy> = {}): SerializedReadinessPolicy {
  return {
    ...getSafeDefaultReadinessPolicy(),
    id: "policy-test",
    name: "Test readiness policy",
    source: "database",
    createdAt: "2026-06-10T08:00:00.000Z",
    updatedAt: "2026-06-10T08:00:00.000Z",
    ...overrides
  };
}

describe("monthly report readiness", () => {
  it("uses the safe default policy when no active policy is supplied", () => {
    const evaluation = evaluateMonthlyReportReadinessFromInput(baseInput());

    expect(evaluation.policySnapshot.id).toBe("default-readiness-policy");
    expect(evaluation.policySnapshot.requiredProofCategories).toEqual(["SHIPMENT_PROOF"]);
    expect(evaluation.publishAllowed).toBe(true);
  });

  it("blocks reports without linked allocations", () => {
    const evaluation = evaluateMonthlyReportReadinessFromInput(baseInput({ linkedAllocations: [] }));

    expect(evaluation.state).toBe("BLOCKED");
    expect(evaluation.publishAllowed).toBe(false);
    expect(evaluation.blockingIssues.some((issue) => issue.id === "linked-allocation")).toBe(true);
  });

  it("blocks reports without a generated frozen snapshot", () => {
    const input = baseInput();
    const evaluation = evaluateMonthlyReportReadinessFromInput({
      ...input,
      report: { ...input.report, proofSummaryJson: null }
    });

    expect(evaluation.state).toBe("BLOCKED");
    expect(evaluation.blockingIssues.some((issue) => issue.id === "snapshot-exists")).toBe(true);
  });

  it("blocks stale snapshots after linkage changes", () => {
    const input = baseInput();
    const evaluation = evaluateMonthlyReportReadinessFromInput({
      ...input,
      report: {
        ...input.report,
        proofSummaryJson: JSON.stringify({
          generatedAt: "2026-06-10T09:00:00.000Z",
          available: { SHIPMENT_PROOF: 1 },
          verified: {},
          excluded: {},
          allocations: [{ id: "allocation-a" }],
        reconciliationSummary: { generatedAt: "2026-06-10T11:00:00.000Z", allocations: [{ allocationId: "allocation-a", status: "BALANCED", score: 100, ledgerSummary: { inventory: { purchased: 0, received: 0, sold: 0, returned: 0, remainingAdjustment: 0, remaining: 0, inventoryVariance: 0 }, cash: { cashIn: 0, supplierPayments: 0, logisticsCosts: 0, marketplaceSettlements: 0, marketplaceFees: 0, refunds: 0, payouts: 0, reinvestments: 0, netCashPosition: 0 }, investorLiability: { capitalAllocated: 0, profitAccrued: 0, payoutsApproved: 0, payoutsPaid: 0, reinvested: 0, lossesRecognized: 0, liabilityAdjustments: 0, liabilityOutstanding: 0, deferredUnpaidShare: 0 } }, investorSafeSummary: { status: "BALANCED", score: 100, capitalDeployed: "0", capitalReturned: "0", payoutStatus: "Not ready", inventoryProgressSummary: "0 received, 0 sold, 0 remaining", exceptionNotice: null }, exceptionSummary: { blockingIssueCount: 0, warningCount: 0 } }], portfolioTotals: { inventory: { purchased: 0, received: 0, sold: 0, returned: 0, remainingAdjustment: 0, remaining: 0, inventoryVariance: 0 }, cash: { cashIn: 0, supplierPayments: 0, logisticsCosts: 0, marketplaceSettlements: 0, marketplaceFees: 0, refunds: 0, payouts: 0, reinvestments: 0, netCashPosition: 0 }, investorLiability: { capitalAllocated: 0, profitAccrued: 0, payoutsApproved: 0, payoutsPaid: 0, reinvested: 0, lossesRecognized: 0, liabilityAdjustments: 0, liabilityOutstanding: 0, deferredUnpaidShare: 0 } }, exceptionsSummary: { blockingIssueCount: 0, warningCount: 0 } }
        })
      }
    });

    expect(evaluation.state).toBe("BLOCKED");
    expect(evaluation.blockingIssues.some((issue) => issue.id === "snapshot-fresh")).toBe(true);
  });

  it("blocks duplicate allocation linkage and cross-investor leakage", () => {
    const input = baseInput();
    const duplicate = input.linkedAllocations[0]!;
    const evaluation = evaluateMonthlyReportReadinessFromInput({
      ...input,
      linkedAllocations: [
        duplicate,
        {
          ...duplicate,
          allocation: { ...duplicate.allocation, investorId: "investor-b" }
        }
      ]
    });

    expect(evaluation.state).toBe("BLOCKED");
    expect(evaluation.blockingIssues.some((issue) => issue.id === "duplicate-linkage")).toBe(true);
    expect(evaluation.blockingIssues.some((issue) => issue.id === "same-investor")).toBe(true);
  });

  it("requires acknowledgment for publish warnings", () => {
    const input = baseInput();
    const evaluation = evaluateMonthlyReportReadinessFromInput({
      ...input,
      report: { ...input.report, performanceNote: null, summary: "Operational report summary." }
    });

    expect(evaluation.state).toBe("READY_WITH_WARNINGS");
    expect(resolveMonthlyReportPublishGate(evaluation, false).ok).toBe(false);
    expect(resolveMonthlyReportPublishGate(evaluation, true).ok).toBe(true);
  });

  it("does not allow bypassing blocking issues", () => {
    const evaluation = evaluateMonthlyReportReadinessFromInput(baseInput({ linkedAllocations: [] }));

    expect(resolveMonthlyReportPublishGate(evaluation, true).ok).toBe(false);
  });

  it("tracks hidden proofs as excluded without leaking them to visible readiness counts", () => {
    const input = baseInput();
    const evaluation = evaluateMonthlyReportReadinessFromInput({
      ...input,
      report: {
        ...input.report,
        proofSummaryJson: JSON.stringify({
          generatedAt: "2026-06-10T11:00:00.000Z",
          available: { SHIPMENT_PROOF: 1 },
          verified: { MARKETPLACE_REPORT: 1 },
          excluded: { WAREHOUSE_MEDIA: 1 },
          allocations: [{ id: "allocation-a" }],
        reconciliationSummary: { generatedAt: "2026-06-10T11:00:00.000Z", allocations: [{ allocationId: "allocation-a", status: "BALANCED", score: 100, ledgerSummary: { inventory: { purchased: 0, received: 0, sold: 0, returned: 0, remainingAdjustment: 0, remaining: 0, inventoryVariance: 0 }, cash: { cashIn: 0, supplierPayments: 0, logisticsCosts: 0, marketplaceSettlements: 0, marketplaceFees: 0, refunds: 0, payouts: 0, reinvestments: 0, netCashPosition: 0 }, investorLiability: { capitalAllocated: 0, profitAccrued: 0, payoutsApproved: 0, payoutsPaid: 0, reinvested: 0, lossesRecognized: 0, liabilityAdjustments: 0, liabilityOutstanding: 0, deferredUnpaidShare: 0 } }, investorSafeSummary: { status: "BALANCED", score: 100, capitalDeployed: "0", capitalReturned: "0", payoutStatus: "Not ready", inventoryProgressSummary: "0 received, 0 sold, 0 remaining", exceptionNotice: null }, exceptionSummary: { blockingIssueCount: 0, warningCount: 0 } }], portfolioTotals: { inventory: { purchased: 0, received: 0, sold: 0, returned: 0, remainingAdjustment: 0, remaining: 0, inventoryVariance: 0 }, cash: { cashIn: 0, supplierPayments: 0, logisticsCosts: 0, marketplaceSettlements: 0, marketplaceFees: 0, refunds: 0, payouts: 0, reinvestments: 0, netCashPosition: 0 }, investorLiability: { capitalAllocated: 0, profitAccrued: 0, payoutsApproved: 0, payoutsPaid: 0, reinvested: 0, lossesRecognized: 0, liabilityAdjustments: 0, liabilityOutstanding: 0, deferredUnpaidShare: 0 } }, exceptionsSummary: { blockingIssueCount: 0, warningCount: 0 } }
        })
      },
      linkedAllocations: [
        {
          ...input.linkedAllocations[0]!,
          allocation: {
            ...input.linkedAllocations[0]!.allocation,
            proofs: [
              ...input.linkedAllocations[0]!.allocation.proofs,
              { id: "proof-hidden", type: "WAREHOUSE_MEDIA", status: "HIDDEN", proofUrl: null }
            ]
          }
        }
      ]
    });

    expect(evaluation.blockingIssues.some((issue) => issue.id === "hidden-proof-not-exposed")).toBe(false);
    expect(evaluation.metrics.visibleProofCount).toBe(6);
    expect(evaluation.metrics.excludedProofCount).toBe(1);
  });

  it("uses proof completeness in readiness state", () => {
    const input = baseInput();
    const evaluation = evaluateMonthlyReportReadinessFromInput({
      ...input,
      linkedAllocations: [
        {
          ...input.linkedAllocations[0]!,
          allocation: {
            ...input.linkedAllocations[0]!.allocation,
            proofs: [
              { id: "proof-a", type: "SHIPMENT_PROOF", status: "AVAILABLE", proofUrl: null },
              { id: "proof-hidden-a", type: "WAREHOUSE_MEDIA", status: "HIDDEN", proofUrl: null },
              { id: "proof-hidden-b", type: "OTHER", status: "HIDDEN", proofUrl: null }
            ]
          }
        }
      ],
      report: {
        ...input.report,
        proofSummaryJson: JSON.stringify({
          generatedAt: "2026-06-10T11:00:00.000Z",
          available: { SHIPMENT_PROOF: 1 },
          verified: {},
          excluded: { WAREHOUSE_MEDIA: 1, OTHER: 1 },
          allocations: [{ id: "allocation-a" }],
        reconciliationSummary: { generatedAt: "2026-06-10T11:00:00.000Z", allocations: [{ allocationId: "allocation-a", status: "BALANCED", score: 100, ledgerSummary: { inventory: { purchased: 0, received: 0, sold: 0, returned: 0, remainingAdjustment: 0, remaining: 0, inventoryVariance: 0 }, cash: { cashIn: 0, supplierPayments: 0, logisticsCosts: 0, marketplaceSettlements: 0, marketplaceFees: 0, refunds: 0, payouts: 0, reinvestments: 0, netCashPosition: 0 }, investorLiability: { capitalAllocated: 0, profitAccrued: 0, payoutsApproved: 0, payoutsPaid: 0, reinvested: 0, lossesRecognized: 0, liabilityAdjustments: 0, liabilityOutstanding: 0, deferredUnpaidShare: 0 } }, investorSafeSummary: { status: "BALANCED", score: 100, capitalDeployed: "0", capitalReturned: "0", payoutStatus: "Not ready", inventoryProgressSummary: "0 received, 0 sold, 0 remaining", exceptionNotice: null }, exceptionSummary: { blockingIssueCount: 0, warningCount: 0 } }], portfolioTotals: { inventory: { purchased: 0, received: 0, sold: 0, returned: 0, remainingAdjustment: 0, remaining: 0, inventoryVariance: 0 }, cash: { cashIn: 0, supplierPayments: 0, logisticsCosts: 0, marketplaceSettlements: 0, marketplaceFees: 0, refunds: 0, payouts: 0, reinvestments: 0, netCashPosition: 0 }, investorLiability: { capitalAllocated: 0, profitAccrued: 0, payoutsApproved: 0, payoutsPaid: 0, reinvested: 0, lossesRecognized: 0, liabilityAdjustments: 0, liabilityOutstanding: 0, deferredUnpaidShare: 0 } }, exceptionsSummary: { blockingIssueCount: 0, warningCount: 0 } }
        })
      }
    });

    expect(evaluation.state).toBe("NEEDS_REVIEW");
    expect(evaluation.warnings.some((issue) => issue.id === "proof-completeness")).toBe(true);
  });

  it("uses active policy required proof categories", () => {
    const evaluation = evaluateMonthlyReportReadinessFromInput(baseInput({ policy: policy({ requiredProofCategories: ["OTHER"] }) }));

    expect(evaluation.state).toBe("BLOCKED");
    expect(evaluation.blockingIssues.some((issue) => issue.id === "required-proof-categories")).toBe(true);
    expect(evaluation.policySnapshot.requiredProofCategories).toEqual(["OTHER"]);
  });

  it("uses active policy minimum completeness threshold", () => {
    const input = baseInput();
    const evaluation = evaluateMonthlyReportReadinessFromInput({
      ...input,
      policy: policy({ minimumProofCompletenessScore: 80 }),
      linkedAllocations: [
        {
          ...input.linkedAllocations[0]!,
          allocation: {
            ...input.linkedAllocations[0]!.allocation,
            proofs: [
              { id: "proof-a", type: "SHIPMENT_PROOF", status: "AVAILABLE", proofUrl: null },
              { id: "proof-b", type: "MARKETPLACE_REPORT", status: "VERIFIED", proofUrl: null },
              { id: "proof-hidden", type: "OTHER", status: "HIDDEN", proofUrl: null }
            ]
          }
        }
      ],
      report: {
        ...input.report,
        proofSummaryJson: JSON.stringify({
          generatedAt: "2026-06-10T11:00:00.000Z",
          available: { SHIPMENT_PROOF: 1 },
          verified: { MARKETPLACE_REPORT: 1 },
          excluded: { OTHER: 1 },
          allocations: [{ id: "allocation-a" }],
        reconciliationSummary: { generatedAt: "2026-06-10T11:00:00.000Z", allocations: [{ allocationId: "allocation-a", status: "BALANCED", score: 100, ledgerSummary: { inventory: { purchased: 0, received: 0, sold: 0, returned: 0, remainingAdjustment: 0, remaining: 0, inventoryVariance: 0 }, cash: { cashIn: 0, supplierPayments: 0, logisticsCosts: 0, marketplaceSettlements: 0, marketplaceFees: 0, refunds: 0, payouts: 0, reinvestments: 0, netCashPosition: 0 }, investorLiability: { capitalAllocated: 0, profitAccrued: 0, payoutsApproved: 0, payoutsPaid: 0, reinvested: 0, lossesRecognized: 0, liabilityAdjustments: 0, liabilityOutstanding: 0, deferredUnpaidShare: 0 } }, investorSafeSummary: { status: "BALANCED", score: 100, capitalDeployed: "0", capitalReturned: "0", payoutStatus: "Not ready", inventoryProgressSummary: "0 received, 0 sold, 0 remaining", exceptionNotice: null }, exceptionSummary: { blockingIssueCount: 0, warningCount: 0 } }], portfolioTotals: { inventory: { purchased: 0, received: 0, sold: 0, returned: 0, remainingAdjustment: 0, remaining: 0, inventoryVariance: 0 }, cash: { cashIn: 0, supplierPayments: 0, logisticsCosts: 0, marketplaceSettlements: 0, marketplaceFees: 0, refunds: 0, payouts: 0, reinvestments: 0, netCashPosition: 0 }, investorLiability: { capitalAllocated: 0, profitAccrued: 0, payoutsApproved: 0, payoutsPaid: 0, reinvested: 0, lossesRecognized: 0, liabilityAdjustments: 0, liabilityOutstanding: 0, deferredUnpaidShare: 0 } }, exceptionsSummary: { blockingIssueCount: 0, warningCount: 0 } }
        })
      }
    });

    expect(evaluation.state).toBe("NEEDS_REVIEW");
    expect(evaluation.metrics.proofCompletenessScore).toBe(38);
    expect(evaluation.warnings.some((issue) => issue.id === "proof-completeness")).toBe(true);
  });

  it("uses frozen V2 proof completeness from the report snapshot instead of live proofs", () => {
    const input = baseInput();
    const evaluation = evaluateMonthlyReportReadinessFromInput({
      ...input,
      report: {
        ...input.report,
        proofSummaryJson: JSON.stringify({
          generatedAt: "2026-06-10T11:00:00.000Z",
          available: { SHIPMENT_PROOF: 1 },
          verified: {},
          excluded: {},
          allocations: [
            {
              id: "allocation-a",
              proofCompleteness: {
                allocationId: "allocation-a",
                score: 25,
                state: "INCOMPLETE",
                presentCategories: ["SHIPMENT_PROOF"],
                missingRequiredCategories: [],
                missingRecommendedCategories: ["MARKETPLACE_REPORT"],
                hiddenProofCount: 0,
                rejectedProofCount: 0,
                unreviewedProofCount: 0,
                supersededProofCount: 0,
                investorSafeSummary: "Frozen proof health.",
                adminWarnings: ["Frozen snapshot warning."],
                policyThreshold: 50,
                components: []
              }
            }
          ]
        })
      }
    });

    expect(evaluation.metrics.proofCompletenessScore).toBe(25);
    expect(evaluation.proofCompleteness.allocations[0]?.investorSafeSummary).toBe("Frozen proof health.");
    expect(evaluation.warnings.some((issue) => issue.id === "proof-completeness")).toBe(true);
  });

  it("does not mutate a frozen policy snapshot when the active policy changes later", () => {
    const firstEvaluation = evaluateMonthlyReportReadinessFromInput(baseInput({ policy: policy({ id: "policy-v1", requiredProofCategories: ["SHIPMENT_PROOF"] }) }));
    const frozenSnapshot = JSON.parse(JSON.stringify(firstEvaluation.policySnapshot)) as typeof firstEvaluation.policySnapshot;
    const secondEvaluation = evaluateMonthlyReportReadinessFromInput(baseInput({ policy: policy({ id: "policy-v2", requiredProofCategories: ["WAREHOUSE_MEDIA"] }) }));

    expect(frozenSnapshot.id).toBe("policy-v1");
    expect(frozenSnapshot.requiredProofCategories).toEqual(["SHIPMENT_PROOF"]);
    expect(secondEvaluation.policySnapshot.id).toBe("policy-v2");
    expect(secondEvaluation.policySnapshot.requiredProofCategories).toEqual(["WAREHOUSE_MEDIA"]);
  });

  it("rejects invalid JSON policy categories", () => {
    expect(parseReadinessPolicyCategoriesJson("{bad json").ok).toBe(false);
    expect(parseReadinessPolicyCategoriesJson(JSON.stringify(["NOT_A_PROOF"])).ok).toBe(false);
  });

  it("blocks publishing warnings when policy disallows warning publishes", () => {
    const evaluation = evaluateMonthlyReportReadinessFromInput({
      ...baseInput(),
      policy: policy({ allowPublishWithWarnings: false }),
      report: { ...baseInput().report, performanceNote: null }
    });

    expect(evaluation.state).toBe("READY_WITH_WARNINGS");
    expect(evaluation.publishAllowed).toBe(false);
    expect(resolveMonthlyReportPublishGate(evaluation, true).ok).toBe(false);
  });
});

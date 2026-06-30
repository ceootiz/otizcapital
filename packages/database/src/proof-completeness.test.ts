import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { calculateAllocationProofCompletenessFromInput, calculatePortfolioProofCompletenessFromInput, getProofRequirementsGuide } from "./proof-completeness";
import { READINESS_PROOF_CATEGORIES, getSafeDefaultReadinessPolicy, type SerializedReadinessPolicy } from "./readiness-policies";

function policy(overrides: Partial<SerializedReadinessPolicy> = {}): SerializedReadinessPolicy {
  return { ...getSafeDefaultReadinessPolicy(), ...overrides };
}

const completeProofs = [
  { type: "PURCHASE_INVOICE", status: "AVAILABLE" },
  { type: "WAREHOUSE_MEDIA", status: "AVAILABLE" },
  { type: "SERIAL_VERIFICATION", status: "VERIFIED" },
  { type: "SHIPMENT_PROOF", status: "AVAILABLE" },
  { type: "MARKETPLACE_REPORT", status: "VERIFIED" },
  { type: "PAYOUT_PROOF", status: "AVAILABLE" }
];

describe("proof completeness v2", () => {
  it("returns VERIFIED for a complete investor-visible proof set", () => {
    const result = calculateAllocationProofCompletenessFromInput({
      allocationId: "allocation-a",
      proofs: completeProofs,
      monthlyReportLinkCount: 1,
      policy: policy()
    });

    expect(result.score).toBe(100);
    expect(result.state).toBe("VERIFIED");
    expect(result.missingRequiredCategories).toEqual([]);
  });

  it("returns INCOMPLETE when required policy categories are missing", () => {
    const result = calculateAllocationProofCompletenessFromInput({
      allocationId: "allocation-a",
      proofs: [{ type: "WAREHOUSE_MEDIA", status: "AVAILABLE" }],
      monthlyReportLinkCount: 1,
      policy: policy({ requiredProofCategories: ["SHIPMENT_PROOF"] })
    });

    expect(result.state).toBe("INCOMPLETE");
    expect(result.missingRequiredCategories).toEqual(["SHIPMENT_PROOF"]);
  });

  it("returns PARTIAL when recommended categories are missing but required categories pass", () => {
    const result = calculateAllocationProofCompletenessFromInput({
      allocationId: "allocation-a",
      proofs: completeProofs.filter((proof) => proof.type !== "MARKETPLACE_REPORT"),
      monthlyReportLinkCount: 1,
      policy: policy({ requiredProofCategories: ["SHIPMENT_PROOF"], warningProofCategories: ["MARKETPLACE_REPORT"], minimumProofCompletenessScore: 40 })
    });

    expect(result.state).toBe("PARTIAL");
    expect(result.missingRecommendedCategories).toContain("MARKETPLACE_REPORT");
  });

  it("does not count hidden or rejected proofs as investor-visible evidence", () => {
    const result = calculateAllocationProofCompletenessFromInput({
      allocationId: "allocation-a",
      proofs: [
        { type: "SHIPMENT_PROOF", status: "HIDDEN" },
        { type: "MARKETPLACE_REPORT", status: "REJECTED" }
      ],
      monthlyReportLinkCount: 0,
      policy: policy()
    });

    expect(result.presentCategories).toEqual([]);
    expect(result.hiddenProofCount).toBe(1);
    expect(result.rejectedProofCount).toBe(1);
    expect(result.state).toBe("HIGH_RISK");
  });

  it("flags unreviewed critical proof according to policy", () => {
    const result = calculateAllocationProofCompletenessFromInput({
      allocationId: "allocation-a",
      proofs: [
        { type: "SHIPMENT_PROOF", status: "AVAILABLE" },
        { type: "MARKETPLACE_REPORT", status: "PENDING" }
      ],
      monthlyReportLinkCount: 1,
      policy: policy({ blockOnUnreviewedCriticalArtifacts: true })
    });

    expect(result.unreviewedProofCount).toBe(1);
    expect(result.state).toBe("HIGH_RISK");
  });

  it("aggregates portfolio score only for the requested investor", () => {
    const result = calculatePortfolioProofCompletenessFromInput({
      investorId: "investor-a",
      policy: policy(),
      allocations: [
        { allocationId: "allocation-a", investorId: "investor-a", proofs: completeProofs, monthlyReportLinkCount: 1 },
        { allocationId: "allocation-b", investorId: "investor-b", proofs: [], monthlyReportLinkCount: 0 }
      ]
    });

    expect(result.allocationCount).toBe(1);
    expect(result.score).toBe(100);
    expect(result.allocations[0]?.allocationId).toBe("allocation-a");
  });

  it("active policy threshold changes completeness behavior", () => {
    const result = calculateAllocationProofCompletenessFromInput({
      allocationId: "allocation-a",
      proofs: completeProofs.slice(0, 4),
      monthlyReportLinkCount: 1,
      policy: policy({ minimumProofCompletenessScore: 90 })
    });

    expect(result.score).toBeLessThan(90);
    expect(result.state).toBe("INCOMPLETE");
  });
});

describe("proof requirements guide", () => {
  it("uses the supplied active policy to mark required and recommended categories", () => {
    const guide = getProofRequirementsGuide(policy({
      requiredProofCategories: ["PURCHASE_INVOICE"],
      warningProofCategories: ["MARKETPLACE_REPORT"]
    }));

    expect(guide.find((item) => item.componentKey === "INVOICE_PROOF")?.policyStatus).toBe("Required");
    expect(guide.find((item) => item.componentKey === "MARKETPLACE_SETTLEMENT_PROOF")?.policyStatus).toBe("Recommended");
  });

  it("falls back to the safe default policy", () => {
    const guide = getProofRequirementsGuide();

    expect(guide.find((item) => item.componentKey === "LOGISTICS_PROOF")?.policyStatus).toBe("Required");
    expect(guide.find((item) => item.componentKey === "MARKETPLACE_SETTLEMENT_PROOF")?.policyStatus).toBe("Recommended");
  });

  it("marks warning policy categories as Recommended", () => {
    const guide = getProofRequirementsGuide(policy({
      requiredProofCategories: [],
      warningProofCategories: ["WAREHOUSE_MEDIA"]
    }));

    expect(guide.find((item) => item.componentKey === "WAREHOUSE_INTAKE_PROOF")?.policyStatus).toBe("Recommended");
  });

  it("handles unknown policy categories safely", () => {
    const guide = getProofRequirementsGuide(policy({
      requiredProofCategories: ["UNKNOWN_PROOF_TYPE" as SerializedReadinessPolicy["requiredProofCategories"][number]],
      warningProofCategories: []
    }));

    expect(guide.every((item) => item.policyStatus !== "Required")).toBe(true);
    expect(guide).toHaveLength(8);
  });

  it("uses only existing project proof types for accepted proof placeholders", () => {
    const knownProofTypes = new Set(READINESS_PROOF_CATEGORIES);
    const acceptedProofTypes = getProofRequirementsGuide().flatMap((item) => item.acceptedProofTypes);

    expect(acceptedProofTypes.length).toBeGreaterThan(0);
    expect(acceptedProofTypes.every((proofType) => knownProofTypes.has(proofType as (typeof READINESS_PROOF_CATEGORIES)[number]))).toBe(true);
  });

  it("does not expose admin guide copy through the investor allocation detail component", () => {
    const investorAllocationPage = readFileSync("apps/web/components/investor/investor-allocation-detail-page.tsx", "utf8");

    expect(investorAllocationPage).not.toContain("Proof requirements guide");
    expect(investorAllocationPage).not.toContain("adminInstruction");
    expect(investorAllocationPage).not.toContain("commonMistakes");
    expect(investorAllocationPage).not.toContain("How to satisfy this requirement");
  });
});

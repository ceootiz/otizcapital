import { describe, expect, it } from "vitest";
import { buildInvestorOnboardingStatus } from "./investor-onboarding";

describe("buildInvestorOnboardingStatus", () => {
  const accountCreatedAt = new Date("2026-01-10T10:00:00.000Z");

  it("shows agreement as the next action for a newly approved investor", () => {
    const result = buildInvestorOnboardingStatus({
      investorStatus: "ACTIVE",
      accountCreatedAt,
      approvedAt: new Date("2026-01-11T10:00:00.000Z")
    });

    expect(result.completedSteps).toBe(2);
    expect(result.nextStep).toBe("agreement");
  });

  it("treats an existing allocation as evidence that a deposit entered work", () => {
    const firstAllocationAt = new Date("2026-01-15T10:00:00.000Z");
    const result = buildInvestorOnboardingStatus({
      investorStatus: "ACTIVE",
      accountCreatedAt,
      agreementSignedAt: new Date("2026-01-12T10:00:00.000Z"),
      firstAllocationAt
    });

    expect(result.steps.find((step) => step.key === "deposit")).toMatchObject({
      complete: true,
      completedAt: firstAllocationAt.toISOString()
    });
    expect(result.nextStep).toBe("report");
  });

  it("marks onboarding complete after the first published report", () => {
    const result = buildInvestorOnboardingStatus({
      investorStatus: "ACTIVE",
      accountCreatedAt,
      agreementSignedAt: new Date("2026-01-12T10:00:00.000Z"),
      depositConfirmedAt: new Date("2026-01-13T10:00:00.000Z"),
      firstAllocationAt: new Date("2026-01-15T10:00:00.000Z"),
      firstReportPublishedAt: new Date("2026-02-01T10:00:00.000Z")
    });

    expect(result.completedSteps).toBe(result.totalSteps);
    expect(result.nextStep).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import { buildInvestorDashboardData, type InvestorDashboardAllocationRecord, type InvestorDashboardMonthlyReportRecord } from "./investor-dashboard";

const now = new Date("2026-05-10T00:00:00.000Z");
const investor = { id: "investor-a", reinvestEnabled: true, lastReportAt: null };

function allocation(input: Partial<InvestorDashboardAllocationRecord> & { id: string; investorId?: string; status: string; amount: number }): InvestorDashboardAllocationRecord {
  return {
    id: input.id,
    investorId: input.investorId ?? "investor-a",
    supplyCode: `SUP-${input.id}`,
    productName: `Product ${input.id}`,
    marketplace: "Marketplace",
    allocationAmount: input.amount,
    currency: "USD",
    status: input.status,
    expectedCycleDays: input.expectedCycleDays ?? 10,
    expectedPayoutAt: input.expectedPayoutAt ?? null,
    riskLevel: input.riskLevel ?? "STANDARD",
    estimatedResult: input.estimatedResult ?? null,
    actualProfit: input.actualProfit ?? null,
    startedAt: input.startedAt ?? new Date("2026-05-01T00:00:00.000Z"),
    completedAt: input.completedAt ?? null,
    payoutStatus: input.payoutStatus ?? "NOT_READY",
    reinvestDecision: input.reinvestDecision ?? "UNDECIDED",
    notes: null,
    createdAt: input.createdAt ?? new Date("2026-05-01T00:00:00.000Z"),
    updatedAt: input.updatedAt ?? new Date("2026-05-02T00:00:00.000Z"),
    proofs: input.proofs ?? []
  };
}

function report(input: Partial<InvestorDashboardMonthlyReportRecord> & { id: string; investorId?: string; status: string; publishedAt?: Date | null }): InvestorDashboardMonthlyReportRecord {
  return {
    id: input.id,
    investorId: input.investorId ?? "investor-a",
    month: input.month ?? "May 2026",
    title: input.title ?? `Report ${input.id}`,
    summary: input.summary ?? "Monthly report summary.",
    status: input.status,
    publishedAt: input.publishedAt ?? null,
    createdAt: input.createdAt ?? new Date("2026-05-01T00:00:00.000Z"),
    updatedAt: input.updatedAt ?? new Date("2026-05-01T00:00:00.000Z")
  };
}

describe("investor dashboard data", () => {
  it("counts only the current investor allocations and reports", () => {
    const dashboard = buildInvestorDashboardData({
      investor,
      now,
      allocations: [
        allocation({ id: "active-a", status: "SELLING", amount: 10000, estimatedResult: "900" }),
        allocation({ id: "active-b", investorId: "investor-b", status: "SELLING", amount: 999999, estimatedResult: "9999" })
      ],
      monthlyReports: [
        report({ id: "published-a", status: "PUBLISHED", publishedAt: new Date("2026-05-08T00:00:00.000Z") }),
        report({ id: "published-b", investorId: "investor-b", status: "PUBLISHED", publishedAt: new Date("2026-05-09T00:00:00.000Z") })
      ]
    });

    expect(dashboard.summary.activeCapital).toBe(10000);
    expect(dashboard.summary.expectedProfit).toBe(900);
    expect(dashboard.activeAllocations).toHaveLength(1);
    expect(dashboard.latestPublishedMonthlyReport?.id).toBe("published-a");
  });

  it("counts completed and paid out allocations without mixing payout totals", () => {
    const dashboard = buildInvestorDashboardData({
      investor,
      now,
      allocations: [
        allocation({ id: "completed-paid", status: "COMPLETED", amount: 10000, actualProfit: "1000", payoutStatus: "PAID", completedAt: new Date("2026-05-04T00:00:00.000Z") }),
        allocation({ id: "completed-pending", status: "COMPLETED", amount: 5000, actualProfit: "500", payoutStatus: "PENDING", completedAt: new Date("2026-05-05T00:00:00.000Z") }),
        allocation({ id: "active", status: "PURCHASING", amount: 7000, estimatedResult: "350" })
      ],
      monthlyReports: []
    });

    expect(dashboard.summary.completedAllocationsCount).toBe(2);
    expect(dashboard.summary.realizedProfit).toBe(1500);
    expect(dashboard.summary.totalPayouts).toBe(1000);
    expect(dashboard.summary.currentAverageRoi).toBe(10);
  });

  it("calculates the next expected payout date from unpaid allocation cycles", () => {
    const dashboard = buildInvestorDashboardData({
      investor,
      now,
      allocations: [
        allocation({ id: "later", status: "SELLING", amount: 4000, startedAt: new Date("2026-05-05T00:00:00.000Z"), expectedCycleDays: 20 }),
        allocation({ id: "next", status: "COMPLETED", amount: 5000, startedAt: new Date("2026-05-01T00:00:00.000Z"), expectedCycleDays: 12, payoutStatus: "APPROVED" }),
        allocation({ id: "paid", status: "COMPLETED", amount: 5000, startedAt: new Date("2026-05-01T00:00:00.000Z"), expectedCycleDays: 11, payoutStatus: "PAID" })
      ],
      monthlyReports: []
    });

    expect(dashboard.summary.nextExpectedPayoutDate).toBe("2026-05-13T00:00:00.000Z");
  });

  it("returns only the latest published monthly report and hides drafts", () => {
    const dashboard = buildInvestorDashboardData({
      investor,
      now,
      allocations: [],
      monthlyReports: [
        report({ id: "draft-newer", status: "DRAFT", publishedAt: null, createdAt: new Date("2026-05-20T00:00:00.000Z") }),
        report({ id: "published-old", status: "PUBLISHED", publishedAt: new Date("2026-04-30T00:00:00.000Z") }),
        report({ id: "published-new", status: "PUBLISHED", publishedAt: new Date("2026-05-15T00:00:00.000Z") })
      ]
    });

    expect(dashboard.latestPublishedMonthlyReport?.id).toBe("published-new");
    expect(dashboard.summary.latestPublishedMonthlyReport?.id).toBe("published-new");
  });

  it("uses explicit allocation payout and risk fields for manager-controlled allocations", () => {
    const dashboard = buildInvestorDashboardData({
      investor,
      now,
      allocations: [
        allocation({
          id: "managed",
          status: "SELLING",
          amount: 25000,
          expectedCycleDays: 45,
          expectedPayoutAt: new Date("2026-05-18T12:00:00.000Z"),
          riskLevel: "ELEVATED"
        })
      ],
      monthlyReports: []
    });

    expect(dashboard.activeAllocations[0]?.expectedPayoutAt).toBe("2026-05-18T12:00:00.000Z");
    expect(dashboard.activeAllocations[0]?.riskLevel).toBe("elevated");
    expect(dashboard.summary.nextExpectedPayoutDate).toBe("2026-05-18T12:00:00.000Z");
  });

  it("keeps loss allocations visible to the investor without counting them as active capital", () => {
    const dashboard = buildInvestorDashboardData({
      investor,
      now,
      allocations: [allocation({ id: "loss", status: "LOSS", amount: 9000, riskLevel: "ELEVATED" })],
      monthlyReports: []
    });

    expect(dashboard.summary.activeCapital).toBe(0);
    expect(dashboard.summary.activeAllocationsCount).toBe(0);
    expect(dashboard.activeAllocations).toHaveLength(1);
    expect(dashboard.activeAllocations[0]?.currentStage).toBe("loss");
    expect(dashboard.activeAllocations[0]?.riskLevel).toBe("elevated");
  });
});

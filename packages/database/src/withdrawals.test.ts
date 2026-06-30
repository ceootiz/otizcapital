import { describe, expect, it } from "vitest";
import { buildInvestorPayoutSummary, filterInvestorWithdrawalRequests, maskWithdrawalDestination, type WithdrawalRequestRecord } from "./withdrawals";

const baseDate = new Date("2026-05-10T00:00:00.000Z");

function request(input: Partial<WithdrawalRequestRecord> & { id: string; investorId?: string; status: string; amount: string; scheduledFor?: Date | null }): WithdrawalRequestRecord {
  return {
    id: input.id,
    investorId: input.investorId ?? "investor-a",
    amount: input.amount,
    currency: "USD",
    status: input.status,
    requestedAt: input.requestedAt ?? baseDate,
    approvedAt: input.approvedAt ?? null,
    rejectedAt: input.rejectedAt ?? null,
    paidAt: input.paidAt ?? null,
    scheduledFor: input.scheduledFor ?? null,
    method: input.method ?? "bank_transfer",
    destinationMasked: input.destinationMasked ?? "•••• 1234",
    adminNote: input.adminNote ?? null,
    investorNote: input.investorNote ?? null,
    rejectionReason: input.rejectionReason ?? null,
    createdAt: input.createdAt ?? baseDate,
    updatedAt: input.updatedAt ?? baseDate
  };
}

describe("withdrawal requests", () => {
  it("filters investor requests without leaking another investor", () => {
    const requests = [
      request({ id: "own", status: "REQUESTED", amount: "1000" }),
      request({ id: "other", investorId: "investor-b", status: "REQUESTED", amount: "9000" })
    ];

    expect(filterInvestorWithdrawalRequests(requests, "investor-a").map((item) => item.id)).toEqual(["own"]);
  });

  it("calculates payout summary from paid, pending, and scheduled requests", () => {
    const summary = buildInvestorPayoutSummary({
      investorId: "investor-a",
      withdrawalRequests: [
        request({ id: "requested", status: "REQUESTED", amount: "300" }),
        request({ id: "scheduled", status: "SCHEDULED", amount: "500", scheduledFor: new Date("2026-05-15T00:00:00.000Z") }),
        request({ id: "paid", status: "PAID", amount: "200" }),
        request({ id: "rejected", status: "REJECTED", amount: "999" }),
        request({ id: "cancelled", status: "CANCELLED", amount: "999" })
      ],
      allocations: [{ investorId: "investor-a", status: "COMPLETED", actualProfit: "2000" }]
    });

    expect(summary.pendingPayouts).toBe(800);
    expect(summary.scheduledPayouts).toBe(500);
    expect(summary.paidPayouts).toBe(200);
    expect(summary.availableForWithdrawal).toBe(1000);
    expect(summary.nextExpectedPayoutDate).toBe("2026-05-15T00:00:00.000Z");
  });

  it("excludes another investor from payout summary", () => {
    const summary = buildInvestorPayoutSummary({
      investorId: "investor-a",
      withdrawalRequests: [request({ id: "other", investorId: "investor-b", status: "PAID", amount: "5000" })],
      allocations: [{ investorId: "investor-b", status: "COMPLETED", actualProfit: "5000" }]
    });

    expect(summary.paidPayouts).toBe(0);
    expect(summary.availableForWithdrawal).toBe(0);
  });

  it("never returns full destination details", () => {
    expect(maskWithdrawalDestination("US88 FULL BANK ACCOUNT 123456789")).toBe("•••• 6789");
    expect(maskWithdrawalDestination("")).toBeNull();
  });
});

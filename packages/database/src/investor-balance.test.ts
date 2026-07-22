import { describe, expect, it } from "vitest";
import { calculateCapitalAfterConfirmedDeposit, calculateInvestorBalanceSummary } from "./investor-balance";

describe("investor balance", () => {
  it("shows recorded capital as the total balance and separates working from awaiting allocation", () => {
    const balance = calculateInvestorBalanceSummary({
      recordedCapital: 10000,
      confirmedDeposits: 0,
      retainedProfit: 0,
      referralBonus: 0,
      paidWithdrawals: 0,
      pendingWithdrawals: 0,
      workingCapital: 5000
    });

    expect(balance.totalBalance).toBe(10000);
    expect(balance.workingCapital).toBe(5000);
    expect(balance.awaitingAllocation).toBe(5000);
  });

  it("adds retained profit once without duplicating confirmed principal", () => {
    const balance = calculateInvestorBalanceSummary({
      recordedCapital: 10000,
      confirmedDeposits: 10000,
      retainedProfit: 1000,
      referralBonus: 0,
      paidWithdrawals: 0,
      pendingWithdrawals: 0,
      workingCapital: 5000
    });

    expect(balance.totalBalance).toBe(11000);
    expect(balance.awaitingAllocation).toBe(6000);
  });

  it("does not count completed allocations as additional capital", () => {
    const balance = calculateInvestorBalanceSummary({
      recordedCapital: 10000,
      confirmedDeposits: 0,
      retainedProfit: 0,
      referralBonus: 0,
      paidWithdrawals: 0,
      pendingWithdrawals: 0,
      workingCapital: 6800
    });

    expect(balance.totalBalance).toBe(10000);
    expect(balance.availableBalance).toBe(3200);
    expect(balance.workingCapital).toBe(6800);
  });

  it("does not double the opening capital on the first confirmed deposit", () => {
    expect(calculateCapitalAfterConfirmedDeposit({
      recordedCapital: 10000,
      depositAmount: 10000,
      hasEstablishedCapitalActivity: false
    })).toBe(10000);
  });

  it("adds a later confirmed top-up to established capital", () => {
    expect(calculateCapitalAfterConfirmedDeposit({
      recordedCapital: 10000,
      depositAmount: 5000,
      hasEstablishedCapitalActivity: true
    })).toBe(15000);
  });
});

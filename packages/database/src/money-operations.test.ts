import { describe, expect, it } from "vitest";
import { calculateCanonicalMoneyPositions, compareMoneyPosition } from "./money-operations";

describe("canonical money positions", () => {
  it("moves capital between positions without increasing total capital", () => {
    const [position] = calculateCanonicalMoneyPositions([
      { ledgerType: "INVESTOR_FREE", amount: "10000", currency: "USD" },
      { ledgerType: "INVESTOR_FREE", amount: "-6800", currency: "USD" },
      { ledgerType: "INVESTOR_WORKING", amount: "6800", currency: "USD" }
    ]);

    expect(position).toMatchObject({
      free: "3200",
      working: "6800",
      pendingWithdrawal: "0",
      currentCapital: "10000",
      issues: []
    });
  });

  it("keeps original currencies separate and ignores voided entries", () => {
    const positions = calculateCanonicalMoneyPositions([
      { ledgerType: "INVESTOR_FREE", amount: "100", currency: "USD" },
      { ledgerType: "INVESTOR_FREE", amount: "50", currency: "USDT" },
      { ledgerType: "INVESTOR_FREE", amount: "999", currency: "USD", voidedAt: new Date() }
    ]);

    expect(positions).toEqual([
      expect.objectContaining({ currency: "USD", currentCapital: "100" }),
      expect.objectContaining({ currency: "USDT", currentCapital: "50" })
    ]);
  });

  it("reports exact differences and negative-position failures", () => {
    const [canonical] = calculateCanonicalMoneyPositions([
      { ledgerType: "INVESTOR_FREE", amount: "-1", currency: "USD" }
    ]);
    const report = compareMoneyPosition({
      investorId: "investor-a",
      canonical,
      legacy: { free: 0, working: 0, pendingWithdrawal: 0, currentCapital: 0 }
    });

    expect(report.balanced).toBe(false);
    expect(report.canonical.issues).toContain("NEGATIVE_FREE_CAPITAL");
    expect(report.differences.currentCapital).toBe("-1");
  });
});

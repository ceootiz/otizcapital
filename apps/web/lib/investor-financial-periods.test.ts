import { describe, expect, it } from "vitest";
import type { InvestorLedgerEntry, InvestorLedgerEntryType } from "@otiz/database";
import { ledgerYears, monthRange, summarizeLedgerPeriod, yearRange } from "./investor-financial-periods";

function entry(id: string, type: InvestorLedgerEntryType, amount: number, occurredAt: string): InvestorLedgerEntry {
  return {
    id,
    type,
    amount,
    occurredAt,
    direction: type === "WITHDRAWAL" || type === "DEAL" ? "OUT" : "IN",
    currency: "USD",
    detail: null,
    sourceType: type === "DEPOSIT" ? "DEPOSIT_NOTIFICATION" : type === "WITHDRAWAL" ? "WITHDRAWAL_REQUEST" : type === "DEAL" ? "ALLOCATION" : "INVESTOR_PAYMENT",
    sourceId: id,
    status: "CONFIRMED",
    href: "/investor/history"
  };
}

describe("investor financial periods", () => {
  const entries = [
    entry("deposit", "DEPOSIT", 10_000, "2026-01-03T12:00:00.000Z"),
    entry("profit", "PROFIT", 1_250, "2026-01-31T23:59:59.000Z"),
    entry("withdrawal", "WITHDRAWAL", 400, "2026-02-01T00:00:00.000Z"),
    entry("reinvest", "REINVESTMENT", 300, "2025-12-20T12:00:00.000Z")
  ];

  it("uses UTC month and year boundaries", () => {
    expect(monthRange(new Date("2026-01-15T18:00:00.000Z"))).toEqual({ from: "2026-01-01", to: "2026-01-31" });
    expect(yearRange(2026)).toEqual({ from: "2026-01-01", to: "2026-12-31" });
  });

  it("summarizes only operations inside the selected period", () => {
    expect(summarizeLedgerPeriod(entries, { from: "2026-01-01", to: "2026-01-31" })).toEqual({
      deposits: 10_000,
      profit: 1_250,
      withdrawals: 0,
      reinvested: 0
    });
    expect(ledgerYears(entries)).toEqual([2026, 2025]);
  });
});

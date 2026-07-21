import { describe, expect, it } from "vitest";
import type { InvestorLedgerEntry } from "@otiz/database";
import { buildInvestorPerformanceSeries, listInvestorPerformanceCurrencies } from "./investor-performance";

function entry(input: Partial<InvestorLedgerEntry> & Pick<InvestorLedgerEntry, "id" | "type" | "direction" | "amount" | "currency" | "occurredAt">): InvestorLedgerEntry {
  return { detail: null, sourceType: "INVESTOR_PAYMENT", sourceId: input.id, status: null, href: "/investor/history", ...input };
}

describe("investor performance", () => {
  const entries = [
    entry({ id: "old-deposit", type: "DEPOSIT", direction: "IN", amount: 1000, currency: "USD", occurredAt: "2025-01-01T00:00:00.000Z" }),
    entry({ id: "profit", type: "PROFIT", direction: "IN", amount: 120, currency: "USD", occurredAt: "2025-12-15T00:00:00.000Z" }),
    entry({ id: "withdrawal", type: "WITHDRAWAL", direction: "OUT", amount: 200, currency: "USD", occurredAt: "2025-12-20T00:00:00.000Z" }),
    entry({ id: "usdt", type: "DEPOSIT", direction: "IN", amount: 50, currency: "USDT", occurredAt: "2025-12-21T00:00:00.000Z" })
  ];

  it("keeps currencies separate and carries opening capital into a selected period", () => {
    const points = buildInvestorPerformanceSeries({ entries, currency: "USD", period: "30d", now: new Date("2026-01-01T00:00:00.000Z") });
    expect(points[0]).toMatchObject({ capital: 1000, profit: 0 });
    expect(points.at(-1)).toMatchObject({ capital: 920, profit: 120 });
  });

  it("lists original currencies with USD first", () => {
    expect(listInvestorPerformanceCurrencies(entries)).toEqual(["USD", "USDT"]);
  });
});

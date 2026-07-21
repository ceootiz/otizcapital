import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import type { InvestorLedgerEntry } from "@otiz/database";
import { buildAccountStatementData, buildAccountStatementXlsx } from "./account-statement";

const entry = (input: Partial<InvestorLedgerEntry> & Pick<InvestorLedgerEntry, "id" | "type" | "direction" | "amount" | "occurredAt">): InvestorLedgerEntry => ({ currency: "USD", detail: null, sourceType: "INVESTOR_PAYMENT", sourceId: input.id, status: null, href: "/investor/history", ...input });

describe("account statement", () => {
  it("calculates recorded positions separately for each original currency", () => {
    const data = buildAccountStatementData({
      investor: { fullName: "Test Investor", email: "test@example.com" },
      generatedAt: new Date("2026-03-01"),
      filters: { from: "2026-02-01", to: "2026-02-28T23:59:59.999Z" },
      entries: [
        entry({ id: "opening", type: "DEPOSIT", direction: "IN", amount: 1000, occurredAt: "2026-01-01T00:00:00.000Z" }),
        entry({ id: "profit", type: "PROFIT", direction: "IN", amount: 100, occurredAt: "2026-02-10T00:00:00.000Z" }),
        entry({ id: "paid", type: "WITHDRAWAL", direction: "OUT", amount: 40, occurredAt: "2026-02-20T00:00:00.000Z" }),
        entry({ id: "usdt", type: "DEPOSIT", direction: "IN", amount: 200, currency: "USDT", occurredAt: "2026-02-05T00:00:00.000Z" })
      ]
    });
    expect(data.positions).toEqual([
      { currency: "USD", opening: 1000, movement: 60, closing: 1060 },
      { currency: "USDT", opening: 0, movement: 200, closing: 200 }
    ]);
    expect(data.entries).toHaveLength(3);
  });

  it("creates a readable XLSX and neutralizes formula-like cells", () => {
    const data = buildAccountStatementData({ investor: { fullName: "=Formula", email: "test@example.com" }, entries: [entry({ id: "+source", type: "PROFIT", direction: "IN", amount: 10, occurredAt: "2026-02-10T00:00:00.000Z", detail: "@detail" })] });
    const workbook = XLSX.read(buildAccountStatementXlsx(data), { type: "buffer" });
    const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets.Statement, { header: 1 });
    expect(rows[1]).toContain("'=Formula");
    expect(JSON.stringify(rows)).toContain("'@detail");
  });
});

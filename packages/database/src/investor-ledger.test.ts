import { describe, expect, it } from "vitest";
import { buildInvestorLedger } from "./investor-ledger";

const investorId = "investor-a";
const date = (value: string) => new Date(value);
const empty = () => ({ investorId, deposits: [], allocations: [], payments: [], withdrawals: [], commissions: [] });

describe("buildInvestorLedger", () => {
  it("combines existing money sources in chronological order", () => {
    const page = buildInvestorLedger({
      investorId,
      deposits: [{ id: "d", investorId, amount: 5000, network: "USDT TRC20", status: "CONFIRMED", reviewedAt: date("2026-01-01"), createdAt: date("2026-01-01") }],
      allocations: [{ id: "a", investorId, allocationAmount: 4000, productName: "iPhone batch", supplyCode: "A-1", currency: "USD", status: "SELLING", startedAt: date("2026-02-01"), createdAt: date("2026-02-01") }],
      payments: [{ id: "p", investorId, fileReportId: "report-file", month: "March 2026", profit: 300, reinvested: 100, createdAt: date("2026-03-01") }],
      withdrawals: [{ id: "w", investorId, amount: 200, currency: "USD", status: "PAID", requestedAt: date("2026-04-01"), scheduledFor: null, paidAt: date("2026-04-02"), createdAt: date("2026-04-01") }],
      commissions: [{ id: "c", investorReferrerId: investorId, commissionAmount: 50, status: "PENDING", createdAt: date("2026-05-01"), referredInvestorName: "Referral Person" }]
    });

    expect(page.entries.map((entry) => entry.type)).toEqual(["REFERRAL_BONUS", "WITHDRAWAL", "PROFIT", "REINVESTMENT", "DEAL", "DEPOSIT"]);
    expect(page.entries.find((entry) => entry.type === "WITHDRAWAL")?.direction).toBe("OUT");
  });

  it("never includes another investor's records", () => {
    const input = empty();
    const page = buildInvestorLedger({ ...input, deposits: [{ id: "other", investorId: "investor-b", amount: 999, network: "USDT", status: "CONFIRMED", reviewedAt: date("2026-01-01"), createdAt: date("2026-01-01") }] });
    expect(page.total).toBe(0);
  });

  it("shows unconfirmed deposits without crediting them and does not debit unpaid withdrawals", () => {
    const input = empty();
    const page = buildInvestorLedger({
      ...input,
      deposits: [{ id: "pending", investorId, amount: 100, network: "USDT", status: "PENDING", reviewedAt: null, createdAt: date("2026-01-01") }],
      withdrawals: [{ id: "requested", investorId, amount: 50, currency: "USD", status: "REQUESTED", requestedAt: date("2026-02-01"), scheduledFor: null, paidAt: null, createdAt: date("2026-02-01") }]
    });
    expect(page.entries).toHaveLength(2);
    expect(page.entries).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "DEPOSIT", direction: "NEUTRAL", status: "PENDING" }),
      expect.objectContaining({ type: "WITHDRAWAL", direction: "NEUTRAL" })
    ]));
  });

  it("supports type, date, and pagination filters", () => {
    const input = empty();
    const deposits = Array.from({ length: 25 }, (_, index) => ({ id: `d-${index}`, investorId, amount: index, network: "USDT", status: "CONFIRMED", reviewedAt: date(`2026-01-${String(index + 1).padStart(2, "0")}`), createdAt: date("2026-01-01") }));
    const page = buildInvestorLedger({ ...input, deposits }, { type: "DEPOSIT", from: "2026-01-10", page: 2, pageSize: 10 });
    expect(page.total).toBe(16);
    expect(page.page).toBe(2);
    expect(page.entries).toHaveLength(6);
  });
});

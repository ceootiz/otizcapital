import { describe, expect, it } from "vitest";
import { buildInvestorCalendarItems } from "./investor-calendar";

describe("investor calendar", () => {
  it("returns only source-backed dates belonging to the current investor", () => {
    const items = buildInvestorCalendarItems({
      investorId: "investor-a",
      allocations: [
        { id: "deal-a", investorId: "investor-a", supplyCode: "OTIZ-1", productName: "Phones", status: "SELLING", expectedPayoutAt: null, expectedCycleDays: 10, startedAt: new Date("2026-07-01T00:00:00.000Z"), createdAt: new Date("2026-07-01T00:00:00.000Z") },
        { id: "deal-b", investorId: "investor-b", supplyCode: "OTIZ-2", productName: "Other", status: "SELLING", expectedPayoutAt: new Date("2026-07-02T00:00:00.000Z"), expectedCycleDays: null, startedAt: null, createdAt: new Date("2026-07-01T00:00:00.000Z") }
      ],
      withdrawals: [
        { id: "withdraw-a", investorId: "investor-a", amount: "500", currency: "USD", status: "SCHEDULED", scheduledFor: new Date("2026-07-20T00:00:00.000Z") }
      ],
      reports: [
        { id: "report-a", investorId: "investor-a", month: "June 2026", title: "June report", status: "PUBLISHED", publishedAt: new Date("2026-07-05T00:00:00.000Z") }
      ]
    });

    expect(items.map((item) => item.id)).toEqual(["report:report-a", "allocation:deal-a", "withdrawal:withdraw-a"]);
    expect(items[1]?.date).toBe("2026-07-11T00:00:00.000Z");
  });

  it("does not invent dates for records without a saved or derivable date", () => {
    const items = buildInvestorCalendarItems({
      investorId: "investor-a",
      allocations: [
        { id: "draft", investorId: "investor-a", supplyCode: "DRAFT", productName: "Draft", status: "DRAFT", expectedPayoutAt: null, expectedCycleDays: null, startedAt: null, createdAt: new Date("2026-07-01T00:00:00.000Z") }
      ],
      withdrawals: [],
      reports: []
    });

    expect(items).toEqual([]);
  });
});

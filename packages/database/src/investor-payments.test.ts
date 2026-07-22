import { describe, expect, it } from "vitest";
import { summarizeReportProfitCredits } from "./investor-payments";

describe("report profit credit summary", () => {
  it("keeps uncredited report profit pending for manual approval", () => {
    expect(summarizeReportProfitCredits(
      [{ id: "payment-1", fileReportId: "report-1", profit: 125 }],
      []
    )).toEqual({
      "report-1": { profitTotal: 125, creditedProfit: 0, uncreditedProfit: 125 }
    });
  });

  it("does not leave automatically credited profit pending", () => {
    expect(summarizeReportProfitCredits(
      [{ id: "payment-1", fileReportId: "report-1", profit: 125 }],
      [{ sourceId: "payment-1", amount: "125" }]
    )).toEqual({
      "report-1": { profitTotal: 125, creditedProfit: 125, uncreditedProfit: 0 }
    });
  });

  it("groups multiple payment rows by report without double counting", () => {
    expect(summarizeReportProfitCredits(
      [
        { id: "payment-1", fileReportId: "report-1", profit: 80.25 },
        { id: "payment-2", fileReportId: "report-1", profit: 19.75 }
      ],
      [{ sourceId: "payment-1", amount: "80.25" }]
    )).toEqual({
      "report-1": { profitTotal: 100, creditedProfit: 80.25, uncreditedProfit: 19.75 }
    });
  });
});

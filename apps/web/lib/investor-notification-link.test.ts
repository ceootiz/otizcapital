import { describe, expect, it } from "vitest";
import { getInvestorNotificationHref } from "./investor-notification-link";

describe("getInvestorNotificationHref", () => {
  it("does not duplicate a locale already stored in the notification link", () => {
    expect(getInvestorNotificationHref("ru", "/ru/investor/documents")).toBe("/ru/investor/documents");
  });

  it("uses the investor's current locale for older localized links", () => {
    expect(getInvestorNotificationHref("de", "/ru/investor/documents")).toBe("/de/investor/documents");
  });

  it("adds the locale to links stored without one", () => {
    expect(getInvestorNotificationHref("en", "/investor/reports/report-1")).toBe("/en/investor/reports/report-1");
  });
});

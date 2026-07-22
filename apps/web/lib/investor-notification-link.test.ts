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

  it("sends legacy document detail links to the existing documents page", () => {
    expect(getInvestorNotificationHref("ru", "/investor/documents/document-1")).toBe("/ru/investor/documents");
  });

  it("does not send an investor to an unknown or external route", () => {
    expect(getInvestorNotificationHref("de", "/investor/missing-page")).toBe("/de/investor/dashboard");
    expect(getInvestorNotificationHref("de", "https://example.com")).toBe("/de/investor/dashboard");
  });
});

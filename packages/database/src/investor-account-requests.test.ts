import { describe, expect, it } from "vitest";
import { validateInvestorAccountRequest } from "./investor-account-requests";

describe("investor account request validation", () => {
  it("accepts supported requests and normalizes details", () => {
    expect(validateInvestorAccountRequest({ type: "PROFILE_CHANGE", details: "  Update   my phone number. " })).toEqual({
      ok: true,
      type: "PROFILE_CHANGE",
      details: "Update my phone number."
    });
  });

  it("rejects unsupported or unexplained requests", () => {
    expect(validateInvestorAccountRequest({ type: "DELETE_NOW", details: "Delete everything immediately." })).toEqual({ ok: false, error: "INVALID_REQUEST_TYPE" });
    expect(validateInvestorAccountRequest({ type: "ACCOUNT_CLOSE", details: "close" })).toEqual({ ok: false, error: "INVALID_DETAILS" });
  });
});

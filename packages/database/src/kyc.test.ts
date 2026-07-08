import { describe, expect, it } from "vitest";
import { isValidKycTransition, KYC_STATUS, type KycStatus } from "./kyc";

describe("isValidKycTransition", () => {
  it("allows an investor to start verification (NOT_STARTED → PENDING)", () => {
    expect(isValidKycTransition(KYC_STATUS.NOT_STARTED, KYC_STATUS.PENDING)).toBe(true);
  });

  it("allows a pending case to be approved or rejected", () => {
    expect(isValidKycTransition(KYC_STATUS.PENDING, KYC_STATUS.VERIFIED)).toBe(true);
    expect(isValidKycTransition(KYC_STATUS.PENDING, KYC_STATUS.REJECTED)).toBe(true);
  });

  it("allows a rejected investor to retry (REJECTED → PENDING)", () => {
    expect(isValidKycTransition(KYC_STATUS.REJECTED, KYC_STATUS.PENDING)).toBe(true);
  });

  it("treats VERIFIED as terminal", () => {
    for (const to of Object.values(KYC_STATUS)) {
      expect(isValidKycTransition(KYC_STATUS.VERIFIED, to as KycStatus)).toBe(false);
    }
  });

  it("rejects skipping straight to a decision without review", () => {
    expect(isValidKycTransition(KYC_STATUS.NOT_STARTED, KYC_STATUS.VERIFIED)).toBe(false);
    expect(isValidKycTransition(KYC_STATUS.NOT_STARTED, KYC_STATUS.REJECTED)).toBe(false);
  });

  it("rejects no-op transitions (from === to)", () => {
    for (const status of Object.values(KYC_STATUS)) {
      expect(isValidKycTransition(status as KycStatus, status as KycStatus)).toBe(false);
    }
  });

  it("rejects an unknown source status", () => {
    expect(isValidKycTransition("BOGUS" as KycStatus, KYC_STATUS.PENDING)).toBe(false);
  });
});

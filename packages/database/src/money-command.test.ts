import { describe, expect, it } from "vitest";
import {
  ALLOCATION_TRANSITIONS,
  DEPOSIT_TRANSITIONS,
  REPORT_TRANSITIONS,
  WITHDRAWAL_TRANSITIONS,
  hashMoneyCommandPayload,
  normalizeIdempotencyKey,
  validateTransition
} from "./money-command";

describe("money command rules", () => {
  it("accepts only stable idempotency keys", () => {
    expect(normalizeIdempotencyKey("withdrawal:investor-a:001")).toBe("withdrawal:investor-a:001");
    expect(normalizeIdempotencyKey("short")).toBeNull();
    expect(normalizeIdempotencyKey("invalid key with spaces")).toBeNull();
  });

  it("hashes equivalent payloads identically regardless of key order", () => {
    expect(hashMoneyCommandPayload({ amount: "10", currency: "USD" })).toBe(
      hashMoneyCommandPayload({ currency: "USD", amount: "10" })
    );
  });

  it("enforces terminal and sequential state transitions", () => {
    expect(validateTransition(DEPOSIT_TRANSITIONS, "PENDING", "CONFIRMED").ok).toBe(true);
    expect(validateTransition(DEPOSIT_TRANSITIONS, "CONFIRMED", "PENDING").ok).toBe(false);
    expect(validateTransition(WITHDRAWAL_TRANSITIONS, "REQUESTED", "APPROVED").ok).toBe(true);
    expect(validateTransition(WITHDRAWAL_TRANSITIONS, "REQUESTED", "PAID").ok).toBe(false);
    expect(validateTransition(ALLOCATION_TRANSITIONS, "DRAFT", "PURCHASING").ok).toBe(true);
    expect(validateTransition(ALLOCATION_TRANSITIONS, "DRAFT", "COMPLETED").ok).toBe(false);
    expect(validateTransition(REPORT_TRANSITIONS, "PUBLISHED", "DRAFT").ok).toBe(false);
  });
});

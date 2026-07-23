import { describe, expect, it } from "vitest";
import { normalizeDepositTransactionHash } from "./deposit-notifications";

describe("normalizeDepositTransactionHash", () => {
  it("normalizes transaction hashes before duplicate checks", () => {
    expect(normalizeDepositTransactionHash("  0xAbC123  ")).toBe("0xabc123");
  });

  it("returns null for empty values", () => {
    expect(normalizeDepositTransactionHash("   ")).toBeNull();
    expect(normalizeDepositTransactionHash(null)).toBeNull();
  });
});

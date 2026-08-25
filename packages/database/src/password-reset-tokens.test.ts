import { describe, expect, it } from "vitest";
import { hashPasswordResetToken } from "./password-reset-tokens";

describe("hashPasswordResetToken", () => {
  it("creates a stable digest without retaining the bearer token", () => {
    const token = "test-reset-token-that-must-not-be-stored";
    const digest = hashPasswordResetToken(token);

    expect(digest).toMatch(/^[a-f0-9]{64}$/u);
    expect(digest).toBe(hashPasswordResetToken(token));
    expect(digest).not.toContain(token);
    expect(digest).not.toBe(hashPasswordResetToken(`${token}-different`));
  });
});

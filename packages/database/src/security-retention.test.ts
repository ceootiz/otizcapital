import { describe, expect, it } from "vitest";
import { securityRetentionCutoffs } from "./security-retention";

describe("securityRetentionCutoffs", () => {
  it("keeps a short reset-token window and a longer session history", () => {
    const now = new Date("2026-08-25T12:00:00.000Z");
    const cutoffs = securityRetentionCutoffs(now);

    expect(cutoffs.resetTokensBefore.toISOString()).toBe("2026-08-18T12:00:00.000Z");
    expect(cutoffs.sessionsBefore.toISOString()).toBe("2026-07-26T12:00:00.000Z");
  });
});

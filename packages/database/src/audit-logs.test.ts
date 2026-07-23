import { describe, expect, it } from "vitest";
import {
  READINESS_POLICY_AUDIT_ACTIONS,
  buildInvestorFileAccessAudit,
  serializeReadinessPolicyAuditEvent
} from "./audit-logs";

describe("readiness policy audit configuration", () => {
  it("tracks the actual readiness policy audit action names", () => {
    expect(READINESS_POLICY_AUDIT_ACTIONS).toEqual([
      "CREATE_READINESS_POLICY",
      "CREATE_AND_ACTIVATE_READINESS_POLICY",
      "UPDATE_READINESS_POLICY",
      "ACTIVATE_READINESS_POLICY"
    ]);
  });

  it("does not expose raw audit json fields through action constants", () => {
    expect(READINESS_POLICY_AUDIT_ACTIONS.some((action) => action.includes("PASSWORD"))).toBe(false);
    expect(READINESS_POLICY_AUDIT_ACTIONS.some((action) => action.includes("SECRET"))).toBe(false);
  });

  it("serializes readiness policy audit metadata without raw json or sensitive keys", () => {
    const event = serializeReadinessPolicyAuditEvent({
      id: "audit-a",
      actor: "admin",
      action: "UPDATE_READINESS_POLICY",
      entityType: "ReadinessPolicy",
      entityId: "policy-a",
      beforeJson: JSON.stringify({ id: "policy-a", name: "Before", adminPassword: "hidden", requiredProofCategories: ["SHIPMENT_PROOF"] }),
      afterJson: JSON.stringify({ id: "policy-a", name: "After", sessionSecret: "hidden", requiredProofCategories: ["MARKETPLACE_REPORT"], minimumProofCompletenessScore: 80 }),
      createdAt: new Date("2026-06-10T12:00:00.000Z")
    });

    expect(event.policyId).toBe("policy-a");
    expect(event.summary).toContain("After");
    expect(JSON.stringify(event.metadata)).not.toContain("adminPassword");
    expect(JSON.stringify(event.metadata)).not.toContain("sessionSecret");
    expect("beforeJson" in event).toBe(false);
    expect("afterJson" in event).toBe(false);
  });
});

describe("investor file access audit", () => {
  it("builds a source-specific event without exposing file contents", () => {
    const event = buildInvestorFileAccessAudit({
      investorId: "investor-1",
      entityType: "InvestorDocument",
      entityId: "document-1",
      accessedAt: new Date("2026-07-23T12:00:00.000Z")
    });

    expect(event).toEqual({
      actor: "investor:investor-1",
      action: "INVESTOR_ACCESSED_FILE",
      entityType: "InvestorDocument",
      entityId: "document-1",
      afterJson: JSON.stringify({ accessedAt: "2026-07-23T12:00:00.000Z" })
    });
    expect(event.afterJson).not.toContain("fileData");
  });
});

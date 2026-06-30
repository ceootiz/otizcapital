import { Prisma } from "@prisma/client";
import { prisma } from "./client";

export const READINESS_PROOF_CATEGORIES = [
  "SHIPMENT_PROOF",
  "WAREHOUSE_MEDIA",
  "MARKETPLACE_REPORT",
  "PURCHASE_INVOICE",
  "PAYOUT_PROOF",
  "SERIAL_VERIFICATION",
  "OTHER"
] as const;

export type ReadinessProofCategory = (typeof READINESS_PROOF_CATEGORIES)[number];

export type SerializedReadinessPolicy = {
  id: string;
  name: string;
  isActive: boolean;
  requiredProofCategories: ReadinessProofCategory[];
  warningProofCategories: ReadinessProofCategory[];
  minimumProofCompletenessScore: number;
  blockOnUnreviewedCriticalArtifacts: boolean;
  blockOnHiddenInvestorLeakRisk: boolean;
  blockOnStaleSnapshot: boolean;
  allowPublishWithWarnings: boolean;
  requireWarningAcknowledgment: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  source: "database" | "default";
};

export type ReadinessPolicySnapshot = Omit<SerializedReadinessPolicy, "isActive"> & {
  snapshotCapturedAt: string;
};

export type ReadinessPolicyInput = {
  name: string;
  requiredProofCategoriesJson: string;
  warningProofCategoriesJson: string;
  minimumProofCompletenessScore: number;
  blockOnUnreviewedCriticalArtifacts: boolean;
  blockOnHiddenInvestorLeakRisk: boolean;
  blockOnStaleSnapshot: boolean;
  allowPublishWithWarnings: boolean;
  requireWarningAcknowledgment: boolean;
  isActive?: boolean;
  actor: string;
};

type ValidatedReadinessPolicyData = {
  name: string;
  requiredProofCategories: ReadinessProofCategory[];
  warningProofCategories: ReadinessProofCategory[];
  minimumProofCompletenessScore: number;
  blockOnUnreviewedCriticalArtifacts: boolean;
  blockOnHiddenInvestorLeakRisk: boolean;
  blockOnStaleSnapshot: boolean;
  allowPublishWithWarnings: boolean;
  requireWarningAcknowledgment: boolean;
  isActive: boolean;
  actor: string;
};

const DEFAULT_READINESS_POLICY: SerializedReadinessPolicy = {
  id: "default-readiness-policy",
  name: "Safe default readiness policy",
  isActive: true,
  requiredProofCategories: ["SHIPMENT_PROOF"],
  warningProofCategories: ["MARKETPLACE_REPORT"],
  minimumProofCompletenessScore: 50,
  blockOnUnreviewedCriticalArtifacts: true,
  blockOnHiddenInvestorLeakRisk: true,
  blockOnStaleSnapshot: true,
  allowPublishWithWarnings: true,
  requireWarningAcknowledgment: true,
  createdAt: null,
  updatedAt: null,
  source: "default"
};

const ALLOWED_PROOF_CATEGORIES = new Set<string>(READINESS_PROOF_CATEGORIES);

function toIso(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function sanitizePolicyName(value: string) {
  return value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, 120);
}

export function getSafeDefaultReadinessPolicy(): SerializedReadinessPolicy {
  return { ...DEFAULT_READINESS_POLICY, requiredProofCategories: [...DEFAULT_READINESS_POLICY.requiredProofCategories], warningProofCategories: [...DEFAULT_READINESS_POLICY.warningProofCategories] };
}

export function parseReadinessPolicyCategoriesJson(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      return { ok: false as const, error: "Proof categories must be a JSON array." };
    }

    const categories = parsed.map((item) => (typeof item === "string" ? item.trim() : "")).filter(Boolean);
    if (categories.some((category) => !ALLOWED_PROOF_CATEGORIES.has(category))) {
      return { ok: false as const, error: `Allowed proof categories: ${READINESS_PROOF_CATEGORIES.join(", ")}.` };
    }

    const uniqueCategories = Array.from(new Set(categories)) as ReadinessProofCategory[];
    return { ok: true as const, categories: uniqueCategories };
  } catch {
    return { ok: false as const, error: "Proof categories must be valid JSON." };
  }
}

export function validateReadinessPolicyInput(input: ReadinessPolicyInput) {
  const name = sanitizePolicyName(input.name);
  if (!name) return { ok: false as const, status: 422 as const, error: "Policy name is required." };

  const required = parseReadinessPolicyCategoriesJson(input.requiredProofCategoriesJson);
  if (!required.ok) return { ok: false as const, status: 422 as const, error: `Required proof categories: ${required.error}` };

  const warning = parseReadinessPolicyCategoriesJson(input.warningProofCategoriesJson);
  if (!warning.ok) return { ok: false as const, status: 422 as const, error: `Warning proof categories: ${warning.error}` };

  const minimumProofCompletenessScore = Number(input.minimumProofCompletenessScore);
  if (!Number.isInteger(minimumProofCompletenessScore) || minimumProofCompletenessScore < 0 || minimumProofCompletenessScore > 100) {
    return { ok: false as const, status: 422 as const, error: "Minimum proof completeness score must be an integer from 0 to 100." };
  }

  return {
    ok: true as const,
    data: {
      name,
      requiredProofCategories: required.categories,
      warningProofCategories: warning.categories,
      minimumProofCompletenessScore,
      blockOnUnreviewedCriticalArtifacts: Boolean(input.blockOnUnreviewedCriticalArtifacts),
      blockOnHiddenInvestorLeakRisk: Boolean(input.blockOnHiddenInvestorLeakRisk),
      blockOnStaleSnapshot: Boolean(input.blockOnStaleSnapshot),
      allowPublishWithWarnings: Boolean(input.allowPublishWithWarnings),
      requireWarningAcknowledgment: Boolean(input.requireWarningAcknowledgment),
      isActive: Boolean(input.isActive),
      actor: input.actor
    }
  };
}

type ReadinessPolicyRecord = {
  id: string;
  name: string;
  isActive: boolean;
  requiredProofCategoriesJson: string;
  warningProofCategoriesJson: string;
  minimumProofCompletenessScore: number;
  blockOnUnreviewedCriticalArtifacts: boolean;
  blockOnHiddenInvestorLeakRisk: boolean;
  blockOnStaleSnapshot: boolean;
  allowPublishWithWarnings: boolean;
  requireWarningAcknowledgment: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export function serializeReadinessPolicy(record: ReadinessPolicyRecord): SerializedReadinessPolicy {
  const required = parseReadinessPolicyCategoriesJson(record.requiredProofCategoriesJson);
  const warning = parseReadinessPolicyCategoriesJson(record.warningProofCategoriesJson);

  return {
    id: record.id,
    name: record.name,
    isActive: record.isActive,
    requiredProofCategories: required.ok ? required.categories : [],
    warningProofCategories: warning.ok ? warning.categories : [],
    minimumProofCompletenessScore: record.minimumProofCompletenessScore,
    blockOnUnreviewedCriticalArtifacts: record.blockOnUnreviewedCriticalArtifacts,
    blockOnHiddenInvestorLeakRisk: record.blockOnHiddenInvestorLeakRisk,
    blockOnStaleSnapshot: record.blockOnStaleSnapshot,
    allowPublishWithWarnings: record.allowPublishWithWarnings,
    requireWarningAcknowledgment: record.requireWarningAcknowledgment,
    createdAt: toIso(record.createdAt),
    updatedAt: toIso(record.updatedAt),
    source: "database"
  };
}

export function serializeReadinessPolicySnapshot(policy: SerializedReadinessPolicy): ReadinessPolicySnapshot {
  const { isActive: _isActive, ...snapshot } = policy;
  return {
    ...snapshot,
    requiredProofCategories: [...policy.requiredProofCategories],
    warningProofCategories: [...policy.warningProofCategories],
    snapshotCapturedAt: new Date().toISOString()
  };
}

function toPolicyData(data: ValidatedReadinessPolicyData) {
  return {
    name: data.name,
    requiredProofCategoriesJson: JSON.stringify(data.requiredProofCategories),
    warningProofCategoriesJson: JSON.stringify(data.warningProofCategories),
    minimumProofCompletenessScore: data.minimumProofCompletenessScore,
    blockOnUnreviewedCriticalArtifacts: data.blockOnUnreviewedCriticalArtifacts,
    blockOnHiddenInvestorLeakRisk: data.blockOnHiddenInvestorLeakRisk,
    blockOnStaleSnapshot: data.blockOnStaleSnapshot,
    allowPublishWithWarnings: data.allowPublishWithWarnings,
    requireWarningAcknowledgment: data.requireWarningAcknowledgment,
    isActive: data.isActive
  };
}

export async function getActiveReadinessPolicy(client: Pick<Prisma.TransactionClient, "readinessPolicy"> = prisma) {
  const activePolicy = await client.readinessPolicy.findFirst({
    where: { isActive: true },
    orderBy: [{ updatedAt: "desc" }]
  });

  return activePolicy ? serializeReadinessPolicy(activePolicy) : getSafeDefaultReadinessPolicy();
}

export async function listReadinessPolicies() {
  const policies = await prisma.readinessPolicy.findMany({ orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }] });
  return policies.map(serializeReadinessPolicy);
}

export async function createReadinessPolicy(input: ReadinessPolicyInput) {
  const validated = validateReadinessPolicyInput(input);
  if (!validated.ok) return validated;

  return prisma.$transaction(async (transaction) => {
    if (validated.data.isActive) {
      await transaction.readinessPolicy.updateMany({ where: { isActive: true }, data: { isActive: false } });
    }

    const policy = await transaction.readinessPolicy.create({ data: toPolicyData(validated.data) });
    await transaction.auditLog.create({
      data: {
        actor: validated.data.actor,
        action: validated.data.isActive ? "CREATE_AND_ACTIVATE_READINESS_POLICY" : "CREATE_READINESS_POLICY",
        entityType: "ReadinessPolicy",
        entityId: policy.id,
        beforeJson: null,
        afterJson: JSON.stringify(serializeReadinessPolicy(policy))
      }
    });

    if (validated.data.isActive) {
      await transaction.auditLog.create({
        data: {
          actor: validated.data.actor,
          action: "ACTIVATE_READINESS_POLICY",
          entityType: "ReadinessPolicy",
          entityId: policy.id,
          beforeJson: null,
          afterJson: JSON.stringify({ policyId: policy.id, name: policy.name })
        }
      });
    }

    return { ok: true as const, policy: serializeReadinessPolicy(policy) };
  });
}

export async function updateReadinessPolicy(id: string, input: ReadinessPolicyInput) {
  if (id === DEFAULT_READINESS_POLICY.id) {
    return { ok: false as const, status: 409 as const, error: "The safe default policy cannot be edited. Save a new policy version instead." };
  }

  const validated = validateReadinessPolicyInput(input);
  if (!validated.ok) return validated;

  return prisma.$transaction(async (transaction) => {
    const existing = await transaction.readinessPolicy.findUnique({ where: { id } });
    if (!existing) return { ok: false as const, status: 404 as const, error: "Readiness policy not found." };

    if (validated.data.isActive) {
      await transaction.readinessPolicy.updateMany({ where: { isActive: true, id: { not: id } }, data: { isActive: false } });
    }

    const policy = await transaction.readinessPolicy.update({
      where: { id },
      data: toPolicyData(validated.data)
    });

    await transaction.auditLog.create({
      data: {
        actor: validated.data.actor,
        action: "UPDATE_READINESS_POLICY",
        entityType: "ReadinessPolicy",
        entityId: policy.id,
        beforeJson: JSON.stringify(serializeReadinessPolicy(existing)),
        afterJson: JSON.stringify(serializeReadinessPolicy(policy))
      }
    });

    if (!existing.isActive && policy.isActive) {
      await transaction.auditLog.create({
        data: {
          actor: validated.data.actor,
          action: "ACTIVATE_READINESS_POLICY",
          entityType: "ReadinessPolicy",
          entityId: policy.id,
          beforeJson: JSON.stringify({ previousActive: null }),
          afterJson: JSON.stringify({ policyId: policy.id, name: policy.name })
        }
      });
    }

    return { ok: true as const, policy: serializeReadinessPolicy(policy) };
  });
}

export async function activateReadinessPolicy(input: { id: string; actor: string }) {
  if (input.id === DEFAULT_READINESS_POLICY.id) {
    return { ok: false as const, status: 409 as const, error: "Save the safe default as a database policy before activating it." };
  }

  return prisma.$transaction(async (transaction) => {
    const existing = await transaction.readinessPolicy.findUnique({ where: { id: input.id } });
    if (!existing) return { ok: false as const, status: 404 as const, error: "Readiness policy not found." };

    const previousActive = await transaction.readinessPolicy.findFirst({ where: { isActive: true } });
    await transaction.readinessPolicy.updateMany({ where: { isActive: true }, data: { isActive: false } });
    const policy = await transaction.readinessPolicy.update({ where: { id: input.id }, data: { isActive: true } });

    await transaction.auditLog.create({
      data: {
        actor: input.actor,
        action: "ACTIVATE_READINESS_POLICY",
        entityType: "ReadinessPolicy",
        entityId: policy.id,
        beforeJson: JSON.stringify(previousActive ? { policyId: previousActive.id, name: previousActive.name } : null),
        afterJson: JSON.stringify({ policyId: policy.id, name: policy.name })
      }
    });

    return { ok: true as const, policy: serializeReadinessPolicy(policy) };
  });
}

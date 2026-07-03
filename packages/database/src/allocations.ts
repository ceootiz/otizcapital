import { prisma } from "./client";
import { createNotificationEventRecord } from "./notification-events";
import { createInvestorNotification } from "./investor-notifications";
import { processPendingEmailNotificationEvents } from "./notification-processor";

export const ALLOCATION_STATUSES = ["DRAFT", "PURCHASING", "SHIPPING", "RECEIVED", "SELLING", "COMPLETED", "CANCELED", "LOSS"] as const;
export const ALLOCATION_PROOF_TYPES = ["SHIPMENT_PROOF", "WAREHOUSE_MEDIA", "MARKETPLACE_REPORT", "PURCHASE_INVOICE", "PAYOUT_PROOF", "SERIAL_VERIFICATION", "OTHER"] as const;
export const ALLOCATION_PROOF_STATUSES = ["PENDING", "AVAILABLE", "VERIFIED", "HIDDEN"] as const;
export const ALLOCATION_PAYOUT_STATUSES = ["NOT_READY", "PENDING", "APPROVED", "PAID", "REINVESTED"] as const;
export const ALLOCATION_REINVEST_DECISIONS = ["UNDECIDED", "REINVEST", "PAYOUT"] as const;
export const ALLOCATION_RISK_LEVELS = ["STANDARD", "MONITORED", "ELEVATED"] as const;

export type AllocationStatus = (typeof ALLOCATION_STATUSES)[number];
export type AllocationProofType = (typeof ALLOCATION_PROOF_TYPES)[number];
export type AllocationProofStatus = (typeof ALLOCATION_PROOF_STATUSES)[number];
export type AllocationPayoutStatus = (typeof ALLOCATION_PAYOUT_STATUSES)[number];
export type AllocationReinvestDecision = (typeof ALLOCATION_REINVEST_DECISIONS)[number];
export type AllocationRiskLevel = (typeof ALLOCATION_RISK_LEVELS)[number];

export type AllocationProofRecord = {
  id: string;
  allocationId: string;
  type: string;
  title: string;
  description: string | null;
  proofUrl: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export type AllocationRecord = {
  id: string;
  investorId: string;
  supplyCode: string;
  productName: string;
  marketplace: string | null;
  allocationAmount: string;
  currency: string;
  status: string;
  expectedCycleDays: number | null;
  expectedPayoutAt: Date | null;
  riskLevel: string;
  estimatedResult: string | null;
  actualProfit: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  payoutStatus: string;
  reinvestDecision: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AllocationWithRelations = AllocationRecord & {
  investor: {
    id: string;
    fullName: string;
    email: string;
    telegram: string | null;
    status: string;
  };
  proofs: AllocationProofRecord[];
};

export type CreateAllocationInput = {
  investorId: string;
  supplyCode: string;
  productName: string;
  marketplace?: string | null;
  allocationAmount: string;
  currency?: string;
  status: AllocationStatus;
  expectedCycleDays?: number | null;
  expectedPayoutAt?: Date | null;
  riskLevel?: AllocationRiskLevel;
  estimatedResult?: string | null;
  notes?: string | null;
  actor: string;
};

export type UpdateAllocationInput = {
  id: string;
  status?: AllocationStatus;
  marketplace?: string | null;
  allocationAmount?: string;
  expectedCycleDays?: number | null;
  expectedPayoutAt?: Date | null;
  riskLevel?: AllocationRiskLevel;
  estimatedResult?: string | null;
  actualProfit?: string | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
  payoutStatus?: AllocationPayoutStatus;
  reinvestDecision?: AllocationReinvestDecision;
  notes?: string | null;
  actor: string;
};

export type CreateAllocationProofInput = {
  allocationId: string;
  type: AllocationProofType;
  title: string;
  description?: string | null;
  proofUrl?: string | null;
  status: AllocationProofStatus;
  actor: string;
};

export type UpdateAllocationProofInput = {
  id: string;
  type?: AllocationProofType;
  title?: string;
  description?: string | null;
  proofUrl?: string | null;
  status?: AllocationProofStatus;
  actor: string;
};

export function isAllocationStatus(value: string): value is AllocationStatus {
  return ALLOCATION_STATUSES.includes(value as AllocationStatus);
}

export function isAllocationProofType(value: string): value is AllocationProofType {
  return ALLOCATION_PROOF_TYPES.includes(value as AllocationProofType);
}

export function isAllocationProofStatus(value: string): value is AllocationProofStatus {
  return ALLOCATION_PROOF_STATUSES.includes(value as AllocationProofStatus);
}

export function isAllocationPayoutStatus(value: string): value is AllocationPayoutStatus {
  return ALLOCATION_PAYOUT_STATUSES.includes(value as AllocationPayoutStatus);
}

export function isAllocationReinvestDecision(value: string): value is AllocationReinvestDecision {
  return ALLOCATION_REINVEST_DECISIONS.includes(value as AllocationReinvestDecision);
}

export function isAllocationRiskLevel(value: string): value is AllocationRiskLevel {
  return ALLOCATION_RISK_LEVELS.includes(value as AllocationRiskLevel);
}

export function isPositiveAmount(value: string) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0;
}

export function serializeAllocationProof(record: AllocationProofRecord) {
  return {
    id: record.id,
    allocationId: record.allocationId,
    type: record.type,
    title: record.title,
    description: record.description,
    proofUrl: record.proofUrl,
    status: record.status,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

export function serializeAllocation(record: AllocationRecord) {
  return {
    id: record.id,
    investorId: record.investorId,
    supplyCode: record.supplyCode,
    productName: record.productName,
    marketplace: record.marketplace,
    allocationAmount: record.allocationAmount,
    currency: record.currency,
    status: record.status,
    expectedCycleDays: record.expectedCycleDays,
    expectedPayoutAt: record.expectedPayoutAt?.toISOString() ?? null,
    riskLevel: record.riskLevel,
    estimatedResult: record.estimatedResult,
    actualProfit: record.actualProfit,
    startedAt: record.startedAt?.toISOString() ?? null,
    completedAt: record.completedAt?.toISOString() ?? null,
    payoutStatus: record.payoutStatus,
    reinvestDecision: record.reinvestDecision,
    notes: record.notes,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}

export function serializeAllocationDetail(record: AllocationWithRelations) {
  return {
    ...serializeAllocation(record),
    investor: record.investor,
    proofs: record.proofs.map(serializeAllocationProof)
  };
}

export async function listAllocationsForInvestor(investorId: string) {
  return prisma.allocation.findMany({
    where: { investorId },
    orderBy: [{ createdAt: "desc" }]
  });
}

export async function getInvestorAllocations(investorId: string) {
  return listAllocationsForInvestor(investorId);
}

export async function getAdminAllocations(options: { status?: AllocationStatus; investorId?: string; riskLevel?: AllocationRiskLevel; payoutStatus?: AllocationPayoutStatus } = {}) {
  return prisma.allocation.findMany({
    where: {
      status: options.status,
      investorId: options.investorId,
      riskLevel: options.riskLevel,
      payoutStatus: options.payoutStatus
    },
    include: {
      investor: { select: { id: true, fullName: true, email: true, telegram: true, status: true } },
      proofs: { orderBy: { createdAt: "desc" } }
    },
    orderBy: [{ updatedAt: "desc" }]
  });
}

export async function getAllocationDetailRecord(id: string) {
  return prisma.allocation.findUnique({
    where: { id },
    include: {
      investor: { select: { id: true, fullName: true, email: true, telegram: true, status: true } },
      proofs: { orderBy: { createdAt: "desc" } }
    }
  });
}

export async function getAdminAllocationById(id: string) {
  return getAllocationDetailRecord(id);
}

export async function getInvestorAllocationDetailRecord(input: { id: string; investorId: string }) {
  return prisma.allocation.findFirst({
    where: { id: input.id, investorId: input.investorId },
    include: {
      investor: { select: { id: true, fullName: true, email: true, telegram: true, status: true } },
      proofs: {
        where: { status: { in: ["AVAILABLE", "VERIFIED"] } },
        orderBy: { createdAt: "desc" }
      }
    }
  });
}

export async function createAllocationRecord(input: CreateAllocationInput) {
  const result = await runCreateAllocationTransaction(input);

  // Investor-facing "money started working" notification (bell + email).
  // Best-effort: a notification failure must never undo the created allocation.
  if (result.ok) {
    try {
      await notifyInvestorAllocationCreated(result.allocation.id);
    } catch (error) {
      console.error("[otiz] Allocation-created investor notification failed:", error);
    }
  }

  return result;
}

// Investor-facing "allocation created" notification: cabinet bell + email.
// Called automatically after creation and re-triggerable from the admin detail
// page ("Уведомить инвестора") in case the investor missed it.
export async function notifyInvestorAllocationCreated(allocationId: string) {
  const allocation = await prisma.allocation.findUnique({ where: { id: allocationId }, include: { investor: true } });

  if (!allocation) {
    return { ok: false as const, status: 404 as const, error: "Allocation not found." };
  }

  await createInvestorNotification({
    investorId: allocation.investorId,
    type: "ALLOCATION_CREATED",
    title: "Аллокация создана",
    body: `Ваш капитал размещён в аллокации ${allocation.supplyCode}. Деньги начали работать.`,
    linkHref: `/ru/investor/allocations/${allocation.id}`
  });

  try {
    await createNotificationEventRecord({
      type: "ALLOCATION_CREATED",
      channel: "EMAIL",
      recipient: allocation.investor.email,
      entityType: "Allocation",
      entityId: allocation.id,
      payload: {
        allocationId: allocation.id,
        investorId: allocation.investorId,
        fullName: allocation.investor.fullName,
        supplyCode: allocation.supplyCode,
        productName: allocation.productName
      },
      status: "PENDING"
    });
    await processPendingEmailNotificationEvents();
  } catch (error) {
    console.error("[otiz] ALLOCATION_CREATED email failed:", error);
  }

  return { ok: true as const };
}

function runCreateAllocationTransaction(input: CreateAllocationInput) {
  return prisma.$transaction(async (transaction) => {
    const investor = await transaction.investor.findUnique({ where: { id: input.investorId } });

    if (!investor) {
      return { ok: false as const, status: 404 as const, error: "Investor not found." };
    }

    const allocation = await transaction.allocation.create({
      data: {
        investorId: input.investorId,
        supplyCode: input.supplyCode,
        productName: input.productName,
        marketplace: input.marketplace || null,
        allocationAmount: input.allocationAmount,
        currency: input.currency || "USD",
        status: input.status,
        expectedCycleDays: input.expectedCycleDays ?? null,
        expectedPayoutAt: input.expectedPayoutAt ?? null,
        riskLevel: input.riskLevel ?? "STANDARD",
        estimatedResult: input.estimatedResult || null,
        actualProfit: null,
        startedAt: null,
        completedAt: null,
        payoutStatus: "NOT_READY",
        reinvestDecision: "UNDECIDED",
        notes: input.notes || null
      }
    });

    await transaction.auditLog.create({
      data: {
        actor: input.actor,
        action: "CREATE_ALLOCATION",
        entityType: "Allocation",
        entityId: allocation.id,
        beforeJson: null,
        afterJson: JSON.stringify({ investorId: allocation.investorId, supplyCode: allocation.supplyCode, status: allocation.status, allocationAmount: allocation.allocationAmount })
      }
    });

    await createNotificationEventRecord(
      {
        type: "ALLOCATION_CREATED",
        channel: "INTERNAL",
        recipient: "admin",
        entityType: "Allocation",
        entityId: allocation.id,
        payload: {
          investorId: investor.id,
          investorEmail: investor.email,
          supplyCode: allocation.supplyCode,
          productName: allocation.productName,
          status: allocation.status,
          allocationAmount: allocation.allocationAmount
        },
        status: "PENDING"
      },
      transaction
    );

    return { ok: true as const, allocation };
  });
}

export async function updateAllocationRecord(input: UpdateAllocationInput) {
  return prisma.$transaction(async (transaction) => {
    const existing = await transaction.allocation.findUnique({ where: { id: input.id } });

    if (!existing) {
      return { ok: false as const, status: 404 as const, error: "Allocation not found." };
    }

    const statusChanged = Boolean(input.status && input.status !== existing.status);
    const riskChanged = Boolean(input.riskLevel && input.riskLevel !== existing.riskLevel);
    const payoutStatusChanged = Boolean(input.payoutStatus && input.payoutStatus !== existing.payoutStatus);
    const reinvestDecisionChanged = Boolean(input.reinvestDecision && input.reinvestDecision !== existing.reinvestDecision);
    const data = {
      status: input.status ?? existing.status,
      marketplace: input.marketplace === undefined ? existing.marketplace : input.marketplace,
      allocationAmount: input.allocationAmount ?? existing.allocationAmount,
      expectedCycleDays: input.expectedCycleDays === undefined ? existing.expectedCycleDays : input.expectedCycleDays,
      expectedPayoutAt: input.expectedPayoutAt === undefined ? existing.expectedPayoutAt : input.expectedPayoutAt,
      riskLevel: input.riskLevel ?? existing.riskLevel,
      estimatedResult: input.estimatedResult === undefined ? existing.estimatedResult : input.estimatedResult,
      actualProfit: input.actualProfit === undefined ? existing.actualProfit : input.actualProfit,
      startedAt: input.startedAt === undefined ? existing.startedAt : input.startedAt,
      completedAt: input.completedAt === undefined ? existing.completedAt : input.completedAt,
      payoutStatus: input.payoutStatus ?? existing.payoutStatus,
      reinvestDecision: input.reinvestDecision ?? existing.reinvestDecision,
      notes: input.notes === undefined ? existing.notes : input.notes
    };

    if (data.status === "COMPLETED" && !data.completedAt) {
      data.completedAt = new Date();
    }

    const allocation = await transaction.allocation.update({ where: { id: existing.id }, data });

    await transaction.auditLog.create({
      data: {
        actor: input.actor,
        action: "UPDATE_ALLOCATION",
        entityType: "Allocation",
        entityId: allocation.id,
        beforeJson: JSON.stringify({
          status: existing.status,
          marketplace: existing.marketplace,
          allocationAmount: existing.allocationAmount,
          expectedCycleDays: existing.expectedCycleDays,
          expectedPayoutAt: existing.expectedPayoutAt,
          riskLevel: existing.riskLevel,
          estimatedResult: existing.estimatedResult,
          actualProfit: existing.actualProfit,
          startedAt: existing.startedAt,
          completedAt: existing.completedAt,
          payoutStatus: existing.payoutStatus,
          reinvestDecision: existing.reinvestDecision,
          notes: existing.notes
        }),
        afterJson: JSON.stringify({
          status: allocation.status,
          marketplace: allocation.marketplace,
          allocationAmount: allocation.allocationAmount,
          expectedCycleDays: allocation.expectedCycleDays,
          expectedPayoutAt: allocation.expectedPayoutAt,
          riskLevel: allocation.riskLevel,
          estimatedResult: allocation.estimatedResult,
          actualProfit: allocation.actualProfit,
          startedAt: allocation.startedAt,
          completedAt: allocation.completedAt,
          payoutStatus: allocation.payoutStatus,
          reinvestDecision: allocation.reinvestDecision,
          notes: allocation.notes
        })
      }
    });

    if (statusChanged) {
      await createNotificationEventRecord({ type: "ALLOCATION_STATUS_CHANGED", channel: "INTERNAL", recipient: "admin", entityType: "Allocation", entityId: allocation.id, payload: { investorId: allocation.investorId, supplyCode: allocation.supplyCode, productName: allocation.productName, previousStatus: existing.status, status: allocation.status }, status: "PENDING" }, transaction);
    }

    if (riskChanged) {
      await transaction.auditLog.create({
        data: {
          actor: input.actor,
          action: "UPDATE_ALLOCATION_RISK",
          entityType: "Allocation",
          entityId: allocation.id,
          beforeJson: JSON.stringify({ riskLevel: existing.riskLevel }),
          afterJson: JSON.stringify({ riskLevel: allocation.riskLevel })
        }
      });
    }

    if (payoutStatusChanged) {
      await createNotificationEventRecord({ type: "ALLOCATION_PAYOUT_STATE_CHANGED", channel: "INTERNAL", recipient: "admin", entityType: "Allocation", entityId: allocation.id, payload: { investorId: allocation.investorId, supplyCode: allocation.supplyCode, productName: allocation.productName, previousPayoutStatus: existing.payoutStatus, payoutStatus: allocation.payoutStatus }, status: "PENDING" }, transaction);
    }

    if (reinvestDecisionChanged) {
      await createNotificationEventRecord({ type: "ALLOCATION_REINVEST_DECISION_CHANGED", channel: "INTERNAL", recipient: "admin", entityType: "Allocation", entityId: allocation.id, payload: { investorId: allocation.investorId, supplyCode: allocation.supplyCode, productName: allocation.productName, previousReinvestDecision: existing.reinvestDecision, reinvestDecision: allocation.reinvestDecision }, status: "PENDING" }, transaction);
    }

    return { ok: true as const, allocation };
  });
}

export async function createAllocation(input: CreateAllocationInput) {
  return createAllocationRecord(input);
}

export async function updateAllocation(input: UpdateAllocationInput) {
  return updateAllocationRecord(input);
}

export async function updateAllocationStage(input: { id: string; status: AllocationStatus; actor: string }) {
  return updateAllocationRecord({ id: input.id, status: input.status, actor: input.actor });
}

export async function updateAllocationRisk(input: { id: string; riskLevel: AllocationRiskLevel; actor: string }) {
  return updateAllocationRecord({ id: input.id, riskLevel: input.riskLevel, actor: input.actor });
}

export async function markAllocationCompleted(input: { id: string; actualProfit?: string | null; completedAt?: Date | null; actor: string }) {
  return updateAllocationRecord({ id: input.id, status: "COMPLETED", actualProfit: input.actualProfit ?? undefined, completedAt: input.completedAt ?? new Date(), actor: input.actor });
}

export async function markAllocationLoss(input: { id: string; notes?: string | null; actor: string }) {
  return updateAllocationRecord({ id: input.id, status: "LOSS", notes: input.notes ?? undefined, actor: input.actor });
}

export async function createAllocationProofRecord(input: CreateAllocationProofInput) {
  return prisma.$transaction(async (transaction) => {
    const allocation = await transaction.allocation.findUnique({ where: { id: input.allocationId } });

    if (!allocation) {
      return { ok: false as const, status: 404 as const, error: "Allocation not found." };
    }

    const proof = await transaction.allocationProof.create({
      data: {
        allocationId: input.allocationId,
        type: input.type,
        title: input.title,
        description: input.description || null,
        proofUrl: input.proofUrl || null,
        status: input.status
      }
    });

    await transaction.auditLog.create({
      data: {
        actor: input.actor,
        action: "CREATE_ALLOCATION_PROOF",
        entityType: "AllocationProof",
        entityId: proof.id,
        beforeJson: null,
        afterJson: JSON.stringify({ allocationId: proof.allocationId, type: proof.type, status: proof.status, title: proof.title })
      }
    });

    return { ok: true as const, proof };
  });
}

export async function attachAllocationProof(input: CreateAllocationProofInput) {
  return createAllocationProofRecord(input);
}

export async function updateAllocationProofRecord(input: UpdateAllocationProofInput) {
  return prisma.$transaction(async (transaction) => {
    const existing = await transaction.allocationProof.findUnique({ where: { id: input.id } });

    if (!existing) {
      return { ok: false as const, status: 404 as const, error: "Allocation proof not found." };
    }

    const proof = await transaction.allocationProof.update({
      where: { id: existing.id },
      data: {
        type: input.type ?? existing.type,
        title: input.title ?? existing.title,
        description: input.description === undefined ? existing.description : input.description,
        proofUrl: input.proofUrl === undefined ? existing.proofUrl : input.proofUrl,
        status: input.status ?? existing.status
      }
    });

    await transaction.auditLog.create({
      data: {
        actor: input.actor,
        action: "UPDATE_ALLOCATION_PROOF",
        entityType: "AllocationProof",
        entityId: proof.id,
        beforeJson: JSON.stringify({ type: existing.type, title: existing.title, description: existing.description, proofUrl: existing.proofUrl, status: existing.status }),
        afterJson: JSON.stringify({ type: proof.type, title: proof.title, description: proof.description, proofUrl: proof.proofUrl, status: proof.status })
      }
    });

    return { ok: true as const, proof };
  });
}

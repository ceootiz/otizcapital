import crypto from "node:crypto";
import { MoneyOperationType, Prisma } from "@prisma/client";
import { prisma } from "./client";
import { isProductFeatureEnabled } from "./site-settings";

export const DEPOSIT_TRANSITIONS = {
  PENDING: ["CONFIRMED", "REJECTED"],
  CONFIRMED: [],
  REJECTED: []
} as const;

export const WITHDRAWAL_TRANSITIONS = {
  REQUESTED: ["APPROVED", "REJECTED", "CANCELLED"],
  APPROVED: ["SCHEDULED", "CANCELLED"],
  SCHEDULED: ["PAID", "CANCELLED"],
  PAID: [],
  REJECTED: [],
  CANCELLED: []
} as const;

export const ALLOCATION_TRANSITIONS = {
  DRAFT: ["PURCHASING", "CANCELED"],
  PURCHASING: ["SHIPPING", "CANCELED", "LOSS"],
  SHIPPING: ["RECEIVED", "CANCELED", "LOSS"],
  RECEIVED: ["SELLING", "CANCELED", "LOSS"],
  SELLING: ["COMPLETED", "LOSS"],
  COMPLETED: [],
  CANCELED: [],
  LOSS: []
} as const;

export const REPORT_TRANSITIONS = {
  DRAFT: ["PUBLISHED"],
  PUBLISHED: []
} as const;

type TransitionMap = Readonly<Record<string, readonly string[]>>;

export type MoneyCommandErrorCode =
  | "INVALID_IDEMPOTENCY_KEY"
  | "IDEMPOTENCY_CONFLICT"
  | "INVALID_TRANSITION";

export type MoneyCommandResult<T> =
  | { ok: true; operationId: string; correlationId: string; replayed: boolean; value: T }
  | { ok: false; code: MoneyCommandErrorCode; status: 409 | 422; error: string; correlationId: string };

export function canTransition(map: TransitionMap, currentStatus: string, nextStatus: string) {
  return map[currentStatus]?.includes(nextStatus) ?? false;
}

export function validateTransition(map: TransitionMap, currentStatus: string, nextStatus: string) {
  return canTransition(map, currentStatus, nextStatus)
    ? { ok: true as const }
    : {
        ok: false as const,
        code: "INVALID_TRANSITION" as const,
        status: 409 as const,
        error: `Transition ${currentStatus} -> ${nextStatus} is not allowed.`
      };
}

export function normalizeIdempotencyKey(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return /^[A-Za-z0-9._:-]{16,128}$/.test(normalized) ? normalized : null;
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, stableValue(item)])
    );
  }
  return value;
}

export function hashMoneyCommandPayload(value: unknown) {
  return crypto.createHash("sha256").update(JSON.stringify(stableValue(value))).digest("hex");
}

export async function isCanonicalMoneyWriteEnabled() {
  if (process.env.CANONICAL_MONEY_LEDGER_WRITE_ENABLED !== "true") return false;
  return isProductFeatureEnabled("canonical-money-ledger");
}

function parseResult<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export async function executeMoneyCommand<T>(input: {
  investorId: string;
  operationType: MoneyOperationType;
  amount: string | number | Prisma.Decimal;
  currency: string;
  sourceKey: string;
  idempotencyKey: string;
  actor: string;
  reason?: string | null;
  payload: unknown;
  execute: (transaction: Prisma.TransactionClient, operationId: string) => Promise<T>;
}): Promise<MoneyCommandResult<T>> {
  const correlationId = crypto.randomUUID();
  const idempotencyKey = normalizeIdempotencyKey(input.idempotencyKey);
  if (!idempotencyKey) {
    return {
      ok: false,
      code: "INVALID_IDEMPOTENCY_KEY",
      status: 422,
      error: "A valid Idempotency-Key is required.",
      correlationId
    };
  }
  const requestHash = hashMoneyCommandPayload(input.payload);

  return prisma.$transaction(async (transaction) => {
    await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${input.investorId}))`;
    const existing = await transaction.moneyOperation.findUnique({
      where: {
        investorId_operationType_idempotencyKey: {
          investorId: input.investorId,
          operationType: input.operationType,
          idempotencyKey
        }
      }
    });

    if (existing) {
      if (existing.requestHash !== requestHash) {
        return {
          ok: false as const,
          code: "IDEMPOTENCY_CONFLICT" as const,
          status: 409 as const,
          error: "The idempotency key was already used for a different request.",
          correlationId: existing.correlationId
        };
      }
      const value = parseResult<T>(existing.resultJson);
      if (existing.status === "COMMITTED" && value !== null) {
        return {
          ok: true as const,
          operationId: existing.id,
          correlationId: existing.correlationId,
          replayed: true,
          value
        };
      }
    }

    const operation =
      existing ??
      (await transaction.moneyOperation.create({
        data: {
          investorId: input.investorId,
          operationType: input.operationType,
          amount: new Prisma.Decimal(input.amount),
          currency: input.currency.trim().toUpperCase(),
          sourceKey: input.sourceKey,
          idempotencyKey,
          requestHash,
          correlationId,
          actor: input.actor,
          reason: input.reason ?? null
        }
      }));
    const value = await input.execute(transaction, operation.id);
    const resultJson = JSON.stringify(value);

    await transaction.moneyOperation.update({
      where: { id: operation.id },
      data: { status: "COMMITTED", committedAt: new Date(), resultJson }
    });
    await transaction.auditLog.create({
      data: {
        actor: input.actor,
        action: `COMMIT_${input.operationType}`,
        entityType: "MoneyOperation",
        entityId: operation.id,
        afterJson: JSON.stringify({
          investorId: input.investorId,
          operationType: input.operationType,
          amount: String(input.amount),
          currency: input.currency.trim().toUpperCase(),
          sourceKey: input.sourceKey,
          correlationId: operation.correlationId
        })
      }
    });

    return {
      ok: true as const,
      operationId: operation.id,
      correlationId: operation.correlationId,
      replayed: false,
      value
    };
  });
}

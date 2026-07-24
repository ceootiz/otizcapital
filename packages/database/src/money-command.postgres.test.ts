import crypto from "node:crypto";
import { MoneyOperationType } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "./client";
import { executeMoneyCommand } from "./money-command";

const databaseTestsEnabled = process.env.OTIZ_DB_TESTS_ENABLED === "true";
const runId = crypto.randomUUID();
const investorEmail = `money-command-${runId}@example.invalid`;
const sourcePrefix = `postgres-test:${runId}`;
let investorId = "";

describe.skipIf(!databaseTestsEnabled)("money command PostgreSQL integrity", () => {
  beforeAll(async () => {
    const investor = await prisma.investor.create({
      data: {
        fullName: "Money Command Integration Test",
        email: investorEmail
      }
    });
    investorId = investor.id;
  });

  afterAll(async () => {
    if (!investorId) return;
    const operations = await prisma.moneyOperation.findMany({
      where: { investorId },
      select: { id: true }
    });
    const operationIds = operations.map((operation) => operation.id);
    await prisma.$transaction([
      prisma.ledgerEntry.deleteMany({ where: { investorId } }),
      prisma.auditLog.deleteMany({
        where: {
          entityType: "MoneyOperation",
          entityId: { in: operationIds }
        }
      }),
      prisma.moneyOperation.deleteMany({ where: { investorId } }),
      prisma.investor.deleteMany({ where: { id: investorId } })
    ]);
  });

  it("serializes concurrent retries and commits one ledger mutation", async () => {
    const idempotencyKey = `withdrawal:${runId}`;
    const sourceKey = `${sourcePrefix}:concurrent`;
    const command = () =>
      executeMoneyCommand({
        investorId,
        operationType: MoneyOperationType.WITHDRAWAL_REQUEST,
        amount: "125.50",
        currency: "USD",
        sourceKey,
        idempotencyKey,
        actor: `investor:${investorId}`,
        payload: { amount: "125.50", currency: "USD" },
        execute: async (transaction, operationId) => {
          const entry = await transaction.ledgerEntry.create({
            data: {
              ledgerType: "INVESTOR_PENDING_WITHDRAWAL",
              investorId,
              moneyOperationId: operationId,
              entryType: "WITHDRAWAL_REQUEST",
              amount: "-125.50",
              currency: "USD",
              occurredAt: new Date(),
              sourceType: "POSTGRES_INTEGRATION_TEST",
              sourceId: sourceKey,
              description: "Concurrent idempotency proof",
              createdBy: `investor:${investorId}`
            }
          });
          return { ledgerEntryId: entry.id };
        }
      });

    const [first, second] = await Promise.all([command(), command()]);

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(first.operationId).toBe(second.operationId);
    expect([first.replayed, second.replayed].sort()).toEqual([false, true]);
    expect(first.value).toEqual(second.value);
    await expect(prisma.moneyOperation.count({ where: { investorId, sourceKey } })).resolves.toBe(1);
    await expect(prisma.ledgerEntry.count({ where: { investorId, sourceId: sourceKey } })).resolves.toBe(1);
    await expect(
      prisma.auditLog.count({
        where: { entityType: "MoneyOperation", entityId: first.operationId }
      })
    ).resolves.toBe(1);
  });

  it("rejects reuse of an idempotency key with a different payload", async () => {
    const idempotencyKey = `deposit:${runId}`;
    const sourceKey = `${sourcePrefix}:conflict`;
    const execute = (amount: string) =>
      executeMoneyCommand({
        investorId,
        operationType: MoneyOperationType.DEPOSIT_CONFIRMATION,
        amount,
        currency: "USD",
        sourceKey,
        idempotencyKey,
        actor: "integration-test",
        payload: { amount },
        execute: async () => ({ amount })
      });

    const first = await execute("100");
    const conflict = await execute("101");

    expect(first.ok).toBe(true);
    expect(conflict.ok).toBe(false);
    if (conflict.ok) return;
    expect(conflict.code).toBe("IDEMPOTENCY_CONFLICT");
    await expect(prisma.moneyOperation.count({ where: { investorId, sourceKey } })).resolves.toBe(1);
  });

  it("rolls back the operation, ledger entry, and audit when execution fails", async () => {
    const sourceKey = `${sourcePrefix}:rollback`;
    await expect(
      executeMoneyCommand({
        investorId,
        operationType: MoneyOperationType.MANUAL_ADJUSTMENT,
        amount: "50",
        currency: "USD",
        sourceKey,
        idempotencyKey: `rollback:${runId}`,
        actor: "integration-test",
        payload: { amount: "50" },
        execute: async (transaction, operationId) => {
          await transaction.ledgerEntry.create({
            data: {
              ledgerType: "INVESTOR_FREE",
              investorId,
              moneyOperationId: operationId,
              entryType: "MANUAL_ADJUSTMENT",
              amount: "50",
              currency: "USD",
              occurredAt: new Date(),
              sourceType: "POSTGRES_INTEGRATION_TEST",
              sourceId: sourceKey,
              description: "Rollback proof",
              createdBy: "integration-test"
            }
          });
          throw new Error("forced_transaction_failure");
        }
      })
    ).rejects.toThrow("forced_transaction_failure");

    await expect(prisma.moneyOperation.count({ where: { investorId, sourceKey } })).resolves.toBe(0);
    await expect(prisma.ledgerEntry.count({ where: { investorId, sourceId: sourceKey } })).resolves.toBe(0);
    await expect(
      prisma.auditLog.count({
        where: { entityType: "MoneyOperation", afterJson: { contains: sourceKey } }
      })
    ).resolves.toBe(0);
  });
});

-- CreateEnum
CREATE TYPE "MoneyOperationType" AS ENUM (
    'DEPOSIT_CONFIRMATION',
    'ALLOCATION_FUNDING',
    'PROFIT_CREDIT',
    'REINVESTMENT',
    'WITHDRAWAL_REQUEST',
    'WITHDRAWAL_APPROVAL',
    'WITHDRAWAL_SCHEDULE',
    'WITHDRAWAL_PAYMENT',
    'WITHDRAWAL_CANCELLATION',
    'REFERRAL_COMMISSION',
    'MANUAL_ADJUSTMENT'
);

-- CreateEnum
CREATE TYPE "MoneyOperationStatus" AS ENUM ('PENDING', 'COMMITTED', 'FAILED', 'REVERSED');

-- CreateTable
CREATE TABLE "MoneyOperation" (
    "id" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "operationType" "MoneyOperationType" NOT NULL,
    "status" "MoneyOperationStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(36,18) NOT NULL,
    "currency" TEXT NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "idempotencyKey" TEXT,
    "requestHash" TEXT,
    "correlationId" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "reason" TEXT,
    "failureCode" TEXT,
    "metadataJson" TEXT,
    "committedAt" TIMESTAMP(3),
    "reversedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MoneyOperation_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "MoneyOperation_amount_nonnegative" CHECK ("amount" >= 0)
);

-- AlterTable
ALTER TABLE "LedgerEntry" ADD COLUMN "moneyOperationId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "MoneyOperation_correlationId_key" ON "MoneyOperation"("correlationId");
CREATE UNIQUE INDEX "MoneyOperation_investorId_operationType_sourceKey_key" ON "MoneyOperation"("investorId", "operationType", "sourceKey");
CREATE UNIQUE INDEX "MoneyOperation_investorId_operationType_idempotencyKey_key" ON "MoneyOperation"("investorId", "operationType", "idempotencyKey");
CREATE INDEX "MoneyOperation_investorId_status_idx" ON "MoneyOperation"("investorId", "status");
CREATE INDEX "MoneyOperation_operationType_status_idx" ON "MoneyOperation"("operationType", "status");
CREATE INDEX "MoneyOperation_createdAt_idx" ON "MoneyOperation"("createdAt");
CREATE INDEX "LedgerEntry_moneyOperationId_idx" ON "LedgerEntry"("moneyOperationId");

-- AddForeignKey
ALTER TABLE "MoneyOperation" ADD CONSTRAINT "MoneyOperation_investorId_fkey"
FOREIGN KEY ("investorId") REFERENCES "Investor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_moneyOperationId_fkey"
FOREIGN KEY ("moneyOperationId") REFERENCES "MoneyOperation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

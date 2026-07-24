-- AlterEnum
ALTER TYPE "MoneyOperationType" ADD VALUE 'DEPOSIT_CLAIM' BEFORE 'DEPOSIT_CONFIRMATION';

-- AlterTable
ALTER TABLE "MoneyOperation" ADD COLUMN "resultJson" TEXT;

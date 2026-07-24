-- AlterTable
ALTER TABLE "MonthlyReport" ADD COLUMN "readinessEvaluatedAt" DATETIME;
ALTER TABLE "MonthlyReport" ADD COLUMN "readinessScore" INTEGER;
ALTER TABLE "MonthlyReport" ADD COLUMN "readinessSnapshotJson" TEXT;
ALTER TABLE "MonthlyReport" ADD COLUMN "readinessState" TEXT;

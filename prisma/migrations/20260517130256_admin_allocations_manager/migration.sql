-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Allocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "investorId" TEXT NOT NULL,
    "supplyCode" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "marketplace" TEXT,
    "allocationAmount" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL,
    "expectedCycleDays" INTEGER,
    "expectedPayoutAt" DATETIME,
    "riskLevel" TEXT NOT NULL DEFAULT 'STANDARD',
    "estimatedResult" TEXT,
    "actualProfit" TEXT,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "payoutStatus" TEXT NOT NULL DEFAULT 'NOT_READY',
    "reinvestDecision" TEXT NOT NULL DEFAULT 'UNDECIDED',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Allocation_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "Investor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Allocation" ("actualProfit", "allocationAmount", "completedAt", "createdAt", "currency", "estimatedResult", "expectedCycleDays", "id", "investorId", "marketplace", "notes", "payoutStatus", "productName", "reinvestDecision", "startedAt", "status", "supplyCode", "updatedAt") SELECT "actualProfit", "allocationAmount", "completedAt", "createdAt", "currency", "estimatedResult", "expectedCycleDays", "id", "investorId", "marketplace", "notes", "payoutStatus", "productName", "reinvestDecision", "startedAt", "status", "supplyCode", "updatedAt" FROM "Allocation";
DROP TABLE "Allocation";
ALTER TABLE "new_Allocation" RENAME TO "Allocation";
CREATE INDEX "Allocation_investorId_idx" ON "Allocation"("investorId");
CREATE INDEX "Allocation_status_idx" ON "Allocation"("status");
CREATE INDEX "Allocation_riskLevel_idx" ON "Allocation"("riskLevel");
CREATE INDEX "Allocation_expectedPayoutAt_idx" ON "Allocation"("expectedPayoutAt");
CREATE INDEX "Allocation_payoutStatus_idx" ON "Allocation"("payoutStatus");
CREATE INDEX "Allocation_reinvestDecision_idx" ON "Allocation"("reinvestDecision");
CREATE INDEX "Allocation_supplyCode_idx" ON "Allocation"("supplyCode");
CREATE INDEX "Allocation_createdAt_idx" ON "Allocation"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

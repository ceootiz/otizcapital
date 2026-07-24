-- CreateTable
CREATE TABLE "AllocationProof" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "allocationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "proofUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AllocationProof_allocationId_fkey" FOREIGN KEY ("allocationId") REFERENCES "Allocation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

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
INSERT INTO "new_Allocation" ("actualProfit", "allocationAmount", "completedAt", "createdAt", "currency", "estimatedResult", "expectedCycleDays", "id", "investorId", "marketplace", "notes", "productName", "startedAt", "status", "supplyCode", "updatedAt") SELECT "actualProfit", "allocationAmount", "completedAt", "createdAt", "currency", "estimatedResult", "expectedCycleDays", "id", "investorId", "marketplace", "notes", "productName", "startedAt", "status", "supplyCode", "updatedAt" FROM "Allocation";
DROP TABLE "Allocation";
ALTER TABLE "new_Allocation" RENAME TO "Allocation";
CREATE INDEX "Allocation_investorId_idx" ON "Allocation"("investorId");
CREATE INDEX "Allocation_status_idx" ON "Allocation"("status");
CREATE INDEX "Allocation_payoutStatus_idx" ON "Allocation"("payoutStatus");
CREATE INDEX "Allocation_reinvestDecision_idx" ON "Allocation"("reinvestDecision");
CREATE INDEX "Allocation_supplyCode_idx" ON "Allocation"("supplyCode");
CREATE INDEX "Allocation_createdAt_idx" ON "Allocation"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "AllocationProof_allocationId_idx" ON "AllocationProof"("allocationId");

-- CreateIndex
CREATE INDEX "AllocationProof_type_idx" ON "AllocationProof"("type");

-- CreateIndex
CREATE INDEX "AllocationProof_status_idx" ON "AllocationProof"("status");

-- CreateIndex
CREATE INDEX "AllocationProof_createdAt_idx" ON "AllocationProof"("createdAt");

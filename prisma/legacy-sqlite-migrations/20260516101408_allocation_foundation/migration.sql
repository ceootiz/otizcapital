-- CreateTable
CREATE TABLE "Allocation" (
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
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Allocation_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "Investor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Allocation_investorId_idx" ON "Allocation"("investorId");

-- CreateIndex
CREATE INDEX "Allocation_status_idx" ON "Allocation"("status");

-- CreateIndex
CREATE INDEX "Allocation_supplyCode_idx" ON "Allocation"("supplyCode");

-- CreateIndex
CREATE INDEX "Allocation_createdAt_idx" ON "Allocation"("createdAt");

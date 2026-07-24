-- CreateTable
CREATE TABLE "MonthlyReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "investorId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "performanceNote" TEXT,
    "payoutNote" TEXT,
    "proofSummaryJson" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MonthlyReport_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "Investor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "MonthlyReport_investorId_idx" ON "MonthlyReport"("investorId");

-- CreateIndex
CREATE INDEX "MonthlyReport_status_idx" ON "MonthlyReport"("status");

-- CreateIndex
CREATE INDEX "MonthlyReport_month_idx" ON "MonthlyReport"("month");

-- CreateIndex
CREATE INDEX "MonthlyReport_publishedAt_idx" ON "MonthlyReport"("publishedAt");

-- CreateIndex
CREATE INDEX "MonthlyReport_createdAt_idx" ON "MonthlyReport"("createdAt");

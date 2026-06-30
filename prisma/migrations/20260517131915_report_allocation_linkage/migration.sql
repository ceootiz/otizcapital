-- CreateTable
CREATE TABLE "MonthlyReportAllocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "monthlyReportId" TEXT NOT NULL,
    "allocationId" TEXT NOT NULL,
    "includedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "includedBy" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MonthlyReportAllocation_monthlyReportId_fkey" FOREIGN KEY ("monthlyReportId") REFERENCES "MonthlyReport" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MonthlyReportAllocation_allocationId_fkey" FOREIGN KEY ("allocationId") REFERENCES "Allocation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "MonthlyReportAllocation_monthlyReportId_idx" ON "MonthlyReportAllocation"("monthlyReportId");

-- CreateIndex
CREATE INDEX "MonthlyReportAllocation_allocationId_idx" ON "MonthlyReportAllocation"("allocationId");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyReportAllocation_monthlyReportId_allocationId_key" ON "MonthlyReportAllocation"("monthlyReportId", "allocationId");

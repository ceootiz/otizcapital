-- CreateTable
CREATE TABLE "OperationalIncident" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "incidentType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "allocationId" TEXT,
    "monthlyReportId" TEXT,
    "investorId" TEXT,
    "source" TEXT NOT NULL,
    "detectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" DATETIME,
    "acknowledgedBy" TEXT,
    "resolvedAt" DATETIME,
    "resolvedBy" TEXT,
    "metadataJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OperationalIncident_allocationId_fkey" FOREIGN KEY ("allocationId") REFERENCES "Allocation" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "OperationalIncident_monthlyReportId_fkey" FOREIGN KEY ("monthlyReportId") REFERENCES "MonthlyReport" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "OperationalIncident_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "Investor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "OperationalIncident_incidentType_idx" ON "OperationalIncident"("incidentType");

-- CreateIndex
CREATE INDEX "OperationalIncident_severity_idx" ON "OperationalIncident"("severity");

-- CreateIndex
CREATE INDEX "OperationalIncident_status_idx" ON "OperationalIncident"("status");

-- CreateIndex
CREATE INDEX "OperationalIncident_source_idx" ON "OperationalIncident"("source");

-- CreateIndex
CREATE INDEX "OperationalIncident_detectedAt_idx" ON "OperationalIncident"("detectedAt");

-- CreateIndex
CREATE INDEX "OperationalIncident_allocationId_idx" ON "OperationalIncident"("allocationId");

-- CreateIndex
CREATE INDEX "OperationalIncident_monthlyReportId_idx" ON "OperationalIncident"("monthlyReportId");

-- CreateIndex
CREATE INDEX "OperationalIncident_investorId_idx" ON "OperationalIncident"("investorId");

-- CreateIndex
CREATE INDEX "OperationalIncident_source_incidentType_status_idx" ON "OperationalIncident"("source", "incidentType", "status");

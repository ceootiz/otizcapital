-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_LedgerEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ledgerType" TEXT NOT NULL,
    "allocationId" TEXT,
    "investorId" TEXT,
    "monthlyReportId" TEXT,
    "entryType" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "quantity" INTEGER,
    "unitCost" TEXT,
    "occurredAt" DATETIME NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT,
    "description" TEXT NOT NULL,
    "metadataJson" TEXT,
    "createdBy" TEXT NOT NULL,
    "isReversal" BOOLEAN NOT NULL DEFAULT false,
    "reversesLedgerEntryId" TEXT,
    "reversalReason" TEXT,
    "correctedByLedgerEntryId" TEXT,
    "voidedAt" DATETIME,
    "voidedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LedgerEntry_allocationId_fkey" FOREIGN KEY ("allocationId") REFERENCES "Allocation" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "LedgerEntry_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "Investor" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "LedgerEntry_monthlyReportId_fkey" FOREIGN KEY ("monthlyReportId") REFERENCES "MonthlyReport" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_LedgerEntry" ("allocationId", "amount", "createdAt", "createdBy", "currency", "description", "entryType", "id", "investorId", "ledgerType", "metadataJson", "monthlyReportId", "occurredAt", "quantity", "sourceId", "sourceType", "unitCost", "updatedAt") SELECT "allocationId", "amount", "createdAt", "createdBy", "currency", "description", "entryType", "id", "investorId", "ledgerType", "metadataJson", "monthlyReportId", "occurredAt", "quantity", "sourceId", "sourceType", "unitCost", "updatedAt" FROM "LedgerEntry";
DROP TABLE "LedgerEntry";
ALTER TABLE "new_LedgerEntry" RENAME TO "LedgerEntry";
CREATE INDEX "LedgerEntry_ledgerType_idx" ON "LedgerEntry"("ledgerType");
CREATE INDEX "LedgerEntry_allocationId_idx" ON "LedgerEntry"("allocationId");
CREATE INDEX "LedgerEntry_investorId_idx" ON "LedgerEntry"("investorId");
CREATE INDEX "LedgerEntry_monthlyReportId_idx" ON "LedgerEntry"("monthlyReportId");
CREATE INDEX "LedgerEntry_occurredAt_idx" ON "LedgerEntry"("occurredAt");
CREATE INDEX "LedgerEntry_sourceType_sourceId_idx" ON "LedgerEntry"("sourceType", "sourceId");
CREATE INDEX "LedgerEntry_reversesLedgerEntryId_idx" ON "LedgerEntry"("reversesLedgerEntryId");
CREATE INDEX "LedgerEntry_correctedByLedgerEntryId_idx" ON "LedgerEntry"("correctedByLedgerEntryId");
CREATE INDEX "LedgerEntry_isReversal_idx" ON "LedgerEntry"("isReversal");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

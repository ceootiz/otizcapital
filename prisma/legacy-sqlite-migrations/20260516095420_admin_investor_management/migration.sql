-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Investor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telegram" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "sourceApplicationId" TEXT,
    "totalCapital" TEXT NOT NULL DEFAULT '0',
    "reinvestEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lastReportAt" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Investor" ("createdAt", "email", "fullName", "id", "status", "telegram", "updatedAt") SELECT "createdAt", "email", "fullName", "id", "status", "telegram", "updatedAt" FROM "Investor";
DROP TABLE "Investor";
ALTER TABLE "new_Investor" RENAME TO "Investor";
CREATE UNIQUE INDEX "Investor_email_key" ON "Investor"("email");
CREATE INDEX "Investor_status_idx" ON "Investor"("status");
CREATE INDEX "Investor_email_idx" ON "Investor"("email");
CREATE INDEX "Investor_sourceApplicationId_idx" ON "Investor"("sourceApplicationId");
CREATE TABLE "new_InvestorApplication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "investorId" TEXT,
    "fullName" TEXT NOT NULL,
    "telegram" TEXT,
    "email" TEXT,
    "country" TEXT NOT NULL,
    "preferredContactMethod" TEXT NOT NULL,
    "plannedAllocationAmount" INTEGER NOT NULL,
    "preferredDepositMethod" TEXT NOT NULL,
    "investorType" TEXT NOT NULL,
    "reinvestInterest" TEXT NOT NULL,
    "heardFrom" TEXT NOT NULL,
    "message" TEXT,
    "consentAccepted" BOOLEAN NOT NULL,
    "managerNotes" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "sourceLabel" TEXT,
    "nextAction" TEXT,
    "nextActionAt" DATETIME,
    "contactedAt" DATETIME,
    "approvedAt" DATETIME,
    "rejectedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InvestorApplication_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "Investor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_InvestorApplication" ("approvedAt", "consentAccepted", "contactedAt", "country", "createdAt", "email", "fullName", "heardFrom", "id", "investorType", "managerNotes", "message", "nextAction", "nextActionAt", "plannedAllocationAmount", "preferredContactMethod", "preferredDepositMethod", "priority", "reinvestInterest", "rejectedAt", "sourceLabel", "status", "telegram", "updatedAt") SELECT "approvedAt", "consentAccepted", "contactedAt", "country", "createdAt", "email", "fullName", "heardFrom", "id", "investorType", "managerNotes", "message", "nextAction", "nextActionAt", "plannedAllocationAmount", "preferredContactMethod", "preferredDepositMethod", "priority", "reinvestInterest", "rejectedAt", "sourceLabel", "status", "telegram", "updatedAt" FROM "InvestorApplication";
DROP TABLE "InvestorApplication";
ALTER TABLE "new_InvestorApplication" RENAME TO "InvestorApplication";
CREATE INDEX "InvestorApplication_status_idx" ON "InvestorApplication"("status");
CREATE INDEX "InvestorApplication_priority_idx" ON "InvestorApplication"("priority");
CREATE INDEX "InvestorApplication_sourceLabel_idx" ON "InvestorApplication"("sourceLabel");
CREATE INDEX "InvestorApplication_nextActionAt_idx" ON "InvestorApplication"("nextActionAt");
CREATE INDEX "InvestorApplication_createdAt_idx" ON "InvestorApplication"("createdAt");
CREATE INDEX "InvestorApplication_email_idx" ON "InvestorApplication"("email");
CREATE INDEX "InvestorApplication_investorId_idx" ON "InvestorApplication"("investorId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_InvestorApplication" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_InvestorApplication" ("consentAccepted", "country", "createdAt", "email", "fullName", "heardFrom", "id", "investorType", "message", "plannedAllocationAmount", "preferredContactMethod", "preferredDepositMethod", "reinvestInterest", "status", "telegram", "updatedAt") SELECT "consentAccepted", "country", "createdAt", "email", "fullName", "heardFrom", "id", "investorType", "message", "plannedAllocationAmount", "preferredContactMethod", "preferredDepositMethod", "reinvestInterest", "status", "telegram", "updatedAt" FROM "InvestorApplication";
DROP TABLE "InvestorApplication";
ALTER TABLE "new_InvestorApplication" RENAME TO "InvestorApplication";
CREATE INDEX "InvestorApplication_status_idx" ON "InvestorApplication"("status");
CREATE INDEX "InvestorApplication_priority_idx" ON "InvestorApplication"("priority");
CREATE INDEX "InvestorApplication_sourceLabel_idx" ON "InvestorApplication"("sourceLabel");
CREATE INDEX "InvestorApplication_nextActionAt_idx" ON "InvestorApplication"("nextActionAt");
CREATE INDEX "InvestorApplication_createdAt_idx" ON "InvestorApplication"("createdAt");
CREATE INDEX "InvestorApplication_email_idx" ON "InvestorApplication"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

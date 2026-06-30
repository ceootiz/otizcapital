-- CreateTable
CREATE TABLE "InvestorApplication" (
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
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "InvestorApplication_status_idx" ON "InvestorApplication"("status");

-- CreateIndex
CREATE INDEX "InvestorApplication_createdAt_idx" ON "InvestorApplication"("createdAt");

-- CreateIndex
CREATE INDEX "InvestorApplication_email_idx" ON "InvestorApplication"("email");

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "SiteContent" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "dataJson" TEXT NOT NULL,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepositAddress" (
    "id" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DepositAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "YieldSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "annualRatePercent" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "YieldSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "contactTelegram" TEXT NOT NULL DEFAULT 'otizceo',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestorApplication" (
    "id" TEXT NOT NULL,
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
    "referredByArbitrageId" TEXT,
    "referredByInvestorId" TEXT,
    "promoCode" TEXT,
    "managerNotes" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "sourceLabel" TEXT,
    "nextAction" TEXT,
    "nextActionAt" TIMESTAMP(3),
    "contactedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestorApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Investor" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telegram" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "sourceApplicationId" TEXT,
    "totalCapital" TEXT NOT NULL DEFAULT '0',
    "reinvestEnabled" BOOLEAN NOT NULL DEFAULT false,
    "yieldRateOverride" DECIMAL(65,30),
    "passwordHash" TEXT,
    "personalAccessCode" TEXT,
    "emailNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lastReportAt" TIMESTAMP(3),
    "notes" TEXT,
    "referralCode" TEXT,
    "referredByArbitrageId" TEXT,
    "referredByInvestorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Investor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestorFileReport" (
    "id" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileData" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvestorFileReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepositNotification" (
    "id" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "network" TEXT NOT NULL,
    "txHash" TEXT,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "verificationStatus" TEXT,
    "verificationData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DepositNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestorPayment" (
    "id" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "fileReportId" TEXT,
    "month" TEXT NOT NULL,
    "period" TEXT,
    "profit" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "payout" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "reinvested" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "roiPercent" DECIMAL(65,30),
    "source" TEXT NOT NULL DEFAULT 'XLSX_REPORT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvestorPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestorDocument" (
    "id" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileData" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_SIGNATURE',
    "signedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvestorDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestorSession" (
    "id" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestorSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestorNotification" (
    "id" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "linkHref" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvestorNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WithdrawalRequest" (
    "id" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "scheduledFor" TIMESTAMP(3),
    "method" TEXT,
    "destinationMasked" TEXT,
    "adminNote" TEXT,
    "investorNote" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WithdrawalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestorWallet" (
    "id" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvestorWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromoCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "yieldRateOverride" DECIMAL(65,30) NOT NULL,
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyReport" (
    "id" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "performanceNote" TEXT,
    "payoutNote" TEXT,
    "proofSummaryJson" TEXT,
    "readinessScore" INTEGER,
    "readinessState" TEXT,
    "readinessSnapshotJson" TEXT,
    "readinessEvaluatedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReadinessPolicy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "requiredProofCategoriesJson" TEXT NOT NULL,
    "warningProofCategoriesJson" TEXT NOT NULL,
    "minimumProofCompletenessScore" INTEGER NOT NULL DEFAULT 50,
    "blockOnUnreviewedCriticalArtifacts" BOOLEAN NOT NULL DEFAULT true,
    "blockOnHiddenInvestorLeakRisk" BOOLEAN NOT NULL DEFAULT true,
    "blockOnStaleSnapshot" BOOLEAN NOT NULL DEFAULT true,
    "allowPublishWithWarnings" BOOLEAN NOT NULL DEFAULT true,
    "requireWarningAcknowledgment" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReadinessPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Allocation" (
    "id" TEXT NOT NULL,
    "investorId" TEXT NOT NULL,
    "supplyCode" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "marketplace" TEXT,
    "allocationAmount" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL,
    "expectedCycleDays" INTEGER,
    "expectedPayoutAt" TIMESTAMP(3),
    "riskLevel" TEXT NOT NULL DEFAULT 'STANDARD',
    "estimatedResult" TEXT,
    "actualProfit" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "payoutStatus" TEXT NOT NULL DEFAULT 'NOT_READY',
    "reinvestDecision" TEXT NOT NULL DEFAULT 'UNDECIDED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Allocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyReportAllocation" (
    "id" TEXT NOT NULL,
    "monthlyReportId" TEXT NOT NULL,
    "allocationId" TEXT NOT NULL,
    "includedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "includedBy" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyReportAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AllocationProof" (
    "id" TEXT NOT NULL,
    "allocationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "proofUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AllocationProof_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "ledgerType" TEXT NOT NULL,
    "allocationId" TEXT,
    "investorId" TEXT,
    "monthlyReportId" TEXT,
    "entryType" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "quantity" INTEGER,
    "unitCost" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT,
    "description" TEXT NOT NULL,
    "metadataJson" TEXT,
    "createdBy" TEXT NOT NULL,
    "isReversal" BOOLEAN NOT NULL DEFAULT false,
    "reversesLedgerEntryId" TEXT,
    "reversalReason" TEXT,
    "correctedByLedgerEntryId" TEXT,
    "voidedAt" TIMESTAMP(3),
    "voidedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "beforeJson" TEXT,
    "afterJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "payloadJson" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "NotificationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperationalIncident" (
    "id" TEXT NOT NULL,
    "incidentType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "allocationId" TEXT,
    "monthlyReportId" TEXT,
    "investorId" TEXT,
    "source" TEXT NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperationalIncident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralProgram" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "arbitrageurRate" DECIMAL(65,30) NOT NULL DEFAULT 0.10,
    "investorReferrerRate" DECIMAL(65,30) NOT NULL DEFAULT 0.10,
    "minDepositForCommission" DECIMAL(65,30) NOT NULL DEFAULT 5000,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Arbitrageur" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telegramHandle" TEXT,
    "referralCode" TEXT NOT NULL,
    "passwordHash" TEXT,
    "customRate" DECIMAL(65,30),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "totalEarned" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalPaid" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Arbitrageur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralClick" (
    "id" TEXT NOT NULL,
    "arbitrageurId" TEXT,
    "investorReferrerId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "suspicious" BOOLEAN NOT NULL DEFAULT false,
    "convertedToApplicationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralClick_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralCommission" (
    "id" TEXT NOT NULL,
    "arbitrageurId" TEXT,
    "investorReferrerId" TEXT,
    "referredInvestorId" TEXT NOT NULL,
    "depositAmount" DECIMAL(65,30) NOT NULL,
    "commissionRate" DECIMAL(65,30) NOT NULL,
    "commissionAmount" DECIMAL(65,30) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralCommission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SiteContent_scope_idx" ON "SiteContent"("scope");

-- CreateIndex
CREATE UNIQUE INDEX "SiteContent_scope_locale_key" ON "SiteContent"("scope", "locale");

-- CreateIndex
CREATE INDEX "DepositAddress_isActive_idx" ON "DepositAddress"("isActive");

-- CreateIndex
CREATE INDEX "DepositAddress_currency_idx" ON "DepositAddress"("currency");

-- CreateIndex
CREATE INDEX "DepositAddress_sortOrder_idx" ON "DepositAddress"("sortOrder");

-- CreateIndex
CREATE INDEX "InvestorApplication_status_idx" ON "InvestorApplication"("status");

-- CreateIndex
CREATE INDEX "InvestorApplication_priority_idx" ON "InvestorApplication"("priority");

-- CreateIndex
CREATE INDEX "InvestorApplication_sourceLabel_idx" ON "InvestorApplication"("sourceLabel");

-- CreateIndex
CREATE INDEX "InvestorApplication_nextActionAt_idx" ON "InvestorApplication"("nextActionAt");

-- CreateIndex
CREATE INDEX "InvestorApplication_createdAt_idx" ON "InvestorApplication"("createdAt");

-- CreateIndex
CREATE INDEX "InvestorApplication_email_idx" ON "InvestorApplication"("email");

-- CreateIndex
CREATE INDEX "InvestorApplication_investorId_idx" ON "InvestorApplication"("investorId");

-- CreateIndex
CREATE UNIQUE INDEX "Investor_email_key" ON "Investor"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Investor_referralCode_key" ON "Investor"("referralCode");

-- CreateIndex
CREATE INDEX "Investor_status_idx" ON "Investor"("status");

-- CreateIndex
CREATE INDEX "Investor_email_idx" ON "Investor"("email");

-- CreateIndex
CREATE INDEX "Investor_sourceApplicationId_idx" ON "Investor"("sourceApplicationId");

-- CreateIndex
CREATE INDEX "Investor_referredByArbitrageId_idx" ON "Investor"("referredByArbitrageId");

-- CreateIndex
CREATE INDEX "Investor_referredByInvestorId_idx" ON "Investor"("referredByInvestorId");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_investorId_idx" ON "PasswordResetToken"("investorId");

-- CreateIndex
CREATE INDEX "PasswordResetToken_token_idx" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "InvestorFileReport_investorId_idx" ON "InvestorFileReport"("investorId");

-- CreateIndex
CREATE INDEX "InvestorFileReport_uploadedAt_idx" ON "InvestorFileReport"("uploadedAt");

-- CreateIndex
CREATE INDEX "DepositNotification_investorId_idx" ON "DepositNotification"("investorId");

-- CreateIndex
CREATE INDEX "DepositNotification_status_idx" ON "DepositNotification"("status");

-- CreateIndex
CREATE INDEX "DepositNotification_createdAt_idx" ON "DepositNotification"("createdAt");

-- CreateIndex
CREATE INDEX "InvestorPayment_investorId_idx" ON "InvestorPayment"("investorId");

-- CreateIndex
CREATE INDEX "InvestorPayment_fileReportId_idx" ON "InvestorPayment"("fileReportId");

-- CreateIndex
CREATE INDEX "InvestorPayment_month_idx" ON "InvestorPayment"("month");

-- CreateIndex
CREATE INDEX "InvestorPayment_createdAt_idx" ON "InvestorPayment"("createdAt");

-- CreateIndex
CREATE INDEX "InvestorDocument_investorId_idx" ON "InvestorDocument"("investorId");

-- CreateIndex
CREATE INDEX "InvestorDocument_status_idx" ON "InvestorDocument"("status");

-- CreateIndex
CREATE INDEX "InvestorDocument_createdAt_idx" ON "InvestorDocument"("createdAt");

-- CreateIndex
CREATE INDEX "InvestorSession_investorId_idx" ON "InvestorSession"("investorId");

-- CreateIndex
CREATE INDEX "InvestorSession_isActive_idx" ON "InvestorSession"("isActive");

-- CreateIndex
CREATE INDEX "InvestorNotification_investorId_idx" ON "InvestorNotification"("investorId");

-- CreateIndex
CREATE INDEX "InvestorNotification_isRead_idx" ON "InvestorNotification"("isRead");

-- CreateIndex
CREATE INDEX "InvestorNotification_createdAt_idx" ON "InvestorNotification"("createdAt");

-- CreateIndex
CREATE INDEX "WithdrawalRequest_investorId_idx" ON "WithdrawalRequest"("investorId");

-- CreateIndex
CREATE INDEX "WithdrawalRequest_status_idx" ON "WithdrawalRequest"("status");

-- CreateIndex
CREATE INDEX "WithdrawalRequest_scheduledFor_idx" ON "WithdrawalRequest"("scheduledFor");

-- CreateIndex
CREATE INDEX "InvestorWallet_investorId_idx" ON "InvestorWallet"("investorId");

-- CreateIndex
CREATE UNIQUE INDEX "PromoCode_code_key" ON "PromoCode"("code");

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

-- CreateIndex
CREATE INDEX "ReadinessPolicy_isActive_idx" ON "ReadinessPolicy"("isActive");

-- CreateIndex
CREATE INDEX "ReadinessPolicy_updatedAt_idx" ON "ReadinessPolicy"("updatedAt");

-- CreateIndex
CREATE INDEX "Allocation_investorId_idx" ON "Allocation"("investorId");

-- CreateIndex
CREATE INDEX "Allocation_status_idx" ON "Allocation"("status");

-- CreateIndex
CREATE INDEX "Allocation_riskLevel_idx" ON "Allocation"("riskLevel");

-- CreateIndex
CREATE INDEX "Allocation_expectedPayoutAt_idx" ON "Allocation"("expectedPayoutAt");

-- CreateIndex
CREATE INDEX "Allocation_payoutStatus_idx" ON "Allocation"("payoutStatus");

-- CreateIndex
CREATE INDEX "Allocation_reinvestDecision_idx" ON "Allocation"("reinvestDecision");

-- CreateIndex
CREATE INDEX "Allocation_supplyCode_idx" ON "Allocation"("supplyCode");

-- CreateIndex
CREATE INDEX "Allocation_createdAt_idx" ON "Allocation"("createdAt");

-- CreateIndex
CREATE INDEX "MonthlyReportAllocation_monthlyReportId_idx" ON "MonthlyReportAllocation"("monthlyReportId");

-- CreateIndex
CREATE INDEX "MonthlyReportAllocation_allocationId_idx" ON "MonthlyReportAllocation"("allocationId");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyReportAllocation_monthlyReportId_allocationId_key" ON "MonthlyReportAllocation"("monthlyReportId", "allocationId");

-- CreateIndex
CREATE INDEX "AllocationProof_allocationId_idx" ON "AllocationProof"("allocationId");

-- CreateIndex
CREATE INDEX "AllocationProof_type_idx" ON "AllocationProof"("type");

-- CreateIndex
CREATE INDEX "AllocationProof_status_idx" ON "AllocationProof"("status");

-- CreateIndex
CREATE INDEX "AllocationProof_createdAt_idx" ON "AllocationProof"("createdAt");

-- CreateIndex
CREATE INDEX "LedgerEntry_ledgerType_idx" ON "LedgerEntry"("ledgerType");

-- CreateIndex
CREATE INDEX "LedgerEntry_allocationId_idx" ON "LedgerEntry"("allocationId");

-- CreateIndex
CREATE INDEX "LedgerEntry_investorId_idx" ON "LedgerEntry"("investorId");

-- CreateIndex
CREATE INDEX "LedgerEntry_monthlyReportId_idx" ON "LedgerEntry"("monthlyReportId");

-- CreateIndex
CREATE INDEX "LedgerEntry_occurredAt_idx" ON "LedgerEntry"("occurredAt");

-- CreateIndex
CREATE INDEX "LedgerEntry_sourceType_sourceId_idx" ON "LedgerEntry"("sourceType", "sourceId");

-- CreateIndex
CREATE INDEX "LedgerEntry_reversesLedgerEntryId_idx" ON "LedgerEntry"("reversesLedgerEntryId");

-- CreateIndex
CREATE INDEX "LedgerEntry_correctedByLedgerEntryId_idx" ON "LedgerEntry"("correctedByLedgerEntryId");

-- CreateIndex
CREATE INDEX "LedgerEntry_isReversal_idx" ON "LedgerEntry"("isReversal");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "NotificationEvent_entityType_entityId_idx" ON "NotificationEvent"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "NotificationEvent_status_idx" ON "NotificationEvent"("status");

-- CreateIndex
CREATE INDEX "NotificationEvent_type_idx" ON "NotificationEvent"("type");

-- CreateIndex
CREATE INDEX "NotificationEvent_createdAt_idx" ON "NotificationEvent"("createdAt");

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

-- CreateIndex
CREATE UNIQUE INDEX "Arbitrageur_email_key" ON "Arbitrageur"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Arbitrageur_referralCode_key" ON "Arbitrageur"("referralCode");

-- CreateIndex
CREATE INDEX "Arbitrageur_status_idx" ON "Arbitrageur"("status");

-- CreateIndex
CREATE INDEX "Arbitrageur_referralCode_idx" ON "Arbitrageur"("referralCode");

-- CreateIndex
CREATE INDEX "ReferralClick_arbitrageurId_idx" ON "ReferralClick"("arbitrageurId");

-- CreateIndex
CREATE INDEX "ReferralClick_investorReferrerId_idx" ON "ReferralClick"("investorReferrerId");

-- CreateIndex
CREATE INDEX "ReferralClick_ipAddress_idx" ON "ReferralClick"("ipAddress");

-- CreateIndex
CREATE INDEX "ReferralClick_createdAt_idx" ON "ReferralClick"("createdAt");

-- CreateIndex
CREATE INDEX "ReferralCommission_arbitrageurId_idx" ON "ReferralCommission"("arbitrageurId");

-- CreateIndex
CREATE INDEX "ReferralCommission_investorReferrerId_idx" ON "ReferralCommission"("investorReferrerId");

-- CreateIndex
CREATE INDEX "ReferralCommission_referredInvestorId_idx" ON "ReferralCommission"("referredInvestorId");

-- CreateIndex
CREATE INDEX "ReferralCommission_status_idx" ON "ReferralCommission"("status");

-- CreateIndex
CREATE INDEX "ReferralCommission_createdAt_idx" ON "ReferralCommission"("createdAt");

-- AddForeignKey
ALTER TABLE "InvestorApplication" ADD CONSTRAINT "InvestorApplication_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "Investor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "Investor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestorFileReport" ADD CONSTRAINT "InvestorFileReport_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "Investor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepositNotification" ADD CONSTRAINT "DepositNotification_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "Investor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestorPayment" ADD CONSTRAINT "InvestorPayment_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "Investor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestorPayment" ADD CONSTRAINT "InvestorPayment_fileReportId_fkey" FOREIGN KEY ("fileReportId") REFERENCES "InvestorFileReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestorDocument" ADD CONSTRAINT "InvestorDocument_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "Investor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestorSession" ADD CONSTRAINT "InvestorSession_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "Investor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestorNotification" ADD CONSTRAINT "InvestorNotification_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "Investor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WithdrawalRequest" ADD CONSTRAINT "WithdrawalRequest_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "Investor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestorWallet" ADD CONSTRAINT "InvestorWallet_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "Investor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyReport" ADD CONSTRAINT "MonthlyReport_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "Investor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Allocation" ADD CONSTRAINT "Allocation_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "Investor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyReportAllocation" ADD CONSTRAINT "MonthlyReportAllocation_monthlyReportId_fkey" FOREIGN KEY ("monthlyReportId") REFERENCES "MonthlyReport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyReportAllocation" ADD CONSTRAINT "MonthlyReportAllocation_allocationId_fkey" FOREIGN KEY ("allocationId") REFERENCES "Allocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AllocationProof" ADD CONSTRAINT "AllocationProof_allocationId_fkey" FOREIGN KEY ("allocationId") REFERENCES "Allocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_allocationId_fkey" FOREIGN KEY ("allocationId") REFERENCES "Allocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "Investor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_monthlyReportId_fkey" FOREIGN KEY ("monthlyReportId") REFERENCES "MonthlyReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalIncident" ADD CONSTRAINT "OperationalIncident_allocationId_fkey" FOREIGN KEY ("allocationId") REFERENCES "Allocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalIncident" ADD CONSTRAINT "OperationalIncident_monthlyReportId_fkey" FOREIGN KEY ("monthlyReportId") REFERENCES "MonthlyReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalIncident" ADD CONSTRAINT "OperationalIncident_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "Investor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralClick" ADD CONSTRAINT "ReferralClick_arbitrageurId_fkey" FOREIGN KEY ("arbitrageurId") REFERENCES "Arbitrageur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralClick" ADD CONSTRAINT "ReferralClick_investorReferrerId_fkey" FOREIGN KEY ("investorReferrerId") REFERENCES "Investor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralCommission" ADD CONSTRAINT "ReferralCommission_arbitrageurId_fkey" FOREIGN KEY ("arbitrageurId") REFERENCES "Arbitrageur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralCommission" ADD CONSTRAINT "ReferralCommission_investorReferrerId_fkey" FOREIGN KEY ("investorReferrerId") REFERENCES "Investor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralCommission" ADD CONSTRAINT "ReferralCommission_referredInvestorId_fkey" FOREIGN KEY ("referredInvestorId") REFERENCES "Investor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

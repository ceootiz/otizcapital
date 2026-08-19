-- Jurisdiction-aware legal document foundation. This migration is additive.
-- Existing records remain REVIEW_REQUIRED until explicitly classified.
ALTER TABLE "InvestorApplication"
  ADD COLUMN "countryCode" TEXT,
  ADD COLUMN "legalJurisdiction" TEXT NOT NULL DEFAULT 'REVIEW_REQUIRED',
  ADD COLUMN "legalRegion" TEXT,
  ADD COLUMN "preferredLocale" TEXT NOT NULL DEFAULT 'en',
  ADD COLUMN "jurisdictionStatus" TEXT NOT NULL DEFAULT 'UNVERIFIED',
  ADD COLUMN "jurisdictionSource" TEXT,
  ADD COLUMN "jurisdictionEvidenceRef" TEXT,
  ADD COLUMN "jurisdictionVerifiedBy" TEXT,
  ADD COLUMN "jurisdictionVerifiedAt" TIMESTAMP(3);

ALTER TABLE "Investor"
  ADD COLUMN "countryCode" TEXT,
  ADD COLUMN "legalJurisdiction" TEXT NOT NULL DEFAULT 'REVIEW_REQUIRED',
  ADD COLUMN "legalRegion" TEXT,
  ADD COLUMN "preferredLocale" TEXT NOT NULL DEFAULT 'en',
  ADD COLUMN "jurisdictionStatus" TEXT NOT NULL DEFAULT 'UNVERIFIED',
  ADD COLUMN "jurisdictionSource" TEXT,
  ADD COLUMN "jurisdictionEvidenceRef" TEXT,
  ADD COLUMN "jurisdictionVerifiedBy" TEXT,
  ADD COLUMN "jurisdictionVerifiedAt" TIMESTAMP(3);

CREATE TABLE "LegalDocumentTemplate" (
  "id" TEXT NOT NULL,
  "documentType" TEXT NOT NULL,
  "jurisdiction" TEXT NOT NULL,
  "locale" TEXT NOT NULL,
  "regionalScope" TEXT NOT NULL DEFAULT '',
  "version" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "bodyJson" TEXT NOT NULL,
  "sourceReferencesJson" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "approvedBy" TEXT,
  "approvedAt" TIMESTAMP(3),
  "effectiveFrom" TIMESTAMP(3),
  "effectiveUntil" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LegalDocumentTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "JurisdictionEvidence" (
  "id" TEXT NOT NULL,
  "applicationId" TEXT,
  "investorId" TEXT,
  "evidenceType" TEXT NOT NULL,
  "countryCode" TEXT NOT NULL,
  "legalRegion" TEXT,
  "jurisdiction" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'OBSERVED',
  "evidenceRef" TEXT,
  "signalJson" TEXT,
  "reason" TEXT,
  "recordedBy" TEXT NOT NULL,
  "verifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "JurisdictionEvidence_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "InvestorDocument"
  ADD COLUMN "templateId" TEXT,
  ADD COLUMN "jurisdiction" TEXT,
  ADD COLUMN "locale" TEXT,
  ADD COLUMN "templateVersion" INTEGER,
  ADD COLUMN "contentHash" TEXT,
  ADD COLUMN "issuedAt" TIMESTAMP(3);

CREATE INDEX "InvestorApplication_countryCode_idx" ON "InvestorApplication"("countryCode");
CREATE INDEX "InvestorApplication_legalJurisdiction_idx" ON "InvestorApplication"("legalJurisdiction");
CREATE INDEX "Investor_countryCode_idx" ON "Investor"("countryCode");
CREATE INDEX "Investor_legalJurisdiction_idx" ON "Investor"("legalJurisdiction");
CREATE UNIQUE INDEX "LegalDocumentTemplate_documentType_jurisdiction_locale_regionalScope_version_key" ON "LegalDocumentTemplate"("documentType", "jurisdiction", "locale", "regionalScope", "version");
CREATE INDEX "LegalDocumentTemplate_documentType_jurisdiction_locale_regionalScope_status_idx" ON "LegalDocumentTemplate"("documentType", "jurisdiction", "locale", "regionalScope", "status");
CREATE INDEX "LegalDocumentTemplate_effectiveFrom_effectiveUntil_idx" ON "LegalDocumentTemplate"("effectiveFrom", "effectiveUntil");
CREATE INDEX "InvestorDocument_templateId_idx" ON "InvestorDocument"("templateId");
CREATE INDEX "InvestorDocument_jurisdiction_locale_idx" ON "InvestorDocument"("jurisdiction", "locale");
CREATE INDEX "JurisdictionEvidence_applicationId_status_idx" ON "JurisdictionEvidence"("applicationId", "status");
CREATE INDEX "JurisdictionEvidence_investorId_status_idx" ON "JurisdictionEvidence"("investorId", "status");
CREATE INDEX "JurisdictionEvidence_countryCode_jurisdiction_idx" ON "JurisdictionEvidence"("countryCode", "jurisdiction");
CREATE INDEX "JurisdictionEvidence_createdAt_idx" ON "JurisdictionEvidence"("createdAt");

ALTER TABLE "InvestorDocument" ADD CONSTRAINT "InvestorDocument_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "LegalDocumentTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "JurisdictionEvidence" ADD CONSTRAINT "JurisdictionEvidence_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "InvestorApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JurisdictionEvidence" ADD CONSTRAINT "JurisdictionEvidence_investorId_fkey" FOREIGN KEY ("investorId") REFERENCES "Investor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

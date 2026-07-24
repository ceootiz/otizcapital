-- CreateTable
CREATE TABLE "ReadinessPolicy" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "ReadinessPolicy_isActive_idx" ON "ReadinessPolicy"("isActive");

-- CreateIndex
CREATE INDEX "ReadinessPolicy_updatedAt_idx" ON "ReadinessPolicy"("updatedAt");

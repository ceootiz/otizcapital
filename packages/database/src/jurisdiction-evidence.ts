import { prisma } from "./client";

export const JURISDICTION_EVIDENCE_TYPES = ["RESIDENCE_DOCUMENT", "KYC_REVIEW", "ADMIN_REVIEW"] as const;
export type JurisdictionEvidenceType = (typeof JURISDICTION_EVIDENCE_TYPES)[number];

export async function verifyApplicationJurisdiction(input: {
  applicationId: string;
  countryCode: string;
  jurisdiction: string;
  legalRegion?: string | null;
  evidenceType: JurisdictionEvidenceType;
  evidenceRef: string;
  reason?: string | null;
  actor: string;
}) {
  return prisma.$transaction(async (transaction) => {
    const application = await transaction.investorApplication.findUnique({
      where: { id: input.applicationId },
      include: { investor: true }
    });
    if (!application) return null;

    const verifiedAt = new Date();
    const before = {
      countryCode: application.countryCode,
      legalJurisdiction: application.legalJurisdiction,
      legalRegion: application.legalRegion,
      jurisdictionStatus: application.jurisdictionStatus,
      jurisdictionSource: application.jurisdictionSource,
      jurisdictionEvidenceRef: application.jurisdictionEvidenceRef
    };
    const decision = {
      countryCode: input.countryCode,
      legalJurisdiction: input.jurisdiction,
      legalRegion: input.legalRegion?.trim().toUpperCase() || null,
      jurisdictionStatus: "VERIFIED",
      jurisdictionSource: input.evidenceType,
      jurisdictionEvidenceRef: input.evidenceRef,
      jurisdictionVerifiedBy: input.actor,
      jurisdictionVerifiedAt: verifiedAt
    };

    const updated = await transaction.investorApplication.update({
      where: { id: application.id },
      data: decision,
      include: { investor: true }
    });

    if (application.investorId) {
      await transaction.investor.update({ where: { id: application.investorId }, data: decision });
    }

    await transaction.jurisdictionEvidence.create({
      data: {
        applicationId: application.id,
        investorId: application.investorId,
        evidenceType: input.evidenceType,
        countryCode: input.countryCode,
        legalRegion: decision.legalRegion,
        jurisdiction: input.jurisdiction,
        status: "VERIFIED",
        evidenceRef: input.evidenceRef,
        reason: input.reason?.trim() || null,
        recordedBy: input.actor,
        verifiedAt
      }
    });

    await transaction.auditLog.create({
      data: {
        actor: input.actor,
        action: "VERIFY_LEGAL_JURISDICTION",
        entityType: "InvestorApplication",
        entityId: application.id,
        beforeJson: JSON.stringify(before),
        afterJson: JSON.stringify(decision)
      }
    });

    return updated;
  });
}

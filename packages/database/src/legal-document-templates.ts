import type { LegalDocumentTemplate, Prisma } from "@prisma/client";
import { prisma } from "./client";

export const LEGAL_TEMPLATE_STATUS = {
  DRAFT: "DRAFT",
  APPROVED: "APPROVED",
  ARCHIVED: "ARCHIVED"
} as const;

export async function listLegalDocumentTemplates() {
  return prisma.legalDocumentTemplate.findMany({
    orderBy: [{ jurisdiction: "asc" }, { locale: "asc" }, { regionalScope: "asc" }, { version: "desc" }]
  });
}

export async function createLegalDocumentTemplateDraft(input: {
  documentType: string;
  jurisdiction: string;
  locale: string;
  regionalScope?: string | null;
  title: string;
  bodyJson: string;
  sourceReferencesJson: string;
  actor: string;
}) {
  return prisma.$transaction(async (transaction) => {
    const regionalScope = input.regionalScope?.trim().toUpperCase() || "";
    const latest = await transaction.legalDocumentTemplate.findFirst({
      where: { documentType: input.documentType, jurisdiction: input.jurisdiction, locale: input.locale, regionalScope },
      orderBy: { version: "desc" },
      select: { version: true }
    });
    const template = await transaction.legalDocumentTemplate.create({
      data: {
        documentType: input.documentType,
        jurisdiction: input.jurisdiction,
        locale: input.locale,
        regionalScope,
        version: (latest?.version ?? 0) + 1,
        title: input.title,
        bodyJson: input.bodyJson,
        sourceReferencesJson: input.sourceReferencesJson,
        status: LEGAL_TEMPLATE_STATUS.DRAFT
      }
    });
    await transaction.auditLog.create({
      data: {
        actor: input.actor,
        action: "CREATE_LEGAL_TEMPLATE_DRAFT",
        entityType: "LegalDocumentTemplate",
        entityId: template.id,
        afterJson: JSON.stringify(legalTemplateSnapshot(template))
      }
    });
    return template;
  });
}

export async function changeLegalDocumentTemplateStatus(input: {
  id: string;
  status: "APPROVED" | "ARCHIVED";
  actor: string;
}) {
  return prisma.$transaction(async (transaction) => {
    const existing = await transaction.legalDocumentTemplate.findUnique({ where: { id: input.id } });
    if (!existing) return null;
    if (input.status === LEGAL_TEMPLATE_STATUS.APPROVED) {
      await transaction.legalDocumentTemplate.updateMany({
        where: {
          id: { not: existing.id },
          documentType: existing.documentType,
          jurisdiction: existing.jurisdiction,
          locale: existing.locale,
          regionalScope: existing.regionalScope,
          status: LEGAL_TEMPLATE_STATUS.APPROVED
        },
        data: { status: LEGAL_TEMPLATE_STATUS.ARCHIVED }
      });
    }
    const updated = await transaction.legalDocumentTemplate.update({
      where: { id: existing.id },
      data: input.status === LEGAL_TEMPLATE_STATUS.APPROVED
        ? { status: input.status, approvedBy: input.actor, approvedAt: new Date(), effectiveFrom: existing.effectiveFrom ?? new Date() }
        : { status: input.status, effectiveUntil: existing.effectiveUntil ?? new Date() }
    });
    await transaction.auditLog.create({
      data: {
        actor: input.actor,
        action: input.status === LEGAL_TEMPLATE_STATUS.APPROVED ? "APPROVE_LEGAL_TEMPLATE" : "ARCHIVE_LEGAL_TEMPLATE",
        entityType: "LegalDocumentTemplate",
        entityId: existing.id,
        beforeJson: JSON.stringify(legalTemplateSnapshot(existing)),
        afterJson: JSON.stringify(legalTemplateSnapshot(updated))
      }
    });
    return updated;
  });
}

export async function findApprovedLegalDocumentTemplate(input: {
  documentType: string;
  jurisdiction: string;
  locale: string;
  regionalScope?: string | null;
  at?: Date;
}) {
  const at = input.at ?? new Date();
  return prisma.legalDocumentTemplate.findFirst({
    where: {
      documentType: input.documentType,
      jurisdiction: input.jurisdiction,
      locale: input.locale,
      regionalScope: input.regionalScope?.trim().toUpperCase() || "",
      status: LEGAL_TEMPLATE_STATUS.APPROVED,
      approvedAt: { not: null },
      AND: [
        { OR: [{ effectiveFrom: null }, { effectiveFrom: { lte: at } }] },
        { OR: [{ effectiveUntil: null }, { effectiveUntil: { gt: at } }] }
      ]
    },
    orderBy: [{ version: "desc" }, { approvedAt: "desc" }]
  });
}

export function legalTemplateSnapshot(template: LegalDocumentTemplate) {
  return {
    templateId: template.id,
    documentType: template.documentType,
    jurisdiction: template.jurisdiction,
    locale: template.locale,
    regionalScope: template.regionalScope,
    version: template.version,
    title: template.title,
    sourceReferencesJson: template.sourceReferencesJson,
    approvedAt: template.approvedAt?.toISOString() ?? null
  };
}

export async function recordMissingLegalTemplate(input: {
  investorId: string;
  applicationId: string;
  jurisdiction: string;
  locale: string;
  regionalScope?: string | null;
  actor: string;
}, client: Prisma.TransactionClient | typeof prisma = prisma) {
  const afterJson = JSON.stringify({
    documentType: "AGREEMENT",
    jurisdiction: input.jurisdiction,
    locale: input.locale,
    regionalScope: input.regionalScope ?? null,
    status: "REVIEW_REQUIRED"
  });
  await client.auditLog.create({
    data: {
      actor: input.actor,
      action: "LEGAL_DOCUMENT_REVIEW_REQUIRED",
      entityType: "Investor",
      entityId: input.investorId,
      afterJson
    }
  });
  return client.notificationEvent.create({
    data: {
      type: "LEGAL_DOCUMENT_REVIEW_REQUIRED",
      channel: "INTERNAL",
      recipient: "admin",
      entityType: "InvestorApplication",
      entityId: input.applicationId,
      payloadJson: afterJson,
      status: "PENDING"
    }
  });
}

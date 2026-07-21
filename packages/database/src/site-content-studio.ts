import { prisma } from "./client";

const DRAFT_SCOPE_PREFIX = "content-draft:";

export function getContentDraftScope(scope: string) {
  return `${DRAFT_SCOPE_PREFIX}${scope}`;
}

export type ContentStudioDocument = {
  publishedJson: string | null;
  draftJson: string | null;
};

export async function getContentStudioDocument(scope: string, locale: string): Promise<ContentStudioDocument> {
  const draftScope = getContentDraftScope(scope);
  const rows = await prisma.siteContent.findMany({
    where: { locale, scope: { in: [scope, draftScope] } },
    select: { scope: true, dataJson: true }
  });

  return {
    publishedJson: rows.find((row) => row.scope === scope)?.dataJson ?? null,
    draftJson: rows.find((row) => row.scope === draftScope)?.dataJson ?? null
  };
}

export async function saveContentDraft(input: { scope: string; locale: string; dataJson: string; actor: string }) {
  const draftScope = getContentDraftScope(input.scope);

  await prisma.$transaction(async (transaction) => {
    const existing = await transaction.siteContent.findUnique({
      where: { scope_locale: { scope: draftScope, locale: input.locale } },
      select: { dataJson: true }
    });

    await transaction.siteContent.upsert({
      where: { scope_locale: { scope: draftScope, locale: input.locale } },
      create: { scope: draftScope, locale: input.locale, dataJson: input.dataJson, updatedBy: input.actor },
      update: { dataJson: input.dataJson, updatedBy: input.actor }
    });

    await transaction.auditLog.create({
      data: {
        actor: input.actor,
        action: "SAVE_CONTENT_DRAFT",
        entityType: "SITE_CONTENT",
        entityId: `${input.scope}:${input.locale}`,
        beforeJson: existing?.dataJson ?? null,
        afterJson: input.dataJson
      }
    });
  });
}

export async function publishContentDraft(input: { scope: string; locale: string; actor: string }) {
  const draftScope = getContentDraftScope(input.scope);

  return prisma.$transaction(async (transaction) => {
    const [draft, published] = await Promise.all([
      transaction.siteContent.findUnique({
        where: { scope_locale: { scope: draftScope, locale: input.locale } },
        select: { dataJson: true }
      }),
      transaction.siteContent.findUnique({
        where: { scope_locale: { scope: input.scope, locale: input.locale } },
        select: { dataJson: true }
      })
    ]);

    if (!draft) return null;

    await transaction.siteContent.upsert({
      where: { scope_locale: { scope: input.scope, locale: input.locale } },
      create: { scope: input.scope, locale: input.locale, dataJson: draft.dataJson, updatedBy: input.actor },
      update: { dataJson: draft.dataJson, updatedBy: input.actor }
    });
    await transaction.siteContent.delete({ where: { scope_locale: { scope: draftScope, locale: input.locale } } });
    await transaction.auditLog.create({
      data: {
        actor: input.actor,
        action: "PUBLISH_SITE_CONTENT",
        entityType: "SITE_CONTENT",
        entityId: `${input.scope}:${input.locale}`,
        beforeJson: published?.dataJson ?? null,
        afterJson: draft.dataJson
      }
    });

    return draft.dataJson;
  });
}

export async function resetContentStudioDocument(input: { scope: string; locale: string; actor: string }) {
  const draftScope = getContentDraftScope(input.scope);

  await prisma.$transaction(async (transaction) => {
    const existing = await transaction.siteContent.findMany({
      where: { locale: input.locale, scope: { in: [input.scope, draftScope] } },
      select: { scope: true, dataJson: true }
    });

    await transaction.siteContent.deleteMany({
      where: { locale: input.locale, scope: { in: [input.scope, draftScope] } }
    });
    await transaction.auditLog.create({
      data: {
        actor: input.actor,
        action: "RESET_SITE_CONTENT",
        entityType: "SITE_CONTENT",
        entityId: `${input.scope}:${input.locale}`,
        beforeJson: JSON.stringify(existing),
        afterJson: null
      }
    });
  });
}

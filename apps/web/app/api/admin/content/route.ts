import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getContentStudioDocument, isProductFeatureEnabled, prisma, publishContentDraft, resetContentStudioDocument, saveContentDraft } from "@otiz/database";
import { CONTENT_SCOPES, isLocale, resolveContent, type ContentScope, type Locale } from "@otiz/lib";
import { getAdminSession, verifyAdminCsrfToken } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

const MAX_PAYLOAD_BYTES = 512 * 1024; // 512 KB safety cap for a single content document

function parseScope(value: unknown): ContentScope | null {
  return typeof value === "string" && (CONTENT_SCOPES as string[]).includes(value) ? (value as ContentScope) : null;
}

function parseLocale(value: unknown): Locale | null {
  return typeof value === "string" && isLocale(value) ? value : null;
}

function publicPathFor(scope: ContentScope, locale: Locale): string {
  return scope === "home" ? `/${locale}` : `/${locale}/apply`;
}

// GET /api/admin/content?scope=home&locale=ru
// Returns the effective (defaults ⊕ override) content for the structured editor.
export async function GET(request: Request) {
  if (!getAdminSession()) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const url = new URL(request.url);
  const scope = parseScope(url.searchParams.get("scope"));
  const locale = parseLocale(url.searchParams.get("locale"));
  if (!scope || !locale) {
    return NextResponse.json({ ok: false, error: "Invalid scope or locale." }, { status: 422 });
  }

  let publishedJson: string | null = null;
  let draftJson: string | null = null;
  const studioEnabled = await isProductFeatureEnabled("content-studio-v2");
  try {
    const document = await getContentStudioDocument(scope, locale);
    publishedJson = document.publishedJson;
    draftJson = document.draftJson;
  } catch {
    publishedJson = null;
    draftJson = null;
  }

  return NextResponse.json({
    ok: true,
    scope,
    locale,
    studioEnabled,
    hasOverride: publishedJson !== null,
    hasDraft: draftJson !== null,
    content: resolveContent(scope, locale, studioEnabled ? draftJson ?? publishedJson : publishedJson)
  });
}

// PUT /api/admin/content  { scope, locale, data }
// Stores the edited document as the override and revalidates the public page.
export async function PUT(request: Request) {
  const csrf = verifyAdminCsrfToken(request);
  if (!csrf.ok) return NextResponse.json({ ok: false, error: csrf.error }, { status: csrf.status });

  const payload = (await request.json().catch(() => null)) as { scope?: unknown; locale?: unknown; data?: unknown } | null;
  if (!payload) return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 422 });

  const scope = parseScope(payload.scope);
  const locale = parseLocale(payload.locale);
  if (!scope || !locale) return NextResponse.json({ ok: false, error: "Invalid scope or locale." }, { status: 422 });

  if (payload.data === null || typeof payload.data !== "object" || Array.isArray(payload.data)) {
    return NextResponse.json({ ok: false, error: "Content data must be an object." }, { status: 422 });
  }

  const dataJson = JSON.stringify(payload.data);
  if (Buffer.byteLength(dataJson, "utf8") > MAX_PAYLOAD_BYTES) {
    return NextResponse.json({ ok: false, error: "Content document is too large." }, { status: 413 });
  }

  if (await isProductFeatureEnabled("content-studio-v2")) {
    await saveContentDraft({ scope, locale, dataJson, actor: csrf.session.actor });
  } else {
    await prisma.siteContent.upsert({
      where: { scope_locale: { scope, locale } },
      create: { scope, locale, dataJson, updatedBy: csrf.session.actor },
      update: { dataJson, updatedBy: csrf.session.actor }
    });
    revalidatePath(publicPathFor(scope, locale));
  }

  return NextResponse.json({ ok: true });
}

// POST /api/admin/content { scope, locale, action: "publish" }
// Publishes the current draft without changing the public page during editing.
export async function POST(request: Request) {
  const csrf = verifyAdminCsrfToken(request);
  if (!csrf.ok) return NextResponse.json({ ok: false, error: csrf.error }, { status: csrf.status });
  if (!(await isProductFeatureEnabled("content-studio-v2"))) {
    return NextResponse.json({ ok: false, error: "Content Studio is disabled." }, { status: 409 });
  }

  const payload = (await request.json().catch(() => null)) as { scope?: unknown; locale?: unknown; action?: unknown } | null;
  const scope = parseScope(payload?.scope);
  const locale = parseLocale(payload?.locale);
  if (!scope || !locale || payload?.action !== "publish") {
    return NextResponse.json({ ok: false, error: "Invalid publish request." }, { status: 422 });
  }

  const publishedJson = await publishContentDraft({ scope, locale, actor: csrf.session.actor });
  if (!publishedJson) return NextResponse.json({ ok: false, error: "No draft is ready to publish." }, { status: 409 });

  revalidatePath(publicPathFor(scope, locale));
  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/content?scope=home&locale=ru  — reset to compiled defaults.
export async function DELETE(request: Request) {
  const csrf = verifyAdminCsrfToken(request);
  if (!csrf.ok) return NextResponse.json({ ok: false, error: csrf.error }, { status: csrf.status });

  const url = new URL(request.url);
  const scope = parseScope(url.searchParams.get("scope"));
  const locale = parseLocale(url.searchParams.get("locale"));
  if (!scope || !locale) return NextResponse.json({ ok: false, error: "Invalid scope or locale." }, { status: 422 });

  if (await isProductFeatureEnabled("content-studio-v2")) {
    await resetContentStudioDocument({ scope, locale, actor: csrf.session.actor });
  } else {
    await prisma.siteContent.deleteMany({ where: { scope, locale } });
  }
  revalidatePath(publicPathFor(scope, locale));

  return NextResponse.json({ ok: true });
}

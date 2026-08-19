import { NextResponse } from "next/server";
import {
  changeLegalDocumentTemplateStatus,
  createLegalDocumentTemplateDraft,
  listLegalDocumentTemplates
} from "@otiz/database";
import {
  LEGAL_JURISDICTIONS,
  isSupportedLegalLocale,
  legalTemplateRequiresRegionalReview,
  parseLegalAgreementTemplateBody,
  type LegalJurisdiction
} from "@otiz/lib";
import { getAdminSession, verifyAdminCsrfToken } from "@/lib/admin-session";

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max) : "";
}

function serialize(template: Awaited<ReturnType<typeof listLegalDocumentTemplates>>[number]) {
  return {
    ...template,
    approvedAt: template.approvedAt?.toISOString() ?? null,
    effectiveFrom: template.effectiveFrom?.toISOString() ?? null,
    effectiveUntil: template.effectiveUntil?.toISOString() ?? null,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString()
  };
}

export async function GET() {
  if (!getAdminSession()) return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  return NextResponse.json({ ok: true, data: (await listLegalDocumentTemplates()).map(serialize) });
}

export async function POST(request: Request) {
  const csrf = verifyAdminCsrfToken(request);
  if (!csrf.ok) return NextResponse.json({ ok: false, error: csrf.error }, { status: csrf.status });
  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const jurisdiction = clean(payload?.jurisdiction, 30) as LegalJurisdiction;
  const locale = clean(payload?.locale, 5);
  const regionalScope = clean(payload?.regionalScope, 30).toUpperCase();
  const title = clean(payload?.title, 180);
  const bodyJson = typeof payload?.bodyJson === "string" ? payload.bodyJson : "";
  const sources = Array.isArray(payload?.sourceReferences)
    ? payload.sourceReferences.map((value) => clean(value, 500)).filter(Boolean)
    : [];

  if (!LEGAL_JURISDICTIONS.includes(jurisdiction) || jurisdiction === "REVIEW_REQUIRED" || !isSupportedLegalLocale(locale) || !title) {
    return NextResponse.json({ ok: false, error: "Jurisdiction, language, and title are required." }, { status: 422 });
  }
  if (legalTemplateRequiresRegionalReview(jurisdiction, regionalScope)) {
    return NextResponse.json({ ok: false, error: "US templates require a state or regional scope." }, { status: 422 });
  }
  if (!parseLegalAgreementTemplateBody(bodyJson)) {
    return NextResponse.json({ ok: false, error: "The agreement fields are incomplete." }, { status: 422 });
  }
  if (sources.length === 0 || sources.some((source) => !/^https:\/\//i.test(source))) {
    return NextResponse.json({ ok: false, error: "At least one HTTPS official source is required." }, { status: 422 });
  }

  const template = await createLegalDocumentTemplateDraft({
    documentType: "AGREEMENT",
    jurisdiction,
    locale,
    regionalScope,
    title,
    bodyJson,
    sourceReferencesJson: JSON.stringify(sources),
    actor: csrf.session.actor
  });
  return NextResponse.json({ ok: true, data: serialize(template) }, { status: 201 });
}

export async function PATCH(request: Request) {
  const csrf = verifyAdminCsrfToken(request);
  if (!csrf.ok) return NextResponse.json({ ok: false, error: csrf.error }, { status: csrf.status });
  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const id = clean(payload?.id, 80);
  const action = clean(payload?.action, 20);
  if (!id || (action !== "approve" && action !== "archive")) {
    return NextResponse.json({ ok: false, error: "Template and action are required." }, { status: 422 });
  }
  const template = await changeLegalDocumentTemplateStatus({
    id,
    status: action === "approve" ? "APPROVED" : "ARCHIVED",
    actor: csrf.session.actor
  });
  if (!template) return NextResponse.json({ ok: false, error: "Template not found." }, { status: 404 });
  return NextResponse.json({ ok: true, data: serialize(template) });
}

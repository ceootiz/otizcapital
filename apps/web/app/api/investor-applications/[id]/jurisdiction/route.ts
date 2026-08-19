import { NextResponse } from "next/server";
import {
  JURISDICTION_EVIDENCE_TYPES,
  serializeInvestorApplication,
  verifyApplicationJurisdiction,
  type JurisdictionEvidenceType
} from "@otiz/database";
import {
  LEGAL_JURISDICTIONS,
  legalTemplateRequiresRegionalReview,
  normalizeCountryCode,
  resolveLegalJurisdiction,
  type LegalJurisdiction
} from "@otiz/lib";
import { verifyAdminCsrfToken } from "@/lib/admin-session";

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max) : "";
}

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const csrf = verifyAdminCsrfToken(request);
  if (!csrf.ok) return NextResponse.json({ ok: false, error: csrf.error }, { status: csrf.status });

  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const countryCode = normalizeCountryCode(payload?.countryCode);
  const jurisdiction = clean(payload?.jurisdiction, 30) as LegalJurisdiction;
  const legalRegion = clean(payload?.legalRegion, 30).toUpperCase() || null;
  const evidenceType = clean(payload?.evidenceType, 40) as JurisdictionEvidenceType;
  const evidenceRef = clean(payload?.evidenceRef, 240);
  const reason = clean(payload?.reason, 1000) || null;

  if (!countryCode || !LEGAL_JURISDICTIONS.includes(jurisdiction) || jurisdiction === "REVIEW_REQUIRED") {
    return NextResponse.json({ ok: false, error: "Select a supported verified country and jurisdiction." }, { status: 422 });
  }
  if (resolveLegalJurisdiction(countryCode) !== jurisdiction) {
    return NextResponse.json({ ok: false, error: "Country and jurisdiction do not match." }, { status: 422 });
  }
  if (!JURISDICTION_EVIDENCE_TYPES.includes(evidenceType) || !evidenceRef) {
    return NextResponse.json({ ok: false, error: "Evidence type and reference are required." }, { status: 422 });
  }
  if (legalTemplateRequiresRegionalReview(jurisdiction, legalRegion)) {
    return NextResponse.json({ ok: false, error: "A US state or regional scope is required." }, { status: 422 });
  }

  const updated = await verifyApplicationJurisdiction({
    applicationId: id,
    countryCode,
    jurisdiction,
    legalRegion,
    evidenceType,
    evidenceRef,
    reason,
    actor: csrf.session.actor
  });
  if (!updated) return NextResponse.json({ ok: false, error: "Investor application not found." }, { status: 404 });
  return NextResponse.json({ ok: true, data: serializeInvestorApplication(updated) });
}

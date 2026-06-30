import { NextResponse } from "next/server";
import { updateReadinessPolicy } from "@otiz/database";
import { verifyAdminCsrfToken } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

function sanitizeString(value: unknown, maxLength = 4000) {
  if (typeof value !== "string" && typeof value !== "number") return "";
  return String(value).replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, maxLength);
}

function booleanValue(value: unknown) {
  return value === true || value === "true";
}

function numberValue(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim()) return Number(value);
  return 0;
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const csrf = verifyAdminCsrfToken(request);
  if (!csrf.ok) return NextResponse.json({ ok: false, error: csrf.error }, { status: csrf.status });

  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!payload) return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 422 });

  const result = await updateReadinessPolicy(sanitizeString(params.id, 160), {
    name: sanitizeString(payload.name, 120),
    requiredProofCategoriesJson: sanitizeString(payload.requiredProofCategoriesJson),
    warningProofCategoriesJson: sanitizeString(payload.warningProofCategoriesJson),
    minimumProofCompletenessScore: numberValue(payload.minimumProofCompletenessScore),
    blockOnUnreviewedCriticalArtifacts: booleanValue(payload.blockOnUnreviewedCriticalArtifacts),
    blockOnHiddenInvestorLeakRisk: booleanValue(payload.blockOnHiddenInvestorLeakRisk),
    blockOnStaleSnapshot: booleanValue(payload.blockOnStaleSnapshot),
    allowPublishWithWarnings: booleanValue(payload.allowPublishWithWarnings),
    requireWarningAcknowledgment: booleanValue(payload.requireWarningAcknowledgment),
    isActive: booleanValue(payload.isActive),
    actor: csrf.session.actor
  });

  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true, data: result.policy });
}

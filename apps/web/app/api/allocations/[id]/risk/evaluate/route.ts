import { NextResponse } from "next/server";
import { calculateAllocationRisk, recordRiskEvaluationEvent, syncOperationalIncidentFromRisk } from "@otiz/database";
import { verifyAdminCsrfToken } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

function sanitizeString(value: unknown, maxLength = 160) {
  if (typeof value !== "string" && typeof value !== "number") return "";
  return String(value).replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const csrf = verifyAdminCsrfToken(request);
  if (!csrf.ok) return NextResponse.json({ ok: false, error: csrf.error }, { status: csrf.status });

  const allocationId = sanitizeString(params.id);
  const risk = await calculateAllocationRisk(allocationId);
  if (!risk) return NextResponse.json({ ok: false, error: "Allocation not found." }, { status: 404 });

  const audit = await recordRiskEvaluationEvent({
    entityType: "Allocation",
    entityId: allocationId,
    actor: csrf.session.actor,
    source: "manual_evaluation",
    currentRisk: risk
  });
  const incident = await syncOperationalIncidentFromRisk(risk, {
    actor: csrf.session.actor,
    metadata: {
      source: "manual_evaluation",
      riskEventSummary: audit.summary,
      previousLevel: audit.diff.previousLevel,
      currentLevel: audit.diff.currentLevel,
      newBlockingIssues: audit.diff.newBlockingIssues.length,
      resolvedBlockingIssues: audit.diff.resolvedBlockingIssues.length
    }
  });

  return NextResponse.json({ ok: true, data: { risk, audit: { eventCount: audit.eventCount, summary: audit.summary }, incident: { created: incident.created, updated: incident.updated, resolved: incident.resolved, id: incident.incident?.id ?? null } } });
}

import { NextResponse } from "next/server";
import { evaluateMonthlyReportReadiness, recordMonthlyReportReadinessAudit } from "@otiz/database";
import { getAdminSession, verifyAdminCsrfToken } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

function sanitizeString(value: unknown, maxLength = 160) {
  if (typeof value !== "string" && typeof value !== "number") return "";
  return String(value).replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export async function GET(_request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = getAdminSession();
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });

  const readiness = await evaluateMonthlyReportReadiness(sanitizeString(params.id));
  if (!readiness) return NextResponse.json({ ok: false, error: "Monthly report not found." }, { status: 404 });
  return NextResponse.json({ ok: true, data: readiness });
}

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const csrf = verifyAdminCsrfToken(request);
  if (!csrf.ok) return NextResponse.json({ ok: false, error: csrf.error }, { status: csrf.status });

  const reportId = sanitizeString(params.id);
  const readiness = await evaluateMonthlyReportReadiness(reportId);
  if (!readiness) return NextResponse.json({ ok: false, error: "Monthly report not found." }, { status: 404 });

  await recordMonthlyReportReadinessAudit({
    reportId,
    actor: csrf.session.actor,
    action: "EVALUATE_REPORT_READINESS",
    evaluation: readiness
  });

  return NextResponse.json({ ok: true, data: readiness });
}

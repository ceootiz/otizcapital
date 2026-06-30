import { NextResponse } from "next/server";
import { calculateMonthlyReportReconciliation, regenerateMonthlyReportProofSnapshotRecord, serializeMonthlyReport } from "@otiz/database";
import { getAdminSession, verifyAdminCsrfToken } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

function sanitizeString(value: unknown, maxLength = 1000) {
  if (typeof value !== "string" && typeof value !== "number") return "";
  return String(value).replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = getAdminSession();
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });

  const reconciliation = await calculateMonthlyReportReconciliation(sanitizeString(params.id, 160));
  if (!reconciliation) return NextResponse.json({ ok: false, error: "Monthly report not found." }, { status: 404 });

  return NextResponse.json({ ok: true, data: reconciliation });
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const csrf = verifyAdminCsrfToken(request);
  if (!csrf.ok) return NextResponse.json({ ok: false, error: csrf.error }, { status: csrf.status });

  const result = await regenerateMonthlyReportProofSnapshotRecord({ id: sanitizeString(params.id, 160), actor: csrf.session.actor });
  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: result.status });

  const reconciliation = await calculateMonthlyReportReconciliation(sanitizeString(params.id, 160));
  return NextResponse.json({ ok: true, data: { report: serializeMonthlyReport(result.report), reconciliation } });
}

import { NextResponse } from "next/server";
import { createMonthlyReportRecord, isMonthlyReportStatus, serializeMonthlyReport, type MonthlyReportStatus } from "@otiz/database";
import { verifyAdminCsrfToken } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

function sanitizeString(value: unknown, maxLength = 4000) {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const csrf = verifyAdminCsrfToken(request);
  if (!csrf.ok) return NextResponse.json({ ok: false, error: csrf.error }, { status: csrf.status });

  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!payload) return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 422 });

  const month = sanitizeString(payload.month, 40);
  const title = sanitizeString(payload.title, 180);
  const summary = sanitizeString(payload.summary, 4000);
  const statusValue = sanitizeString(payload.status || "DRAFT", 24);

  if (!month) return NextResponse.json({ ok: false, error: "month is required." }, { status: 422 });
  if (!title) return NextResponse.json({ ok: false, error: "title is required." }, { status: 422 });
  if (!summary) return NextResponse.json({ ok: false, error: "summary is required." }, { status: 422 });
  if (!isMonthlyReportStatus(statusValue)) return NextResponse.json({ ok: false, error: "Invalid report status." }, { status: 422 });

  const result = await createMonthlyReportRecord({
    investorId: sanitizeString(params.id, 160),
    month,
    title,
    summary,
    performanceNote: sanitizeString(payload.performanceNote, 4000) || null,
    payoutNote: sanitizeString(payload.payoutNote, 4000) || null,
    status: statusValue as MonthlyReportStatus,
    actor: csrf.session.actor
  });

  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: result.status });

  return NextResponse.json({ ok: true, data: serializeMonthlyReport(result.report) }, { status: 201 });
}

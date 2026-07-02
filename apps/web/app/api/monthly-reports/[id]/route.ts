import { NextResponse } from "next/server";
import {
  createInvestorNotification,
  evaluateMonthlyReportReadiness,
  findInvestorById,
  getInvestorMonthlyReportDetailRecord,
  getMonthlyReportDetailRecord,
  isMonthlyReportStatus,
  recordMonthlyReportReadinessAudit,
  regenerateMonthlyReportProofSnapshotRecord,
  resolveMonthlyReportPublishGate,
  serializeMonthlyReport,
  serializeMonthlyReportDetail,
  updateMonthlyReportRecord,
  type MonthlyReportStatus
} from "@otiz/database";
import { getAdminSession, verifyAdminCsrfToken } from "@/lib/admin-session";
import { getInvestorSession } from "@/lib/investor-session";

export const dynamic = "force-dynamic";

function sanitizeString(value: unknown, maxLength = 4000) {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const id = sanitizeString(params.id, 160);
  const adminSession = getAdminSession();

  if (adminSession) {
    const report = await getMonthlyReportDetailRecord(id);
    if (!report) return NextResponse.json({ ok: false, error: "Monthly report not found." }, { status: 404 });
    return NextResponse.json({ ok: true, data: serializeMonthlyReportDetail(report) });
  }

  const investorSession = getInvestorSession();
  if (!investorSession) return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });

  const investor = await findInvestorById(investorSession.investorId);
  if (!investor || investor.email !== investorSession.email || investor.status !== "ACTIVE") {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const report = await getInvestorMonthlyReportDetailRecord({ id, investorId: investor.id });
  if (!report) return NextResponse.json({ ok: false, error: "Monthly report not found." }, { status: 404 });

  return NextResponse.json({ ok: true, data: serializeMonthlyReportDetail(report) });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const csrf = verifyAdminCsrfToken(request);
  if (!csrf.ok) return NextResponse.json({ ok: false, error: csrf.error }, { status: csrf.status });

  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!payload) return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 422 });

  const action = sanitizeString(payload.action, 80);
  if (action === "regenerate-proof-snapshot") {
    const result = await regenerateMonthlyReportProofSnapshotRecord({
      id: sanitizeString(params.id, 160),
      actor: csrf.session.actor
    });

    if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
    return NextResponse.json({ ok: true, data: serializeMonthlyReport(result.report) });
  }
  if (action) return NextResponse.json({ ok: false, error: "Unsupported monthly report action." }, { status: 422 });

  const statusValue = typeof payload.status === "string" ? sanitizeString(payload.status, 24) : undefined;
  if (statusValue && !isMonthlyReportStatus(statusValue)) return NextResponse.json({ ok: false, error: "Invalid report status." }, { status: 422 });

  const month = payload.month === undefined ? undefined : sanitizeString(payload.month, 40);
  const title = payload.title === undefined ? undefined : sanitizeString(payload.title, 180);
  const summary = payload.summary === undefined ? undefined : sanitizeString(payload.summary, 4000);

  if (month !== undefined && !month) return NextResponse.json({ ok: false, error: "month is required." }, { status: 422 });
  if (title !== undefined && !title) return NextResponse.json({ ok: false, error: "title is required." }, { status: 422 });
  if (summary !== undefined && !summary) return NextResponse.json({ ok: false, error: "summary is required." }, { status: 422 });

  const reportId = sanitizeString(params.id, 160);
  let readinessFields: {
    readinessScore?: number | null;
    readinessState?: string | null;
    readinessSnapshotJson?: string | null;
    readinessEvaluatedAt?: Date | null;
  } = {};

  if (statusValue === "PUBLISHED") {
    const readiness = await evaluateMonthlyReportReadiness(reportId);
    if (!readiness) return NextResponse.json({ ok: false, error: "Monthly report not found." }, { status: 404 });
    const gate = resolveMonthlyReportPublishGate(readiness, payload.acknowledgeWarnings === true);

    if (!gate.ok) {
      if (gate.auditAction) {
        await recordMonthlyReportReadinessAudit({
          reportId,
          actor: csrf.session.actor,
          action: gate.auditAction,
          evaluation: readiness
        });
      }

      return NextResponse.json({ ok: false, error: gate.error, readiness }, { status: gate.status });
    }

    if (gate.auditAction) {
      await recordMonthlyReportReadinessAudit({
        reportId,
        actor: csrf.session.actor,
        action: gate.auditAction,
        evaluation: readiness
      });
    }

    readinessFields = {
      readinessScore: readiness.readinessPercentage,
      readinessState: readiness.state,
      readinessSnapshotJson: JSON.stringify(readiness),
      readinessEvaluatedAt: new Date(readiness.evaluatedAt)
    };
  }

  const result = await updateMonthlyReportRecord({
    id: reportId,
    month,
    title,
    summary,
    performanceNote: payload.performanceNote === undefined ? undefined : sanitizeString(payload.performanceNote, 4000) || null,
    payoutNote: payload.payoutNote === undefined ? undefined : sanitizeString(payload.payoutNote, 4000) || null,
    status: statusValue as MonthlyReportStatus | undefined,
    ...readinessFields,
    actor: csrf.session.actor
  });

  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: result.status });

  // Notify the investor when a report becomes published (best-effort).
  if (statusValue === "PUBLISHED") {
    await createInvestorNotification({
      investorId: result.report.investorId,
      type: "REPORT_PUBLISHED",
      title: "New report available",
      body: "A new monthly report has been published to your account.",
      linkHref: `/investor/reports/${reportId}`
    });
  }

  return NextResponse.json({ ok: true, data: serializeMonthlyReport(result.report) });
}

import { NextResponse } from "next/server";
import { INVESTOR_STATUSES, serializeInvestor, updateInvestorRecord, type InvestorStatus } from "@otiz/database";
import { verifyAdminCsrfToken } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

function sanitizeString(value: unknown, maxLength = 1000) {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function parseOptionalDate(value: unknown) {
  if (value === null || value === "") return null;
  if (typeof value !== "string") return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function isInvestorStatus(value: string): value is InvestorStatus {
  return INVESTOR_STATUSES.includes(value as InvestorStatus);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const csrf = verifyAdminCsrfToken(request);

  if (!csrf.ok) {
    return NextResponse.json({ ok: false, error: csrf.error }, { status: csrf.status });
  }

  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  if (!payload) {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 422 });
  }

  const statusValue = typeof payload.status === "string" ? sanitizeString(payload.status, 24) : undefined;
  const totalCapital = typeof payload.totalCapital === "string" || typeof payload.totalCapital === "number" ? sanitizeString(String(payload.totalCapital), 32) : undefined;
  const lastReportAt = payload.lastReportAt === undefined ? undefined : parseOptionalDate(payload.lastReportAt);

  if (statusValue && !isInvestorStatus(statusValue)) {
    return NextResponse.json({ ok: false, error: "Invalid investor status." }, { status: 422 });
  }
  const status = statusValue as InvestorStatus | undefined;

  if (totalCapital !== undefined && (!Number.isFinite(Number(totalCapital)) || Number(totalCapital) < 0)) {
    return NextResponse.json({ ok: false, error: "totalCapital must be a non-negative amount." }, { status: 422 });
  }

  if (payload.lastReportAt !== undefined && lastReportAt === undefined) {
    return NextResponse.json({ ok: false, error: "lastReportAt must be a valid date." }, { status: 422 });
  }

  const result = await updateInvestorRecord({
    id: sanitizeString(params.id, 160),
    status,
    notes: payload.notes === undefined ? undefined : sanitizeString(payload.notes, 4000) || null,
    reinvestEnabled: typeof payload.reinvestEnabled === "boolean" ? payload.reinvestEnabled : undefined,
    totalCapital,
    lastReportAt,
    actor: csrf.session.actor
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true, data: serializeInvestor(result.investor) });
}

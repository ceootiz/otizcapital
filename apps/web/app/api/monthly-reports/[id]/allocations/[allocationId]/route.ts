import { NextResponse } from "next/server";
import { removeAllocationFromMonthlyReport, serializeMonthlyReportAllocation, updateReportAllocationNote } from "@otiz/database";
import { verifyAdminCsrfToken } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

function sanitizeString(value: unknown, maxLength = 1000) {
  if (typeof value !== "string" && typeof value !== "number") return "";
  return String(value).replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export async function PATCH(request: Request, { params }: { params: { id: string; allocationId: string } }) {
  const csrf = verifyAdminCsrfToken(request);
  if (!csrf.ok) return NextResponse.json({ ok: false, error: csrf.error }, { status: csrf.status });

  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!payload) return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 422 });

  const result = await updateReportAllocationNote({
    monthlyReportId: sanitizeString(params.id, 160),
    allocationId: sanitizeString(params.allocationId, 160),
    note: sanitizeString(payload.note, 2000) || null,
    actor: csrf.session.actor
  });

  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true, data: serializeMonthlyReportAllocation(result.link) });
}

export async function DELETE(request: Request, { params }: { params: { id: string; allocationId: string } }) {
  const csrf = verifyAdminCsrfToken(request);
  if (!csrf.ok) return NextResponse.json({ ok: false, error: csrf.error }, { status: csrf.status });

  const result = await removeAllocationFromMonthlyReport({
    monthlyReportId: sanitizeString(params.id, 160),
    allocationId: sanitizeString(params.allocationId, 160),
    actor: csrf.session.actor
  });

  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true });
}

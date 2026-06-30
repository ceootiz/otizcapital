import { NextResponse } from "next/server";
import { approveWithdrawalRequest, cancelWithdrawalRequest, markWithdrawalPaid, rejectWithdrawalRequest, scheduleWithdrawalRequest, serializeInvestorWithdrawalRequest } from "@otiz/database";
import { verifyAdminCsrfToken } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

function sanitizeString(value: unknown, maxLength = 1000) {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function parseDate(value: unknown) {
  const raw = sanitizeString(value, 80);
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const csrf = verifyAdminCsrfToken(request);
  if (!csrf.ok) return NextResponse.json({ ok: false, error: csrf.error }, { status: csrf.status });

  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!payload) return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 422 });
  const action = sanitizeString(payload.action, 40);
  const adminNote = sanitizeString(payload.adminNote, 1000) || null;
  const id = sanitizeString(params.id, 160);
  const scheduledFor = parseDate(payload.scheduledFor);
  if (action === "schedule" && !scheduledFor) {
    return NextResponse.json({ ok: false, error: "scheduledFor is required." }, { status: 422 });
  }

  const result =
    action === "approve"
      ? await approveWithdrawalRequest({ id, actor: csrf.session.actor, adminNote })
      : action === "reject"
        ? await rejectWithdrawalRequest({ id, actor: csrf.session.actor, rejectionReason: sanitizeString(payload.rejectionReason, 1000) || null, adminNote })
        : action === "schedule"
          ? await scheduleWithdrawalRequest({ id, actor: csrf.session.actor, scheduledFor: scheduledFor as Date, adminNote })
          : action === "mark-paid"
            ? await markWithdrawalPaid({ id, actor: csrf.session.actor, adminNote })
            : action === "cancel"
              ? await cancelWithdrawalRequest({ id, actor: csrf.session.actor, adminNote })
              : { ok: false as const, status: 422 as const, error: "Unsupported withdrawal action." };

  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true, data: serializeInvestorWithdrawalRequest(result.request) });
}

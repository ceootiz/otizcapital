import { NextResponse } from "next/server";
import { createInvestorNotification, reviewDepositNotification, serializeDepositNotification } from "@otiz/database";
import { sanitizeAdminInput, verifyAdminCsrfToken } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

// PATCH: confirm or reject a pending deposit claim. On confirmation the
// investor gets a cabinet bell notification.
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const csrf = verifyAdminCsrfToken(request);
  if (!csrf.ok) return NextResponse.json({ ok: false, error: csrf.error }, { status: csrf.status });

  const payload = (await request.json().catch(() => null)) as { action?: unknown; adminNote?: unknown } | null;
  const action = typeof payload?.action === "string" ? payload.action : "";
  if (action !== "confirm" && action !== "reject") {
    return NextResponse.json({ ok: false, error: "action must be confirm or reject." }, { status: 422 });
  }

  const adminNote = sanitizeAdminInput(payload?.adminNote, 1000) || null;
  const { updated, record } = await reviewDepositNotification({
    id: params.id,
    status: action === "confirm" ? "CONFIRMED" : "REJECTED",
    adminNote,
    reviewedBy: csrf.session.actor
  });

  if (!record) {
    return NextResponse.json({ ok: false, error: "Deposit notification not found." }, { status: 404 });
  }
  if (!updated) {
    return NextResponse.json({ ok: false, error: "This deposit claim was already reviewed." }, { status: 409 });
  }

  // Investor-facing bell notification (best-effort).
  await createInvestorNotification({
    investorId: record.investorId,
    type: action === "confirm" ? "DEPOSIT_CONFIRMED" : "DEPOSIT_REJECTED",
    title: action === "confirm" ? "Ваш депозит подтверждён" : "По вашему депозиту нужна уточняющая информация",
    body:
      action === "confirm"
        ? `Поступление на сумму $${Number(record.amount)} (${record.network}) подтверждено менеджером.`
        : `Менеджер не смог подтвердить поступление $${Number(record.amount)} (${record.network}).${adminNote ? ` Комментарий: ${adminNote}` : " Свяжитесь с менеджером."}`,
    linkHref: "/ru/investor/deposit"
  });

  return NextResponse.json({ ok: true, data: serializeDepositNotification(record) });
}

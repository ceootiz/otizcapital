import { NextResponse } from "next/server";
import { approveWithdrawalRequest, cancelWithdrawalRequest, createInvestorNotification, markWithdrawalPaid, rejectWithdrawalRequest, scheduleWithdrawalRequest, serializeInvestorWithdrawalRequest } from "@otiz/database";
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

  // Notify the investor at each timeline step (best-effort). Russian to match
  // the rest of the cabinet, with the amount and a locale-prefixed deep link so
  // the bell click lands on the withdrawals page.
  const amountLabel = `${result.request.currency} ${result.request.amount}`;
  const notify = (
    type: "WITHDRAWAL_APPROVED" | "WITHDRAWAL_REJECTED" | "WITHDRAWAL_SCHEDULED" | "WITHDRAWAL_PAID",
    title: string,
    body: string
  ) => createInvestorNotification({ investorId: result.request.investorId, type, title, body, linkHref: "/ru/investor/withdrawals" });

  if (action === "approve") {
    await notify("WITHDRAWAL_APPROVED", "Запрос на вывод одобрен", `Ваш запрос на вывод ${amountLabel} одобрен менеджером. Далее будет назначена дата выплаты.`);
  } else if (action === "reject") {
    const reason = sanitizeString(payload.rejectionReason, 1000);
    await notify("WITHDRAWAL_REJECTED", "Запрос на вывод отклонён", `Ваш запрос на вывод ${amountLabel} не был одобрен.${reason ? ` Причина: ${reason}` : " Свяжитесь с менеджером для уточнения."}`);
  } else if (action === "schedule") {
    const dateLabel = scheduledFor ? scheduledFor.toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" }) : "";
    await notify("WITHDRAWAL_SCHEDULED", "Выплата запланирована", `Выплата ${amountLabel} запланирована${dateLabel ? ` на ${dateLabel}` : ""}. Средства поступят в назначенную дату.`);
  } else if (action === "mark-paid") {
    await notify("WITHDRAWAL_PAID", "Выплата произведена", `Выплата ${amountLabel} произведена. Спасибо, что инвестируете с OTIZ Capital.`);
  }

  return NextResponse.json({ ok: true, data: serializeInvestorWithdrawalRequest(result.request) });
}

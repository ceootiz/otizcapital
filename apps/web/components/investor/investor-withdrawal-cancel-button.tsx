"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@otiz/lib";

const COPY: Record<Locale, { cancel: string; confirm: string; cancelling: string; error: string }> = {
  en: { cancel: "Cancel request", confirm: "Cancel this withdrawal request?", cancelling: "Cancelling...", error: "Unable to cancel the request." },
  ru: { cancel: "Отменить заявку", confirm: "Отменить эту заявку на вывод?", cancelling: "Отменяем...", error: "Не удалось отменить заявку." },
  de: { cancel: "Antrag stornieren", confirm: "Diesen Auszahlungsantrag stornieren?", cancelling: "Wird storniert...", error: "Der Antrag konnte nicht storniert werden." },
  es: { cancel: "Cancelar solicitud", confirm: "¿Cancelar esta solicitud de retiro?", cancelling: "Cancelando...", error: "No se pudo cancelar la solicitud." },
  zh: { cancel: "取消申请", confirm: "确定取消此提现申请吗？", cancelling: "正在取消……", error: "无法取消申请。" }
};

export function InvestorWithdrawalCancelButton({ locale, withdrawalId }: { locale: Locale; withdrawalId: string }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");
  const copy = COPY[locale];

  async function cancel() {
    if (!window.confirm(copy.confirm)) return;
    setError("");
    setSubmitting(true);
    try {
      const response = await fetch(`/api/investor/withdrawals/${encodeURIComponent(withdrawalId)}/cancel`, { method: "POST" });
      const body = (await response.json().catch(() => null)) as { ok?: boolean } | null;
      if (!response.ok || !body?.ok) {
        setError(copy.error);
        return;
      }
      startTransition(() => router.refresh());
    } catch {
      setError(copy.error);
    } finally {
      setSubmitting(false);
    }
  }

  const busy = submitting || pending;
  return <div className="mt-4">
    <button type="button" disabled={busy} onClick={() => void cancel()} className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground disabled:opacity-50 dark:border-white/10">
      {busy ? copy.cancelling : copy.cancel}
    </button>
    {error ? <p className="mt-2 text-sm text-red-700 dark:text-red-200" role="alert">{error}</p> : null}
  </div>;
}

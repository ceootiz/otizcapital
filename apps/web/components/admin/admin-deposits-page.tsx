"use client";

import * as React from "react";
import Link from "next/link";
import type { SerializedAdminDepositNotification } from "@otiz/database";
import { createAdminFormatters, type Locale } from "@otiz/lib";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@otiz/ui";

const ADMIN_CSRF_COOKIE = "admin_csrf_token";
const ADMIN_CSRF_HEADER = "x-csrf-token";

const STRINGS = {
  en: {
    eyebrow: "Money received",
    title: "Deposit confirmations",
    description: "Confirm only after the funds are visible in the OTIZ account. Confirmed deposits immediately update the investor balance.",
    all: "All",
    pending: "Awaiting confirmation",
    confirmed: "Confirmed",
    rejected: "Rejected",
    empty: "No deposits in this group.",
    moneyReceived: "Funds received",
    reject: "Reject",
    saving: "Saving...",
    note: "Manager note (optional)",
    investor: "Investor",
    transaction: "Transaction",
    noHash: "No transaction hash — manual verification required",
    verificationFailed: "Automatic verification did not pass. Review the transaction and enable manual confirmation if the funds are visible.",
    manualOverride: "I verified the funds manually",
    error: "Unable to update this deposit."
  },
  ru: {
    eyebrow: "Поступившие деньги",
    title: "Подтверждение пополнений",
    description: "Подтверждайте только после появления денег на счёте OTIZ. Подтверждённое пополнение сразу увеличит баланс инвестора.",
    all: "Все",
    pending: "Ожидают подтверждения",
    confirmed: "Подтверждены",
    rejected: "Отклонены",
    empty: "В этой группе нет пополнений.",
    moneyReceived: "Деньги поступили",
    reject: "Отклонить",
    saving: "Сохраняем...",
    note: "Комментарий менеджера (необязательно)",
    investor: "Инвестор",
    transaction: "Транзакция",
    noHash: "Хэш транзакции не указан — требуется ручная проверка",
    verificationFailed: "Автоматическая проверка не пройдена. Проверьте транзакцию и разрешите ручное подтверждение, только если деньги видны на счёте.",
    manualOverride: "Я проверил поступление вручную",
    error: "Не удалось обновить пополнение."
  }
} as const;

type Filter = "ALL" | "PENDING" | "CONFIRMED" | "REJECTED";
type VerificationWarning = { status?: string; error?: string; explorerUrl?: string };

function cookieValue(name: string) {
  return document.cookie.split("; ").find((cookie) => cookie.startsWith(`${name}=`))?.split("=").slice(1).join("=") || "";
}

function statusTone(status: string) {
  if (status === "CONFIRMED") return "border-emerald-300/40 text-emerald-700 dark:text-emerald-300";
  if (status === "REJECTED") return "border-red-300/40 text-red-700 dark:text-red-300";
  return "border-gold-200/35 text-amber-700 dark:text-gold-100";
}

export function AdminDepositsPage({ locale, initialDeposits }: { locale: Locale; initialDeposits: SerializedAdminDepositNotification[] }) {
  const t = (STRINGS as unknown as Record<string, typeof STRINGS.en>)[locale] ?? STRINGS.en;
  const fmt = createAdminFormatters(locale);
  const [deposits, setDeposits] = React.useState(initialDeposits);
  const [filter, setFilter] = React.useState<Filter>("PENDING");
  const [notes, setNotes] = React.useState<Record<string, string>>({});
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [warnings, setWarnings] = React.useState<Record<string, VerificationWarning>>({});
  const [manualOverrides, setManualOverrides] = React.useState<Record<string, boolean>>({});
  const [error, setError] = React.useState<string | null>(null);
  const visible = filter === "ALL" ? deposits : deposits.filter((deposit) => deposit.status === filter);
  const counts = {
    ALL: deposits.length,
    PENDING: deposits.filter((deposit) => deposit.status === "PENDING").length,
    CONFIRMED: deposits.filter((deposit) => deposit.status === "CONFIRMED").length,
    REJECTED: deposits.filter((deposit) => deposit.status === "REJECTED").length
  };

  async function review(deposit: SerializedAdminDepositNotification, action: "confirm" | "reject") {
    setBusyId(deposit.id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/deposits/${deposit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", [ADMIN_CSRF_HEADER]: cookieValue(ADMIN_CSRF_COOKIE) },
        body: JSON.stringify({ action, adminNote: notes[deposit.id] || null, manualOverride: manualOverrides[deposit.id] === true })
      });
      const payload = (await response.json()) as {
        ok: boolean;
        error?: string;
        code?: string;
        verification?: VerificationWarning;
        data?: SerializedAdminDepositNotification;
      };
      if (!response.ok && payload.code === "VERIFICATION_FAILED" && payload.verification) {
        setWarnings((current) => ({ ...current, [deposit.id]: payload.verification as VerificationWarning }));
        return;
      }
      if (!response.ok || !payload.ok || !payload.data) throw new Error(payload.error || t.error);
      setDeposits((current) => current.map((item) => item.id === deposit.id ? { ...item, ...payload.data, investor: item.investor } : item));
      setWarnings((current) => {
        const next = { ...current };
        delete next[deposit.id];
        return next;
      });
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : t.error);
    } finally {
      setBusyId(null);
    }
  }

  const filters: Array<{ key: Filter; label: string }> = [
    { key: "PENDING", label: t.pending },
    { key: "CONFIRMED", label: t.confirmed },
    { key: "REJECTED", label: t.rejected },
    { key: "ALL", label: t.all }
  ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground micro-noise">
      <div className="container relative z-10 py-8 sm:py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700 dark:text-gold-100">{t.eyebrow}</p>
        <h1 className="mt-3 font-display text-3xl tracking-[-0.03em] sm:text-4xl">{t.title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{t.description}</p>

        <div className="mt-6 flex flex-wrap gap-2">
          {filters.map((item) => (
            <Button key={item.key} type="button" variant={filter === item.key ? "default" : "outline"} size="sm" onClick={() => setFilter(item.key)}>
              {item.label} · {counts[item.key]}
            </Button>
          ))}
        </div>

        {error ? <p className="mt-5 text-sm text-red-600 dark:text-red-400">{error}</p> : null}
        <div className="mt-6 grid gap-4">
          {visible.length === 0 ? (
            <Card><CardContent className="p-6 text-sm text-muted-foreground">{t.empty}</CardContent></Card>
          ) : visible.map((deposit) => {
            const warning = warnings[deposit.id];
            return (
              <Card key={deposit.id} className="rounded-[1.35rem] bg-card dark:bg-graphite-900/[0.72]">
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <CardTitle>{fmt.currency(deposit.amount)} · {deposit.network}</CardTitle>
                      <CardDescription>{fmt.dateTime(new Date(deposit.createdAt))}</CardDescription>
                    </div>
                    <Badge className={statusTone(deposit.status)}>{deposit.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-border bg-muted/30 p-4 dark:border-white/10 dark:bg-black/20">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t.investor}</p>
                      <Link href={`/${locale}/admin/investors/${deposit.investor.id}`} className="mt-2 block font-semibold text-amber-700 hover:underline dark:text-gold-100">{deposit.investor.fullName}</Link>
                      <p className="mt-1 text-xs text-muted-foreground">{deposit.investor.email}</p>
                    </div>
                    <div className="rounded-2xl border border-border bg-muted/30 p-4 dark:border-white/10 dark:bg-black/20">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t.transaction}</p>
                      <p className="mt-2 break-all text-sm text-foreground">{deposit.txHash || t.noHash}</p>
                    </div>
                  </div>

                  {warning ? (
                    <div className="rounded-2xl border border-amber-400/40 bg-amber-100/40 p-4 dark:bg-amber-900/20">
                      <p className="text-sm text-amber-900 dark:text-amber-100">{t.verificationFailed}</p>
                      <label className="mt-3 flex items-center gap-2 text-sm text-foreground">
                        <input type="checkbox" checked={manualOverrides[deposit.id] === true} onChange={(event) => setManualOverrides((current) => ({ ...current, [deposit.id]: event.target.checked }))} />
                        {t.manualOverride}
                      </label>
                    </div>
                  ) : null}

                  {deposit.status === "PENDING" ? (
                    <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-center">
                      <input value={notes[deposit.id] || ""} onChange={(event) => setNotes((current) => ({ ...current, [deposit.id]: event.target.value }))} placeholder={t.note} className="h-11 rounded-2xl border border-border bg-muted/30 px-4 text-sm text-foreground outline-none dark:border-white/10 dark:bg-black/20" />
                      <Button type="button" disabled={busyId === deposit.id || Boolean(warning && !manualOverrides[deposit.id])} onClick={() => review(deposit, "confirm")}>
                        {busyId === deposit.id ? t.saving : t.moneyReceived}
                      </Button>
                      <Button type="button" variant="outline" disabled={busyId === deposit.id} onClick={() => review(deposit, "reject")}>{t.reject}</Button>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </main>
  );
}

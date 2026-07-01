"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, CalendarClock, Save } from "lucide-react";
import { createAdminFormatters, enumLabel, type Locale } from "@otiz/lib";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Separator } from "@otiz/ui";
import { AdminNavigation } from "./admin-navigation";

const STRINGS = {
  en: {
    eyebrow: "Admin payout schedule",
    h1: "Withdrawal requests",
    desc: "Manager-controlled payout requests with masked destinations and audit-backed actions.",
    visible: "{n} visible",
    backToInvestors: "Back to investors",
    metricMethod: "Method",
    metricDestination: "Destination",
    metricRequested: "Requested",
    metricScheduled: "Scheduled",
    notSet: "Not set",
    scheduleDate: "Schedule date",
    adminNote: "Admin note / rejection reason",
    approve: "Approve",
    schedule: "Schedule",
    markPaid: "Mark paid",
    reject: "Reject",
    cancel: "Cancel",
    emptyTitle: "No withdrawal requests",
    emptyDesc: "Requests will appear here after investor or manager creation.",
    noticeUpdated: "Withdrawal request updated.",
    noticeError: "Unable to update withdrawal request."
  },
  ru: {
    eyebrow: "График выплат администратора",
    h1: "Запросы на вывод средств",
    desc: "Управляемые менеджером запросы на выплату с маскированными реквизитами и действиями с аудитом.",
    visible: "Показано: {n}",
    backToInvestors: "Назад к инвесторам",
    metricMethod: "Способ",
    metricDestination: "Реквизиты",
    metricRequested: "Запрошено",
    metricScheduled: "Запланировано",
    notSet: "Не задано",
    scheduleDate: "Дата планирования",
    adminNote: "Заметка администратора / причина отклонения",
    approve: "Одобрить",
    schedule: "Запланировать",
    markPaid: "Отметить выплаченным",
    reject: "Отклонить",
    cancel: "Отменить",
    emptyTitle: "Нет запросов на вывод средств",
    emptyDesc: "Запросы появятся здесь после создания инвестором или менеджером.",
    noticeUpdated: "Запрос на вывод средств обновлён.",
    noticeError: "Не удалось обновить запрос на вывод средств."
  }
} as const;

type Strings = typeof STRINGS.en;
const getStrings = (locale: Locale): Strings => (STRINGS as unknown as Record<string, Strings>)[locale] ?? STRINGS.en;

const ADMIN_CSRF_COOKIE = "admin_csrf_token";
const ADMIN_CSRF_HEADER = "x-csrf-token";
const STATUS_FILTERS = ["ALL", "REQUESTED", "APPROVED", "SCHEDULED", "PAID", "REJECTED", "CANCELLED"] as const;

type Withdrawal = {
  id: string;
  investorId: string;
  amount: string;
  currency: string;
  status: string;
  requestedAt: string;
  approvedAt: string | null;
  rejectedAt: string | null;
  paidAt: string | null;
  scheduledFor: string | null;
  method: string | null;
  destinationMasked: string | null;
  investorNote: string | null;
  rejectionReason: string | null;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
  investor: { id: string; fullName: string; email: string; telegram: string | null; status: string };
};

function getCookieValue(name: string) {
  if (typeof document === "undefined") return "";
  return document.cookie.split("; ").find((cookie) => cookie.startsWith(`${name}=`))?.split("=").slice(1).join("=") || "";
}

function getAdminMutationHeaders() {
  return { "Content-Type": "application/json", [ADMIN_CSRF_HEADER]: getCookieValue(ADMIN_CSRF_COOKIE) };
}

function toDateInputValue(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function AdminWithdrawalsPage({ locale, withdrawals: initialWithdrawals, initialStatus }: { locale: Locale; withdrawals: Withdrawal[]; initialStatus: string }) {
  const t = getStrings(locale);
  const formatters = createAdminFormatters(locale);
  const [withdrawals, setWithdrawals] = React.useState(initialWithdrawals);
  const [filter, setFilter] = React.useState(initialStatus || "ALL");
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [scheduledFor, setScheduledFor] = React.useState<Record<string, string>>(() => Object.fromEntries(initialWithdrawals.map((withdrawal) => [withdrawal.id, toDateInputValue(withdrawal.scheduledFor)])));
  const [adminNotes, setAdminNotes] = React.useState<Record<string, string>>(() => Object.fromEntries(initialWithdrawals.map((withdrawal) => [withdrawal.id, withdrawal.adminNote || ""])));
  const visibleWithdrawals = filter === "ALL" ? withdrawals : withdrawals.filter((withdrawal) => withdrawal.status === filter);

  async function runAction(withdrawal: Withdrawal, action: string) {
    setPendingId(withdrawal.id);
    setNotice(null);
    setError(null);
    try {
      const response = await fetch(`/api/admin/withdrawals/${withdrawal.id}`, {
        method: "PATCH",
        headers: getAdminMutationHeaders(),
        body: JSON.stringify({
          action,
          scheduledFor: scheduledFor[withdrawal.id] || null,
          adminNote: adminNotes[withdrawal.id] || null,
          rejectionReason: adminNotes[withdrawal.id] || null
        })
      });
      const payload = (await response.json()) as { ok: boolean; data?: Partial<Withdrawal>; error?: string };
      if (!response.ok || !payload.ok || !payload.data) throw new Error(payload.error || t.noticeError);
      setWithdrawals((current) => current.map((item) => (item.id === withdrawal.id ? { ...item, ...payload.data } : item)));
      setNotice(t.noticeUpdated);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t.noticeError);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground micro-noise">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(212,175,95,0.14),transparent_34rem),radial-gradient(circle_at_86%_10%,rgba(255,255,255,0.07),transparent_28rem)]" />
      <div className="macro-grid absolute inset-0 opacity-45" />
      <section className="relative z-10 py-8 sm:py-10">
        <div className="container">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link href={`/${locale}/admin/investors`} className="inline-flex items-center gap-3 text-sm text-muted-foreground transition-colors hover:text-foreground"><ArrowLeft className="size-4" />{t.backToInvestors}</Link>
            <AdminNavigation locale={locale} activeSection="withdrawals" />
          </div>

          <Card className="mb-6 rounded-[2rem] bg-graphite-900/[0.78]">
            <CardContent className="grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-100">{t.eyebrow}</p>
                <h1 className="mt-3 font-display text-4xl tracking-[-0.04em] text-foreground md:text-5xl">{t.h1}</h1>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{t.desc}</p>
              </div>
              <Badge variant="secondary">{t.visible.replace("{n}", String(visibleWithdrawals.length))}</Badge>
            </CardContent>
          </Card>

          {notice ? <Notice tone="success" message={notice} /> : null}
          {error ? <Notice tone="error" message={error} /> : null}

          <div className="mb-6 flex gap-2 overflow-x-auto rounded-[1.5rem] border border-white/10 bg-black/20 p-2">
            {STATUS_FILTERS.map((status) => (
              <button key={status} type="button" onClick={() => setFilter(status)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors ${filter === status ? "bg-gold-200/15 text-gold-100" : "text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"}`}>{enumLabel("withdrawalStatus", status, locale)}</button>
            ))}
          </div>

          <div className="grid gap-4">
            {visibleWithdrawals.length === 0 ? (
              <Card className="rounded-[2rem] bg-graphite-900/[0.72]"><CardContent className="p-8 text-center"><CalendarClock className="mx-auto size-9 text-gold-100" /><p className="mt-4 font-semibold text-foreground">{t.emptyTitle}</p><p className="mt-2 text-sm text-muted-foreground">{t.emptyDesc}</p></CardContent></Card>
            ) : visibleWithdrawals.map((withdrawal) => (
              <Card key={withdrawal.id} className="rounded-[2rem] bg-graphite-900/[0.72]">
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle>{withdrawal.currency} {formatters.number(Number(withdrawal.amount || 0))}</CardTitle>
                      <CardDescription>{withdrawal.investor.fullName} · {withdrawal.investor.email}</CardDescription>
                    </div>
                    <Badge>{enumLabel("withdrawalStatus", withdrawal.status, locale)}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid gap-3 md:grid-cols-4">
                    <Metric label={t.metricMethod} value={withdrawal.method || t.notSet} />
                    <Metric label={t.metricDestination} value={withdrawal.destinationMasked || t.notSet} />
                    <Metric label={t.metricRequested} value={formatters.dateTime(withdrawal.requestedAt)} />
                    <Metric label={t.metricScheduled} value={formatters.dateTime(withdrawal.scheduledFor)} />
                  </div>
                  <Separator />
                  <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
                    <label className="grid gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t.scheduleDate}</span>
                      <input type="date" value={scheduledFor[withdrawal.id] || ""} onChange={(event) => setScheduledFor((current) => ({ ...current, [withdrawal.id]: event.target.value }))} className="h-11 rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-foreground outline-none" />
                    </label>
                    <label className="grid gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t.adminNote}</span>
                      <input value={adminNotes[withdrawal.id] || ""} onChange={(event) => setAdminNotes((current) => ({ ...current, [withdrawal.id]: event.target.value }))} className="h-11 rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-foreground outline-none" />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" size="sm" variant="outline" disabled={pendingId === withdrawal.id || withdrawal.status !== "REQUESTED"} onClick={() => runAction(withdrawal, "approve")}>{t.approve}</Button>
                      <Button type="button" size="sm" variant="outline" disabled={pendingId === withdrawal.id || !["REQUESTED", "APPROVED", "SCHEDULED"].includes(withdrawal.status)} onClick={() => runAction(withdrawal, "schedule")}>{t.schedule}</Button>
                      <Button type="button" size="sm" disabled={pendingId === withdrawal.id || !["APPROVED", "SCHEDULED"].includes(withdrawal.status)} onClick={() => runAction(withdrawal, "mark-paid")}><Save data-icon="inline-start" />{t.markPaid}</Button>
                      <Button type="button" size="sm" variant="outline" disabled={pendingId === withdrawal.id || !["REQUESTED", "APPROVED", "SCHEDULED"].includes(withdrawal.status)} onClick={() => runAction(withdrawal, "reject")}>{t.reject}</Button>
                      <Button type="button" size="sm" variant="outline" disabled={pendingId === withdrawal.id || !["REQUESTED", "APPROVED", "SCHEDULED"].includes(withdrawal.status)} onClick={() => runAction(withdrawal, "cancel")}>{t.cancel}</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p><p className="mt-2 text-sm leading-6 text-foreground">{value}</p></div>;
}

function Notice({ tone, message }: { tone: "success" | "error"; message: string }) {
  return <div className={`mb-6 rounded-[1.5rem] border p-4 text-sm ${tone === "success" ? "border-gold-200/25 bg-gold-200/10 text-gold-100" : "border-white/10 bg-black/30 text-foreground"}`}>{message}</div>;
}

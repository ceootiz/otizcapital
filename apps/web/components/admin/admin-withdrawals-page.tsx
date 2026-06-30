"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, CalendarClock, Save } from "lucide-react";
import type { Locale } from "@otiz/lib";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Separator } from "@otiz/ui";
import { AdminNavigation } from "./admin-navigation";

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

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

function getCookieValue(name: string) {
  if (typeof document === "undefined") return "";
  return document.cookie.split("; ").find((cookie) => cookie.startsWith(`${name}=`))?.split("=").slice(1).join("=") || "";
}

function getAdminMutationHeaders() {
  return { "Content-Type": "application/json", [ADMIN_CSRF_HEADER]: getCookieValue(ADMIN_CSRF_COOKIE) };
}

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : dateFormatter.format(date);
}

function toDateInputValue(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function AdminWithdrawalsPage({ locale, withdrawals: initialWithdrawals, initialStatus }: { locale: Locale; withdrawals: Withdrawal[]; initialStatus: string }) {
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
      if (!response.ok || !payload.ok || !payload.data) throw new Error(payload.error || "Unable to update withdrawal request.");
      setWithdrawals((current) => current.map((item) => (item.id === withdrawal.id ? { ...item, ...payload.data } : item)));
      setNotice("Withdrawal request updated.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to update withdrawal request.");
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
            <Link href={`/${locale}/admin/investors`} className="inline-flex items-center gap-3 text-sm text-muted-foreground transition-colors hover:text-foreground"><ArrowLeft className="size-4" />Back to investors</Link>
            <AdminNavigation locale={locale} activeSection="withdrawals" />
          </div>

          <Card className="mb-6 rounded-[2rem] bg-graphite-900/[0.78]">
            <CardContent className="grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-100">Admin payout schedule</p>
                <h1 className="mt-3 font-display text-4xl tracking-[-0.04em] text-foreground md:text-5xl">Withdrawal requests</h1>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">Manager-controlled payout requests with masked destinations and audit-backed actions.</p>
              </div>
              <Badge variant="secondary">{visibleWithdrawals.length} visible</Badge>
            </CardContent>
          </Card>

          {notice ? <Notice tone="success" message={notice} /> : null}
          {error ? <Notice tone="error" message={error} /> : null}

          <div className="mb-6 flex gap-2 overflow-x-auto rounded-[1.5rem] border border-white/10 bg-black/20 p-2">
            {STATUS_FILTERS.map((status) => (
              <button key={status} type="button" onClick={() => setFilter(status)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors ${filter === status ? "bg-gold-200/15 text-gold-100" : "text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"}`}>{status}</button>
            ))}
          </div>

          <div className="grid gap-4">
            {visibleWithdrawals.length === 0 ? (
              <Card className="rounded-[2rem] bg-graphite-900/[0.72]"><CardContent className="p-8 text-center"><CalendarClock className="mx-auto size-9 text-gold-100" /><p className="mt-4 font-semibold text-foreground">No withdrawal requests</p><p className="mt-2 text-sm text-muted-foreground">Requests will appear here after investor or manager creation.</p></CardContent></Card>
            ) : visibleWithdrawals.map((withdrawal) => (
              <Card key={withdrawal.id} className="rounded-[2rem] bg-graphite-900/[0.72]">
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle>{withdrawal.currency} {Number(withdrawal.amount || 0).toLocaleString("en-US")}</CardTitle>
                      <CardDescription>{withdrawal.investor.fullName} · {withdrawal.investor.email}</CardDescription>
                    </div>
                    <Badge>{withdrawal.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid gap-3 md:grid-cols-4">
                    <Metric label="Method" value={withdrawal.method || "Not set"} />
                    <Metric label="Destination" value={withdrawal.destinationMasked || "Not set"} />
                    <Metric label="Requested" value={formatDate(withdrawal.requestedAt)} />
                    <Metric label="Scheduled" value={formatDate(withdrawal.scheduledFor)} />
                  </div>
                  <Separator />
                  <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
                    <label className="grid gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Schedule date</span>
                      <input type="date" value={scheduledFor[withdrawal.id] || ""} onChange={(event) => setScheduledFor((current) => ({ ...current, [withdrawal.id]: event.target.value }))} className="h-11 rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-foreground outline-none" />
                    </label>
                    <label className="grid gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Admin note / rejection reason</span>
                      <input value={adminNotes[withdrawal.id] || ""} onChange={(event) => setAdminNotes((current) => ({ ...current, [withdrawal.id]: event.target.value }))} className="h-11 rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-foreground outline-none" />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" size="sm" variant="outline" disabled={pendingId === withdrawal.id || withdrawal.status !== "REQUESTED"} onClick={() => runAction(withdrawal, "approve")}>Approve</Button>
                      <Button type="button" size="sm" variant="outline" disabled={pendingId === withdrawal.id || !["REQUESTED", "APPROVED", "SCHEDULED"].includes(withdrawal.status)} onClick={() => runAction(withdrawal, "schedule")}>Schedule</Button>
                      <Button type="button" size="sm" disabled={pendingId === withdrawal.id || !["APPROVED", "SCHEDULED"].includes(withdrawal.status)} onClick={() => runAction(withdrawal, "mark-paid")}><Save data-icon="inline-start" />Mark paid</Button>
                      <Button type="button" size="sm" variant="outline" disabled={pendingId === withdrawal.id || !["REQUESTED", "APPROVED", "SCHEDULED"].includes(withdrawal.status)} onClick={() => runAction(withdrawal, "reject")}>Reject</Button>
                      <Button type="button" size="sm" variant="outline" disabled={pendingId === withdrawal.id || !["REQUESTED", "APPROVED", "SCHEDULED"].includes(withdrawal.status)} onClick={() => runAction(withdrawal, "cancel")}>Cancel</Button>
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

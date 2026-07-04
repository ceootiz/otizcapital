"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { AdminArbitrageurRow, AdminCommissionRow, SerializedReferralProgram } from "@otiz/database";
import { createAdminFormatters, type Locale } from "@otiz/lib";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@otiz/ui";

const ADMIN_CSRF_COOKIE = "admin_csrf_token";
const ADMIN_CSRF_HEADER = "x-csrf-token";

function getCookieValue(name: string) {
  if (typeof document === "undefined") return "";
  return document.cookie.split("; ").find((cookie) => cookie.startsWith(`${name}=`))?.split("=").slice(1).join("=") || "";
}
function mutationHeaders() {
  return { "Content-Type": "application/json", [ADMIN_CSRF_HEADER]: getCookieValue(ADMIN_CSRF_COOKIE) };
}

type TabKey = "arbitrageurs" | "commissions" | "settings";

const STRINGS = {
  en: {
    title: "Referrals",
    desc: "Arbitrageurs, commissions, and program settings.",
    tabs: { arbitrageurs: "Arbitrageurs", commissions: "Commissions", settings: "Settings" },
    // arbitrageurs
    arbEmpty: "No arbitrageurs yet.",
    colName: "Name",
    colCode: "Code",
    colClicks: "Clicks",
    colApproved: "Investors",
    colPending: "Pending",
    colRate: "Rate",
    colStatus: "Status",
    approve: "Approve",
    suspend: "Suspend",
    reactivate: "Reactivate",
    saveRate: "Save",
    ratePlaceholder: "default",
    flagged: "flagged",
    statusPending: "Pending",
    statusActive: "Active",
    statusSuspended: "Suspended",
    // commissions
    commEmpty: "No commissions yet.",
    colDate: "Date",
    colReferrer: "Referrer",
    colInvestor: "Investor",
    colDeposit: "Deposit",
    colCommission: "Commission",
    markPaid: "Mark paid",
    notePlaceholder: "Payment note (optional)",
    commPaid: "Paid",
    commPendingStatus: "Pending",
    typeArb: "Arbitrageur",
    typeInv: "Investor",
    // settings
    settingsTitle: "Program settings",
    arbRate: "Arbitrageur rate",
    invRate: "Investor referrer rate",
    minDeposit: "Minimum deposit for commission",
    rateHint: "As a fraction (0.10 = 10%).",
    save: "Save settings",
    saving: "Saving...",
    saved: "Saved.",
    backfillTitle: "Existing investors",
    backfillDesc: "Generate referral codes for investors created before the program launched.",
    backfill: "Generate missing codes",
    backfillDone: (n: number) => `${n} code(s) generated.`,
    errFallback: "Something went wrong. Please try again."
  },
  ru: {
    title: "Рефералы",
    desc: "Арбитражники, комиссии и настройки программы.",
    tabs: { arbitrageurs: "Арбитражники", commissions: "Комиссии", settings: "Настройки" },
    arbEmpty: "Пока нет арбитражников.",
    colName: "Имя",
    colCode: "Код",
    colClicks: "Переходы",
    colApproved: "Инвесторы",
    colPending: "К выплате",
    colRate: "Ставка",
    colStatus: "Статус",
    approve: "Одобрить",
    suspend: "Заблокировать",
    reactivate: "Разблокировать",
    saveRate: "Сохранить",
    ratePlaceholder: "по умолч.",
    flagged: "подозр.",
    statusPending: "Ожидает",
    statusActive: "Активен",
    statusSuspended: "Заблокирован",
    commEmpty: "Пока нет комиссий.",
    colDate: "Дата",
    colReferrer: "Реферер",
    colInvestor: "Инвестор",
    colDeposit: "Депозит",
    colCommission: "Комиссия",
    markPaid: "Отметить выплату",
    notePlaceholder: "Комментарий к выплате (необязательно)",
    commPaid: "Выплачено",
    commPendingStatus: "Ожидает",
    typeArb: "Арбитражник",
    typeInv: "Инвестор",
    settingsTitle: "Настройки программы",
    arbRate: "Ставка арбитражника",
    invRate: "Ставка инвестора-реферера",
    minDeposit: "Минимальный депозит для комиссии",
    rateHint: "Дробью (0.10 = 10%).",
    save: "Сохранить настройки",
    saving: "Сохраняем...",
    saved: "Сохранено.",
    backfillTitle: "Существующие инвесторы",
    backfillDesc: "Сгенерировать реферальные коды для инвесторов, созданных до запуска программы.",
    backfill: "Сгенерировать недостающие коды",
    backfillDone: (n: number) => `Сгенерировано кодов: ${n}.`,
    errFallback: "Что-то пошло не так. Попробуйте ещё раз."
  }
} as const;
type Strings = typeof STRINGS.en;
const getStrings = (locale: Locale): Strings => (STRINGS as unknown as Record<string, Strings>)[locale] ?? STRINGS.en;

const cardClass = "rounded-[1.35rem] bg-card dark:bg-graphite-900/[0.72]";
const inputClass =
  "h-11 rounded-2xl border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 px-3 text-sm text-foreground outline-none focus:border-gold-200/45";

export function AdminReferralsPage({
  locale,
  arbitrageurs,
  commissions,
  program
}: {
  locale: Locale;
  arbitrageurs: AdminArbitrageurRow[];
  commissions: AdminCommissionRow[];
  program: SerializedReferralProgram;
}) {
  const t = getStrings(locale);
  const router = useRouter();
  const fmt = React.useMemo(() => createAdminFormatters(locale), [locale]);
  const [tab, setTab] = React.useState<TabKey>("arbitrageurs");
  const [error, setError] = React.useState<string | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const [rateDraft, setRateDraft] = React.useState<Record<string, string>>({});
  const [noteDraft, setNoteDraft] = React.useState<Record<string, string>>({});

  async function call(url: string, method: string, body: unknown): Promise<boolean> {
    setError(null);
    try {
      const response = await fetch(url, { method, headers: mutationHeaders(), body: JSON.stringify(body) });
      const payload = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.error || t.errFallback);
      return true;
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t.errFallback);
      return false;
    }
  }

  async function arbitrageurAction(id: string, action: "approve" | "suspend") {
    setBusyId(id);
    if (await call(`/api/admin/referrals/arbitrageurs/${id}`, "PATCH", { action })) router.refresh();
    setBusyId(null);
  }

  async function saveRate(id: string) {
    setBusyId(id);
    const raw = rateDraft[id]?.trim();
    if (await call(`/api/admin/referrals/arbitrageurs/${id}`, "PATCH", { action: "set-rate", customRate: raw === "" ? null : raw })) {
      router.refresh();
    }
    setBusyId(null);
  }

  async function markPaid(id: string) {
    setBusyId(id);
    if (await call(`/api/admin/referrals/commissions/${id}`, "PATCH", { action: "mark-paid", note: noteDraft[id] || null })) {
      router.refresh();
    }
    setBusyId(null);
  }

  function statusBadge(status: string) {
    if (status === "ACTIVE") return <Badge variant="default">{t.statusActive}</Badge>;
    if (status === "SUSPENDED") return <Badge variant="outline">{t.statusSuspended}</Badge>;
    return <Badge variant="secondary">{t.statusPending}</Badge>;
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl tracking-[-0.03em] text-foreground">{t.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.desc}</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {(Object.keys(t.tabs) as TabKey[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition-colors ${
              tab === key
                ? "border-gold-200/35 bg-gold-300/20 dark:bg-gold-200/10 text-amber-700 dark:text-gold-100"
                : "border-border dark:border-white/10 bg-muted/30 dark:bg-white/[0.03] text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.tabs[key]}
          </button>
        ))}
      </div>

      {error ? <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p> : null}

      {tab === "arbitrageurs" ? (
        <Card className={cardClass}>
          <CardContent className="p-5">
            {arbitrageurs.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.arbEmpty}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[54rem] text-sm">
                  <thead>
                    <tr className="text-left text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      <th className="pb-3 pr-4">{t.colName}</th>
                      <th className="pb-3 pr-4">{t.colCode}</th>
                      <th className="pb-3 pr-4">{t.colClicks}</th>
                      <th className="pb-3 pr-4">{t.colApproved}</th>
                      <th className="pb-3 pr-4">{t.colPending}</th>
                      <th className="pb-3 pr-4">{t.colRate}</th>
                      <th className="pb-3 pr-4">{t.colStatus}</th>
                      <th className="pb-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {arbitrageurs.map((arb) => (
                      <tr key={arb.id} className="border-t border-border dark:border-white/10 align-top">
                        <td className="py-3 pr-4">
                          <p className="font-semibold text-foreground">{arb.name}</p>
                          <p className="text-xs text-muted-foreground">{arb.email}</p>
                        </td>
                        <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">{arb.referralCode}</td>
                        <td className="py-3 pr-4 text-foreground">
                          {fmt.number(arb.totalClicks)}
                          {arb.suspiciousClicks > 0 ? (
                            <span className="ml-1 text-xs text-red-600 dark:text-red-400">
                              ({fmt.number(arb.suspiciousClicks)} {t.flagged})
                            </span>
                          ) : null}
                        </td>
                        <td className="py-3 pr-4 text-foreground">{fmt.number(arb.approvedInvestors)}</td>
                        <td className="py-3 pr-4 text-foreground">{fmt.currency(arb.pendingCommission)}</td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <input
                              className={`${inputClass} w-20`}
                              defaultValue={arb.customRate != null ? String(arb.customRate) : ""}
                              placeholder={t.ratePlaceholder}
                              onChange={(event) => setRateDraft((current) => ({ ...current, [arb.id]: event.target.value }))}
                            />
                            <Button type="button" size="sm" variant="outline" disabled={busyId === arb.id} onClick={() => saveRate(arb.id)}>
                              {t.saveRate}
                            </Button>
                          </div>
                        </td>
                        <td className="py-3 pr-4">{statusBadge(arb.status)}</td>
                        <td className="py-3">
                          {arb.status === "ACTIVE" ? (
                            <Button type="button" size="sm" variant="outline" disabled={busyId === arb.id} onClick={() => arbitrageurAction(arb.id, "suspend")}>
                              {t.suspend}
                            </Button>
                          ) : (
                            <Button type="button" size="sm" disabled={busyId === arb.id} onClick={() => arbitrageurAction(arb.id, "approve")}>
                              {arb.status === "SUSPENDED" ? t.reactivate : t.approve}
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {tab === "commissions" ? (
        <Card className={cardClass}>
          <CardContent className="p-5">
            {commissions.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.commEmpty}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[52rem] text-sm">
                  <thead>
                    <tr className="text-left text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      <th className="pb-3 pr-4">{t.colDate}</th>
                      <th className="pb-3 pr-4">{t.colReferrer}</th>
                      <th className="pb-3 pr-4">{t.colInvestor}</th>
                      <th className="pb-3 pr-4">{t.colDeposit}</th>
                      <th className="pb-3 pr-4">{t.colCommission}</th>
                      <th className="pb-3 pr-4">{t.colStatus}</th>
                      <th className="pb-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {commissions.map((row) => (
                      <tr key={row.id} className="border-t border-border dark:border-white/10 align-top">
                        <td className="py-3 pr-4 text-muted-foreground">{fmt.date(new Date(row.createdAt))}</td>
                        <td className="py-3 pr-4">
                          <p className="text-foreground">{row.referrerName}</p>
                          <p className="text-xs text-muted-foreground">{row.referrerType === "arbitrageur" ? t.typeArb : t.typeInv}</p>
                        </td>
                        <td className="py-3 pr-4 text-foreground">{row.referredInvestorMasked}</td>
                        <td className="py-3 pr-4 text-foreground">{fmt.currency(row.depositAmount)}</td>
                        <td className="py-3 pr-4 font-semibold text-foreground">{fmt.currency(row.commissionAmount)}</td>
                        <td className="py-3 pr-4">
                          <Badge variant={row.status === "PAID" ? "default" : "secondary"}>
                            {row.status === "PAID" ? t.commPaid : t.commPendingStatus}
                          </Badge>
                        </td>
                        <td className="py-3">
                          {row.status === "PENDING" ? (
                            <div className="flex flex-wrap items-center gap-2">
                              <input
                                className={`${inputClass} w-44`}
                                placeholder={t.notePlaceholder}
                                onChange={(event) => setNoteDraft((current) => ({ ...current, [row.id]: event.target.value }))}
                              />
                              <Button type="button" size="sm" disabled={busyId === row.id} onClick={() => markPaid(row.id)}>
                                {t.markPaid}
                              </Button>
                            </div>
                          ) : row.note ? (
                            <span className="text-xs text-muted-foreground">{row.note}</span>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {tab === "settings" ? <SettingsTab locale={locale} program={program} /> : null}
    </main>
  );
}

function SettingsTab({ locale, program }: { locale: Locale; program: SerializedReferralProgram }) {
  const t = getStrings(locale);
  const router = useRouter();
  const [arbRate, setArbRate] = React.useState(String(program.arbitrageurRate));
  const [invRate, setInvRate] = React.useState(String(program.investorReferrerRate));
  const [minDeposit, setMinDeposit] = React.useState(String(program.minDepositForCommission));
  const [status, setStatus] = React.useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = React.useState<string | null>(null);
  const [backfillMsg, setBackfillMsg] = React.useState<string | null>(null);
  const [backfilling, setBackfilling] = React.useState(false);

  async function save() {
    setStatus("saving");
    setError(null);
    try {
      const response = await fetch("/api/admin/referrals/program", {
        method: "PATCH",
        headers: mutationHeaders(),
        body: JSON.stringify({
          arbitrageurRate: Number(arbRate),
          investorReferrerRate: Number(invRate),
          minDepositForCommission: Number(minDeposit)
        })
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.error || t.errFallback);
      setStatus("saved");
      router.refresh();
    } catch (saveError) {
      setStatus("idle");
      setError(saveError instanceof Error ? saveError.message : t.errFallback);
    }
  }

  async function backfill() {
    setBackfilling(true);
    setBackfillMsg(null);
    try {
      const response = await fetch("/api/admin/referrals/backfill-codes", { method: "POST", headers: mutationHeaders() });
      const payload = (await response.json()) as { ok: boolean; data?: { updated: number }; error?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.error || t.errFallback);
      setBackfillMsg(t.backfillDone(payload.data?.updated ?? 0));
    } catch (backfillError) {
      setBackfillMsg(backfillError instanceof Error ? backfillError.message : t.errFallback);
    } finally {
      setBackfilling(false);
    }
  }

  const labelClass = "text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground";

  return (
    <div className="grid gap-6">
      <Card className={cardClass}>
        <CardHeader>
          <CardTitle>{t.settingsTitle}</CardTitle>
          <CardDescription>{t.rateHint}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="grid gap-2">
              <span className={labelClass}>{t.arbRate}</span>
              <input className={inputClass} value={arbRate} onChange={(event) => setArbRate(event.target.value)} />
            </label>
            <label className="grid gap-2">
              <span className={labelClass}>{t.invRate}</span>
              <input className={inputClass} value={invRate} onChange={(event) => setInvRate(event.target.value)} />
            </label>
            <label className="grid gap-2">
              <span className={labelClass}>{t.minDeposit}</span>
              <input className={inputClass} value={minDeposit} onChange={(event) => setMinDeposit(event.target.value)} />
            </label>
          </div>
          {error ? <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p> : null}
          <div className="mt-5 flex items-center gap-3">
            <Button type="button" disabled={status === "saving"} onClick={save}>
              {status === "saving" ? t.saving : t.save}
            </Button>
            {status === "saved" ? <span className="text-sm text-amber-700 dark:text-gold-100">{t.saved}</span> : null}
          </div>
        </CardContent>
      </Card>

      <Card className={cardClass}>
        <CardHeader>
          <CardTitle>{t.backfillTitle}</CardTitle>
          <CardDescription>{t.backfillDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" disabled={backfilling} onClick={backfill}>
              {t.backfill}
            </Button>
            {backfillMsg ? <span className="text-sm text-muted-foreground">{backfillMsg}</span> : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

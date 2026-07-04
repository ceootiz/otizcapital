"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Copy, LogOut } from "lucide-react";
import type { ArbitrageurDashboard as ArbitrageurDashboardData } from "@otiz/database";
import { createAdminFormatters, type Locale } from "@otiz/lib";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@otiz/ui";

const STRINGS = {
  en: {
    greeting: "Referral dashboard",
    logout: "Log out",
    linkTitle: "Your referral link",
    linkDesc: "Share this link. You earn commission when a referred investor's deposit is confirmed.",
    copy: "Copy",
    copied: "Copied",
    statClicks: "Clicks",
    statApplications: "Applications",
    statApproved: "Approved investors",
    statDeposits: "Confirmed deposits",
    statSuspicious: "Flagged clicks",
    earningsTitle: "Earnings",
    accrued: "Accrued",
    paid: "Paid",
    pending: "To be paid",
    historyTitle: "Commission history",
    historyEmpty: "No commissions yet.",
    colDate: "Date",
    colInvestor: "Investor",
    colDeposit: "Deposit",
    colCommission: "Commission",
    colStatus: "Status",
    statusPending: "Pending",
    statusPaid: "Paid"
  },
  ru: {
    greeting: "Реферальный кабинет",
    logout: "Выйти",
    linkTitle: "Ваша реферальная ссылка",
    linkDesc: "Делитесь этой ссылкой. Вы получаете комиссию, когда депозит приведённого инвестора подтверждён.",
    copy: "Копировать",
    copied: "Скопировано",
    statClicks: "Переходов",
    statApplications: "Заявок",
    statApproved: "Одобренных инвесторов",
    statDeposits: "Подтверждённых депозитов",
    statSuspicious: "Подозрительных переходов",
    earningsTitle: "Начисления",
    accrued: "Начислено",
    paid: "Выплачено",
    pending: "К выплате",
    historyTitle: "История комиссий",
    historyEmpty: "Пока нет комиссий.",
    colDate: "Дата",
    colInvestor: "Инвестор",
    colDeposit: "Депозит",
    colCommission: "Комиссия",
    colStatus: "Статус",
    statusPending: "Ожидает",
    statusPaid: "Выплачено"
  }
} as const;
type Strings = typeof STRINGS.en;
const getStrings = (locale: Locale): Strings => (STRINGS as unknown as Record<string, Strings>)[locale] ?? STRINGS.en;

const cardClass = "rounded-[1.35rem] bg-card dark:bg-graphite-900/[0.72]";
const statClass = "rounded-[1.35rem] border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 p-4";

export function ArbitrageDashboard({ locale, dashboard }: { locale: Locale; dashboard: ArbitrageurDashboardData }) {
  const t = getStrings(locale);
  const router = useRouter();
  const fmt = React.useMemo(() => createAdminFormatters(locale), [locale]);
  const [copied, setCopied] = React.useState(false);

  const referralLink = React.useMemo(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/${locale}?ref=${dashboard.arbitrageur.referralCode}`;
  }, [locale, dashboard.arbitrageur.referralCode]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard can fail in insecure contexts; ignore */
    }
  }

  async function logout() {
    await fetch("/api/arbitrage/logout", { method: "POST" });
    router.replace(`/${locale}/arbitrage/login`);
    router.refresh();
  }

  const stats: Array<{ label: string; value: string; muted?: boolean }> = [
    { label: t.statClicks, value: fmt.number(dashboard.stats.totalClicks) },
    { label: t.statApplications, value: fmt.number(dashboard.stats.applications) },
    { label: t.statApproved, value: fmt.number(dashboard.stats.approvedInvestors) },
    { label: t.statDeposits, value: fmt.number(dashboard.stats.confirmedDeposits) },
    { label: t.statSuspicious, value: fmt.number(dashboard.stats.suspiciousClicks), muted: true }
  ];

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700 dark:text-gold-100">{t.greeting}</p>
          <h1 className="mt-1 font-display text-3xl tracking-[-0.03em] text-foreground md:text-4xl">{dashboard.arbitrageur.name}</h1>
        </div>
        <Button type="button" variant="outline" size="sm" className="gap-2" onClick={logout}>
          <LogOut className="size-4" />
          {t.logout}
        </Button>
      </div>

      <Card className={cardClass}>
        <CardHeader>
          <CardTitle>{t.linkTitle}</CardTitle>
          <CardDescription>{t.linkDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <code className="flex-1 break-all rounded-2xl border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 px-4 py-3 font-mono text-sm text-foreground">
              {referralLink}
            </code>
            <Button type="button" variant="outline" size="sm" className="gap-2" onClick={copyLink}>
              <Copy className="size-4" />
              {copied ? t.copied : t.copy}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.label} className={statClass}>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{stat.label}</p>
            <p className={`mt-2 text-2xl font-semibold tracking-[-0.03em] ${stat.muted ? "text-muted-foreground" : "text-foreground"}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <Card className={cardClass}>
        <CardHeader>
          <CardTitle>{t.earningsTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className={statClass}>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t.accrued}</p>
              <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground">{fmt.currency(dashboard.earnings.accrued)}</p>
            </div>
            <div className={statClass}>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t.paid}</p>
              <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground">{fmt.currency(dashboard.earnings.paid)}</p>
            </div>
            <div className={statClass}>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t.pending}</p>
              <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-amber-700 dark:text-gold-100">{fmt.currency(dashboard.earnings.pending)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={cardClass}>
        <CardHeader>
          <CardTitle>{t.historyTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          {dashboard.commissions.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.historyEmpty}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] text-sm">
                <thead>
                  <tr className="text-left text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    <th className="pb-3 pr-4">{t.colDate}</th>
                    <th className="pb-3 pr-4">{t.colInvestor}</th>
                    <th className="pb-3 pr-4">{t.colDeposit}</th>
                    <th className="pb-3 pr-4">{t.colCommission}</th>
                    <th className="pb-3">{t.colStatus}</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.commissions.map((row) => (
                    <tr key={row.id} className="border-t border-border dark:border-white/10">
                      <td className="py-3 pr-4 text-muted-foreground">{fmt.date(new Date(row.createdAt))}</td>
                      <td className="py-3 pr-4 text-foreground">{row.referredInvestorMasked}</td>
                      <td className="py-3 pr-4 text-foreground">{fmt.currency(row.depositAmount)}</td>
                      <td className="py-3 pr-4 font-semibold text-foreground">{fmt.currency(row.commissionAmount)}</td>
                      <td className="py-3">
                        <Badge variant={row.status === "PAID" ? "default" : "secondary"}>
                          {row.status === "PAID" ? t.statusPaid : t.statusPending}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

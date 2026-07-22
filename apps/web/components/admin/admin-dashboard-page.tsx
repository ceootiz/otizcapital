import Link from "next/link";
import { ArrowRight, Download } from "lucide-react";
import { createAdminFormatters, enumLabel, type Locale } from "@otiz/lib";
import type { AdminDashboardData } from "@otiz/database";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@otiz/ui";

const STRINGS = {
  en: {
    backToHome: "Back to homepage",
    eyebrow: "Business overview",
    title: "Dashboard",
    description: "Capital under management, portfolio state, and everything waiting on your attention.",
    metricTotalCapital: "Capital under management",
    metricActiveInvestors: "Active investors",
    metricPayoutsThisMonth: "Expected payouts this month",
    metricNewApplications: "New applications (7 days)",
    portfolioTitle: "Portfolio",
    portfolioDesc: "All active investors with capital, status, and last report date.",
    topTitle: "Top 5 by capital",
    colInvestor: "Investor",
    colCapital: "Capital",
    colStatus: "Status",
    colLastReport: "Last report",
    never: "—",
    noInvestors: "No active investors yet.",
    pendingTitle: "Pending actions",
    pendingDesc: "Items that need your attention.",
    pendingApplications: "Applications unanswered > 24h",
    pendingWithdrawals: "Withdrawals awaiting approval",
    pendingNoAllocation: "Investors without an allocation",
    pendingDocuments: "Documents awaiting signature",
    allClear: "All clear — nothing is waiting on you.",
    exportTitle: "Export",
    exportDesc: "Download all investor data (name, email, capital, status, total profit, last report date) as XLSX.",
    exportCta: "Export data"
  },
  ru: {
    backToHome: "На главную",
    eyebrow: "Обзор бизнеса",
    title: "Дашборд",
    description: "Капитал под управлением, состояние портфеля и всё, что ждёт вашего внимания.",
    metricTotalCapital: "Всего капитала под управлением",
    metricActiveInvestors: "Активных инвесторов",
    metricPayoutsThisMonth: "Ожидаемые выплаты в этом месяце",
    metricNewApplications: "Новых заявок за 7 дней",
    portfolioTitle: "Портфель",
    portfolioDesc: "Все активные инвесторы с капиталом, статусом и датой последнего отчёта.",
    topTitle: "Топ 5 по размеру капитала",
    colInvestor: "Инвестор",
    colCapital: "Капитал",
    colStatus: "Статус",
    colLastReport: "Последний отчёт",
    never: "—",
    noInvestors: "Пока нет активных инвесторов.",
    pendingTitle: "Требуют внимания",
    pendingDesc: "Задачи, которые ждут вашего решения.",
    pendingApplications: "Заявки без ответа > 24ч",
    pendingWithdrawals: "Выводы, ожидающие одобрения",
    pendingNoAllocation: "Инвесторы без аллокации",
    pendingDocuments: "Документы, ожидающие подписи",
    allClear: "Всё чисто — ничего не ждёт вашего внимания.",
    exportTitle: "Экспорт",
    exportDesc: "Скачайте все данные инвесторов (имя, email, капитал, статус, общая прибыль, дата последнего отчёта) в XLSX.",
    exportCta: "Экспорт данных"
  }
} as const;
type Strings = typeof STRINGS.en;
const getStrings = (locale: Locale): Strings => (STRINGS as unknown as Record<string, Strings>)[locale] ?? STRINGS.en;

export function AdminDashboardPage({ locale, data }: { locale: Locale; data: AdminDashboardData }) {
  const t = getStrings(locale);
  const f = createAdminFormatters(locale);

  const pendingItems = [
    { label: t.pendingApplications, count: data.pending.staleApplications, href: `/${locale}/admin/applications` },
    { label: t.pendingWithdrawals, count: data.pending.pendingWithdrawals, href: `/${locale}/admin/withdrawals?status=REQUESTED` },
    { label: t.pendingNoAllocation, count: data.pending.investorsWithoutAllocation, href: `/${locale}/admin/investors` },
    { label: t.pendingDocuments, count: data.pending.unsignedDocuments, href: `/${locale}/admin/investors` }
  ].filter((item) => item.count > 0);

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground micro-noise">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(212,175,95,0.14),transparent_34rem),radial-gradient(circle_at_86%_10%,rgba(255,255,255,0.07),transparent_28rem)]" />
      <div className="macro-grid absolute inset-0 opacity-45" />
      <section className="relative z-10 py-8 sm:py-10">
        <div className="container">
          <Card className="mb-6 rounded-[1.35rem] bg-card dark:bg-graphite-900/[0.78]">
            <CardContent className="p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700 dark:text-gold-100">{t.eyebrow}</p>
              <h1 className="mt-3 font-display text-4xl tracking-[-0.04em] text-foreground md:text-5xl">{t.title}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">{t.description}</p>
            </CardContent>
          </Card>

          {/* Row 1 — key metrics */}
          <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label={t.metricTotalCapital} value={f.currency(data.totalCapital)} />
            <MetricCard label={t.metricActiveInvestors} value={f.number(data.activeInvestorsCount)} />
            <MetricCard label={t.metricPayoutsThisMonth} value={f.currency(data.expectedPayoutsThisMonth)} />
            <MetricCard label={t.metricNewApplications} value={f.number(data.newApplications7d)} />
          </div>

          {/* Row 2 — portfolio */}
          <Card className="mb-6 rounded-[1.35rem] bg-card dark:bg-graphite-900/[0.72]">
            <CardHeader>
              <CardTitle>{t.portfolioTitle}</CardTitle>
              <CardDescription>{t.portfolioDesc}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5">
              {data.investors.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t.noInvestors}</p>
              ) : (
                <>
                  <div>
                    <p className="mb-3 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t.topTitle}</p>
                    <div className="flex flex-wrap gap-2">
                      {data.topInvestors.map((investor, index) => (
                        <Link
                          key={investor.id}
                          href={`/${locale}/admin/investors/${investor.id}`}
                          className="inline-flex items-center gap-2 rounded-full border border-border dark:border-white/10 bg-muted/30 dark:bg-white/[0.04] px-4 py-2 text-sm transition-colors hover:border-gold-200/35"
                        >
                          <span className="text-xs font-semibold text-amber-700 dark:text-gold-100">{index + 1}</span>
                          <span className="font-medium text-foreground">{investor.fullName}</span>
                          <span className="text-muted-foreground">{f.currency(investor.totalCapital)}</span>
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          <th className="pb-3 pr-4">{t.colInvestor}</th>
                          <th className="pb-3 pr-4 text-right">{t.colCapital}</th>
                          <th className="pb-3 pr-4">{t.colStatus}</th>
                          <th className="pb-3">{t.colLastReport}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.investors.map((investor) => (
                          <tr key={investor.id} className="border-t border-border dark:border-white/10">
                            <td className="py-3 pr-4">
                              <Link href={`/${locale}/admin/investors/${investor.id}`} className="font-medium text-foreground transition-colors hover:text-amber-700 dark:hover:text-gold-100">
                                {investor.fullName}
                              </Link>
                              <span className="ml-2 text-xs text-muted-foreground">{investor.email}</span>
                            </td>
                            <td className="py-3 pr-4 text-right font-medium text-foreground">{f.currency(investor.totalCapital)}</td>
                            <td className="py-3 pr-4"><Badge variant={investor.status === "ACTIVE" ? "default" : "secondary"}>{enumLabel("investorStatus", investor.status, locale)}</Badge></td>
                            <td className="py-3 text-muted-foreground">{investor.lastReportAt ? f.date(new Date(investor.lastReportAt)) : t.never}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Row 3 — pending actions */}
          <Card className="mb-6 rounded-[1.35rem] bg-card dark:bg-graphite-900/[0.72]">
            <CardHeader>
              <CardTitle>{t.pendingTitle}</CardTitle>
              <CardDescription>{t.pendingDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t.allClear}</p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {pendingItems.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="flex items-center justify-between gap-3 rounded-[1.35rem] border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 p-4 transition-colors hover:border-gold-200/35"
                    >
                      <span className="text-sm text-foreground">{item.label}</span>
                      <span className="inline-flex items-center gap-2">
                        <span className="rounded-full border border-gold-200/35 bg-gold-300/20 dark:bg-gold-200/10 px-3 py-0.5 text-sm font-semibold text-amber-700 dark:text-gold-100">{item.count}</span>
                        <ArrowRight className="size-4 text-muted-foreground" />
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Row 4 — export */}
          <Card className="rounded-[1.35rem] bg-card dark:bg-graphite-900/[0.72]">
            <CardHeader>
              <CardTitle>{t.exportTitle}</CardTitle>
              <CardDescription>{t.exportDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              {/* This endpoint returns a file download rather than a navigable page. */}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a
                href="/api/admin/export"
                className="inline-flex h-11 items-center gap-2 rounded-full border border-border dark:border-white/10 bg-muted/30 dark:bg-white/[0.03] px-5 text-sm font-semibold text-amber-700 dark:text-gold-100 transition-colors hover:bg-muted/50 dark:hover:bg-white/[0.08]"
              >
                <Download className="size-4" />
                {t.exportCta}
              </a>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="rounded-[1.35rem] bg-card dark:bg-graphite-900/[0.72]">
      <CardContent className="p-5">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
        <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}

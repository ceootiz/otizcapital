import Link from "next/link";
import { ArrowLeft, BarChart3, CalendarClock, CheckCircle2, FileText, PackageCheck, WalletCards } from "lucide-react";
import type { Investor } from "@prisma/client";
import { createAdminFormatters, enumLabel, type Locale } from "@otiz/lib";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Separator } from "@otiz/ui";
import type { InvestorDashboardAllocation, InvestorDashboardData, InvestorWithdrawal } from "@/lib/investor-dashboard-data";
import { ThemeToggle } from "@/components/home/theme-toggle";
import { InvestorLocaleSwitcher, InvestorLogoutButton, InvestorWithdrawalForm, ReinvestPreferenceControl } from "./investor-actions";

type InvestorPageKey = "dashboard" | "allocations" | "reports" | "withdrawals" | "reinvest";

type InvestorMonthlyReport = {
  id: string;
  month: string;
  title: string;
  summary: string;
  performanceNote: string | null;
  payoutNote: string | null;
  proofSummary: Record<string, number>;
  publishedAt: string | null;
};

const WITHDRAWAL_LOCK_DAYS = 90;

// ---------------------------------------------------------------------------
// Localized strings (EN + RU)
// ---------------------------------------------------------------------------

const INVESTOR_STRINGS = {
  en: {
    backHome: "Back to homepage",
    brand: "OTIZ INVESTOR",
    investorLabel: "Investor",
    nav: { dashboard: "Dashboard", allocations: "Allocations", reports: "Reports", withdrawals: "Withdrawals", reinvest: "Reinvest" },
    pages: {
      dashboard: { eyebrow: "Operational commerce capital", title: "Investor dashboard", description: "A calm view of active capital, commerce cycles, reporting posture, and pending payout instructions." },
      allocations: { eyebrow: "Supply cycle visibility", title: "Allocations", description: "Allocation cards show commerce supply IDs, product focus, cycle status, and latest operational update." },
      reports: { eyebrow: "Monthly reporting", title: "Reports", description: "Monthly summaries keep the focus on allocations, performance, payouts, and operational notes." },
      withdrawals: { eyebrow: "Manager-reviewed requests", title: "Withdrawals", description: "Request review and cooldown visibility with manager-controlled payout scheduling." },
      reinvest: { eyebrow: "Instruction preference", title: "Reinvest", description: "A simple preference interface for reinvest instructions, intentionally separated from real money movement." }
    },
    kpi: {
      activeCapital: "Active capital", totalInvested: "Total invested", realizedProfit: "Realized profit", expectedProfit: "Expected profit",
      totalPayouts: "Total payouts", pendingPayouts: "Pending payouts", activeAllocations: "Active allocations", completedAllocations: "Completed allocations",
      currentAverageRoi: "Current average ROI", nextExpectedPayout: "Next expected payout"
    },
    dash: {
      activeTitle: "Active allocations", activeDesc: "Current capital assigned to managed electronics procurement, logistics, and marketplace sale operations.",
      latestTitle: "Latest monthly report", latestDesc: "Published report visibility stays separate from internal audit and draft records.",
      publishedPrefix: "Published", reinvestPreference: "Reinvest preference", enabled: "Enabled", disabled: "Disabled",
      riskNote: "Risk note", riskNoteValue: "Allocation outcomes depend on operational commerce execution. No return is promised.",
      noActiveTitle: "No active allocations yet.", noActiveDesc: "Managed allocations will appear here after OTIZ assigns capital to a real commerce supply cycle.",
      noReportTitle: "No published report yet.", noReportDesc: "Published monthly reports will appear here after manager review. Draft reports remain hidden from investor access."
    },
    alloc: {
      noActiveTitle: "No active allocations yet.", noActiveDesc: "Your investor profile is active. Allocations will appear once a manager assigns capital to an electronics commerce cycle.",
      lifecycleProgress: "Lifecycle progress", invested: "Invested amount", expectedReturn: "Expected return", expectedPayout: "Expected payout",
      updated: "Updated", proofHealth: "Proof health", riskVisibility: "Risk visibility", started: "Started", latestProof: "Latest proof", latestReport: "Latest report",
      riskNote: "Risk note", underManagerReview: "Under manager review", noProofYet: "No investor-visible proof yet.", noReportYet: "No published report yet.",
      managerReviewRequired: "Manager review required.", normalMonitoring: "Normal operational monitoring."
    },
    reportsList: {
      noReportsTitle: "No published reports yet.", noReportsDesc: "Monthly reports will appear after OTIZ publishes an operational reporting summary for your investor profile.",
      published: "Published", afterManagerReview: "after manager review", summary: "Summary", performance: "Performance", payouts: "Payouts", proofCategories: "Proof categories",
      noPerformance: "No performance note published.", noPayout: "No payout note published.", noProofCats: "No available proof categories in this report."
    },
    withdraw: {
      availabilityTitle: "Withdrawal availability", availabilityDesc: "Requests are manager-reviewed and use masked payout destination metadata only.",
      available: "Available for withdrawal", pendingPayouts: "Pending payouts", scheduledNext: "Scheduled next payout",
      historyTitle: "Withdrawal history", historyDesc: "Investor-safe payout request history with masked method and destination details.",
      noRequestsTitle: "No withdrawal requests yet.", noRequestsDesc: "Manager-reviewed payout requests and paid history will appear here after a request is recorded.",
      pendingReview: "Pending review", scheduledPayouts: "Scheduled payouts", paidHistory: "Paid history",
      noPending: "No pending withdrawal requests.", noScheduled: "No scheduled payouts.", noPaid: "No paid withdrawals yet.",
      requested: "Requested", scheduled: "Scheduled", paid: "Paid", method: "Method", destination: "Destination", investorNote: "Investor note",
      noNote: "No investor-visible note.", notSet: "Not set"
    },
    reinvest: {
      approachTitle: "Reinvest approach", approachDesc: "Reinvest instructions keep completed cycle proceeds inside future commerce allocations after manager review.",
      whatChanges: "What it changes", whatChangesVal: "Eligible payouts can be rolled into future procurement cycles instead of being queued for withdrawal.",
      whatNotChanges: "What it does not change", whatNotChangesVal: "It does not guarantee allocation availability, cycle timing, or commercial outcome.",
      reviewModel: "Review model", reviewModelVal: "Manager confirmation remains required before permanent instruction changes."
    },
    common: { notScheduled: "Not scheduled", notAvailable: "Not available" }
  },
  ru: {
    backHome: "На главную",
    brand: "OTIZ INVESTOR",
    investorLabel: "Инвестор",
    nav: { dashboard: "Панель", allocations: "Аллокации", reports: "Отчёты", withdrawals: "Выводы", reinvest: "Реинвест" },
    pages: {
      dashboard: { eyebrow: "Операционный торговый капитал", title: "Панель инвестора", description: "Спокойный обзор активного капитала, торговых циклов, состояния отчётности и запланированных выплат." },
      allocations: { eyebrow: "Видимость циклов поставок", title: "Аллокации", description: "Карточки аллокаций показывают ID поставки, продукт, статус цикла и последнее операционное обновление." },
      reports: { eyebrow: "Ежемесячная отчётность", title: "Отчёты", description: "Ежемесячные сводки фокусируются на аллокациях, результатах, выплатах и операционных заметках." },
      withdrawals: { eyebrow: "Запросы с проверкой менеджером", title: "Выводы", description: "Запрос проверки и видимость периода удержания с планированием выплат под контролем менеджера." },
      reinvest: { eyebrow: "Предпочтение по инструкциям", title: "Реинвест", description: "Простой интерфейс предпочтений по реинвестированию, намеренно отделённый от реального движения средств." }
    },
    kpi: {
      activeCapital: "Активный капитал", totalInvested: "Всего инвестировано", realizedProfit: "Реализованная прибыль", expectedProfit: "Ожидаемая прибыль",
      totalPayouts: "Всего выплат", pendingPayouts: "Ожидающие выплаты", activeAllocations: "Активные аллокации", completedAllocations: "Завершённые аллокации",
      currentAverageRoi: "Текущий средний ROI", nextExpectedPayout: "Следующая ожидаемая выплата"
    },
    dash: {
      activeTitle: "Активные аллокации", activeDesc: "Текущий капитал, назначенный на управляемую закупку электроники, логистику и продажи на маркетплейсах.",
      latestTitle: "Последний ежемесячный отчёт", latestDesc: "Видимость опубликованных отчётов отделена от внутреннего аудита и черновиков.",
      publishedPrefix: "Опубликовано", reinvestPreference: "Предпочтение по реинвесту", enabled: "Включено", disabled: "Выключено",
      riskNote: "Заметка о риске", riskNoteValue: "Результаты аллокаций зависят от операционного исполнения торговли. Доходность не гарантируется.",
      noActiveTitle: "Пока нет активных аллокаций.", noActiveDesc: "Управляемые аллокации появятся здесь после того, как OTIZ назначит капитал на реальный торговый цикл поставок.",
      noReportTitle: "Пока нет опубликованных отчётов.", noReportDesc: "Опубликованные ежемесячные отчёты появятся здесь после проверки менеджером. Черновики остаются скрытыми от инвестора."
    },
    alloc: {
      noActiveTitle: "Пока нет активных аллокаций.", noActiveDesc: "Ваш профиль инвестора активен. Аллокации появятся, как только менеджер назначит капитал на торговый цикл электроники.",
      lifecycleProgress: "Прогресс цикла", invested: "Сумма инвестиций", expectedReturn: "Ожидаемый возврат", expectedPayout: "Ожидаемая выплата",
      updated: "Обновлено", proofHealth: "Состояние подтверждений", riskVisibility: "Видимость риска", started: "Начато", latestProof: "Последнее подтверждение", latestReport: "Последний отчёт",
      riskNote: "Заметка о риске", underManagerReview: "На проверке у менеджера", noProofYet: "Пока нет видимых инвестору подтверждений.", noReportYet: "Пока нет опубликованного отчёта.",
      managerReviewRequired: "Требуется проверка менеджера.", normalMonitoring: "Обычный операционный мониторинг."
    },
    reportsList: {
      noReportsTitle: "Пока нет опубликованных отчётов.", noReportsDesc: "Ежемесячные отчёты появятся после того, как OTIZ опубликует операционную сводку для вашего профиля инвестора.",
      published: "Опубликовано", afterManagerReview: "после проверки менеджером", summary: "Сводка", performance: "Результаты", payouts: "Выплаты", proofCategories: "Категории подтверждений",
      noPerformance: "Заметка о результатах не опубликована.", noPayout: "Заметка о выплатах не опубликована.", noProofCats: "В этом отчёте нет доступных категорий подтверждений."
    },
    withdraw: {
      availabilityTitle: "Доступность вывода", availabilityDesc: "Запросы проверяются менеджером и используют только маскированные метаданные назначения выплаты.",
      available: "Доступно для вывода", pendingPayouts: "Ожидающие выплаты", scheduledNext: "Запланированная следующая выплата",
      historyTitle: "История выводов", historyDesc: "Безопасная для инвестора история запросов выплат с маскированными данными метода и назначения.",
      noRequestsTitle: "Пока нет запросов на вывод.", noRequestsDesc: "Проверенные менеджером запросы выплат и история появятся здесь после создания запроса.",
      pendingReview: "На рассмотрении", scheduledPayouts: "Запланированные выплаты", paidHistory: "История выплат",
      noPending: "Нет ожидающих запросов на вывод.", noScheduled: "Нет запланированных выплат.", noPaid: "Пока нет выплаченных выводов.",
      requested: "Запрошено", scheduled: "Запланировано", paid: "Выплачено", method: "Метод", destination: "Назначение", investorNote: "Заметка инвестора",
      noNote: "Нет видимой инвестору заметки.", notSet: "Не указано"
    },
    reinvest: {
      approachTitle: "Подход к реинвестированию", approachDesc: "Инструкции по реинвесту оставляют доход завершённых циклов в будущих торговых аллокациях после проверки менеджером.",
      whatChanges: "Что это меняет", whatChangesVal: "Подходящие выплаты могут быть направлены в будущие циклы закупок вместо постановки в очередь на вывод.",
      whatNotChanges: "Что это не меняет", whatNotChangesVal: "Это не гарантирует доступность аллокаций, сроки цикла или коммерческий результат.",
      reviewModel: "Модель проверки", reviewModelVal: "Подтверждение менеджера по-прежнему требуется до постоянного изменения инструкций."
    },
    common: { notScheduled: "Не запланировано", notAvailable: "Недоступно" }
  }
} as const;

type InvestorStrings = typeof INVESTOR_STRINGS.en;

export function getInvestorStrings(locale: Locale): InvestorStrings {
  return (INVESTOR_STRINGS as unknown as Record<string, InvestorStrings>)[locale] ?? INVESTOR_STRINGS.en;
}

function makeFormatters(locale: Locale, t: InvestorStrings) {
  const fmt = createAdminFormatters(locale);
  return {
    money: (value: number) => fmt.currency(value),
    date: (value: string | null) => {
      if (!value) return t.common.notScheduled;
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? t.common.notScheduled : fmt.date(date);
    },
    percent: (value: number | null) =>
      value === null ? t.common.notAvailable : `${fmt.number(value, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`,
    number: (value: number) => fmt.number(value)
  };
}

function statusTone(status: string) {
  if (status === "completed" || status === "ACTIVE") return "default";
  return "secondary";
}

export function InvestorShell({
  locale,
  investor,
  active,
  eyebrow,
  title,
  description,
  children
}: {
  locale: Locale;
  investor: Investor;
  active: InvestorPageKey;
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const t = getInvestorStrings(locale);

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground micro-noise">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(212,175,95,0.13),transparent_34rem),radial-gradient(circle_at_88%_6%,rgba(255,255,255,0.07),transparent_30rem)]" />
      <div className="macro-grid absolute inset-0 opacity-45" />
      <section className="relative z-10 py-8 sm:py-10">
        <div className="container">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Link href={`/${locale}`} className="inline-flex items-center gap-3 text-sm text-muted-foreground transition-colors hover:text-foreground">
              <ArrowLeft className="size-4" />
              {t.backHome}
            </Link>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold tracking-[0.24em] text-foreground">{t.brand}</span>
              <InvestorLocaleSwitcher locale={locale} />
              <ThemeToggle />
              <InvestorLogoutButton locale={locale} />
            </div>
          </div>

          <Card className="mb-6 rounded-[2rem] bg-graphite-900/[0.72]">
            <CardContent className="grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-100">{eyebrow}</p>
                <h1 className="mt-3 max-w-3xl font-display text-4xl tracking-[-0.04em] text-foreground md:text-5xl">{title}</h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">{description}</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t.investorLabel}</p>
                <p className="mt-2 font-semibold text-foreground">{investor.fullName}</p>
                <p className="mt-1 text-sm text-muted-foreground">{investor.email}</p>
                <Badge className="mt-3" variant={statusTone(investor.status)}>{enumLabel("investorStatus", investor.status, locale)}</Badge>
              </div>
            </CardContent>
          </Card>

          <div className="mb-6 flex gap-2 overflow-x-auto rounded-[1.5rem] border border-white/10 bg-black/20 p-2">
            {(Object.keys(t.nav) as InvestorPageKey[]).map((key) => {
              const isActive = key === active;

              return (
                <Link
                  key={key}
                  href={`/${locale}/investor/${key}`}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors ${isActive ? "bg-gold-200/15 text-gold-100" : "text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"}`}
                >
                  {t.nav[key]}
                </Link>
              );
            })}
          </div>

          {children}
        </div>
      </section>
    </main>
  );
}

export function InvestorDashboardHome({ locale, data }: { locale: Locale; data: InvestorDashboardData }) {
  const t = getInvestorStrings(locale);
  const f = makeFormatters(locale, t);

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <KpiCard icon={<WalletCards className="size-5" />} label={t.kpi.activeCapital} value={f.money(data.summary.activeCapital)} />
        <KpiCard icon={<BarChart3 className="size-5" />} label={t.kpi.totalInvested} value={f.money(data.summary.totalInvested)} />
        <KpiCard icon={<CheckCircle2 className="size-5" />} label={t.kpi.realizedProfit} value={f.money(data.summary.realizedProfit)} />
        <KpiCard icon={<CalendarClock className="size-5" />} label={t.kpi.expectedProfit} value={f.money(data.summary.expectedProfit)} />
        <KpiCard icon={<WalletCards className="size-5" />} label={t.kpi.totalPayouts} value={f.money(data.summary.totalPayouts)} />
        <KpiCard icon={<CalendarClock className="size-5" />} label={t.kpi.pendingPayouts} value={f.money(data.summary.pendingPayouts)} />
        <KpiCard icon={<PackageCheck className="size-5" />} label={t.kpi.activeAllocations} value={f.number(data.summary.activeAllocationsCount)} />
        <KpiCard icon={<CheckCircle2 className="size-5" />} label={t.kpi.completedAllocations} value={f.number(data.summary.completedAllocationsCount)} />
        <KpiCard icon={<BarChart3 className="size-5" />} label={t.kpi.currentAverageRoi} value={f.percent(data.summary.currentAverageRoi)} />
        <KpiCard icon={<FileText className="size-5" />} label={t.kpi.nextExpectedPayout} value={f.date(data.summary.nextExpectedPayoutDate)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-[2rem] bg-graphite-900/[0.72]">
          <CardHeader>
            <CardTitle>{t.dash.activeTitle}</CardTitle>
            <CardDescription>{t.dash.activeDesc}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {data.activeAllocations.length === 0 ? (
              <InvestorEmptyState title={t.dash.noActiveTitle} description={t.dash.noActiveDesc} />
            ) : (
              data.activeAllocations.slice(0, 2).map((allocation) => <AllocationCard key={allocation.id} locale={locale} allocation={allocation} compact />)
            )}
          </CardContent>
        </Card>
        <Card className="rounded-[2rem] bg-graphite-900/[0.72]">
          <CardHeader>
            <CardTitle>{t.dash.latestTitle}</CardTitle>
            <CardDescription>{t.dash.latestDesc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.latestPublishedMonthlyReport ? (
              <Link href={`/${locale}/investor/reports/${data.latestPublishedMonthlyReport.id}`} className="block rounded-[1.5rem] border border-white/10 bg-black/20 p-4 transition-colors hover:border-gold-200/30">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{data.latestPublishedMonthlyReport.month}</p>
                <p className="mt-2 font-semibold text-foreground">{data.latestPublishedMonthlyReport.title}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{data.latestPublishedMonthlyReport.summary}</p>
                <p className="mt-3 text-xs text-gold-100">{t.dash.publishedPrefix} {f.date(data.latestPublishedMonthlyReport.publishedAt)}</p>
              </Link>
            ) : (
              <InvestorEmptyState title={t.dash.noReportTitle} description={t.dash.noReportDesc} />
            )}
            <ProofLine label={t.dash.reinvestPreference} value={data.summary.reinvestEnabled ? t.dash.enabled : t.dash.disabled} />
            <ProofLine label={t.dash.riskNote} value={t.dash.riskNoteValue} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function InvestorAllocationsPage({ locale, data }: { locale: Locale; data: InvestorDashboardData }) {
  const t = getInvestorStrings(locale);

  return (
    <div className="grid gap-4">
      {data.activeAllocations.length === 0 ? (
        <InvestorEmptyState title={t.alloc.noActiveTitle} description={t.alloc.noActiveDesc} />
      ) : (
        data.activeAllocations.map((allocation) => <AllocationCard key={allocation.id} locale={locale} allocation={allocation} />)
      )}
    </div>
  );
}

export function InvestorReportsPage({ locale, reports }: { locale: Locale; reports: InvestorMonthlyReport[] }) {
  const t = getInvestorStrings(locale);
  const f = makeFormatters(locale, t);

  return (
    <div className="grid gap-4">
      {reports.length === 0 ? (
        <InvestorEmptyState title={t.reportsList.noReportsTitle} description={t.reportsList.noReportsDesc} />
      ) : reports.map((report) => (
        <Link key={report.id} href={`/${locale}/investor/reports/${report.id}`} className="block">
          <Card className="rounded-[2rem] bg-graphite-900/[0.72] transition-colors hover:border-gold-200/30">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>{report.title}</CardTitle>
                  <CardDescription>{report.month} · {t.reportsList.published} {report.publishedAt ? f.date(report.publishedAt) : t.reportsList.afterManagerReview}</CardDescription>
                </div>
                <Badge variant="secondary">{t.reportsList.published}</Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <ProofLine label={t.reportsList.summary} value={report.summary} />
              <ProofLine label={t.reportsList.performance} value={report.performanceNote || t.reportsList.noPerformance} />
              <ProofLine label={t.reportsList.payouts} value={report.payoutNote || t.reportsList.noPayout} />
              <ProofLine label={t.reportsList.proofCategories} value={Object.keys(report.proofSummary).length ? Object.entries(report.proofSummary).map(([type, count]) => `${enumLabel("proofType", type, locale)}: ${count}`).join(", ") : t.reportsList.noProofCats} />
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

export function InvestorWithdrawalsPage({
  locale,
  allocations,
  withdrawals,
  summary
}: {
  locale: Locale;
  allocations: InvestorDashboardAllocation[];
  withdrawals: InvestorWithdrawal[];
  summary: InvestorDashboardData["summary"];
}) {
  const t = getInvestorStrings(locale);
  const f = makeFormatters(locale, t);

  const pending = withdrawals.filter((withdrawal) => ["REQUESTED", "APPROVED"].includes(withdrawal.status));
  const scheduled = withdrawals.filter((withdrawal) => withdrawal.status === "SCHEDULED");
  const paid = withdrawals.filter((withdrawal) => withdrawal.status === "PAID");

  const available = Math.max(0, summary.realizedProfit - summary.totalPayouts - summary.pendingPayouts);

  // 90-day lock: withdrawals unlock 90 days after the earliest allocation start.
  const startedTimes = allocations
    .map((allocation) => allocation.startedAt)
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value).getTime())
    .filter((time) => Number.isFinite(time));
  const earliestStart = startedTimes.length ? Math.min(...startedTimes) : null;
  const unlockTime = earliestStart !== null ? earliestStart + WITHDRAWAL_LOCK_DAYS * 24 * 60 * 60 * 1000 : null;
  const locked = unlockTime === null ? true : Date.now() < unlockTime;
  const unlockDate = unlockTime !== null ? new Date(unlockTime).toISOString() : null;

  return (
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <Card className="rounded-[2rem] bg-graphite-900/[0.72]">
        <CardHeader>
          <CardTitle>{t.withdraw.availabilityTitle}</CardTitle>
          <CardDescription>{t.withdraw.availabilityDesc}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <ProofLine label={t.withdraw.available} value={f.money(available)} />
          <ProofLine label={t.withdraw.pendingPayouts} value={f.money(summary.pendingPayouts)} />
          <ProofLine label={t.withdraw.scheduledNext} value={f.date(summary.nextExpectedPayoutDate)} />
          <InvestorWithdrawalForm locale={locale} availableAmount={available} locked={locked} unlockDate={unlockDate} />
        </CardContent>
      </Card>
      <Card className="rounded-[2rem] bg-graphite-900/[0.72]">
        <CardHeader>
          <CardTitle>{t.withdraw.historyTitle}</CardTitle>
          <CardDescription>{t.withdraw.historyDesc}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {withdrawals.length === 0 ? (
            <InvestorEmptyState title={t.withdraw.noRequestsTitle} description={t.withdraw.noRequestsDesc} />
          ) : (
            <>
              <WithdrawalGroup locale={locale} title={t.withdraw.pendingReview} withdrawals={pending} emptyText={t.withdraw.noPending} />
              <WithdrawalGroup locale={locale} title={t.withdraw.scheduledPayouts} withdrawals={scheduled} emptyText={t.withdraw.noScheduled} />
              <WithdrawalGroup locale={locale} title={t.withdraw.paidHistory} withdrawals={paid} emptyText={t.withdraw.noPaid} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function InvestorReinvestPage({ locale, enabled }: { locale: Locale; enabled: boolean }) {
  const t = getInvestorStrings(locale);

  return (
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <ReinvestPreferenceControl locale={locale} initialEnabled={enabled} />
      <Card className="rounded-[2rem] bg-graphite-900/[0.72]">
        <CardHeader>
          <CardTitle>{t.reinvest.approachTitle}</CardTitle>
          <CardDescription>{t.reinvest.approachDesc}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <ProofLine label={t.reinvest.whatChanges} value={t.reinvest.whatChangesVal} />
          <ProofLine label={t.reinvest.whatNotChanges} value={t.reinvest.whatNotChangesVal} />
          <ProofLine label={t.reinvest.reviewModel} value={t.reinvest.reviewModelVal} />
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="rounded-[1.5rem] bg-graphite-900/[0.72]">
      <CardContent className="p-5">
        <div className="mb-5 flex size-10 items-center justify-center rounded-full border border-gold-200/20 bg-gold-200/10 text-gold-100">{icon}</div>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
        <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}

function AllocationCard({ locale, allocation, compact = false }: { locale: Locale; allocation: InvestorDashboardAllocation; compact?: boolean }) {
  const t = getInvestorStrings(locale);
  const f = makeFormatters(locale, t);

  return (
    <Link href={`/${locale}/investor/allocations/${allocation.id}`}>
    <Card className="rounded-[1.5rem] bg-white/[0.035] transition-colors hover:bg-white/[0.055]">
      <CardContent className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{allocation.supplyId}</p>
            <h3 className="mt-2 text-lg font-semibold text-foreground">{allocation.product}</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>{enumLabel("allocationStatus", allocation.currentStage, locale)}</Badge>
            <Badge variant="secondary">{enumLabel("riskLevel", allocation.riskLevel, locale)}</Badge>
          </div>
        </div>
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>{t.alloc.lifecycleProgress}</span>
            <span>{allocation.progressPercent}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gold-200/70" style={{ width: `${allocation.progressPercent}%` }} />
          </div>
        </div>
        <div className={`mt-5 grid gap-3 ${compact ? "sm:grid-cols-2" : "md:grid-cols-4"}`}>
          <ProofLine label={t.alloc.invested} value={f.money(allocation.investedAmount)} />
          <ProofLine label={t.alloc.expectedReturn} value={allocation.expectedReturnNote} />
          <ProofLine label={t.alloc.expectedPayout} value={f.date(allocation.expectedPayoutAt)} />
          <ProofLine label={t.alloc.updated} value={f.date(allocation.updatedAt)} />
          <ProofLine label={t.alloc.proofHealth} value={allocation.proofHealth ? `${allocation.proofHealth.state} · ${allocation.proofHealth.score}%` : t.alloc.underManagerReview} />
          <ProofLine label={t.alloc.riskVisibility} value={allocation.riskHealth ? `${allocation.riskHealth.level} · ${allocation.riskHealth.score}/100` : t.alloc.underManagerReview} />
          {!compact ? <ProofLine label={t.alloc.started} value={f.date(allocation.startedAt)} /> : null}
          {!compact ? <ProofLine label={t.alloc.latestProof} value={allocation.latestProofReference ? `${enumLabel("proofType", allocation.latestProofReference.type, locale)}: ${allocation.latestProofReference.title}` : t.alloc.noProofYet} /> : null}
          {!compact ? <ProofLine label={t.alloc.latestReport} value={allocation.latestReportReference ? allocation.latestReportReference.title : t.alloc.noReportYet} /> : null}
          {!compact ? <ProofLine label={t.alloc.riskNote} value={allocation.riskHealth?.summary || (allocation.riskLevel === "elevated" ? t.alloc.managerReviewRequired : t.alloc.normalMonitoring)} /> : null}
        </div>
      </CardContent>
    </Card>
    </Link>
  );
}

function InvestorEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <Card className="rounded-[1.5rem] bg-white/[0.035]">
      <CardContent className="p-8 text-center">
        <PackageCheck className="mx-auto size-9 text-gold-100" />
        <p className="mt-4 font-semibold text-foreground">{title}</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function WithdrawalGroup({ locale, title, withdrawals, emptyText }: { locale: Locale; title: string; withdrawals: InvestorWithdrawal[]; emptyText: string }) {
  const t = getInvestorStrings(locale);
  const f = makeFormatters(locale, t);

  return (
    <div className="grid gap-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{title}</p>
      {withdrawals.length === 0 ? (
        <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4 text-sm text-muted-foreground">{emptyText}</div>
      ) : withdrawals.map((withdrawal) => (
        <div key={withdrawal.id} className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-lg font-semibold text-foreground">{withdrawal.currency} {f.number(Number(withdrawal.amount || 0))}</p>
            <Badge variant="secondary">{enumLabel("withdrawalStatus", withdrawal.status, locale)}</Badge>
          </div>
          <Separator className="my-4" />
          <div className="grid gap-3 sm:grid-cols-2">
            <ProofLine label={t.withdraw.requested} value={f.date(withdrawal.requestedAt)} />
            <ProofLine label={t.withdraw.scheduled} value={f.date(withdrawal.scheduledFor)} />
            <ProofLine label={t.withdraw.paid} value={f.date(withdrawal.paidAt)} />
            <ProofLine label={t.withdraw.method} value={withdrawal.method || t.withdraw.notSet} />
            <ProofLine label={t.withdraw.destination} value={withdrawal.destinationMasked || t.withdraw.notSet} />
            <ProofLine label={t.withdraw.investorNote} value={withdrawal.investorNote || withdrawal.rejectionReason || t.withdraw.noNote} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ProofLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm leading-6 text-foreground">{value}</p>
    </div>
  );
}

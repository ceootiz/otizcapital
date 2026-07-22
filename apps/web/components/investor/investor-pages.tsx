import Link from "next/link";
import { ArrowLeft, ArrowRight, BarChart3, CalendarClock, CheckCircle2, Download, FileSpreadsheet, FileText, PackageCheck, WalletCards } from "lucide-react";
import type { Investor } from "@prisma/client";
import { ActiveInvestorCount } from "./active-investor-count";

// Anonymized active-investor count label (single string; kept inline rather than
// threaded through the large INVESTOR_STRINGS dict).
const ACTIVE_INVESTORS_LABEL: Record<string, string> = {
  en: "Active investors on the platform:",
  ru: "Активных инвесторов на платформе:",
  es: "Inversores activos en la plataforma:",
  de: "Aktive Investoren auf der Plattform:",
  zh: "平台活跃投资者："
};

// Effective annual yield-rate line (single strings kept inline). {rate} is the
// numeric percent; the personal tag shows when the investor has a promo override.
const YIELD_RATE_LABEL: Record<string, string> = {
  en: "Your annual yield rate:",
  ru: "Ваша годовая ставка доходности:",
  es: "Su tasa de rendimiento anual:",
  de: "Ihr jährlicher Renditesatz:",
  zh: "您的年化收益率："
};
const YIELD_RATE_PERSONAL_TAG: Record<string, string> = {
  en: "personal rate",
  ru: "персональная ставка",
  es: "tasa personal",
  de: "persönlicher Satz",
  zh: "专属费率"
};
import { createAdminFormatters, enumLabel, type Locale } from "@otiz/lib";
import type { SerializedDepositAddress } from "@otiz/database";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Separator } from "@otiz/ui";
import type { InvestorDashboardAllocation, InvestorDashboardData, InvestorWithdrawal } from "@/lib/investor-dashboard-data";
import { ThemeToggle } from "@/components/home/theme-toggle";
import { InvestorDepositAddresses, InvestorLocaleSwitcher, InvestorLogoutButton, InvestorNotificationBell, InvestorWithdrawalForm, ReinvestPreferenceControl } from "./investor-actions";
import { ContactManagerButton } from "./contact-manager-button";
import { DepositClaimForm } from "./deposit-claim-form";

type InvestorPageKey = "dashboard" | "deposit" | "allocations" | "reports" | "documents" | "history" | "withdrawals" | "reinvest" | "settings";

export type InvestorPaymentView = {
  id: string;
  month: string;
  period: string | null;
  profit: number;
  payout: number;
  reinvested: number;
  roiPercent: number | null;
};

export type InvestorFileReportView = {
  id: string;
  fileName: string;
  month: string;
  uploadedAt: string;
};

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
    nav: { dashboard: "Dashboard", deposit: "Deposit", allocations: "Allocations", reports: "Reports", documents: "Documents", history: "History", withdrawals: "Withdrawals", reinvest: "Reinvest", settings: "Settings" },
    pages: {
      dashboard: { eyebrow: "Operational commerce capital", title: "Investor dashboard", description: "A calm view of active capital, commerce cycles, reporting posture, and pending payout instructions." },
      deposit: { eyebrow: "Account funding", title: "Deposit", description: "Send funds to the address below and notify your manager." },
      allocations: { eyebrow: "Supply cycle visibility", title: "Allocations", description: "Allocation cards show commerce supply IDs, product focus, cycle status, and latest operational update." },
      reports: { eyebrow: "Monthly reporting", title: "Reports", description: "Monthly summaries keep the focus on allocations, performance, payouts, and operational notes." },
      documents: { eyebrow: "Agreements & signatures", title: "Documents", description: "Review and sign your onboarding agreement and other documents prepared by your manager." },
      history: { eyebrow: "Extracted from monthly reports", title: "Payment history", description: "Structured month-by-month figures extracted from the report files published by your manager." },
      withdrawals: { eyebrow: "Manager-reviewed requests", title: "Withdrawals", description: "Request review and cooldown visibility with manager-controlled payout scheduling." },
      reinvest: { eyebrow: "Instruction preference", title: "Reinvest", description: "A simple preference interface for reinvest instructions, intentionally separated from real money movement." },
      settings: { eyebrow: "Account settings", title: "Settings", description: "Manage your security, language, notification preferences, and account data." }
    },
    kpi: {
      totalBalance: "Balance", availableBalance: "Awaiting allocation", workingCapital: "Working capital", retainedProfit: "Retained profit",
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
    deposit: {
      instructionTitle: "How to deposit",
      instruction: "Send funds to the address below. After the transfer, notify your manager.",
      emptyTitle: "No deposit addresses available yet.",
      emptyDesc: "Deposit addresses will appear here once a manager publishes them. Please contact your manager for funding instructions."
    },
    files: {
      title: "Report files", desc: "Downloadable report files published by your manager.",
      emptyTitle: "Reports will appear here once published by your manager.", download: "Download", uploaded: "Uploaded"
    },
    welcome: {
      title: "Welcome", subtitle: "Your account is active. As soon as a manager assigns an allocation, it will appear here.",
      depositTitle: "Fund your account", depositDesc: "Send funds to a deposit address, then notify your manager.",
      timelineTitle: "How it works",
      steps: { deposit: "Deposit", allocation: "Allocation", reporting: "Reporting", payout: "Payout" }
    },
    timeline: {
      title: "Request status",
      hint: "Typical review time: 3–5 business days.",
      steps: { received: "Request received", review: "Under review", approved: "Approved", scheduled: "Payout scheduled", paid: "Paid" }
    },
    moneyWork: { active: "Active", daysWorking: (days: number) => `${days} ${days === 1 ? "day" : "days"} at work` },
    howItWorks: {
      title: "How it works",
      steps: [
        { name: "Deposit", desc: "You send a deposit to the provided crypto address" },
        { name: "Allocation", desc: "Your manager places the capital into a trading cycle" },
        { name: "Trading", desc: "Capital works in real merchandise deals" },
        { name: "Reporting", desc: "A monthly report with the cycle results" },
        { name: "Payout or reinvest", desc: "Profit is paid out or reinvested — your choice" }
      ]
    },
    payoutHint: "The date is estimated from the allocation start date plus the ~45-day trading cycle. The actual date may differ depending on the operational cycle.",
    history: {
      totalsProfit: "Total profit", totalsPayout: "Total payouts", totalsReinvested: "Total reinvested",
      colMonth: "Month", colProfit: "Profit", colPayout: "Payout", colReinvested: "Reinvested", colRoi: "ROI %",
      emptyTitle: "Payment history will appear after your manager uploads reports.",
      emptyDesc: "Each uploaded monthly report file adds its figures here automatically."
    },
    common: { notScheduled: "Not scheduled", notAvailable: "Not available" }
  },
  ru: {
    backHome: "На главную",
    brand: "OTIZ INVESTOR",
    investorLabel: "Инвестор",
    nav: { dashboard: "Панель", deposit: "Пополнение", allocations: "Аллокации", reports: "Отчёты", documents: "Документы", history: "История", withdrawals: "Выводы", reinvest: "Реинвест", settings: "Настройки" },
    pages: {
      dashboard: { eyebrow: "Операционный торговый капитал", title: "Панель инвестора", description: "Спокойный обзор активного капитала, торговых циклов, состояния отчётности и запланированных выплат." },
      deposit: { eyebrow: "Пополнение счёта", title: "Пополнение", description: "Отправьте средства на указанный адрес и уведомите менеджера." },
      allocations: { eyebrow: "Видимость циклов поставок", title: "Аллокации", description: "Карточки аллокаций показывают ID поставки, продукт, статус цикла и последнее операционное обновление." },
      reports: { eyebrow: "Ежемесячная отчётность", title: "Отчёты", description: "Ежемесячные сводки фокусируются на аллокациях, результатах, выплатах и операционных заметках." },
      documents: { eyebrow: "Соглашения и подписи", title: "Документы", description: "Ознакомьтесь и подпишите инвестиционное соглашение и другие документы, подготовленные менеджером." },
      history: { eyebrow: "Извлечено из ежемесячных отчётов", title: "История платежей", description: "Структурированные помесячные показатели, извлечённые из файлов отчётов, опубликованных менеджером." },
      withdrawals: { eyebrow: "Запросы с проверкой менеджером", title: "Выводы", description: "Запрос проверки и видимость периода удержания с планированием выплат под контролем менеджера." },
      reinvest: { eyebrow: "Предпочтение по инструкциям", title: "Реинвест", description: "Простой интерфейс предпочтений по реинвестированию, намеренно отделённый от реального движения средств." },
      settings: { eyebrow: "Настройки аккаунта", title: "Настройки", description: "Управляйте безопасностью, языком, настройками уведомлений и данными аккаунта." }
    },
    kpi: {
      totalBalance: "Баланс", availableBalance: "Ожидает аллокации", workingCapital: "В работе", retainedProfit: "Оставленная прибыль",
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
    deposit: {
      instructionTitle: "Как пополнить",
      instruction: "Отправьте средства на указанный адрес. После перевода уведомите менеджера.",
      emptyTitle: "Пока нет доступных адресов для пополнения.",
      emptyDesc: "Адреса для пополнения появятся здесь после того, как менеджер их опубликует. Пожалуйста, свяжитесь с менеджером для получения инструкций."
    },
    files: {
      title: "Файлы отчётов", desc: "Файлы отчётов, опубликованные вашим менеджером, доступны для скачивания.",
      emptyTitle: "Отчёты появятся здесь после их публикации менеджером.", download: "Скачать", uploaded: "Загружено"
    },
    welcome: {
      title: "Добро пожаловать", subtitle: "Ваш аккаунт активен. Как только менеджер назначит аллокацию, она появится здесь.",
      depositTitle: "Пополните аккаунт", depositDesc: "Отправьте средства на адрес для пополнения и уведомите менеджера.",
      timelineTitle: "Как это работает",
      steps: { deposit: "Пополнение", allocation: "Аллокация", reporting: "Отчётность", payout: "Выплата" }
    },
    timeline: {
      title: "Статус запроса",
      hint: "Обычный срок рассмотрения: 3–5 рабочих дней.",
      steps: { received: "Запрос получен", review: "На рассмотрении", approved: "Одобрено", scheduled: "Выплата запланирована", paid: "Выплачено" }
    },
    moneyWork: { active: "Активна", daysWorking: (days: number) => `${days} ${pluralizeDaysRu(days)} в работе` },
    howItWorks: {
      title: "Как это работает",
      steps: [
        { name: "Пополнение", desc: "Вы отправляете депозит на указанный крипто-адрес" },
        { name: "Аллокация", desc: "Менеджер размещает капитал в торговый цикл" },
        { name: "Торговля", desc: "Капитал работает в реальных товарных сделках" },
        { name: "Отчётность", desc: "Ежемесячный отчёт с результатами цикла" },
        { name: "Выплата или реинвест", desc: "Прибыль выплачивается или реинвестируется по вашему выбору" }
      ]
    },
    payoutHint: "Дата рассчитана на основе даты начала аллокации + 45 дней торгового цикла. Фактическая дата может отличаться в зависимости от операционного цикла.",
    history: {
      totalsProfit: "Общая прибыль", totalsPayout: "Всего выплат", totalsReinvested: "Всего реинвестировано",
      colMonth: "Месяц", colProfit: "Прибыль", colPayout: "Выплата", colReinvested: "Реинвестировано", colRoi: "ROI %",
      emptyTitle: "История платежей появится после загрузки отчётов менеджером.",
      emptyDesc: "Каждый загруженный файл ежемесячного отчёта автоматически добавляет сюда свои показатели."
    },
    common: { notScheduled: "Не запланировано", notAvailable: "Недоступно" }
  }
} as const;

// Russian day pluralization for the "N дней в работе" money-is-working line.
function pluralizeDaysRu(days: number) {
  const mod100 = days % 100;
  const mod10 = days % 10;
  if (mod100 >= 11 && mod100 <= 14) return "дней";
  if (mod10 === 1) return "день";
  if (mod10 >= 2 && mod10 <= 4) return "дня";
  return "дней";
}

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
  contactContext,
  children
}: {
  locale: Locale;
  investor: Investor;
  active: InvestorPageKey;
  eyebrow: string;
  title: string;
  description: string;
  contactContext?: string;
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
              <ContactManagerButton locale={locale} context={contactContext} />
              <InvestorLocaleSwitcher locale={locale} />
              <InvestorNotificationBell locale={locale} />
              <ThemeToggle />
              <InvestorLogoutButton locale={locale} />
            </div>
          </div>

          <Card className="mb-6 rounded-[1.35rem] bg-card dark:bg-graphite-900/[0.72]">
            <CardContent className="grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700 dark:text-gold-100">{eyebrow}</p>
                <h1 className="mt-3 max-w-3xl font-display text-4xl tracking-[-0.04em] text-foreground md:text-5xl">{title}</h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">{description}</p>
              </div>
              <div className="rounded-[1.35rem] border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t.investorLabel}</p>
                <p className="mt-2 font-semibold text-foreground">{investor.fullName}</p>
                <p className="mt-1 text-sm text-muted-foreground">{investor.email}</p>
                <Badge className="mt-3" variant={statusTone(investor.status)}>{enumLabel("investorStatus", investor.status, locale)}</Badge>
              </div>
            </CardContent>
          </Card>

          <div className="mb-6 flex gap-2 overflow-x-auto rounded-[1.35rem] border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 p-2">
            {(Object.keys(t.nav) as InvestorPageKey[]).map((key) => {
              const isActive = key === active;

              return (
                <Link
                  key={key}
                  href={`/${locale}/investor/${key}`}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors ${isActive ? "bg-gold-300/25 dark:bg-gold-200/15 text-amber-700 dark:text-gold-100" : "text-muted-foreground hover:bg-muted/40 dark:hover:bg-white/[0.06] hover:text-foreground"}`}
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

export function InvestorDashboardHome({
  locale,
  data,
  investorName = "",
  depositAddresses = [],
  annualRatePercent,
  hasCustomRate = false
}: {
  locale: Locale;
  data: InvestorDashboardData;
  investorName?: string;
  depositAddresses?: SerializedDepositAddress[];
  annualRatePercent?: number;
  hasCustomRate?: boolean;
}) {
  const t = getInvestorStrings(locale);
  const f = makeFormatters(locale, t);

  // A zero money-metric is only meaningful ("$0") once the investor has some
  // allocation/withdrawal history; before that we render "—" to avoid a wall of
  // hollow "$0"s. Allocation counters always show their real number.
  const moneyMetric = (value: number) => (value === 0 && !data.summary.hasHistory ? "—" : f.money(value));

  const balanceCards = (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard icon={<WalletCards className="size-5" />} label={t.kpi.totalBalance} value={moneyMetric(data.summary.totalBalance)} />
      <KpiCard icon={<CheckCircle2 className="size-5" />} label={t.kpi.availableBalance} value={moneyMetric(data.summary.awaitingAllocation)} />
      <KpiCard icon={<BarChart3 className="size-5" />} label={t.kpi.workingCapital} value={moneyMetric(data.summary.workingCapital)} />
      <KpiCard icon={<CalendarClock className="size-5" />} label={t.kpi.retainedProfit} value={moneyMetric(data.summary.retainedProfit)} />
    </div>
  );

  // Zero-allocation onboarding view: no capital assigned yet.
  if (data.summary.activeAllocationsCount === 0 && data.summary.completedAllocationsCount === 0) {
    return (
      <div className="grid gap-6">
        {balanceCards}
        <InvestorWelcome locale={locale} name={investorName} addresses={depositAddresses} />
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {balanceCards}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <KpiCard icon={<WalletCards className="size-5" />} label={t.kpi.activeCapital} value={moneyMetric(data.summary.activeCapital)} />
        <KpiCard icon={<BarChart3 className="size-5" />} label={t.kpi.totalInvested} value={moneyMetric(data.summary.totalInvested)} />
        <KpiCard icon={<CheckCircle2 className="size-5" />} label={t.kpi.realizedProfit} value={moneyMetric(data.summary.realizedProfit)} />
        <KpiCard icon={<CalendarClock className="size-5" />} label={t.kpi.expectedProfit} value={moneyMetric(data.summary.expectedProfit)} />
        <KpiCard icon={<WalletCards className="size-5" />} label={t.kpi.totalPayouts} value={moneyMetric(data.summary.totalPayouts)} />
        <KpiCard icon={<CalendarClock className="size-5" />} label={t.kpi.pendingPayouts} value={moneyMetric(data.summary.pendingPayouts)} />
        <KpiCard icon={<PackageCheck className="size-5" />} label={t.kpi.activeAllocations} value={f.number(data.summary.activeAllocationsCount)} />
        <KpiCard icon={<CheckCircle2 className="size-5" />} label={t.kpi.completedAllocations} value={f.number(data.summary.completedAllocationsCount)} />
        <KpiCard icon={<BarChart3 className="size-5" />} label={t.kpi.currentAverageRoi} value={f.percent(data.summary.currentAverageRoi)} />
        <KpiCard icon={<FileText className="size-5" />} label={t.kpi.nextExpectedPayout} value={f.date(data.summary.nextExpectedPayoutDate)} hint={t.payoutHint} />
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {typeof annualRatePercent === "number" ? (
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {YIELD_RATE_LABEL[locale] ?? YIELD_RATE_LABEL.en} {f.number(annualRatePercent)}%
            {hasCustomRate ? (
              <span className="ml-2 rounded-full border border-gold-200/40 bg-gold-300/15 px-2 py-0.5 text-[0.6rem] text-amber-700 dark:text-gold-100">
                {YIELD_RATE_PERSONAL_TAG[locale] ?? YIELD_RATE_PERSONAL_TAG.en}
              </span>
            ) : null}
          </span>
        ) : null}
        <ActiveInvestorCount
          label={ACTIVE_INVESTORS_LABEL[locale] ?? ACTIVE_INVESTORS_LABEL.en}
          className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-[1.35rem] bg-card dark:bg-graphite-900/[0.72]">
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
        <Card className="rounded-[1.35rem] bg-card dark:bg-graphite-900/[0.72]">
          <CardHeader>
            <CardTitle>{t.dash.latestTitle}</CardTitle>
            <CardDescription>{t.dash.latestDesc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.latestPublishedMonthlyReport ? (
              <Link href={`/${locale}/investor/reports/${data.latestPublishedMonthlyReport.id}`} className="block rounded-[1.35rem] border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 p-4 transition-colors hover:border-gold-200/30">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{data.latestPublishedMonthlyReport.month}</p>
                <p className="mt-2 font-semibold text-foreground">{data.latestPublishedMonthlyReport.title}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{data.latestPublishedMonthlyReport.summary}</p>
                <p className="mt-3 text-xs text-amber-700 dark:text-gold-100">{t.dash.publishedPrefix} {f.date(data.latestPublishedMonthlyReport.publishedAt)}</p>
              </Link>
            ) : (
              <InvestorEmptyState title={t.dash.noReportTitle} description={t.dash.noReportDesc} />
            )}
            <ProofLine label={t.dash.reinvestPreference} value={data.summary.reinvestEnabled ? t.dash.enabled : t.dash.disabled} />
            <ProofLine label={t.dash.riskNote} value={t.dash.riskNoteValue} />
          </CardContent>
        </Card>
      </div>

      <HowItWorksSection locale={locale} />
    </div>
  );
}

// E1: zero-allocation welcome. Greets the investor, surfaces deposit addresses
// prominently, and shows the lifecycle timeline so the next step is obvious.
function InvestorWelcome({ locale, name, addresses }: { locale: Locale; name: string; addresses: SerializedDepositAddress[] }) {
  const t = getInvestorStrings(locale);
  const steps = [t.welcome.steps.deposit, t.welcome.steps.allocation, t.welcome.steps.reporting, t.welcome.steps.payout];

  return (
    <div className="grid gap-6">
      <Card className="rounded-[1.35rem] bg-card dark:bg-graphite-900/[0.72]">
        <CardContent className="p-8">
          <h2 className="font-display text-3xl tracking-[-0.03em] text-foreground">
            {t.welcome.title}{name ? `, ${name}` : ""}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">{t.welcome.subtitle}</p>

          <div className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t.welcome.timelineTitle}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {steps.map((step, index) => (
                <div key={step} className="flex items-center gap-3">
                  <div className="flex items-center gap-2 rounded-full border border-gold-200/30 bg-gold-300/15 dark:bg-gold-200/10 px-4 py-2">
                    <span className="text-xs font-semibold text-amber-700 dark:text-gold-100">{index + 1}</span>
                    <span className="text-sm font-medium text-foreground">{step}</span>
                  </div>
                  {index < steps.length - 1 ? <ArrowRight className="size-4 text-muted-foreground" /> : null}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[1.35rem] bg-card dark:bg-graphite-900/[0.72]">
        <CardHeader>
          <CardTitle>{t.welcome.depositTitle}</CardTitle>
          <CardDescription>{t.welcome.depositDesc}</CardDescription>
        </CardHeader>
      </Card>
      {addresses.length === 0 ? (
        <InvestorEmptyState title={t.deposit.emptyTitle} description={t.deposit.emptyDesc} />
      ) : (
        <InvestorDepositAddresses locale={locale} addresses={addresses} />
      )}
    </div>
  );
}

export function InvestorDepositPage({ locale, addresses }: { locale: Locale; addresses: SerializedDepositAddress[] }) {
  const t = getInvestorStrings(locale);

  return (
    <div className="grid gap-6">
      <Card className="rounded-[1.35rem] bg-card dark:bg-graphite-900/[0.72]">
        <CardHeader>
          <CardTitle>{t.deposit.instructionTitle}</CardTitle>
          <CardDescription>{t.deposit.instruction}</CardDescription>
        </CardHeader>
      </Card>
      {addresses.length === 0 ? (
        <InvestorEmptyState title={t.deposit.emptyTitle} description={t.deposit.emptyDesc} />
      ) : (
        <InvestorDepositAddresses locale={locale} addresses={addresses} />
      )}
      <DepositClaimForm locale={locale} />
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

export function InvestorReportsPage({
  locale,
  reports,
  fileReports = []
}: {
  locale: Locale;
  reports: InvestorMonthlyReport[];
  fileReports?: InvestorFileReportView[];
}) {
  const t = getInvestorStrings(locale);
  const f = makeFormatters(locale, t);

  return (
    <div className="grid gap-6">
      <Card className="rounded-[1.35rem] bg-card dark:bg-graphite-900/[0.72]">
        <CardHeader>
          <CardTitle>{t.files.title}</CardTitle>
          <CardDescription>{t.files.desc}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {fileReports.length === 0 ? (
            <div className="rounded-[1.35rem] border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 p-6 text-center text-sm text-muted-foreground">
              {t.files.emptyTitle}
            </div>
          ) : (
            fileReports.map((file) => (
              <div key={file.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[1.35rem] border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 p-4">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 truncate font-semibold text-foreground">
                    <FileSpreadsheet className="size-4 shrink-0 text-amber-700 dark:text-gold-100" />
                    {file.fileName}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{file.month} · {t.files.uploaded} {f.date(file.uploadedAt)}</p>
                </div>
                <a
                  href={`/api/investor/reports/files/${file.id}`}
                  className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-gold-200/40 bg-gold-300/20 dark:bg-gold-200/10 px-4 py-2 text-sm font-semibold text-amber-700 dark:text-gold-100 transition-colors hover:bg-gold-300/30"
                >
                  <Download className="size-4" />
                  {t.files.download}
                </a>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {reports.length === 0 ? (
        <InvestorEmptyState title={t.reportsList.noReportsTitle} description={t.reportsList.noReportsDesc} />
      ) : reports.map((report) => (
        <Link key={report.id} href={`/${locale}/investor/reports/${report.id}`} className="block">
          <Card className="rounded-[1.35rem] bg-card dark:bg-graphite-900/[0.72] transition-colors hover:border-gold-200/30">
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
      <Card className="rounded-[1.35rem] bg-card dark:bg-graphite-900/[0.72]">
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
      <Card className="rounded-[1.35rem] bg-card dark:bg-graphite-900/[0.72]">
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

// Task 2: structured payment history extracted from uploaded XLSX reports.
export function InvestorHistoryPage({
  locale,
  payments,
  totals
}: {
  locale: Locale;
  payments: InvestorPaymentView[];
  totals: { profit: number; payout: number; reinvested: number };
}) {
  const t = getInvestorStrings(locale);
  const f = makeFormatters(locale, t);

  if (payments.length === 0) {
    return <InvestorEmptyState title={t.history.emptyTitle} description={t.history.emptyDesc} />;
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard icon={<BarChart3 className="size-5" />} label={t.history.totalsProfit} value={f.money(totals.profit)} />
        <KpiCard icon={<WalletCards className="size-5" />} label={t.history.totalsPayout} value={f.money(totals.payout)} />
        <KpiCard icon={<CheckCircle2 className="size-5" />} label={t.history.totalsReinvested} value={f.money(totals.reinvested)} />
      </div>

      <Card className="rounded-[1.35rem] bg-card dark:bg-graphite-900/[0.72]">
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  <th className="pb-3 pr-4">{t.history.colMonth}</th>
                  <th className="pb-3 pr-4 text-right">{t.history.colProfit}</th>
                  <th className="pb-3 pr-4 text-right">{t.history.colPayout}</th>
                  <th className="pb-3 pr-4 text-right">{t.history.colReinvested}</th>
                  <th className="pb-3 text-right">{t.history.colRoi}</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-t border-border dark:border-white/10">
                    <td className="py-3 pr-4">
                      <span className="font-medium text-foreground">{payment.month}</span>
                      {payment.period ? <span className="ml-2 text-xs text-muted-foreground">{payment.period}</span> : null}
                    </td>
                    <td className="py-3 pr-4 text-right text-foreground">{f.money(payment.profit)}</td>
                    <td className="py-3 pr-4 text-right text-foreground">{f.money(payment.payout)}</td>
                    <td className="py-3 pr-4 text-right text-foreground">{f.money(payment.reinvested)}</td>
                    <td className="py-3 text-right text-muted-foreground">{payment.roiPercent === null ? "—" : f.percent(payment.roiPercent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function InvestorReinvestPage({ locale, enabled, persistenceEnabled }: { locale: Locale; enabled: boolean; persistenceEnabled: boolean }) {
  const t = getInvestorStrings(locale);

  return (
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <ReinvestPreferenceControl locale={locale} initialEnabled={enabled} persistenceEnabled={persistenceEnabled} />
      <Card className="rounded-[1.35rem] bg-card dark:bg-graphite-900/[0.72]">
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

function KpiCard({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint?: string }) {
  return (
    <Card className="rounded-[1.35rem] bg-card dark:bg-graphite-900/[0.72]">
      <CardContent className="p-5">
        <div className="mb-5 flex size-10 items-center justify-center rounded-full border border-gold-200/20 bg-gold-300/20 dark:bg-gold-200/10 text-amber-700 dark:text-gold-100">{icon}</div>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
        <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground">{value}</p>
        {hint ? <p className="mt-2 text-[0.7rem] leading-4 text-muted-foreground/80">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

// F4: permanent "how it works" cycle — horizontal on desktop, vertical on
// mobile. Gold step numbers, intentionally quiet.
function HowItWorksSection({ locale }: { locale: Locale }) {
  const t = getInvestorStrings(locale);

  return (
    <Card className="rounded-[1.35rem] bg-card dark:bg-graphite-900/[0.72]">
      <CardHeader>
        <CardTitle>{t.howItWorks.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="grid gap-6 lg:grid-cols-5 lg:gap-4">
          {t.howItWorks.steps.map((step, index) => (
            <li key={step.name} className="relative flex gap-4 lg:flex-col lg:gap-3">
              <div className="flex flex-col items-center lg:flex-row lg:gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-gold-200/35 bg-gold-300/15 dark:bg-gold-200/10 text-sm font-semibold text-amber-700 dark:text-gold-100">
                  {index + 1}
                </span>
                {index < t.howItWorks.steps.length - 1 ? (
                  <span className="mt-1 h-full w-px flex-1 bg-border dark:bg-white/10 lg:mt-0 lg:h-px lg:w-full" aria-hidden="true" />
                ) : null}
              </div>
              <div className="pb-1">
                <p className="text-sm font-semibold text-foreground">{step.name}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

function AllocationCard({ locale, allocation, compact = false }: { locale: Locale; allocation: InvestorDashboardAllocation; compact?: boolean }) {
  const t = getInvestorStrings(locale);
  const f = makeFormatters(locale, t);

  return (
    <Link href={`/${locale}/investor/allocations/${allocation.id}`}>
    <Card className="rounded-[1.35rem] bg-muted/30 dark:bg-white/[0.035] transition-colors hover:bg-muted/40 dark:hover:bg-white/[0.055]">
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
          <div className="h-2 overflow-hidden rounded-full bg-muted/40 dark:bg-white/10">
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
        {allocation.startedAt ? <MoneyWorkingLine locale={locale} startedAt={allocation.startedAt} /> : null}
      </CardContent>
    </Card>
    </Link>
  );
}

// "● Active — N days at work" — a subtle one-line vitality signal under active
// allocations. Days counted from startedAt.
function MoneyWorkingLine({ locale, startedAt }: { locale: Locale; startedAt: string }) {
  const t = getInvestorStrings(locale);
  const started = new Date(startedAt).getTime();
  if (!Number.isFinite(started)) return null;
  const days = Math.max(0, Math.floor((Date.now() - started) / (24 * 60 * 60 * 1000)));

  return (
    <div className="mt-4 flex items-center gap-2 text-xs font-medium text-amber-700 dark:text-gold-100">
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-gold-300/70 opacity-75" />
        <span className="relative inline-flex size-2 rounded-full bg-gold-300 dark:bg-gold-200" />
      </span>
      {t.moneyWork.active} — {t.moneyWork.daysWorking(days)}
    </div>
  );
}

function InvestorEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <Card className="rounded-[1.35rem] bg-muted/30 dark:bg-white/[0.035]">
      <CardContent className="p-8 text-center">
        <PackageCheck className="mx-auto size-9 text-amber-700 dark:text-gold-100" />
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
        <div className="rounded-[1.35rem] border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 p-4 text-sm text-muted-foreground">{emptyText}</div>
      ) : withdrawals.map((withdrawal) => (
        <div key={withdrawal.id} className="rounded-[1.35rem] border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-lg font-semibold text-foreground">{withdrawal.currency} {f.number(Number(withdrawal.amount || 0))}</p>
            <Badge variant="secondary">{enumLabel("withdrawalStatus", withdrawal.status, locale)}</Badge>
          </div>
          <WithdrawalTimeline locale={locale} status={withdrawal.status} />
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

// Which of the 5 progress steps a withdrawal has reached. REJECTED/CANCELLED
// stall at "under review" (step 2) and are visually marked terminal.
function withdrawalStepIndex(status: string): number {
  switch (status) {
    case "PAID": return 5;
    case "SCHEDULED": return 4;
    case "APPROVED": return 3;
    case "REQUESTED": return 2;
    default: return 2;
  }
}

function WithdrawalTimeline({ locale, status }: { locale: Locale; status: string }) {
  const t = getInvestorStrings(locale);
  const steps = [t.timeline.steps.received, t.timeline.steps.review, t.timeline.steps.approved, t.timeline.steps.scheduled, t.timeline.steps.paid];
  const active = withdrawalStepIndex(status);
  const terminal = status === "REJECTED" || status === "CANCELLED";
  const showHint = status === "REQUESTED" || status === "APPROVED";

  return (
    <div className="mt-4">
      <div className="flex items-center">
        {steps.map((label, index) => {
          const stepNumber = index + 1;
          const reached = stepNumber <= active;
          const dotClass = terminal
            ? "bg-muted-foreground/40"
            : reached
              ? "bg-gold-300 dark:bg-gold-200"
              : "bg-muted/60 dark:bg-white/10";
          return (
            <div key={label} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center">
                <span className={`size-2.5 rounded-full ${dotClass}`} />
              </div>
              {index < steps.length - 1 ? (
                <div className={`h-px flex-1 ${!terminal && stepNumber < active ? "bg-gold-300/60 dark:bg-gold-200/50" : "bg-border dark:bg-white/10"}`} />
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs font-medium text-amber-700 dark:text-gold-100">
          {steps[Math.max(0, active - 1)]}
        </p>
        {showHint ? <p className="text-[0.68rem] text-muted-foreground">{t.timeline.hint}</p> : null}
      </div>
    </div>
  );
}

function ProofLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 p-4">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm leading-6 text-foreground">{value}</p>
    </div>
  );
}

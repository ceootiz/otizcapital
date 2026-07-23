import Link from "next/link";
import { ArrowLeft, ArrowRight, BarChart3, CalendarClock, CheckCircle2, Download, FileSpreadsheet, FileText, LifeBuoy, PackageCheck, WalletCards } from "lucide-react";
import type { Investor } from "@prisma/client";
import { createAdminFormatters, enumLabel, type Locale } from "@otiz/lib";
import type { SerializedDepositAddress, WithdrawalLockStatus } from "@otiz/database";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Separator } from "@otiz/ui";
import type { InvestorDashboardAllocation, InvestorDashboardData, InvestorWithdrawal } from "@/lib/investor-dashboard-data";
import { ThemeToggle } from "@/components/home/theme-toggle";
import { InvestorDepositAddresses, InvestorLocaleSwitcher, InvestorLogoutButton, InvestorNotificationBell, InvestorWithdrawalForm, ReinvestPreferenceControl } from "./investor-actions";
import { ContactManagerButton } from "./contact-manager-button";
import { DepositClaimForm } from "./deposit-claim-form";

type InvestorPageKey = "dashboard" | "deposit" | "allocations" | "reports" | "documents" | "history" | "withdrawals" | "reinvest" | "calendar" | "support" | "settings";

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


// ---------------------------------------------------------------------------
// Localized strings (EN + RU)
// ---------------------------------------------------------------------------

const INVESTOR_STRINGS = {
  en: {
    backHome: "Back to homepage",
    brand: "OTIZ INVESTOR",
    investorLabel: "Investor",
    nav: { dashboard: "Dashboard", deposit: "Deposit", allocations: "Allocations", reports: "Reports", documents: "Documents", history: "History", withdrawals: "Withdrawals", reinvest: "Reinvest", calendar: "Calendar", support: "My requests", settings: "Settings" },
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
    summary: {
      total: "Total capital", totalHint: "Free funds, working capital and confirmed profit, less completed withdrawals.",
      free: "Free funds", freeHint: "Available for a future deal or withdrawal when eligible.",
      working: "Working capital", workingHint: "Currently assigned to active deals.",
      pending: "Expected", pendingHint: "Expected profit and payouts still awaiting confirmation. Not included until confirmed."
    },
    nextAction: {
      label: "What happens next", open: "Open",
      payoutTitle: "Your payout is being prepared", payoutDesc: "Open withdrawals to see the current status and expected date.",
      reportTitle: "Your latest report is ready", reportDesc: "Review the result, linked deal and available documents.",
      workingTitle: "Your capital is working", workingDesc: "Open the active deal to see its stage, latest update and supporting documents.",
      allocationTitle: "Funds are ready for allocation", allocationDesc: "Your manager can assign the available capital to the next suitable deal.",
      depositTitle: "Fund your account", depositDesc: "Open the deposit page, send funds and submit the transfer for confirmation."
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
    nav: { dashboard: "Панель", deposit: "Пополнение", allocations: "Аллокации", reports: "Отчёты", documents: "Документы", history: "История", withdrawals: "Выводы", reinvest: "Реинвест", calendar: "Календарь", support: "Мои обращения", settings: "Настройки" },
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
    summary: {
      total: "Общий капитал", totalHint: "Свободные средства, капитал в работе и подтверждённая прибыль за вычетом завершённых выводов.",
      free: "Свободно", freeHint: "Можно направить в новую сделку или вывести, когда вывод доступен.",
      working: "В работе", workingHint: "Сейчас участвует в активных сделках.",
      pending: "Ожидается", pendingHint: "Ожидаемая прибыль и выплаты на подтверждении. Они не учитываются как подтверждённые."
    },
    nextAction: {
      label: "Что дальше", open: "Открыть",
      payoutTitle: "Выплата готовится", payoutDesc: "Откройте выводы, чтобы посмотреть статус и ожидаемую дату.",
      reportTitle: "Новый отчёт готов", reportDesc: "Проверьте результат, связанную сделку и доступные документы.",
      workingTitle: "Капитал работает", workingDesc: "Откройте активную сделку: там указан этап, последнее обновление и документы.",
      allocationTitle: "Средства готовы к размещению", allocationDesc: "Менеджер может направить свободный капитал в следующую подходящую сделку.",
      depositTitle: "Пополните счёт", depositDesc: "Откройте пополнение, отправьте средства и передайте перевод на подтверждение."
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

const LOCALIZED_INVESTOR_STRINGS = {
  en: INVESTOR_STRINGS.en,
  ru: INVESTOR_STRINGS.ru,
  es: {
    ...INVESTOR_STRINGS.en,
    backHome: "Volver al inicio", investorLabel: "Inversor",
    nav: { dashboard: "Resumen", deposit: "Depósito", allocations: "Operaciones", reports: "Informes", documents: "Documentos", history: "Historial", withdrawals: "Retiros", reinvest: "Reinvertir", calendar: "Calendario", support: "Mis solicitudes", settings: "Ajustes" },
    pages: {
      dashboard: { eyebrow: "Su capital", title: "Resumen del inversor", description: "Vea cuánto capital está disponible, cuánto está trabajando y qué ocurrirá después." },
      deposit: { eyebrow: "Añadir capital", title: "Depósito", description: "Envíe los fondos a la dirección indicada y presente la transferencia para su confirmación." },
      allocations: { eyebrow: "Operaciones activas", title: "Operaciones", description: "Consulte dónde trabaja su capital, el estado de cada operación y la última actualización." },
      reports: { eyebrow: "Resultados", title: "Informes", description: "Consulte los resultados publicados, los pagos y los documentos relacionados." },
      documents: { eyebrow: "Acuerdos y archivos", title: "Documentos", description: "Consulte y firme los documentos preparados para su cuenta." },
      history: { eyebrow: "Movimiento del capital", title: "Historial", description: "Consulte los resultados mensuales publicados para su cuenta." },
      withdrawals: { eyebrow: "Recibir fondos", title: "Retiros", description: "Solicite un retiro y siga su revisión, programación y pago." },
      reinvest: { eyebrow: "Su elección", title: "Reinvertir", description: "Indique si desea usar los resultados disponibles en futuras operaciones." },
      settings: { eyebrow: "Su cuenta", title: "Ajustes", description: "Gestione el idioma, las notificaciones, los monederos y los datos de su cuenta." }
    },
    kpi: { totalBalance: "Saldo", availableBalance: "Pendiente de asignación", workingCapital: "En operaciones", retainedProfit: "Beneficio conservado", activeCapital: "Capital activo", totalInvested: "Total invertido", realizedProfit: "Beneficio confirmado", expectedProfit: "Beneficio previsto", totalPayouts: "Total pagado", pendingPayouts: "Pagos pendientes", activeAllocations: "Operaciones activas", completedAllocations: "Operaciones completadas", currentAverageRoi: "ROI medio", nextExpectedPayout: "Próximo pago previsto" },
    summary: { total: "Capital total", totalHint: "Fondos libres, capital en operaciones y beneficio confirmado, menos los retiros pagados.", free: "Disponible", freeHint: "Puede destinarse a una nueva operación o retirarse cuando esté disponible.", working: "En operaciones", workingHint: "Actualmente participa en operaciones activas.", pending: "Pendiente", pendingHint: "Beneficio previsto y pagos aún por confirmar. No se incluyen hasta su confirmación." },
    nextAction: { label: "Qué ocurre después", open: "Abrir", payoutTitle: "Su pago se está preparando", payoutDesc: "Abra Retiros para consultar el estado y la fecha prevista.", reportTitle: "Su último informe está listo", reportDesc: "Revise el resultado, la operación relacionada y los documentos disponibles.", workingTitle: "Su capital está trabajando", workingDesc: "Abra la operación activa para ver la etapa, la última actualización y los documentos.", allocationTitle: "Los fondos están listos para asignarse", allocationDesc: "Su gestor puede asignar el capital disponible a la siguiente operación adecuada.", depositTitle: "Añada capital", depositDesc: "Abra Depósito, envíe los fondos y presente la transferencia para su confirmación." },
    dash: { activeTitle: "Operaciones activas", activeDesc: "Capital actualmente asignado a compras, logística y ventas.", latestTitle: "Último informe", latestDesc: "El informe publicado explica el resultado y sus documentos.", publishedPrefix: "Publicado", reinvestPreference: "Preferencia de reinversión", enabled: "Activada", disabled: "Desactivada", riskNote: "Riesgo", riskNoteValue: "Los resultados dependen de la ejecución de cada operación. La rentabilidad no está garantizada.", noActiveTitle: "Aún no hay operaciones activas.", noActiveDesc: "Las operaciones aparecerán cuando su gestor asigne el capital disponible.", noReportTitle: "Aún no hay informes publicados.", noReportDesc: "El informe aparecerá después de la revisión del gestor." },
    alloc: { noActiveTitle: "Aún no hay operaciones activas.", noActiveDesc: "Su cuenta está activa. Las operaciones aparecerán cuando se asigne capital.", lifecycleProgress: "Progreso", invested: "Capital asignado", expectedReturn: "Resultado previsto", expectedPayout: "Pago previsto", updated: "Actualizado", proofHealth: "Estado de documentos", riskVisibility: "Nivel de atención", started: "Inicio", latestProof: "Último documento", latestReport: "Último informe", riskNote: "Nota", underManagerReview: "En revisión", noProofYet: "Aún no hay documentos disponibles.", noReportYet: "Aún no hay informe publicado.", managerReviewRequired: "Requiere revisión del gestor.", normalMonitoring: "Seguimiento normal." },
    reportsList: { noReportsTitle: "Aún no hay informes publicados.", noReportsDesc: "Los informes aparecerán después de su revisión y publicación.", published: "Publicado", afterManagerReview: "tras la revisión", summary: "Resumen", performance: "Resultado", payouts: "Pagos", proofCategories: "Documentos", noPerformance: "No hay resultado publicado.", noPayout: "No hay información de pago.", noProofCats: "No hay documentos disponibles en este informe." },
    withdraw: { availabilityTitle: "Disponibilidad", availabilityDesc: "Cada solicitud es revisada antes de programar el pago.", available: "Disponible para retirar", pendingPayouts: "Pagos pendientes", scheduledNext: "Próximo pago", historyTitle: "Historial de retiros", historyDesc: "Estado e historial de sus solicitudes.", noRequestsTitle: "Aún no hay solicitudes de retiro.", noRequestsDesc: "Las solicitudes y los pagos aparecerán aquí.", pendingReview: "En revisión", scheduledPayouts: "Pagos programados", paidHistory: "Pagados", noPending: "No hay solicitudes pendientes.", noScheduled: "No hay pagos programados.", noPaid: "Aún no hay retiros pagados.", requested: "Solicitado", scheduled: "Programado", paid: "Pagado", method: "Método", destination: "Destino", investorNote: "Nota", noNote: "Sin nota.", notSet: "No indicado" },
    reinvest: { approachTitle: "Cómo funciona", approachDesc: "La reinversión puede destinar resultados disponibles a futuras operaciones tras la revisión del gestor.", whatChanges: "Qué cambia", whatChangesVal: "Los fondos elegibles pueden usarse en futuras operaciones en lugar de retirarse.", whatNotChanges: "Qué no cambia", whatNotChangesVal: "No garantiza disponibilidad, plazos ni resultados.", reviewModel: "Confirmación", reviewModelVal: "El gestor confirma el cambio antes de aplicarlo." },
    deposit: { instructionTitle: "Cómo depositar", instruction: "Envíe fondos a la dirección indicada y presente la transferencia para su confirmación.", emptyTitle: "No hay direcciones disponibles.", emptyDesc: "Contacte con su gestor para recibir instrucciones." },
    files: { title: "Archivos del informe", desc: "Archivos publicados disponibles para descargar.", emptyTitle: "Los informes aparecerán después de publicarse.", download: "Descargar", uploaded: "Cargado" },
    welcome: { title: "Bienvenido", subtitle: "Su cuenta está activa. El siguiente paso es añadir capital o esperar su asignación.", depositTitle: "Añada capital", depositDesc: "Envíe los fondos y presente la transferencia para su confirmación.", timelineTitle: "Cómo funciona", steps: { deposit: "Depósito", allocation: "Operación", reporting: "Informe", payout: "Pago" } },
    timeline: { title: "Estado", hint: "Plazo habitual: 3–5 días laborables.", steps: { received: "Recibida", review: "En revisión", approved: "Aprobada", scheduled: "Programada", paid: "Pagada" } },
    moneyWork: { active: "Activa", daysWorking: (days: number) => `${days} ${days === 1 ? "día" : "días"} en operación` },
    howItWorks: { title: "Cómo funciona", steps: [{ name: "Depósito", desc: "Envía los fondos y confirma la transferencia" }, { name: "Operación", desc: "El gestor asigna el capital a una operación" }, { name: "Venta", desc: "El capital participa en comercio de productos" }, { name: "Informe", desc: "Recibe un informe con el resultado" }, { name: "Pago o reinversión", desc: "Elige retirar o reinvertir el resultado" }] },
    payoutHint: "La fecha es una estimación y puede cambiar según el desarrollo de la operación.",
    history: { totalsProfit: "Beneficio total", totalsPayout: "Total pagado", totalsReinvested: "Total reinvertido", colMonth: "Mes", colProfit: "Beneficio", colPayout: "Pago", colReinvested: "Reinvertido", colRoi: "ROI %", emptyTitle: "El historial aparecerá después del primer informe.", emptyDesc: "Los resultados publicados se añadirán aquí automáticamente." },
    common: { notScheduled: "No programado", notAvailable: "No disponible" }
  },
  de: {
    ...INVESTOR_STRINGS.en,
    backHome: "Zur Startseite", investorLabel: "Investor",
    nav: { dashboard: "Übersicht", deposit: "Einzahlung", allocations: "Geschäfte", reports: "Berichte", documents: "Dokumente", history: "Verlauf", withdrawals: "Auszahlungen", reinvest: "Reinvestieren", calendar: "Kalender", support: "Meine Anfragen", settings: "Einstellungen" },
    pages: { dashboard: { eyebrow: "Ihr Kapital", title: "Investor-Übersicht", description: "Sehen Sie verfügbares Kapital, laufende Geschäfte und den nächsten Schritt." }, deposit: { eyebrow: "Kapital einzahlen", title: "Einzahlung", description: "Senden Sie den Betrag an die angegebene Adresse und reichen Sie die Überweisung zur Bestätigung ein." }, allocations: { eyebrow: "Laufende Geschäfte", title: "Geschäfte", description: "Sehen Sie, wo Ihr Kapital arbeitet, den Status und die letzte Aktualisierung." }, reports: { eyebrow: "Ergebnisse", title: "Berichte", description: "Sehen Sie veröffentlichte Ergebnisse, Auszahlungen und zugehörige Dokumente." }, documents: { eyebrow: "Verträge und Dateien", title: "Dokumente", description: "Prüfen und unterzeichnen Sie die für Ihr Konto bereitgestellten Dokumente." }, history: { eyebrow: "Kapitalbewegungen", title: "Verlauf", description: "Sehen Sie die veröffentlichten Monatsergebnisse Ihres Kontos." }, withdrawals: { eyebrow: "Geld erhalten", title: "Auszahlungen", description: "Beantragen Sie eine Auszahlung und verfolgen Sie Prüfung, Planung und Zahlung." }, reinvest: { eyebrow: "Ihre Auswahl", title: "Reinvestieren", description: "Legen Sie fest, ob verfügbare Ergebnisse in künftige Geschäfte fließen sollen." }, settings: { eyebrow: "Ihr Konto", title: "Einstellungen", description: "Verwalten Sie Sprache, Benachrichtigungen, Wallets und Kontodaten." } },
    kpi: { totalBalance: "Guthaben", availableBalance: "Zur Zuweisung", workingCapital: "In Geschäften", retainedProfit: "Einbehaltener Gewinn", activeCapital: "Aktives Kapital", totalInvested: "Insgesamt investiert", realizedProfit: "Bestätigter Gewinn", expectedProfit: "Erwarteter Gewinn", totalPayouts: "Ausgezahlt", pendingPayouts: "Ausstehende Zahlungen", activeAllocations: "Aktive Geschäfte", completedAllocations: "Abgeschlossene Geschäfte", currentAverageRoi: "Durchschnittlicher ROI", nextExpectedPayout: "Nächste erwartete Zahlung" },
    summary: { total: "Gesamtkapital", totalHint: "Freie Mittel, arbeitendes Kapital und bestätigter Gewinn abzüglich abgeschlossener Auszahlungen.", free: "Verfügbar", freeHint: "Kann einem neuen Geschäft zugewiesen oder bei Verfügbarkeit ausgezahlt werden.", working: "In Geschäften", workingHint: "Derzeit aktiven Geschäften zugewiesen.", pending: "Ausstehend", pendingHint: "Erwarteter Gewinn und Zahlungen, die noch nicht bestätigt sind." },
    nextAction: { label: "Nächster Schritt", open: "Öffnen", payoutTitle: "Ihre Auszahlung wird vorbereitet", payoutDesc: "Öffnen Sie Auszahlungen für Status und erwartetes Datum.", reportTitle: "Ihr neuester Bericht ist bereit", reportDesc: "Prüfen Sie Ergebnis, Geschäft und verfügbare Dokumente.", workingTitle: "Ihr Kapital arbeitet", workingDesc: "Öffnen Sie das aktive Geschäft für Status, Aktualisierung und Dokumente.", allocationTitle: "Mittel sind zur Zuweisung bereit", allocationDesc: "Ihr Manager kann das verfügbare Kapital dem nächsten passenden Geschäft zuweisen.", depositTitle: "Kapital einzahlen", depositDesc: "Öffnen Sie Einzahlung, senden Sie den Betrag und reichen Sie ihn zur Bestätigung ein." },
    dash: { activeTitle: "Aktive Geschäfte", activeDesc: "Kapital, das derzeit Einkauf, Logistik und Verkauf zugewiesen ist.", latestTitle: "Neuester Bericht", latestDesc: "Der veröffentlichte Bericht erklärt Ergebnis und Dokumente.", publishedPrefix: "Veröffentlicht", reinvestPreference: "Reinvestitionswunsch", enabled: "Aktiv", disabled: "Inaktiv", riskNote: "Risiko", riskNoteValue: "Ergebnisse hängen von der Durchführung des Geschäfts ab. Renditen sind nicht garantiert.", noActiveTitle: "Noch keine aktiven Geschäfte.", noActiveDesc: "Geschäfte erscheinen, sobald Ihr Manager Kapital zuweist.", noReportTitle: "Noch kein Bericht veröffentlicht.", noReportDesc: "Der Bericht erscheint nach Prüfung durch den Manager." },
    alloc: { noActiveTitle: "Noch keine aktiven Geschäfte.", noActiveDesc: "Ihr Konto ist aktiv. Geschäfte erscheinen nach der Kapitalzuweisung.", lifecycleProgress: "Fortschritt", invested: "Zugewiesenes Kapital", expectedReturn: "Erwartetes Ergebnis", expectedPayout: "Erwartete Zahlung", updated: "Aktualisiert", proofHealth: "Dokumentstatus", riskVisibility: "Aufmerksamkeitsstufe", started: "Beginn", latestProof: "Neuestes Dokument", latestReport: "Neuester Bericht", riskNote: "Hinweis", underManagerReview: "In Prüfung", noProofYet: "Noch keine Dokumente verfügbar.", noReportYet: "Noch kein Bericht veröffentlicht.", managerReviewRequired: "Prüfung durch den Manager erforderlich.", normalMonitoring: "Normale Begleitung." },
    reportsList: { noReportsTitle: "Noch keine Berichte veröffentlicht.", noReportsDesc: "Berichte erscheinen nach Prüfung und Veröffentlichung.", published: "Veröffentlicht", afterManagerReview: "nach Prüfung", summary: "Zusammenfassung", performance: "Ergebnis", payouts: "Zahlungen", proofCategories: "Dokumente", noPerformance: "Kein Ergebnis veröffentlicht.", noPayout: "Keine Zahlungsangabe.", noProofCats: "Keine Dokumente in diesem Bericht." },
    withdraw: { availabilityTitle: "Verfügbarkeit", availabilityDesc: "Jeder Antrag wird vor der Zahlungsplanung geprüft.", available: "Auszahlbar", pendingPayouts: "Ausstehende Zahlungen", scheduledNext: "Nächste Zahlung", historyTitle: "Auszahlungsverlauf", historyDesc: "Status und Verlauf Ihrer Anträge.", noRequestsTitle: "Noch keine Auszahlungsanträge.", noRequestsDesc: "Anträge und Zahlungen erscheinen hier.", pendingReview: "In Prüfung", scheduledPayouts: "Geplante Zahlungen", paidHistory: "Bezahlt", noPending: "Keine offenen Anträge.", noScheduled: "Keine geplanten Zahlungen.", noPaid: "Noch keine Auszahlungen.", requested: "Beantragt", scheduled: "Geplant", paid: "Bezahlt", method: "Methode", destination: "Ziel", investorNote: "Hinweis", noNote: "Kein Hinweis.", notSet: "Nicht angegeben" },
    reinvest: { approachTitle: "So funktioniert es", approachDesc: "Verfügbare Ergebnisse können nach Prüfung künftigen Geschäften zugewiesen werden.", whatChanges: "Was sich ändert", whatChangesVal: "Geeignete Mittel können statt einer Auszahlung in künftige Geschäfte fließen.", whatNotChanges: "Was gleich bleibt", whatNotChangesVal: "Verfügbarkeit, Zeitplan und Ergebnis sind nicht garantiert.", reviewModel: "Bestätigung", reviewModelVal: "Der Manager bestätigt die Änderung vor der Anwendung." },
    deposit: { instructionTitle: "So zahlen Sie ein", instruction: "Senden Sie den Betrag und reichen Sie die Überweisung zur Bestätigung ein.", emptyTitle: "Keine Einzahlungsadresse verfügbar.", emptyDesc: "Kontaktieren Sie Ihren Manager für Anweisungen." },
    files: { title: "Berichtsdateien", desc: "Veröffentlichte Dateien zum Herunterladen.", emptyTitle: "Berichte erscheinen nach der Veröffentlichung.", download: "Herunterladen", uploaded: "Hochgeladen" },
    welcome: { title: "Willkommen", subtitle: "Ihr Konto ist aktiv. Zahlen Sie Kapital ein oder warten Sie auf die Zuweisung.", depositTitle: "Kapital einzahlen", depositDesc: "Senden Sie den Betrag und reichen Sie ihn zur Bestätigung ein.", timelineTitle: "So funktioniert es", steps: { deposit: "Einzahlung", allocation: "Geschäft", reporting: "Bericht", payout: "Zahlung" } },
    timeline: { title: "Status", hint: "Übliche Bearbeitung: 3–5 Werktage.", steps: { received: "Eingegangen", review: "In Prüfung", approved: "Genehmigt", scheduled: "Geplant", paid: "Bezahlt" } },
    moneyWork: { active: "Aktiv", daysWorking: (days: number) => `${days} ${days === 1 ? "Tag" : "Tage"} im Geschäft` },
    howItWorks: { title: "So funktioniert es", steps: [{ name: "Einzahlung", desc: "Sie senden den Betrag und bestätigen die Überweisung" }, { name: "Geschäft", desc: "Der Manager weist das Kapital einem Geschäft zu" }, { name: "Verkauf", desc: "Das Kapital arbeitet im Warenhandel" }, { name: "Bericht", desc: "Sie erhalten einen Bericht zum Ergebnis" }, { name: "Zahlung oder Reinvestition", desc: "Sie wählen Auszahlung oder Reinvestition" }] },
    payoutHint: "Das Datum ist eine Schätzung und kann sich je nach Geschäftsverlauf ändern.",
    history: { totalsProfit: "Gesamtgewinn", totalsPayout: "Ausgezahlt", totalsReinvested: "Reinvestiert", colMonth: "Monat", colProfit: "Gewinn", colPayout: "Zahlung", colReinvested: "Reinvestiert", colRoi: "ROI %", emptyTitle: "Der Verlauf erscheint nach dem ersten Bericht.", emptyDesc: "Veröffentlichte Ergebnisse werden automatisch hinzugefügt." },
    common: { notScheduled: "Nicht geplant", notAvailable: "Nicht verfügbar" }
  },
  zh: {
    ...INVESTOR_STRINGS.en,
    backHome: "返回首页", investorLabel: "投资者",
    nav: { dashboard: "概览", deposit: "入金", allocations: "项目", reports: "报告", documents: "文件", history: "记录", withdrawals: "提现", reinvest: "再投资", calendar: "日历", support: "我的请求", settings: "设置" },
    pages: { dashboard: { eyebrow: "您的资金", title: "投资者概览", description: "查看可用资金、运作中的资金以及下一步安排。" }, deposit: { eyebrow: "增加资金", title: "入金", description: "向指定地址转账，并提交转账以供确认。" }, allocations: { eyebrow: "进行中的项目", title: "项目", description: "查看资金所在项目、当前阶段和最新进展。" }, reports: { eyebrow: "项目结果", title: "报告", description: "查看已发布的结果、付款和相关文件。" }, documents: { eyebrow: "协议与文件", title: "文件", description: "查看并签署为您的账户准备的文件。" }, history: { eyebrow: "资金记录", title: "记录", description: "查看已发布的月度结果。" }, withdrawals: { eyebrow: "接收资金", title: "提现", description: "提交提现申请，并查看审核、安排和付款状态。" }, reinvest: { eyebrow: "您的选择", title: "再投资", description: "选择是否将可用结果用于未来项目。" }, settings: { eyebrow: "您的账户", title: "设置", description: "管理语言、通知、钱包和账户信息。" } },
    kpi: { totalBalance: "余额", availableBalance: "待分配", workingCapital: "运作中", retainedProfit: "留存利润", activeCapital: "活跃资金", totalInvested: "累计投入", realizedProfit: "已确认利润", expectedProfit: "预计利润", totalPayouts: "累计支付", pendingPayouts: "待支付", activeAllocations: "进行中项目", completedAllocations: "已完成项目", currentAverageRoi: "平均回报率", nextExpectedPayout: "下次预计付款" },
    summary: { total: "总资金", totalHint: "可用资金、运作中资金和已确认利润，扣除已完成提现。", free: "可用", freeHint: "可用于新项目，或在满足条件时提现。", working: "运作中", workingHint: "目前已分配至进行中的项目。", pending: "待确认", pendingHint: "尚未确认的预计利润和付款，确认前不计入已确认金额。" },
    nextAction: { label: "下一步", open: "打开", payoutTitle: "您的付款正在准备", payoutDesc: "打开提现页面查看状态和预计日期。", reportTitle: "最新报告已准备好", reportDesc: "查看结果、相关项目和可用文件。", workingTitle: "您的资金正在运作", workingDesc: "打开进行中的项目，查看阶段、最新进展和文件。", allocationTitle: "资金可以分配", allocationDesc: "您的经理可以将可用资金分配到下一个合适项目。", depositTitle: "增加资金", depositDesc: "打开入金页面，完成转账并提交确认。" },
    dash: { activeTitle: "进行中的项目", activeDesc: "目前用于采购、物流和销售的资金。", latestTitle: "最新报告", latestDesc: "已发布报告会说明结果和相关文件。", publishedPrefix: "发布时间", reinvestPreference: "再投资选择", enabled: "已开启", disabled: "已关闭", riskNote: "风险说明", riskNoteValue: "结果取决于每个项目的执行情况，不保证收益。", noActiveTitle: "暂无进行中的项目。", noActiveDesc: "经理分配资金后，项目将显示在这里。", noReportTitle: "暂无已发布报告。", noReportDesc: "经理审核后，报告将显示在这里。" },
    alloc: { noActiveTitle: "暂无进行中的项目。", noActiveDesc: "您的账户已激活，资金分配后会显示项目。", lifecycleProgress: "进度", invested: "分配资金", expectedReturn: "预计结果", expectedPayout: "预计付款", updated: "更新时间", proofHealth: "文件状态", riskVisibility: "关注级别", started: "开始时间", latestProof: "最新文件", latestReport: "最新报告", riskNote: "说明", underManagerReview: "审核中", noProofYet: "暂无可用文件。", noReportYet: "暂无已发布报告。", managerReviewRequired: "需要经理审核。", normalMonitoring: "正常跟进。" },
    reportsList: { noReportsTitle: "暂无已发布报告。", noReportsDesc: "报告将在审核并发布后显示。", published: "已发布", afterManagerReview: "审核后", summary: "摘要", performance: "结果", payouts: "付款", proofCategories: "文件", noPerformance: "暂无已发布结果。", noPayout: "暂无付款信息。", noProofCats: "本报告暂无文件。" },
    withdraw: { availabilityTitle: "提现可用性", availabilityDesc: "每个申请都会在安排付款前审核。", available: "可提现", pendingPayouts: "待支付", scheduledNext: "下次付款", historyTitle: "提现记录", historyDesc: "查看申请状态和历史。", noRequestsTitle: "暂无提现申请。", noRequestsDesc: "申请和付款会显示在这里。", pendingReview: "审核中", scheduledPayouts: "已安排", paidHistory: "已支付", noPending: "没有待处理申请。", noScheduled: "没有已安排付款。", noPaid: "暂无已支付提现。", requested: "申请时间", scheduled: "安排时间", paid: "支付时间", method: "方式", destination: "收款地址", investorNote: "说明", noNote: "无说明。", notSet: "未设置" },
    reinvest: { approachTitle: "运作方式", approachDesc: "经经理确认后，可将可用结果用于未来项目。", whatChanges: "会改变什么", whatChangesVal: "符合条件的资金可用于未来项目，而不是提现。", whatNotChanges: "不会改变什么", whatNotChangesVal: "不保证项目供应、时间或结果。", reviewModel: "确认", reviewModelVal: "经理会在执行前确认变更。" },
    deposit: { instructionTitle: "如何入金", instruction: "向指定地址转账，并提交转账以供确认。", emptyTitle: "暂无入金地址。", emptyDesc: "请联系经理获取入金说明。" },
    files: { title: "报告文件", desc: "可下载的已发布文件。", emptyTitle: "报告发布后会显示在这里。", download: "下载", uploaded: "上传时间" },
    welcome: { title: "欢迎", subtitle: "您的账户已激活。下一步是增加资金或等待分配。", depositTitle: "增加资金", depositDesc: "完成转账并提交确认。", timelineTitle: "运作方式", steps: { deposit: "入金", allocation: "项目", reporting: "报告", payout: "付款" } },
    timeline: { title: "状态", hint: "通常审核时间：3至5个工作日。", steps: { received: "已收到", review: "审核中", approved: "已批准", scheduled: "已安排", paid: "已支付" } },
    moneyWork: { active: "进行中", daysWorking: (days: number) => `已运作 ${days} 天` },
    howItWorks: { title: "运作方式", steps: [{ name: "入金", desc: "转账并提交确认" }, { name: "项目", desc: "经理将资金分配到项目" }, { name: "销售", desc: "资金用于商品交易" }, { name: "报告", desc: "您会收到项目结果报告" }, { name: "付款或再投资", desc: "选择提现或再投资" }] },
    payoutHint: "该日期为预计时间，可能因项目进展而变化。",
    history: { totalsProfit: "累计利润", totalsPayout: "累计支付", totalsReinvested: "累计再投资", colMonth: "月份", colProfit: "利润", colPayout: "付款", colReinvested: "再投资", colRoi: "回报率", emptyTitle: "首份报告发布后会显示记录。", emptyDesc: "已发布结果将自动添加到这里。" },
    common: { notScheduled: "未安排", notAvailable: "暂无" }
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
  return (LOCALIZED_INVESTOR_STRINGS as unknown as Record<string, InvestorStrings>)[locale] ?? INVESTOR_STRINGS.en;
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
      <Link
        href={`/${locale}/investor/support#new-request`}
        aria-label={t.nav.support}
        title={t.nav.support}
        className="fixed bottom-5 right-5 z-50 flex size-14 items-center justify-center rounded-full border border-gold-200/35 bg-foreground text-background shadow-[0_18px_50px_rgba(0,0,0,0.28)] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300 sm:bottom-7 sm:right-7"
      >
        <LifeBuoy className="size-6" aria-hidden="true" />
      </Link>
    </main>
  );
}

export function InvestorDashboardHome({
  locale,
  data,
  investorName = "",
  depositAddresses = [],
}: {
  locale: Locale;
  data: InvestorDashboardData;
  investorName?: string;
  depositAddresses?: SerializedDepositAddress[];
}) {
  const t = getInvestorStrings(locale);
  const f = makeFormatters(locale, t);

  // A zero money-metric is only meaningful ("$0") once the investor has some
  // allocation/withdrawal history; before that we render "—" to avoid a wall of
  // hollow "$0"s. Allocation counters always show their real number.
  const moneyMetric = (value: number) => (value === 0 && !data.summary.hasHistory ? "—" : f.money(value));

  const expectedAmount = data.summary.expectedProfit + data.summary.pendingPayouts;
  const nextAction = data.summary.pendingPayouts > 0
    ? { title: t.nextAction.payoutTitle, description: t.nextAction.payoutDesc, href: `/${locale}/investor/withdrawals` }
    : data.latestPublishedMonthlyReport
      ? { title: t.nextAction.reportTitle, description: t.nextAction.reportDesc, href: `/${locale}/investor/reports/${data.latestPublishedMonthlyReport.id}` }
      : data.activeAllocations[0]
        ? { title: t.nextAction.workingTitle, description: t.nextAction.workingDesc, href: `/${locale}/investor/allocations/${data.activeAllocations[0].id}` }
        : data.summary.availableBalance > 0
          ? { title: t.nextAction.allocationTitle, description: t.nextAction.allocationDesc, href: `/${locale}/investor/allocations` }
          : { title: t.nextAction.depositTitle, description: t.nextAction.depositDesc, href: `/${locale}/investor/deposit` };

  const balanceCards = (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard icon={<WalletCards className="size-5" />} label={t.summary.total} value={moneyMetric(data.summary.totalBalance)} hint={t.summary.totalHint} href={`/${locale}/investor/history`} />
      <KpiCard icon={<CheckCircle2 className="size-5" />} label={t.summary.free} value={moneyMetric(data.summary.availableBalance)} hint={t.summary.freeHint} href={`/${locale}/investor/deposit`} />
      <KpiCard icon={<BarChart3 className="size-5" />} label={t.summary.working} value={moneyMetric(data.summary.workingCapital)} hint={t.summary.workingHint} href={`/${locale}/investor/allocations`} />
      <KpiCard icon={<CalendarClock className="size-5" />} label={t.summary.pending} value={moneyMetric(expectedAmount)} hint={t.summary.pendingHint} href={data.summary.pendingPayouts > 0 ? `/${locale}/investor/withdrawals` : `/${locale}/investor/reports`} />
    </div>
  );

  const nextActionCard = (
    <Card className="rounded-[1.35rem] border-gold-200/35 bg-gold-300/10 dark:bg-gold-200/[0.06]">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 dark:text-gold-100">{t.nextAction.label}</p>
          <p className="mt-2 text-lg font-semibold text-foreground">{nextAction.title}</p>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">{nextAction.description}</p>
        </div>
        <Link href={nextAction.href} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-gold-200/40 bg-gold-300/20 px-4 py-2 text-sm font-semibold text-amber-700 transition-colors hover:bg-gold-300/30 dark:bg-gold-200/10 dark:text-gold-100">
          {t.nextAction.open}<ArrowRight className="size-4" />
        </Link>
      </CardContent>
    </Card>
  );

  // Zero-allocation onboarding view: no capital assigned yet.
  if (data.summary.activeAllocationsCount === 0 && data.summary.completedAllocationsCount === 0) {
    return (
      <div className="grid gap-6">
        {balanceCards}
        {nextActionCard}
        <InvestorWelcome locale={locale} name={investorName} addresses={depositAddresses} />
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {balanceCards}
      {nextActionCard}

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

export function InvestorDepositPage({ locale, addresses, trackerEnabled = false }: { locale: Locale; addresses: SerializedDepositAddress[]; trackerEnabled?: boolean }) {
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
      <DepositClaimForm locale={locale} trackerEnabled={trackerEnabled} />
    </div>
  );
}

const ALLOCATION_FILTER_COPY = {
  en: { search: "Search by deal or product", status: "Status", risk: "Risk", sort: "Sort", apply: "Apply", all: "All", active: "Active", completed: "Completed", loss: "Needs attention", standard: "Standard", monitored: "Monitored", elevated: "Elevated", updatedDesc: "Recently updated", amountDesc: "Capital: high to low", amountAsc: "Capital: low to high", returnDesc: "Result: high to low", noMatches: "No deals match these filters." },
  ru: { search: "Поиск по сделке или товару", status: "Статус", risk: "Риск", sort: "Сортировка", apply: "Применить", all: "Все", active: "В работе", completed: "Завершены", loss: "Требуют внимания", standard: "Стандартный", monitored: "Под наблюдением", elevated: "Повышенный", updatedDesc: "Сначала обновлённые", amountDesc: "Капитал: по убыванию", amountAsc: "Капитал: по возрастанию", returnDesc: "Результат: по убыванию", noMatches: "По выбранным фильтрам сделок нет." },
  de: { search: "Nach Geschäft oder Produkt suchen", status: "Status", risk: "Risiko", sort: "Sortierung", apply: "Anwenden", all: "Alle", active: "Aktiv", completed: "Abgeschlossen", loss: "Aufmerksamkeit nötig", standard: "Standard", monitored: "Beobachtet", elevated: "Erhöht", updatedDesc: "Zuletzt aktualisiert", amountDesc: "Kapital: absteigend", amountAsc: "Kapital: aufsteigend", returnDesc: "Ergebnis: absteigend", noMatches: "Keine Geschäfte entsprechen diesen Filtern." },
  es: { search: "Buscar por operación o producto", status: "Estado", risk: "Riesgo", sort: "Orden", apply: "Aplicar", all: "Todas", active: "Activas", completed: "Completadas", loss: "Requieren atención", standard: "Estándar", monitored: "Supervisadas", elevated: "Elevado", updatedDesc: "Actualizadas recientemente", amountDesc: "Capital: mayor a menor", amountAsc: "Capital: menor a mayor", returnDesc: "Resultado: mayor a menor", noMatches: "Ninguna operación coincide con estos filtros." },
  zh: { search: "按项目或产品搜索", status: "状态", risk: "风险", sort: "排序", apply: "应用", all: "全部", active: "进行中", completed: "已完成", loss: "需要关注", standard: "标准", monitored: "观察中", elevated: "较高", updatedDesc: "最近更新", amountDesc: "资金：从高到低", amountAsc: "资金：从低到高", returnDesc: "结果：从高到低", noMatches: "没有符合筛选条件的项目。" }
} as const;

type AllocationFilters = { query: string; status: string; risk: string; sort: string };

export function InvestorAllocationsPage({
  locale,
  data,
  filtersEnabled = false,
  filters = { query: "", status: "all", risk: "all", sort: "updated_desc" }
}: {
  locale: Locale;
  data: InvestorDashboardData;
  filtersEnabled?: boolean;
  filters?: AllocationFilters;
}) {
  const t = getInvestorStrings(locale);
  const filterCopy = ALLOCATION_FILTER_COPY[locale] ?? ALLOCATION_FILTER_COPY.en;
  const source = filtersEnabled ? data.allocations : data.activeAllocations;
  const normalizedQuery = filters.query.trim().toLocaleLowerCase(locale);
  const filtered = source.filter((allocation) => {
    const matchesQuery = !normalizedQuery || `${allocation.supplyId} ${allocation.product}`.toLocaleLowerCase(locale).includes(normalizedQuery);
    const matchesStatus =
      filters.status === "all" ||
      (filters.status === "active" && !["completed", "paid_out", "loss"].includes(allocation.currentStage)) ||
      (filters.status === "completed" && ["completed", "paid_out"].includes(allocation.currentStage)) ||
      (filters.status === "loss" && allocation.currentStage === "loss");
    const matchesRisk = filters.risk === "all" || allocation.riskLevel === filters.risk;
    return matchesQuery && matchesStatus && matchesRisk;
  }).sort((left, right) => {
    if (filters.sort === "amount_desc") return right.investedAmount - left.investedAmount;
    if (filters.sort === "amount_asc") return left.investedAmount - right.investedAmount;
    if (filters.sort === "return_desc") return (right.comparisonResult ?? Number.NEGATIVE_INFINITY) - (left.comparisonResult ?? Number.NEGATIVE_INFINITY);
    return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
  });

  return (
    <div className="grid gap-4">
      {filtersEnabled ? (
        <form method="GET" className="grid gap-3 rounded-[1.35rem] border border-border bg-card p-4 dark:border-white/10 dark:bg-graphite-900/[0.72] md:grid-cols-[minmax(12rem,1fr)_auto_auto_auto_auto] md:items-end">
          <label className="grid gap-2"><span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{filterCopy.search}</span><input name="q" defaultValue={filters.query} className="h-11 rounded-xl border border-border bg-muted/30 px-3 text-sm text-foreground outline-none focus:border-gold-200/45 dark:border-white/10 dark:bg-black/20" /></label>
          <label className="grid gap-2"><span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{filterCopy.status}</span><select name="status" defaultValue={filters.status} className="h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground dark:border-white/10"><option value="all">{filterCopy.all}</option><option value="active">{filterCopy.active}</option><option value="completed">{filterCopy.completed}</option><option value="loss">{filterCopy.loss}</option></select></label>
          <label className="grid gap-2"><span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{filterCopy.risk}</span><select name="risk" defaultValue={filters.risk} className="h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground dark:border-white/10"><option value="all">{filterCopy.all}</option><option value="standard">{filterCopy.standard}</option><option value="monitored">{filterCopy.monitored}</option><option value="elevated">{filterCopy.elevated}</option></select></label>
          <label className="grid gap-2"><span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{filterCopy.sort}</span><select name="sort" defaultValue={filters.sort} className="h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground dark:border-white/10"><option value="updated_desc">{filterCopy.updatedDesc}</option><option value="amount_desc">{filterCopy.amountDesc}</option><option value="amount_asc">{filterCopy.amountAsc}</option><option value="return_desc">{filterCopy.returnDesc}</option></select></label>
          <button type="submit" className="min-h-11 rounded-full bg-foreground px-5 text-sm font-semibold text-background">{filterCopy.apply}</button>
        </form>
      ) : null}
      {filtered.length === 0 ? (
        <InvestorEmptyState title={t.alloc.noActiveTitle} description={filtersEnabled ? filterCopy.noMatches : t.alloc.noActiveDesc} />
      ) : (
        filtered.map((allocation) => <AllocationCard key={allocation.id} locale={locale} allocation={allocation} />)
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
  withdrawals,
  summary,
  withdrawalAccess
}: {
  locale: Locale;
  withdrawals: InvestorWithdrawal[];
  summary: InvestorDashboardData["summary"];
  withdrawalAccess: WithdrawalLockStatus;
}) {
  const t = getInvestorStrings(locale);
  const f = makeFormatters(locale, t);

  const pending = withdrawals.filter((withdrawal) => ["REQUESTED", "APPROVED"].includes(withdrawal.status));
  const scheduled = withdrawals.filter((withdrawal) => withdrawal.status === "SCHEDULED");
  const paid = withdrawals.filter((withdrawal) => withdrawal.status === "PAID");

  const available = Math.max(0, summary.realizedProfit - summary.totalPayouts - summary.pendingPayouts);

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
          <InvestorWithdrawalForm locale={locale} availableAmount={available} locked={withdrawalAccess.locked} unlockDate={withdrawalAccess.unlockDate} />
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

function KpiCard({ icon, label, value, hint, href }: { icon: React.ReactNode; label: string; value: string; hint?: string; href?: string }) {
  const card = (
    <Card className="rounded-[1.35rem] bg-card dark:bg-graphite-900/[0.72]">
      <CardContent className="p-5">
        <div className="mb-5 flex size-10 items-center justify-center rounded-full border border-gold-200/20 bg-gold-300/20 dark:bg-gold-200/10 text-amber-700 dark:text-gold-100">{icon}</div>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
        <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground">{value}</p>
        {hint ? <p className="mt-2 text-[0.7rem] leading-4 text-muted-foreground/80">{hint}</p> : null}
      </CardContent>
    </Card>
  );
  return href ? <Link href={href} className="block rounded-[1.35rem] transition-transform hover:-translate-y-0.5">{card}</Link> : card;
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
            <Badge>{enumLabel("allocationStatus", allocation.currentStage.toUpperCase(), locale)}</Badge>
            <Badge variant="secondary">{enumLabel("riskLevel", allocation.riskLevel.toUpperCase(), locale)}</Badge>
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
          <ProofLine label={t.alloc.expectedReturn} value={allocation.expectedReturn === null ? t.common.notAvailable : f.money(allocation.expectedReturn)} />
          <ProofLine label={t.alloc.expectedPayout} value={f.date(allocation.expectedPayoutAt)} />
          <ProofLine label={t.alloc.updated} value={f.date(allocation.updatedAt)} />
          <ProofLine label={t.alloc.proofHealth} value={allocation.proofHealth ? `${allocation.proofHealth.score}%` : t.alloc.underManagerReview} />
          <ProofLine label={t.alloc.riskVisibility} value={allocation.riskHealth ? enumLabel("riskLevel", allocation.riskHealth.level, locale) : t.alloc.underManagerReview} />
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

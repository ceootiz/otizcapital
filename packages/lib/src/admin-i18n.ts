import { defaultLocale, type Locale } from "./i18n";
import { CRM_VIEWS, type CrmSavedView, type CrmViewKey } from "./crm-views";
import type { ApplicationSlaFilter, ApplicationPriorityReason } from "./application-sla";

// ---------------------------------------------------------------------------
// Locale-aware formatting
// ---------------------------------------------------------------------------

export const adminLocaleTag: Record<Locale, string> = {
  en: "en-US",
  es: "es-ES",
  de: "de-DE",
  ru: "ru-RU",
  zh: "zh-CN"
};

export type AdminFormatters = {
  number: (value: number, options?: Intl.NumberFormatOptions) => string;
  currency: (value: number, currency?: string) => string;
  percent: (value: number, fractionDigits?: number) => string;
  date: (value: Date | string | number | null | undefined) => string;
  dateTime: (value: Date | string | number | null | undefined) => string;
};

function toDate(value: Date | string | number | null | undefined): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function createAdminFormatters(locale: Locale): AdminFormatters {
  const tag = adminLocaleTag[locale] ?? adminLocaleTag[defaultLocale];

  return {
    number: (value, options) => new Intl.NumberFormat(tag, options).format(value),
    currency: (value, currency = "USD") =>
      new Intl.NumberFormat(tag, { style: "currency", currency, maximumFractionDigits: 0 }).format(value),
    percent: (value, fractionDigits = 0) =>
      new Intl.NumberFormat(tag, { style: "percent", minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits }).format(value),
    date: (value) => {
      const date = toDate(value);
      return date ? new Intl.DateTimeFormat(tag, { dateStyle: "medium" }).format(date) : "—";
    },
    dateTime: (value) => {
      const date = toDate(value);
      return date ? new Intl.DateTimeFormat(tag, { dateStyle: "medium", timeStyle: "short" }).format(date) : "—";
    }
  };
}

// ---------------------------------------------------------------------------
// Localized enum labels
// ---------------------------------------------------------------------------

export type EnumGroup =
  | "withdrawalStatus"
  | "allocationStatus"
  | "riskLevel"
  | "payoutStatus"
  | "proofType"
  | "proofStatus"
  | "reinvestDecision"
  | "ledgerType"
  | "ledgerEntry"
  | "ledgerSourceType"
  | "ledgerReversalStatus"
  | "incidentSeverity"
  | "incidentStatus"
  | "riskSource"
  | "applicationStatus"
  | "applicationPriority"
  | "reinvestInterest"
  | "investorStatus"
  | "reportStatus"
  | "reconciliationState"
  | "readinessState"
  | "healthStatus"
  | "notificationChannel"
  | "notificationStatus"
  | "checkpointCategory"
  | "auditAction"
  | "applicationSort";

type LabelMap = Record<string, string>;

const EN: Record<EnumGroup, LabelMap> = {
  withdrawalStatus: { ALL: "All", REQUESTED: "Requested", APPROVED: "Approved", SCHEDULED: "Scheduled", PAID: "Paid", REJECTED: "Rejected", CANCELLED: "Cancelled" },
  allocationStatus: { ALL: "All", DRAFT: "Draft", PURCHASING: "Purchasing", SHIPPING: "Shipping", RECEIVED: "Received", SELLING: "Selling", COMPLETED: "Completed", CANCELED: "Canceled", LOSS: "Loss" },
  riskLevel: { ALL: "All", STANDARD: "Standard", MONITORED: "Monitored", ELEVATED: "Elevated" },
  payoutStatus: { ALL: "All", NOT_READY: "Not ready", PENDING: "Pending", APPROVED: "Approved", PAID: "Paid", REINVESTED: "Reinvested" },
  proofType: { SHIPMENT_PROOF: "Shipment proof", WAREHOUSE_MEDIA: "Warehouse media", MARKETPLACE_REPORT: "Marketplace report", PURCHASE_INVOICE: "Purchase invoice", PAYOUT_PROOF: "Payout proof", SERIAL_VERIFICATION: "Serial verification", OTHER: "Other" },
  proofStatus: { PENDING: "Pending", AVAILABLE: "Available", VERIFIED: "Verified", HIDDEN: "Hidden" },
  reinvestDecision: { UNDECIDED: "Undecided", REINVEST: "Reinvest", PAYOUT: "Payout" },
  ledgerType: { INVENTORY: "Inventory", CASH: "Cash", INVESTOR_LIABILITY: "Investor liability" },
  ledgerEntry: {
    UNITS_PURCHASED: "Units purchased", UNITS_RECEIVED: "Units received", UNITS_SOLD: "Units sold", UNITS_RETURNED: "Units returned", UNITS_REMAINING_ADJUSTMENT: "Remaining units adjustment",
    INVESTOR_CASH_IN: "Investor cash in", SUPPLIER_PAYMENT: "Supplier payment", LOGISTICS_COST: "Logistics cost", MARKETPLACE_SETTLEMENT: "Marketplace settlement", MARKETPLACE_FEE: "Marketplace fee", REFUND: "Refund", PAYOUT: "Payout", REINVESTMENT: "Reinvestment",
    CAPITAL_ALLOCATED: "Capital allocated", PROFIT_ACCRUED: "Profit accrued", PAYOUT_APPROVED: "Payout approved", PAYOUT_PAID: "Payout paid", REINVESTED: "Reinvested", LOSS_RECOGNIZED: "Loss recognized", LIABILITY_ADJUSTMENT: "Liability adjustment"
  },
  ledgerSourceType: { ALLOCATION: "Allocation", WITHDRAWAL_REQUEST: "Withdrawal request", MONTHLY_REPORT: "Monthly report", MANUAL_ADJUSTMENT: "Manual adjustment", MARKETPLACE_SETTLEMENT: "Marketplace settlement", PROOF_ARTIFACT: "Proof artifact", OTHER: "Other" },
  ledgerReversalStatus: { ALL: "All", ORIGINAL_ONLY: "Original only", REVERSALS_ONLY: "Reversals only", REVERSED_ONLY: "Reversed only", CORRECTED_ONLY: "Corrected only" },
  incidentSeverity: { ALL: "All", LOW: "Low", MEDIUM: "Medium", HIGH: "High", CRITICAL: "Critical" },
  incidentStatus: { ALL: "All", OPEN: "Open", ACKNOWLEDGED: "Acknowledged", RESOLVED: "Resolved" },
  riskSource: { ALL: "All", all: "All", risk_engine: "Risk engine", reconciliation: "Reconciliation", readiness: "Readiness", snapshot_integrity: "Snapshot integrity", withdrawal: "Withdrawal", proof_completeness: "Proof completeness", manual: "Manual", manual_evaluation: "Manual evaluation", report_snapshot: "Report snapshot", readiness_gate: "Readiness gate", unknown: "Unknown" },
  applicationStatus: { NEW: "New", REVIEWED: "Reviewed", APPROVED: "Approved", REJECTED: "Rejected", CONTACTED: "Contacted" },
  applicationPriority: { LOW: "Low", NORMAL: "Normal", HIGH: "High", VIP: "VIP" },
  reinvestInterest: { yes: "Yes", no: "No", not_sure: "Not sure" },
  investorStatus: { ACTIVE: "Active", PAUSED: "Paused", CLOSED: "Closed" },
  reportStatus: { DRAFT: "Draft", PUBLISHED: "Published", ARCHIVED: "Archived" },
  reconciliationState: { BALANCED: "Balanced", WARNING: "Warning", BROKEN: "Broken" },
  readinessState: { READY: "Ready", READY_WITH_WARNINGS: "Ready with warnings", NEEDS_REVIEW: "Needs review", BLOCKED: "Blocked" },
  healthStatus: { HEALTHY: "Healthy", ATTENTION: "Attention", CRITICAL: "Critical", WARNING: "Warning", BALANCED: "Balanced", BROKEN: "Broken" },
  notificationChannel: { EMAIL: "Email", TELEGRAM: "Telegram", IN_APP: "In app", WEBHOOK: "Webhook" },
  notificationStatus: { PENDING: "Pending", SENT: "Sent", FAILED: "Failed" },
  checkpointCategory: { READINESS: "Readiness", RECONCILIATION: "Reconciliation", RISK: "Risk", WITHDRAWALS: "Withdrawals", PROOF: "Proof completeness", NOTIFICATIONS: "Notifications", INCIDENTS: "Incidents", SNAPSHOT_INTEGRITY: "Snapshot integrity" },
  auditAction: { CREATE_READINESS_POLICY: "Create readiness policy", CREATE_AND_ACTIVATE_READINESS_POLICY: "Create and activate readiness policy", UPDATE_READINESS_POLICY: "Update readiness policy", ACTIVATE_READINESS_POLICY: "Activate readiness policy" },
  applicationSort: { smart: "Smart priority", newest: "Newest", oldest: "Oldest", "amount-desc": "Highest amount", "next-action": "Next action date" }
};

const RU: Record<EnumGroup, LabelMap> = {
  withdrawalStatus: { ALL: "Все", REQUESTED: "Запрошено", APPROVED: "Одобрено", SCHEDULED: "Запланировано", PAID: "Выплачено", REJECTED: "Отклонено", CANCELLED: "Отменено" },
  allocationStatus: { ALL: "Все", DRAFT: "Черновик", PURCHASING: "Закупка", SHIPPING: "Доставка", RECEIVED: "Получено", SELLING: "Продажа", COMPLETED: "Завершено", CANCELED: "Отменено", LOSS: "Убыток" },
  riskLevel: { ALL: "Все", STANDARD: "Стандартный", MONITORED: "Под наблюдением", ELEVATED: "Повышенный" },
  payoutStatus: { ALL: "Все", NOT_READY: "Не готово", PENDING: "В ожидании", APPROVED: "Одобрено", PAID: "Выплачено", REINVESTED: "Реинвестировано" },
  proofType: { SHIPMENT_PROOF: "Подтверждение отгрузки", WAREHOUSE_MEDIA: "Складские материалы", MARKETPLACE_REPORT: "Отчёт маркетплейса", PURCHASE_INVOICE: "Счёт на закупку", PAYOUT_PROOF: "Подтверждение выплаты", SERIAL_VERIFICATION: "Проверка серийных номеров", OTHER: "Другое" },
  proofStatus: { PENDING: "В ожидании", AVAILABLE: "Доступно", VERIFIED: "Проверено", HIDDEN: "Скрыто" },
  reinvestDecision: { UNDECIDED: "Не решено", REINVEST: "Реинвестировать", PAYOUT: "Выплата" },
  ledgerType: { INVENTORY: "Товар", CASH: "Денежные средства", INVESTOR_LIABILITY: "Обязательства перед инвестором" },
  ledgerEntry: {
    UNITS_PURCHASED: "Закуплено единиц", UNITS_RECEIVED: "Получено единиц", UNITS_SOLD: "Продано единиц", UNITS_RETURNED: "Возвращено единиц", UNITS_REMAINING_ADJUSTMENT: "Корректировка остатка",
    INVESTOR_CASH_IN: "Поступление от инвестора", SUPPLIER_PAYMENT: "Оплата поставщику", LOGISTICS_COST: "Логистические расходы", MARKETPLACE_SETTLEMENT: "Расчёт маркетплейса", MARKETPLACE_FEE: "Комиссия маркетплейса", REFUND: "Возврат", PAYOUT: "Выплата", REINVESTMENT: "Реинвестирование",
    CAPITAL_ALLOCATED: "Капитал распределён", PROFIT_ACCRUED: "Начислена прибыль", PAYOUT_APPROVED: "Выплата одобрена", PAYOUT_PAID: "Выплата произведена", REINVESTED: "Реинвестировано", LOSS_RECOGNIZED: "Признан убыток", LIABILITY_ADJUSTMENT: "Корректировка обязательств" },
  ledgerSourceType: { ALLOCATION: "Аллокация", WITHDRAWAL_REQUEST: "Запрос на вывод", MONTHLY_REPORT: "Ежемесячный отчёт", MANUAL_ADJUSTMENT: "Ручная корректировка", MARKETPLACE_SETTLEMENT: "Расчёт маркетплейса", PROOF_ARTIFACT: "Артефакт-подтверждение", OTHER: "Другое" },
  ledgerReversalStatus: { ALL: "Все", ORIGINAL_ONLY: "Только оригиналы", REVERSALS_ONLY: "Только сторно", REVERSED_ONLY: "Только сторнированные", CORRECTED_ONLY: "Только исправленные" },
  incidentSeverity: { ALL: "Все", LOW: "Низкая", MEDIUM: "Средняя", HIGH: "Высокая", CRITICAL: "Критическая" },
  incidentStatus: { ALL: "Все", OPEN: "Открыт", ACKNOWLEDGED: "Принят", RESOLVED: "Решён" },
  riskSource: { ALL: "Все", all: "Все", risk_engine: "Движок рисков", reconciliation: "Сверка", readiness: "Готовность", snapshot_integrity: "Целостность снимка", withdrawal: "Вывод средств", proof_completeness: "Полнота подтверждений", manual: "Вручную", manual_evaluation: "Ручная оценка", report_snapshot: "Снимок отчёта", readiness_gate: "Гейт готовности", unknown: "Неизвестно" },
  applicationStatus: { NEW: "Новая", REVIEWED: "Рассмотрена", APPROVED: "Одобрена", REJECTED: "Отклонена", CONTACTED: "Связались" },
  applicationPriority: { LOW: "Низкий", NORMAL: "Обычный", HIGH: "Высокий", VIP: "VIP" },
  reinvestInterest: { yes: "Да", no: "Нет", not_sure: "Не уверен" },
  investorStatus: { ACTIVE: "Активен", PAUSED: "Приостановлен", CLOSED: "Закрыт" },
  reportStatus: { DRAFT: "Черновик", PUBLISHED: "Опубликован", ARCHIVED: "В архиве" },
  reconciliationState: { BALANCED: "Сбалансировано", WARNING: "Предупреждение", BROKEN: "Нарушено" },
  readinessState: { READY: "Готов", READY_WITH_WARNINGS: "Готов с предупреждениями", NEEDS_REVIEW: "Требует проверки", BLOCKED: "Заблокирован" },
  healthStatus: { HEALTHY: "В норме", ATTENTION: "Внимание", CRITICAL: "Критично", WARNING: "Предупреждение", BALANCED: "Сбалансировано", BROKEN: "Нарушено" },
  notificationChannel: { EMAIL: "Email", TELEGRAM: "Telegram", IN_APP: "В приложении", WEBHOOK: "Webhook" },
  notificationStatus: { PENDING: "В ожидании", SENT: "Отправлено", FAILED: "Ошибка" },
  checkpointCategory: { READINESS: "Готовность", RECONCILIATION: "Сверка", RISK: "Риск", WITHDRAWALS: "Выводы", PROOF: "Полнота подтверждений", NOTIFICATIONS: "Уведомления", INCIDENTS: "Инциденты", SNAPSHOT_INTEGRITY: "Целостность снимка" },
  auditAction: { CREATE_READINESS_POLICY: "Создание политики готовности", CREATE_AND_ACTIVATE_READINESS_POLICY: "Создание и активация политики готовности", UPDATE_READINESS_POLICY: "Обновление политики готовности", ACTIVATE_READINESS_POLICY: "Активация политики готовности" },
  applicationSort: { smart: "Умный приоритет", newest: "Сначала новые", oldest: "Сначала старые", "amount-desc": "По сумме (убыв.)", "next-action": "По дате действия" }
};

const ENUM_LABELS: Partial<Record<Locale, Record<EnumGroup, LabelMap>>> = { en: EN, ru: RU };

/** Humanizes a raw enum token (e.g. "SHIPMENT_PROOF" -> "Shipment proof") as a fallback. */
export function humanizeToken(value: string): string {
  const cleaned = value.replace(/[_-]+/g, " ").trim().toLowerCase();
  if (!cleaned) return value;
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/** Localized label for an enum value, falling back to English then a humanized token. */
export function enumLabel(group: EnumGroup, value: string | null | undefined, locale: Locale): string {
  if (value === null || value === undefined || value === "") return "—";
  const localized = ENUM_LABELS[locale]?.[group]?.[value];
  if (localized) return localized;
  const english = EN[group]?.[value];
  if (english) return english;
  return humanizeToken(value);
}

// ---------------------------------------------------------------------------
// Localized CRM saved views
// ---------------------------------------------------------------------------

const CRM_VIEW_RU: Record<CrmViewKey, { label: string; description: string }> = {
  all: { label: "Все", description: "Полная очередь CRM" },
  new: { label: "Новые", description: "Свежие заявки" },
  contacted: { label: "Связались", description: "Менеджер связался" },
  approved: { label: "Одобрены", description: "Готовы двигаться дальше" },
  vip: { label: "VIP", description: "Высший приоритет" },
  "high-priority": { label: "Высокий приоритет", description: "Требуют внимания" },
  overdue: { label: "Просрочены", description: "Просрочено следующее действие" },
  "reinvest-interested": { label: "Интерес к реинвесту", description: "Намерение реинвестировать" },
  "needs-first-contact": { label: "Нужен первый контакт", description: "Новые и без контакта" },
  "due-today": { label: "Срок сегодня", description: "Открытые задачи на сегодня" },
  "ready-for-agreement": { label: "Готовы к соглашению", description: "Подготовка соглашения" },
  "waiting-decision": { label: "Ожидают решения", description: "Связались, не просрочено" },
  "high-value": { label: "Крупные лиды", description: "Планируется $25k+" },
  stale: { label: "Залежавшиеся лиды", description: "7+ дней без активности" }
};

export function getCrmViews(locale: Locale): CrmSavedView[] {
  if (locale !== "ru") return CRM_VIEWS;
  return CRM_VIEWS.map((view) => ({ ...view, ...CRM_VIEW_RU[view.key] }));
}

// ---------------------------------------------------------------------------
// Localized SLA badge + priority reason labels (keyed by stable filter/key)
// ---------------------------------------------------------------------------

export const SLA_BADGE_LABELS: Record<Locale, Record<ApplicationSlaFilter, { label: string; shortLabel: string }>> = {
  en: {
    "first-contact-overdue": { label: "First contact overdue", shortLabel: "First contact" },
    "due-soon": { label: "Due soon", shortLabel: "Due soon" },
    overdue: { label: "Overdue", shortLabel: "Overdue" },
    "high-value-no-contact": { label: "High value no contact", shortLabel: "High value" }
  },
  ru: {
    "first-contact-overdue": { label: "Просрочен первый контакт", shortLabel: "Первый контакт" },
    "due-soon": { label: "Скоро срок", shortLabel: "Скоро срок" },
    overdue: { label: "Просрочено", shortLabel: "Просрочено" },
    "high-value-no-contact": { label: "Крупный лид без контакта", shortLabel: "Крупный лид" }
  },
  es: {} as Record<ApplicationSlaFilter, { label: string; shortLabel: string }>,
  de: {} as Record<ApplicationSlaFilter, { label: string; shortLabel: string }>,
  zh: {} as Record<ApplicationSlaFilter, { label: string; shortLabel: string }>
};

const PRIORITY_REASON_RU: Record<ApplicationPriorityReason["key"], string> = {
  "next-action-overdue": "Просрочено следующее действие",
  "first-contact-overdue": "Просрочен первый контакт",
  "high-value-no-contact": "Крупный лид без контакта",
  "due-soon": "Скоро срок",
  "vip-priority": "VIP-приоритет",
  "high-priority": "Высокий приоритет",
  "new-lead": "Новый лид"
};

export function slaBadgeLabel(filter: ApplicationSlaFilter, locale: Locale, short = false): string {
  const map = SLA_BADGE_LABELS[locale]?.[filter] ?? SLA_BADGE_LABELS.en[filter];
  return short ? map.shortLabel : map.label;
}

export function priorityReasonLabel(reason: ApplicationPriorityReason, locale: Locale): string {
  if (locale === "ru") return PRIORITY_REASON_RU[reason.key] ?? reason.label;
  return reason.label;
}

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
  | "proofCompletenessState"
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
  proofCompletenessState: { VERIFIED: "Verified", PARTIAL: "Partially complete", INCOMPLETE: "Documents missing", HIGH_RISK: "Needs urgent review" },
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
  proofCompletenessState: { VERIFIED: "Проверено", PARTIAL: "Заполнено частично", INCOMPLETE: "Не хватает документов", HIGH_RISK: "Требует срочной проверки" },
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

const ES: Record<EnumGroup, LabelMap> = {
  withdrawalStatus: { ALL: "Todos", REQUESTED: "Solicitado", APPROVED: "Aprobado", SCHEDULED: "Programado", PAID: "Pagado", REJECTED: "Rechazado", CANCELLED: "Cancelado" },
  allocationStatus: { ALL: "Todos", DRAFT: "Borrador", PURCHASING: "Compra", SHIPPING: "Envío", RECEIVED: "Recibido", SELLING: "En venta", COMPLETED: "Completado", CANCELED: "Cancelado", LOSS: "Pérdida" },
  riskLevel: { ALL: "Todos", STANDARD: "Estándar", MONITORED: "En seguimiento", ELEVATED: "Requiere atención" },
  payoutStatus: { ALL: "Todos", NOT_READY: "No preparado", PENDING: "Pendiente", APPROVED: "Aprobado", PAID: "Pagado", REINVESTED: "Reinvertido" },
  proofType: { SHIPMENT_PROOF: "Comprobante de envío", WAREHOUSE_MEDIA: "Material de almacén", MARKETPLACE_REPORT: "Informe del marketplace", PURCHASE_INVOICE: "Factura de compra", PAYOUT_PROOF: "Comprobante de pago", SERIAL_VERIFICATION: "Verificación de números de serie", OTHER: "Otro" },
  proofStatus: { PENDING: "Pendiente", AVAILABLE: "Disponible", VERIFIED: "Verificado", HIDDEN: "Oculto" },
  proofCompletenessState: { VERIFIED: "Verificado", PARTIAL: "Parcialmente completo", INCOMPLETE: "Faltan documentos", HIGH_RISK: "Revisión urgente" },
  reinvestDecision: { UNDECIDED: "Sin decidir", REINVEST: "Reinvertir", PAYOUT: "Pagar" },
  ledgerType: { INVENTORY: "Inventario", CASH: "Efectivo", INVESTOR_LIABILITY: "Obligación con el inversor" },
  ledgerEntry: { UNITS_PURCHASED: "Unidades compradas", UNITS_RECEIVED: "Unidades recibidas", UNITS_SOLD: "Unidades vendidas", UNITS_RETURNED: "Unidades devueltas", UNITS_REMAINING_ADJUSTMENT: "Ajuste de unidades restantes", INVESTOR_CASH_IN: "Ingreso del inversor", SUPPLIER_PAYMENT: "Pago al proveedor", LOGISTICS_COST: "Coste logístico", MARKETPLACE_SETTLEMENT: "Liquidación del marketplace", MARKETPLACE_FEE: "Comisión del marketplace", REFUND: "Reembolso", PAYOUT: "Pago", REINVESTMENT: "Reinversión", CAPITAL_ALLOCATED: "Capital asignado", PROFIT_ACCRUED: "Beneficio reconocido", PAYOUT_APPROVED: "Pago aprobado", PAYOUT_PAID: "Pago realizado", REINVESTED: "Reinvertido", LOSS_RECOGNIZED: "Pérdida reconocida", LIABILITY_ADJUSTMENT: "Ajuste de obligación" },
  ledgerSourceType: { ALLOCATION: "Operación", WITHDRAWAL_REQUEST: "Solicitud de retiro", MONTHLY_REPORT: "Informe mensual", MANUAL_ADJUSTMENT: "Ajuste manual", MARKETPLACE_SETTLEMENT: "Liquidación del marketplace", PROOF_ARTIFACT: "Documento de respaldo", OTHER: "Otro" },
  ledgerReversalStatus: { ALL: "Todos", ORIGINAL_ONLY: "Solo originales", REVERSALS_ONLY: "Solo reversiones", REVERSED_ONLY: "Solo revertidos", CORRECTED_ONLY: "Solo corregidos" },
  incidentSeverity: { ALL: "Todas", LOW: "Baja", MEDIUM: "Media", HIGH: "Alta", CRITICAL: "Crítica" },
  incidentStatus: { ALL: "Todos", OPEN: "Abierto", ACKNOWLEDGED: "En revisión", RESOLVED: "Resuelto" },
  riskSource: { ALL: "Todos", all: "Todos", risk_engine: "Evaluación de riesgo", reconciliation: "Verificación", readiness: "Preparación", snapshot_integrity: "Integridad del informe", withdrawal: "Retiro", proof_completeness: "Estado de documentos", manual: "Manual", manual_evaluation: "Evaluación manual", report_snapshot: "Copia del informe", readiness_gate: "Revisión de preparación", unknown: "Desconocido" },
  applicationStatus: { NEW: "Nueva", REVIEWED: "Revisada", APPROVED: "Aprobada", REJECTED: "Rechazada", CONTACTED: "Contactada" },
  applicationPriority: { LOW: "Baja", NORMAL: "Normal", HIGH: "Alta", VIP: "VIP" },
  reinvestInterest: { yes: "Sí", no: "No", not_sure: "No está seguro" },
  investorStatus: { ACTIVE: "Activo", PAUSED: "En pausa", CLOSED: "Cerrado" },
  reportStatus: { DRAFT: "Borrador", PUBLISHED: "Publicado", ARCHIVED: "Archivado" },
  reconciliationState: { BALANCED: "Verificado", WARNING: "Requiere atención", BROKEN: "No coincide" },
  readinessState: { READY: "Preparado", READY_WITH_WARNINGS: "Preparado con observaciones", NEEDS_REVIEW: "Requiere revisión", BLOCKED: "Bloqueado" },
  healthStatus: { HEALTHY: "Correcto", ATTENTION: "Atención", CRITICAL: "Crítico", WARNING: "Advertencia", BALANCED: "Verificado", BROKEN: "No coincide" },
  notificationChannel: { EMAIL: "Correo", TELEGRAM: "Telegram", IN_APP: "En la aplicación", WEBHOOK: "Webhook" },
  notificationStatus: { PENDING: "Pendiente", SENT: "Enviado", FAILED: "Error" },
  checkpointCategory: { READINESS: "Preparación", RECONCILIATION: "Verificación", RISK: "Riesgo", WITHDRAWALS: "Retiros", PROOF: "Documentos", NOTIFICATIONS: "Notificaciones", INCIDENTS: "Incidencias", SNAPSHOT_INTEGRITY: "Integridad del informe" },
  auditAction: { CREATE_READINESS_POLICY: "Crear política de preparación", CREATE_AND_ACTIVATE_READINESS_POLICY: "Crear y activar política de preparación", UPDATE_READINESS_POLICY: "Actualizar política de preparación", ACTIVATE_READINESS_POLICY: "Activar política de preparación" },
  applicationSort: { smart: "Prioridad recomendada", newest: "Más recientes", oldest: "Más antiguas", "amount-desc": "Mayor importe", "next-action": "Próxima acción" }
};

const DE: Record<EnumGroup, LabelMap> = {
  withdrawalStatus: { ALL: "Alle", REQUESTED: "Beantragt", APPROVED: "Genehmigt", SCHEDULED: "Geplant", PAID: "Bezahlt", REJECTED: "Abgelehnt", CANCELLED: "Storniert" },
  allocationStatus: { ALL: "Alle", DRAFT: "Entwurf", PURCHASING: "Einkauf", SHIPPING: "Versand", RECEIVED: "Eingegangen", SELLING: "Im Verkauf", COMPLETED: "Abgeschlossen", CANCELED: "Storniert", LOSS: "Verlust" },
  riskLevel: { ALL: "Alle", STANDARD: "Standard", MONITORED: "Unter Beobachtung", ELEVATED: "Aufmerksamkeit erforderlich" },
  payoutStatus: { ALL: "Alle", NOT_READY: "Nicht bereit", PENDING: "Ausstehend", APPROVED: "Genehmigt", PAID: "Bezahlt", REINVESTED: "Reinvestiert" },
  proofType: { SHIPMENT_PROOF: "Versandnachweis", WAREHOUSE_MEDIA: "Lagermaterial", MARKETPLACE_REPORT: "Marktplatzbericht", PURCHASE_INVOICE: "Einkaufsrechnung", PAYOUT_PROOF: "Auszahlungsnachweis", SERIAL_VERIFICATION: "Seriennummernprüfung", OTHER: "Sonstiges" },
  proofStatus: { PENDING: "Ausstehend", AVAILABLE: "Verfügbar", VERIFIED: "Geprüft", HIDDEN: "Ausgeblendet" },
  proofCompletenessState: { VERIFIED: "Geprüft", PARTIAL: "Teilweise vollständig", INCOMPLETE: "Dokumente fehlen", HIGH_RISK: "Dringende Prüfung" },
  reinvestDecision: { UNDECIDED: "Nicht entschieden", REINVEST: "Reinvestieren", PAYOUT: "Auszahlen" },
  ledgerType: { INVENTORY: "Bestand", CASH: "Geldmittel", INVESTOR_LIABILITY: "Verbindlichkeit gegenüber Investor" },
  ledgerEntry: { UNITS_PURCHASED: "Einheiten gekauft", UNITS_RECEIVED: "Einheiten eingegangen", UNITS_SOLD: "Einheiten verkauft", UNITS_RETURNED: "Einheiten zurückgegeben", UNITS_REMAINING_ADJUSTMENT: "Restbestandskorrektur", INVESTOR_CASH_IN: "Einzahlung des Investors", SUPPLIER_PAYMENT: "Lieferantenzahlung", LOGISTICS_COST: "Logistikkosten", MARKETPLACE_SETTLEMENT: "Marktplatzabrechnung", MARKETPLACE_FEE: "Marktplatzgebühr", REFUND: "Rückerstattung", PAYOUT: "Auszahlung", REINVESTMENT: "Reinvestition", CAPITAL_ALLOCATED: "Kapital zugewiesen", PROFIT_ACCRUED: "Gewinn erfasst", PAYOUT_APPROVED: "Auszahlung genehmigt", PAYOUT_PAID: "Auszahlung erfolgt", REINVESTED: "Reinvestiert", LOSS_RECOGNIZED: "Verlust erfasst", LIABILITY_ADJUSTMENT: "Verbindlichkeitskorrektur" },
  ledgerSourceType: { ALLOCATION: "Geschäft", WITHDRAWAL_REQUEST: "Auszahlungsantrag", MONTHLY_REPORT: "Monatsbericht", MANUAL_ADJUSTMENT: "Manuelle Korrektur", MARKETPLACE_SETTLEMENT: "Marktplatzabrechnung", PROOF_ARTIFACT: "Nachweisdokument", OTHER: "Sonstiges" },
  ledgerReversalStatus: { ALL: "Alle", ORIGINAL_ONLY: "Nur Originale", REVERSALS_ONLY: "Nur Stornos", REVERSED_ONLY: "Nur stornierte", CORRECTED_ONLY: "Nur korrigierte" },
  incidentSeverity: { ALL: "Alle", LOW: "Niedrig", MEDIUM: "Mittel", HIGH: "Hoch", CRITICAL: "Kritisch" },
  incidentStatus: { ALL: "Alle", OPEN: "Offen", ACKNOWLEDGED: "In Prüfung", RESOLVED: "Gelöst" },
  riskSource: { ALL: "Alle", all: "Alle", risk_engine: "Risikobewertung", reconciliation: "Prüfung", readiness: "Bereitschaft", snapshot_integrity: "Berichtsintegrität", withdrawal: "Auszahlung", proof_completeness: "Dokumentenstatus", manual: "Manuell", manual_evaluation: "Manuelle Bewertung", report_snapshot: "Berichtskopie", readiness_gate: "Bereitschaftsprüfung", unknown: "Unbekannt" },
  applicationStatus: { NEW: "Neu", REVIEWED: "Geprüft", APPROVED: "Genehmigt", REJECTED: "Abgelehnt", CONTACTED: "Kontaktiert" },
  applicationPriority: { LOW: "Niedrig", NORMAL: "Normal", HIGH: "Hoch", VIP: "VIP" },
  reinvestInterest: { yes: "Ja", no: "Nein", not_sure: "Unsicher" },
  investorStatus: { ACTIVE: "Aktiv", PAUSED: "Pausiert", CLOSED: "Geschlossen" },
  reportStatus: { DRAFT: "Entwurf", PUBLISHED: "Veröffentlicht", ARCHIVED: "Archiviert" },
  reconciliationState: { BALANCED: "Geprüft", WARNING: "Aufmerksamkeit erforderlich", BROKEN: "Abweichung" },
  readinessState: { READY: "Bereit", READY_WITH_WARNINGS: "Bereit mit Hinweisen", NEEDS_REVIEW: "Prüfung erforderlich", BLOCKED: "Blockiert" },
  healthStatus: { HEALTHY: "In Ordnung", ATTENTION: "Achtung", CRITICAL: "Kritisch", WARNING: "Warnung", BALANCED: "Geprüft", BROKEN: "Abweichung" },
  notificationChannel: { EMAIL: "E-Mail", TELEGRAM: "Telegram", IN_APP: "In der Anwendung", WEBHOOK: "Webhook" },
  notificationStatus: { PENDING: "Ausstehend", SENT: "Gesendet", FAILED: "Fehler" },
  checkpointCategory: { READINESS: "Bereitschaft", RECONCILIATION: "Prüfung", RISK: "Risiko", WITHDRAWALS: "Auszahlungen", PROOF: "Dokumente", NOTIFICATIONS: "Benachrichtigungen", INCIDENTS: "Vorfälle", SNAPSHOT_INTEGRITY: "Berichtsintegrität" },
  auditAction: { CREATE_READINESS_POLICY: "Bereitschaftsregel erstellen", CREATE_AND_ACTIVATE_READINESS_POLICY: "Bereitschaftsregel erstellen und aktivieren", UPDATE_READINESS_POLICY: "Bereitschaftsregel aktualisieren", ACTIVATE_READINESS_POLICY: "Bereitschaftsregel aktivieren" },
  applicationSort: { smart: "Empfohlene Priorität", newest: "Neueste zuerst", oldest: "Älteste zuerst", "amount-desc": "Höchster Betrag", "next-action": "Nächste Aktion" }
};

const ZH: Record<EnumGroup, LabelMap> = {
  withdrawalStatus: { ALL: "全部", REQUESTED: "已申请", APPROVED: "已批准", SCHEDULED: "已安排", PAID: "已支付", REJECTED: "已拒绝", CANCELLED: "已取消" },
  allocationStatus: { ALL: "全部", DRAFT: "草稿", PURCHASING: "采购中", SHIPPING: "运输中", RECEIVED: "已入库", SELLING: "销售中", COMPLETED: "已完成", CANCELED: "已取消", LOSS: "亏损" },
  riskLevel: { ALL: "全部", STANDARD: "正常", MONITORED: "跟进中", ELEVATED: "需要关注" },
  payoutStatus: { ALL: "全部", NOT_READY: "尚未就绪", PENDING: "待处理", APPROVED: "已批准", PAID: "已支付", REINVESTED: "已复投" },
  proofType: { SHIPMENT_PROOF: "发货凭证", WAREHOUSE_MEDIA: "仓库资料", MARKETPLACE_REPORT: "平台报告", PURCHASE_INVOICE: "采购发票", PAYOUT_PROOF: "付款凭证", SERIAL_VERIFICATION: "序列号核验", OTHER: "其他" },
  proofStatus: { PENDING: "待处理", AVAILABLE: "可用", VERIFIED: "已核验", HIDDEN: "已隐藏" },
  proofCompletenessState: { VERIFIED: "已核验", PARTIAL: "部分完整", INCOMPLETE: "缺少文件", HIGH_RISK: "需要紧急审核" },
  reinvestDecision: { UNDECIDED: "未决定", REINVEST: "复投", PAYOUT: "支付" },
  ledgerType: { INVENTORY: "库存", CASH: "资金", INVESTOR_LIABILITY: "投资者应付款" },
  ledgerEntry: { UNITS_PURCHASED: "已采购数量", UNITS_RECEIVED: "已入库数量", UNITS_SOLD: "已售数量", UNITS_RETURNED: "退回数量", UNITS_REMAINING_ADJUSTMENT: "剩余数量调整", INVESTOR_CASH_IN: "投资者入金", SUPPLIER_PAYMENT: "供应商付款", LOGISTICS_COST: "物流成本", MARKETPLACE_SETTLEMENT: "平台结算", MARKETPLACE_FEE: "平台费用", REFUND: "退款", PAYOUT: "付款", REINVESTMENT: "复投", CAPITAL_ALLOCATED: "资金已分配", PROFIT_ACCRUED: "收益已确认", PAYOUT_APPROVED: "付款已批准", PAYOUT_PAID: "付款已完成", REINVESTED: "已复投", LOSS_RECOGNIZED: "亏损已确认", LIABILITY_ADJUSTMENT: "应付款调整" },
  ledgerSourceType: { ALLOCATION: "项目", WITHDRAWAL_REQUEST: "提现申请", MONTHLY_REPORT: "月度报告", MANUAL_ADJUSTMENT: "手动调整", MARKETPLACE_SETTLEMENT: "平台结算", PROOF_ARTIFACT: "支持文件", OTHER: "其他" },
  ledgerReversalStatus: { ALL: "全部", ORIGINAL_ONLY: "仅原始记录", REVERSALS_ONLY: "仅冲销记录", REVERSED_ONLY: "仅已冲销", CORRECTED_ONLY: "仅已更正" },
  incidentSeverity: { ALL: "全部", LOW: "低", MEDIUM: "中", HIGH: "高", CRITICAL: "严重" },
  incidentStatus: { ALL: "全部", OPEN: "待处理", ACKNOWLEDGED: "审核中", RESOLVED: "已解决" },
  riskSource: { ALL: "全部", all: "全部", risk_engine: "风险评估", reconciliation: "核对", readiness: "准备状态", snapshot_integrity: "报告完整性", withdrawal: "提现", proof_completeness: "文件状态", manual: "手动", manual_evaluation: "手动评估", report_snapshot: "报告副本", readiness_gate: "准备审核", unknown: "未知" },
  applicationStatus: { NEW: "新申请", REVIEWED: "已审核", APPROVED: "已批准", REJECTED: "已拒绝", CONTACTED: "已联系" },
  applicationPriority: { LOW: "低", NORMAL: "普通", HIGH: "高", VIP: "VIP" },
  reinvestInterest: { yes: "是", no: "否", not_sure: "不确定" },
  investorStatus: { ACTIVE: "活跃", PAUSED: "已暂停", CLOSED: "已关闭" },
  reportStatus: { DRAFT: "草稿", PUBLISHED: "已发布", ARCHIVED: "已归档" },
  reconciliationState: { BALANCED: "已核对", WARNING: "需要关注", BROKEN: "存在差异" },
  readinessState: { READY: "已就绪", READY_WITH_WARNINGS: "已就绪但有提示", NEEDS_REVIEW: "需要审核", BLOCKED: "已阻止" },
  healthStatus: { HEALTHY: "正常", ATTENTION: "注意", CRITICAL: "严重", WARNING: "警告", BALANCED: "已核对", BROKEN: "存在差异" },
  notificationChannel: { EMAIL: "电子邮件", TELEGRAM: "Telegram", IN_APP: "应用内", WEBHOOK: "Webhook" },
  notificationStatus: { PENDING: "待处理", SENT: "已发送", FAILED: "失败" },
  checkpointCategory: { READINESS: "准备状态", RECONCILIATION: "核对", RISK: "风险", WITHDRAWALS: "提现", PROOF: "文件", NOTIFICATIONS: "通知", INCIDENTS: "事件", SNAPSHOT_INTEGRITY: "报告完整性" },
  auditAction: { CREATE_READINESS_POLICY: "创建准备规则", CREATE_AND_ACTIVATE_READINESS_POLICY: "创建并启用准备规则", UPDATE_READINESS_POLICY: "更新准备规则", ACTIVATE_READINESS_POLICY: "启用准备规则" },
  applicationSort: { smart: "推荐优先级", newest: "最新优先", oldest: "最早优先", "amount-desc": "金额从高到低", "next-action": "下一步操作" }
};

const ENUM_LABELS: Partial<Record<Locale, Record<EnumGroup, LabelMap>>> = { en: EN, ru: RU, es: ES, de: DE, zh: ZH };

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

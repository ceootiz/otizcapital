"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, FileText, PackageCheck, Save } from "lucide-react";
import { createAdminFormatters, enumLabel, type Locale } from "@otiz/lib";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Separator } from "@otiz/ui";

const STRINGS = {
  en: {
    BACK_TO_INVESTOR: "Back to investor",
    EYEBROW: "Allocation detail",
    AMOUNT: "Amount",
    ALL: "All",
    OVERVIEW_TITLE: "Allocation overview",
    OVERVIEW_DESC: "Operational state and manager-controlled payout/reinvest metadata.",
    PROOF_COMPLETENESS_TITLE: "Proof completeness",
    PROOF_COMPLETENESS_DESC: "Evidence score from investor-visible proofs, policy requirements, and report linkage.",
    PROOF_GUIDE_TITLE: "Proof requirements guide",
    PROOF_GUIDE_DESC: "Operator guide for V2 proof score components. Missing evidence is shown first.",
    RISK_ENGINE_TITLE: "Risk engine",
    RISK_ENGINE_DESC: "Operational risk layer across inventory, cash, proof, payout, reconciliation, and concentration controls.",
    RISK_TIMELINE_TITLE: "Risk timeline",
    RISK_TIMELINE_DESC: "Risk evaluation events recorded from report snapshots or explicit admin evaluation.",
    RISK_TIMELINE_EMPTY: "No risk evaluation events recorded for this allocation yet.",
    RECONCILIATION_TITLE: "Reconciliation",
    RECONCILIATION_DESC: "Three-ledger control view for inventory, cash, and investor liability.",
    STATUS_TIMELINE_TITLE: "Status timeline",
    STATUS_TIMELINE_DESC: "Calm operational lifecycle for this supply allocation.",
    AUDIT_TITLE: "Audit and notifications",
    AUDIT_DESC: "Recent internal control events.",
    EDIT_TITLE: "Edit allocation",
    EDIT_DESC: "No automatic profit calculation or payment movement happens here.",
    PREVIEW_TITLE: "Investor-visible preview",
    PREVIEW_DESC: "Admin notes, hidden proof counts, raw risk factors, and audit history are not exposed to investors.",
    ADD_LEDGER_TITLE: "Add ledger entry",
    ADD_LEDGER_DESC: "Ledger entries update three-ledger reconciliation. This records metadata only; no banking, marketplace, or payout execution happens here.",
    CREATE_PROOF_TITLE: "Create proof placeholder",
    CREATE_PROOF_DESC: "Metadata only. No file upload or external storage.",
    PROOF_LIST_TITLE: "Proof list",
    PROOF_LIST_DESC: "Shipment, warehouse, marketplace, invoice, payout, and serial verification placeholders.",
    INVESTOR: "Investor",
    MARKETPLACE: "Marketplace",
    EXPECTED_CYCLE: "Expected cycle",
    EXPECTED_PAYOUT: "Expected payout",
    RISK_LEVEL: "Risk level",
    ESTIMATED_RESULT: "Estimated result",
    ACTUAL_PROFIT: "Actual profit",
    STARTED_COMPLETED: "Started / completed",
    DAYS: "days",
    NOT_SET: "Not set",
    NOT_BOOKED: "Not booked",
    SCORE: "Score",
    STATE: "State",
    THRESHOLD: "threshold",
    PRESENT_CATEGORIES: "Present categories",
    MISSING_REQUIRED: "Missing required",
    MISSING_RECOMMENDED: "Missing recommended",
    HIDDEN_REJECTED_UNREVIEWED: "Hidden / rejected / unreviewed",
    NONE: "None",
    HOW_TO_SATISFY: "How to satisfy this requirement",
    ACCEPTED_PROOF_TYPES: "Accepted proof types:",
    EXPECTED_METADATA: "Expected metadata:",
    INVESTOR_VISIBILITY: "Investor visibility:",
    NOT_EVALUATED: "Not evaluated",
    NO_PROOF_PLACEHOLDER: "No proof placeholder; use report linkage.",
    METADATA_LABEL: "Metadata:",
    COMMON_MISTAKES: "Common mistakes:",
    MISSING: "Missing",
    REQUIRED: "Required",
    RECOMMENDED: "Recommended",
    OPTIONAL: "Optional",
    RISK_SCORE: "risk score",
    FACTORS: "factor(s)",
    ADMIN_SUMMARY: "Admin summary",
    INVESTOR_SAFE_SUMMARY: "Investor-safe summary",
    EVALUATE_RISK_HELP: "Records a new risk evaluation event using current ledger, proof, payout, and reconciliation data.",
    EVALUATE_RISK: "Evaluate risk now",
    EVALUATING: "Evaluating...",
    BLOCKING_RISK_ISSUES: "Blocking risk issues",
    NO_BLOCKING_RISK: "No critical allocation risk issues.",
    RISK_WARNINGS: "Risk warnings",
    NO_RISK_WARNINGS: "No operational risk warnings.",
    RECOMMENDED_ACTIONS: "Recommended actions",
    RISK_ENGINE_UNAVAILABLE: "Risk engine unavailable",
    SCORE_WORD: "score",
    LEDGER_ENTRIES: "ledger entries",
    INVENTORY: "Inventory",
    INV_PURCHASED: "purchased",
    INV_RECEIVED: "received",
    INV_SOLD: "sold",
    INV_REMAINING: "remaining",
    CASH_NET_POSITION: "Cash net position",
    INVESTOR_LIABILITY_OUTSTANDING: "Investor liability outstanding",
    LATEST_LEDGER_ENTRY: "Latest ledger entry",
    BLOCKING_ISSUES: "Blocking issues",
    NO_BLOCKING_RECON: "No blocking reconciliation issues.",
    WARNINGS: "Warnings",
    NO_RECON_WARNINGS: "No reconciliation warnings.",
    LEDGER_FILTERS: "Ledger filters",
    LEDGER_FILTERS_HELP: "Manager search over ledger entries. Exports use the current filter fields. Reconciliation totals remain based on the full ledger. CSV exports are audit logged.",
    FILTERED_ENTRIES: "filtered entries",
    SHOWING_LATEST: "Showing latest entries",
    LEDGER_TYPE: "Ledger type",
    ENTRY_TYPE: "Entry type",
    SOURCE_TYPE: "Source type",
    REVERSAL_STATUS: "Reversal status",
    DATE_FROM: "Date from",
    DATE_TO: "Date to",
    MIN_AMOUNT: "Min amount",
    MAX_AMOUNT: "Max amount",
    LIMIT: "Limit",
    SEARCH_DESC: "Search description/source ID",
    APPLY_FILTERS: "Apply filters",
    FILTERING: "Filtering...",
    CLEAR_FILTERS: "Clear filters",
    EXPORT_CSV: "Export CSV",
    FILTERED_LEDGER_ENTRIES: "Filtered ledger entries",
    LATEST_LEDGER_ENTRIES: "Latest ledger entries",
    NO_ENTRIES_MATCH: "No ledger entries match the current filters.",
    NO_ENTRIES_YET: "No ledger entries recorded yet.",
    REVERSAL: "Reversal",
    REVERSED: "Reversed",
    CORRECTED: "Corrected",
    REVERSES_ENTRY: "Reverses entry",
    VOIDED: "Voided",
    BY: "by",
    ADMIN: "admin",
    CORRECTED_BY_ENTRY: "Corrected by entry",
    UNITS: "units",
    AUDIT_TRAIL: "Audit trail",
    HIDE_AUDIT_TRAIL: "Hide audit trail",
    REVERSE_ENTRY: "Reverse entry",
    REVERSAL_HELP: "This does not edit history. It creates an offsetting reversal entry.",
    REVERSAL_REASON_PLACEHOLDER: "Reason for reversal",
    CONFIRM_REVERSAL: "Confirm reversal",
    REVERSING: "Reversing...",
    CANCEL: "Cancel",
    RECON_NOT_EVALUATED: "Reconciliation not evaluated",
    AUDIT_EVENTS: "Audit events",
    NOTIFICATION_EVENTS: "Notification events",
    STATUS: "Status",
    PAYOUT_STATUS: "Payout status",
    REINVEST_DECISION: "Reinvest decision",
    EXPECTED_DAYS: "Expected days",
    NOTES: "Notes",
    SAVE_ALLOCATION: "Save allocation",
    SAVING: "Saving...",
    MARK_COMPLETED: "Mark completed",
    MARK_LOSS: "Mark loss",
    PRODUCT: "Product",
    STAGE: "Stage",
    RISK: "Risk",
    PROOF_HEALTH: "Proof health",
    INVESTOR_SUMMARY: "Investor summary",
    RISK_SUMMARY: "Risk summary",
    UNDER_MANAGER_REVIEW: "Under manager review",
    EVIDENCE_UNDER_REVIEW: "Evidence coverage is under manager review.",
    RISK_UNDER_REVIEW: "Operational risk is under manager review.",
    CURRENCY: "Currency",
    QUANTITY: "Quantity",
    UNIT_COST: "Unit cost",
    OCCURRED_AT: "Occurred at",
    SOURCE_ID: "Source ID",
    DESCRIPTION: "Description",
    METADATA_JSON: "Metadata JSON",
    LEDGER_DESC_PLACEHOLDER: "Operational source note for this ledger entry.",
    CREATE_LEDGER_ENTRY: "Create ledger entry",
    CREATING: "Creating...",
    TYPE: "Type",
    TITLE: "Title",
    PROOF_URL: "Proof URL",
    CREATE_PROOF: "Create proof",
    NO_DESCRIPTION: "No description.",
    EMPTY_TITLE: "No proof placeholders yet",
    EMPTY_DESC: "Create metadata placeholders as documentation becomes available.",
    LOADING: "Loading...",
    EVENTS: "event(s)",
    DETAILS: "Details",
    SOURCE: "Source",
    UNABLE_LOAD_TIMELINE: "Unable to load risk timeline.",
    NO_DIFF: "No detailed diff stored for this event.",
    LEVEL: "Level",
    ACTOR: "Actor",
    NEW_FACTORS: "New factors",
    RESOLVED_FACTORS: "Resolved factors",
    NEW_BLOCKING_ISSUES: "New blocking issues",
    RESOLVED_BLOCKING_ISSUES: "Resolved blocking issues",
    LOADING_AUDIT_TRAIL: "Loading audit trail...",
    LEDGER_AUDIT_TRAIL: "Ledger audit trail",
    IMMUTABLE_CHAIN: "Immutable chain for original, reversal, and correction records.",
    ORIGINAL: "Original",
    CREATED_BY: "created by",
    REASON: "Reason:",
    REVERSES: "Reverses",
    CORRECTED_BY: "Corrected by",
    METADATA_PREVIEW: "Metadata preview:",
    NO_AUDIT_EVENTS: "No audit events recorded for this chain.",
    ALLOCATION_UPDATED: "Allocation updated.",
    UNABLE_UPDATE_ALLOCATION: "Unable to update allocation.",
    PROOF_PLACEHOLDER_CREATED: "Proof placeholder created.",
    UNABLE_CREATE_PROOF: "Unable to create proof.",
    LEDGER_ENTRY_CREATED: "Ledger entry created and reconciliation refreshed.",
    UNABLE_CREATE_LEDGER: "Unable to create ledger entry.",
    LEDGER_ENTRY_REVERSED: "Ledger entry reversed and reconciliation refreshed.",
    UNABLE_REVERSE_LEDGER: "Unable to reverse ledger entry.",
    REVERSAL_REASON_REQUIRED: "reversalReason is required.",
    UNABLE_LOAD_AUDIT_TRAIL: "Unable to load audit trail.",
    LEDGER_FILTERS_APPLIED: "Ledger filters applied.",
    UNABLE_FILTER_LEDGER: "Unable to filter ledger entries.",
    UNABLE_EVALUATE_RISK: "Unable to evaluate risk.",
    UNABLE_REFRESH_TIMELINE: "Unable to refresh risk timeline.",
    RISK_EVALUATED_TIMELINE: "Risk evaluated and timeline refreshed.",
    RISK_EVALUATED_PREFIX: "Risk evaluated.",
    LEDGER_FILTERS_CLEARED: "Ledger filters cleared.",
    UNABLE_UPDATE_PROOF: "Unable to update proof.",
    PROOF_UPDATED: "Proof updated.",
    ALLOCATION_MARKED_COMPLETED: "Allocation marked completed.",
    ALLOCATION_MARKED_LOSS: "Allocation marked loss.",
    VAL_LEDGER_TYPE_REQUIRED: "ledgerType is required.",
    VAL_ENTRY_TYPE_REQUIRED: "entryType is required.",
    VAL_OCCURRED_AT_REQUIRED: "occurredAt is required.",
    VAL_AMOUNT_REQUIRED: "amount is required for cash and investor liability entries.",
    VAL_CURRENCY_REQUIRED: "currency is required when amount is provided.",
    VAL_AMOUNT_NUMERIC: "amount must be numeric.",
    VAL_QUANTITY_REQUIRED: "quantity is required for inventory entries.",
    VAL_QUANTITY_NUMERIC: "quantity must be numeric.",
    VAL_QUANTITY_NEGATIVE: "quantity cannot be negative unless entryType is UNITS_REMAINING_ADJUSTMENT.",
    VAL_DESCRIPTION_REQUIRED: "description is required.",
    VAL_METADATA_JSON: "metadataJson must be valid JSON."
  },
  ru: {
    BACK_TO_INVESTOR: "Назад к инвестору",
    EYEBROW: "Детали аллокации",
    AMOUNT: "Сумма",
    ALL: "Все",
    OVERVIEW_TITLE: "Обзор аллокации",
    OVERVIEW_DESC: "Операционное состояние и управляемые менеджером метаданные выплат/реинвеста.",
    PROOF_COMPLETENESS_TITLE: "Полнота подтверждений",
    PROOF_COMPLETENESS_DESC: "Оценка доказательств по видимым инвестору подтверждениям, требованиям политики и связке с отчётами.",
    PROOF_GUIDE_TITLE: "Руководство по требованиям к подтверждениям",
    PROOF_GUIDE_DESC: "Руководство оператора по компонентам оценки подтверждений V2. Недостающие доказательства показаны первыми.",
    RISK_ENGINE_TITLE: "Движок рисков",
    RISK_ENGINE_DESC: "Слой операционного риска по товару, денежным средствам, подтверждениям, выплатам, сверке и контролю концентрации.",
    RISK_TIMELINE_TITLE: "Хронология рисков",
    RISK_TIMELINE_DESC: "События оценки риска, записанные из снимков отчётов или явной оценки администратором.",
    RISK_TIMELINE_EMPTY: "Для этой аллокации ещё не записано событий оценки риска.",
    RECONCILIATION_TITLE: "Сверка",
    RECONCILIATION_DESC: "Контрольный вид трёх книг учёта: товар, денежные средства и обязательства перед инвестором.",
    STATUS_TIMELINE_TITLE: "Хронология статусов",
    STATUS_TIMELINE_DESC: "Спокойный операционный жизненный цикл этой товарной аллокации.",
    AUDIT_TITLE: "Аудит и уведомления",
    AUDIT_DESC: "Недавние события внутреннего контроля.",
    EDIT_TITLE: "Редактировать аллокацию",
    EDIT_DESC: "Здесь не происходит автоматического расчёта прибыли или движения платежей.",
    PREVIEW_TITLE: "Предпросмотр для инвестора",
    PREVIEW_DESC: "Заметки администратора, число скрытых подтверждений, сырые факторы риска и история аудита не показываются инвесторам.",
    ADD_LEDGER_TITLE: "Добавить проводку",
    ADD_LEDGER_DESC: "Проводки обновляют сверку трёх книг учёта. Здесь записываются только метаданные; никаких банковских операций, действий маркетплейса или исполнения выплат не происходит.",
    CREATE_PROOF_TITLE: "Создать заготовку подтверждения",
    CREATE_PROOF_DESC: "Только метаданные. Без загрузки файлов или внешнего хранилища.",
    PROOF_LIST_TITLE: "Список подтверждений",
    PROOF_LIST_DESC: "Заготовки для отгрузки, склада, маркетплейса, счёта, выплаты и проверки серийных номеров.",
    INVESTOR: "Инвестор",
    MARKETPLACE: "Маркетплейс",
    EXPECTED_CYCLE: "Ожидаемый цикл",
    EXPECTED_PAYOUT: "Ожидаемая выплата",
    RISK_LEVEL: "Уровень риска",
    ESTIMATED_RESULT: "Ожидаемый результат",
    ACTUAL_PROFIT: "Фактическая прибыль",
    STARTED_COMPLETED: "Начато / завершено",
    DAYS: "дн.",
    NOT_SET: "Не задано",
    NOT_BOOKED: "Не проведено",
    SCORE: "Оценка",
    STATE: "Состояние",
    THRESHOLD: "порог",
    PRESENT_CATEGORIES: "Присутствующие категории",
    MISSING_REQUIRED: "Отсутствуют обязательные",
    MISSING_RECOMMENDED: "Отсутствуют рекомендуемые",
    HIDDEN_REJECTED_UNREVIEWED: "Скрыто / отклонено / не проверено",
    NONE: "Нет",
    HOW_TO_SATISFY: "Как выполнить это требование",
    ACCEPTED_PROOF_TYPES: "Принимаемые типы подтверждений:",
    EXPECTED_METADATA: "Ожидаемые метаданные:",
    INVESTOR_VISIBILITY: "Видимость для инвестора:",
    NOT_EVALUATED: "Не оценено",
    NO_PROOF_PLACEHOLDER: "Заготовка подтверждения не требуется; используйте связку с отчётом.",
    METADATA_LABEL: "Метаданные:",
    COMMON_MISTAKES: "Частые ошибки:",
    MISSING: "Отсутствует",
    REQUIRED: "Обязательно",
    RECOMMENDED: "Рекомендуется",
    OPTIONAL: "Опционально",
    RISK_SCORE: "оценка риска",
    FACTORS: "фактор(ов)",
    ADMIN_SUMMARY: "Сводка для администратора",
    INVESTOR_SAFE_SUMMARY: "Сводка для инвестора",
    EVALUATE_RISK_HELP: "Записывает новое событие оценки риска на основе текущих данных книги учёта, подтверждений, выплат и сверки.",
    EVALUATE_RISK: "Оценить риск сейчас",
    EVALUATING: "Оценка...",
    BLOCKING_RISK_ISSUES: "Блокирующие проблемы риска",
    NO_BLOCKING_RISK: "Нет критических проблем риска аллокации.",
    RISK_WARNINGS: "Предупреждения о рисках",
    NO_RISK_WARNINGS: "Нет операционных предупреждений о рисках.",
    RECOMMENDED_ACTIONS: "Рекомендуемые действия",
    RISK_ENGINE_UNAVAILABLE: "Движок рисков недоступен",
    SCORE_WORD: "оценка",
    LEDGER_ENTRIES: "проводок",
    INVENTORY: "Товар",
    INV_PURCHASED: "закуплено",
    INV_RECEIVED: "получено",
    INV_SOLD: "продано",
    INV_REMAINING: "остаток",
    CASH_NET_POSITION: "Чистая денежная позиция",
    INVESTOR_LIABILITY_OUTSTANDING: "Непогашенные обязательства перед инвестором",
    LATEST_LEDGER_ENTRY: "Последняя проводка",
    BLOCKING_ISSUES: "Блокирующие проблемы",
    NO_BLOCKING_RECON: "Нет блокирующих проблем сверки.",
    WARNINGS: "Предупреждения",
    NO_RECON_WARNINGS: "Нет предупреждений сверки.",
    LEDGER_FILTERS: "Фильтры книги учёта",
    LEDGER_FILTERS_HELP: "Поиск менеджера по проводкам. Экспорт использует текущие поля фильтра. Итоги сверки остаются на основе полной книги учёта. Экспорт CSV фиксируется в аудите.",
    FILTERED_ENTRIES: "отфильтрованных проводок",
    SHOWING_LATEST: "Показаны последние проводки",
    LEDGER_TYPE: "Тип книги учёта",
    ENTRY_TYPE: "Тип проводки",
    SOURCE_TYPE: "Тип источника",
    REVERSAL_STATUS: "Статус сторно",
    DATE_FROM: "Дата с",
    DATE_TO: "Дата по",
    MIN_AMOUNT: "Мин. сумма",
    MAX_AMOUNT: "Макс. сумма",
    LIMIT: "Лимит",
    SEARCH_DESC: "Поиск по описанию/ID источника",
    APPLY_FILTERS: "Применить фильтры",
    FILTERING: "Фильтрация...",
    CLEAR_FILTERS: "Сбросить фильтры",
    EXPORT_CSV: "Экспорт CSV",
    FILTERED_LEDGER_ENTRIES: "Отфильтрованные проводки",
    LATEST_LEDGER_ENTRIES: "Последние проводки",
    NO_ENTRIES_MATCH: "Нет проводок, соответствующих текущим фильтрам.",
    NO_ENTRIES_YET: "Проводки ещё не записаны.",
    REVERSAL: "Сторно",
    REVERSED: "Сторнировано",
    CORRECTED: "Исправлено",
    REVERSES_ENTRY: "Сторнирует проводку",
    VOIDED: "Аннулировано",
    BY: "кем:",
    ADMIN: "администратор",
    CORRECTED_BY_ENTRY: "Исправлено проводкой",
    UNITS: "ед.",
    AUDIT_TRAIL: "Журнал аудита",
    HIDE_AUDIT_TRAIL: "Скрыть журнал аудита",
    REVERSE_ENTRY: "Сторнировать проводку",
    REVERSAL_HELP: "Это не изменяет историю. Создаётся компенсирующая проводка сторно.",
    REVERSAL_REASON_PLACEHOLDER: "Причина сторнирования",
    CONFIRM_REVERSAL: "Подтвердить сторно",
    REVERSING: "Сторнирование...",
    CANCEL: "Отмена",
    RECON_NOT_EVALUATED: "Сверка не выполнена",
    AUDIT_EVENTS: "События аудита",
    NOTIFICATION_EVENTS: "События уведомлений",
    STATUS: "Статус",
    PAYOUT_STATUS: "Статус выплаты",
    REINVEST_DECISION: "Решение по реинвесту",
    EXPECTED_DAYS: "Ожидаемые дни",
    NOTES: "Заметки",
    SAVE_ALLOCATION: "Сохранить аллокацию",
    SAVING: "Сохранение...",
    MARK_COMPLETED: "Отметить завершённой",
    MARK_LOSS: "Отметить убытком",
    PRODUCT: "Продукт",
    STAGE: "Этап",
    RISK: "Риск",
    PROOF_HEALTH: "Состояние подтверждений",
    INVESTOR_SUMMARY: "Сводка для инвестора",
    RISK_SUMMARY: "Сводка риска",
    UNDER_MANAGER_REVIEW: "На проверке у менеджера",
    EVIDENCE_UNDER_REVIEW: "Покрытие доказательствами на проверке у менеджера.",
    RISK_UNDER_REVIEW: "Операционный риск на проверке у менеджера.",
    CURRENCY: "Валюта",
    QUANTITY: "Количество",
    UNIT_COST: "Стоимость единицы",
    OCCURRED_AT: "Дата события",
    SOURCE_ID: "ID источника",
    DESCRIPTION: "Описание",
    METADATA_JSON: "Метаданные JSON",
    LEDGER_DESC_PLACEHOLDER: "Операционная заметка об источнике для этой проводки.",
    CREATE_LEDGER_ENTRY: "Создать проводку",
    CREATING: "Создание...",
    TYPE: "Тип",
    TITLE: "Заголовок",
    PROOF_URL: "URL подтверждения",
    CREATE_PROOF: "Создать подтверждение",
    NO_DESCRIPTION: "Нет описания.",
    EMPTY_TITLE: "Пока нет заготовок подтверждений",
    EMPTY_DESC: "Создавайте заготовки метаданных по мере появления документации.",
    LOADING: "Загрузка...",
    EVENTS: "событий",
    DETAILS: "Подробнее",
    SOURCE: "Источник",
    UNABLE_LOAD_TIMELINE: "Не удалось загрузить хронологию рисков.",
    NO_DIFF: "Для этого события не сохранена подробная разница.",
    LEVEL: "Уровень",
    ACTOR: "Исполнитель",
    NEW_FACTORS: "Новые факторы",
    RESOLVED_FACTORS: "Устранённые факторы",
    NEW_BLOCKING_ISSUES: "Новые блокирующие проблемы",
    RESOLVED_BLOCKING_ISSUES: "Устранённые блокирующие проблемы",
    LOADING_AUDIT_TRAIL: "Загрузка журнала аудита...",
    LEDGER_AUDIT_TRAIL: "Журнал аудита книги учёта",
    IMMUTABLE_CHAIN: "Неизменяемая цепочка записей: оригинал, сторно и исправление.",
    ORIGINAL: "Оригинал",
    CREATED_BY: "создано",
    REASON: "Причина:",
    REVERSES: "Сторнирует",
    CORRECTED_BY: "Исправлено",
    METADATA_PREVIEW: "Предпросмотр метаданных:",
    NO_AUDIT_EVENTS: "Для этой цепочки не записано событий аудита.",
    ALLOCATION_UPDATED: "Аллокация обновлена.",
    UNABLE_UPDATE_ALLOCATION: "Не удалось обновить аллокацию.",
    PROOF_PLACEHOLDER_CREATED: "Заготовка подтверждения создана.",
    UNABLE_CREATE_PROOF: "Не удалось создать подтверждение.",
    LEDGER_ENTRY_CREATED: "Проводка создана, сверка обновлена.",
    UNABLE_CREATE_LEDGER: "Не удалось создать проводку.",
    LEDGER_ENTRY_REVERSED: "Проводка сторнирована, сверка обновлена.",
    UNABLE_REVERSE_LEDGER: "Не удалось сторнировать проводку.",
    REVERSAL_REASON_REQUIRED: "Необходимо указать причину сторнирования.",
    UNABLE_LOAD_AUDIT_TRAIL: "Не удалось загрузить журнал аудита.",
    LEDGER_FILTERS_APPLIED: "Фильтры книги учёта применены.",
    UNABLE_FILTER_LEDGER: "Не удалось отфильтровать проводки.",
    UNABLE_EVALUATE_RISK: "Не удалось оценить риск.",
    UNABLE_REFRESH_TIMELINE: "Не удалось обновить хронологию рисков.",
    RISK_EVALUATED_TIMELINE: "Риск оценён, хронология обновлена.",
    RISK_EVALUATED_PREFIX: "Риск оценён.",
    LEDGER_FILTERS_CLEARED: "Фильтры книги учёта сброшены.",
    UNABLE_UPDATE_PROOF: "Не удалось обновить подтверждение.",
    PROOF_UPDATED: "Подтверждение обновлено.",
    ALLOCATION_MARKED_COMPLETED: "Аллокация отмечена завершённой.",
    ALLOCATION_MARKED_LOSS: "Аллокация отмечена убытком.",
    VAL_LEDGER_TYPE_REQUIRED: "Необходимо указать тип книги учёта.",
    VAL_ENTRY_TYPE_REQUIRED: "Необходимо указать тип проводки.",
    VAL_OCCURRED_AT_REQUIRED: "Необходимо указать дату события.",
    VAL_AMOUNT_REQUIRED: "Сумма обязательна для проводок по денежным средствам и обязательствам перед инвестором.",
    VAL_CURRENCY_REQUIRED: "Валюта обязательна, если указана сумма.",
    VAL_AMOUNT_NUMERIC: "Сумма должна быть числом.",
    VAL_QUANTITY_REQUIRED: "Количество обязательно для проводок по товару.",
    VAL_QUANTITY_NUMERIC: "Количество должно быть числом.",
    VAL_QUANTITY_NEGATIVE: "Количество не может быть отрицательным, кроме типа проводки UNITS_REMAINING_ADJUSTMENT.",
    VAL_DESCRIPTION_REQUIRED: "Необходимо указать описание.",
    VAL_METADATA_JSON: "metadataJson должен быть корректным JSON."
  }
} as const;
type Strings = typeof STRINGS.en;
const getStrings = (locale: Locale): Strings => (STRINGS as unknown as Record<string, Strings>)[locale] ?? STRINGS.en;

const ADMIN_CSRF_COOKIE = "admin_csrf_token";
const ADMIN_CSRF_HEADER = "x-csrf-token";
const ALLOCATION_STATUSES = ["DRAFT", "PURCHASING", "SHIPPING", "RECEIVED", "SELLING", "COMPLETED", "CANCELED", "LOSS"] as const;
const PROOF_TYPES = ["SHIPMENT_PROOF", "WAREHOUSE_MEDIA", "MARKETPLACE_REPORT", "PURCHASE_INVOICE", "PAYOUT_PROOF", "SERIAL_VERIFICATION", "OTHER"] as const;
const PROOF_STATUSES = ["PENDING", "AVAILABLE", "VERIFIED", "HIDDEN"] as const;
const PAYOUT_STATUSES = ["NOT_READY", "PENDING", "APPROVED", "PAID", "REINVESTED"] as const;
const REINVEST_DECISIONS = ["UNDECIDED", "REINVEST", "PAYOUT"] as const;
const RISK_LEVELS = ["STANDARD", "MONITORED", "ELEVATED"] as const;
const LEDGER_TYPES = ["INVENTORY", "CASH", "INVESTOR_LIABILITY"] as const;
const LEDGER_ENTRY_OPTIONS = {
  INVENTORY: ["UNITS_PURCHASED", "UNITS_RECEIVED", "UNITS_SOLD", "UNITS_RETURNED", "UNITS_REMAINING_ADJUSTMENT"],
  CASH: ["INVESTOR_CASH_IN", "SUPPLIER_PAYMENT", "LOGISTICS_COST", "MARKETPLACE_SETTLEMENT", "MARKETPLACE_FEE", "REFUND", "PAYOUT", "REINVESTMENT"],
  INVESTOR_LIABILITY: ["CAPITAL_ALLOCATED", "PROFIT_ACCRUED", "PAYOUT_APPROVED", "PAYOUT_PAID", "REINVESTED", "LOSS_RECOGNIZED", "LIABILITY_ADJUSTMENT"]
} as const;
const LEDGER_SOURCE_TYPES = ["ALLOCATION", "WITHDRAWAL_REQUEST", "MONTHLY_REPORT", "MANUAL_ADJUSTMENT", "MARKETPLACE_SETTLEMENT", "PROOF_ARTIFACT", "OTHER"] as const;
const LEDGER_REVERSAL_STATUS_OPTIONS = ["ALL", "ORIGINAL_ONLY", "REVERSALS_ONLY", "REVERSED_ONLY", "CORRECTED_ONLY"] as const;
const ALL_LEDGER_ENTRY_OPTIONS = [...LEDGER_ENTRY_OPTIONS.INVENTORY, ...LEDGER_ENTRY_OPTIONS.CASH, ...LEDGER_ENTRY_OPTIONS.INVESTOR_LIABILITY] as const;
const RISK_TIMELINE_SOURCE_FILTERS = ["all", "manual_evaluation", "report_snapshot", "readiness_gate", "unknown"] as const;
const RISK_TIMELINE_LIMIT_OPTIONS = ["10", "20", "50", "100"] as const;

type Proof = { id: string; allocationId: string; type: string; title: string; description: string | null; proofUrl: string | null; status: string; createdAt: string; updatedAt: string };
type ProofCompleteness = {
  score: number;
  state: string;
  presentCategories: string[];
  missingRequiredCategories: string[];
  missingRecommendedCategories: string[];
  hiddenProofCount: number;
  rejectedProofCount: number;
  unreviewedProofCount: number;
  supersededProofCount: number;
  investorSafeSummary: string;
  adminWarnings: string[];
  policyThreshold: number;
};
type ProofRequirementGuideItem = {
  componentKey: string;
  displayName: string;
  acceptedProofTypes: string[];
  policyStatus: "Required" | "Recommended" | "Optional";
  investorVisibleExplanation: string;
  adminInstruction: string;
  acceptableMetadataExamples: string[];
  commonMistakes: string[];
};
type ReconciliationException = { id: string; severity: "BLOCKING" | "WARNING"; message: string };
type RiskFactor = { id: string; category: string; severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"; label: string; description: string; investorVisible: boolean };
type RiskSummary = {
  score: number;
  level: "LOW" | "MODERATE" | "ELEVATED" | "HIGH" | "CRITICAL";
  riskFactors: RiskFactor[];
  blockingIssues: RiskFactor[];
  warnings: RiskFactor[];
  investorSafeSummary: { score: number; level: string; summary: string; visibleFactors: string[] };
  adminSummary: string;
  recommendedActions: string[];
};
type RiskTimelineFactor = { id: string; category: string; severity: string; label: string };
type RiskTimelineEvent = {
  id: string;
  actor: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  source: string;
  summary: string;
  risk: { level: string; score: number } | null;
  diff: {
    previousLevel: string | null;
    currentLevel: string;
    previousScore: number | null;
    currentScore: number;
    newRiskFactors: RiskTimelineFactor[];
    resolvedRiskFactors: RiskTimelineFactor[];
    newBlockingIssues: RiskTimelineFactor[];
    resolvedBlockingIssues: RiskTimelineFactor[];
  } | null;
  details: {
    previousLevel: string | null;
    currentLevel: string | null;
    previousScore: number | null;
    currentScore: number | null;
    newFactors: RiskTimelineFactor[];
    resolvedFactors: RiskTimelineFactor[];
    newBlockingIssues: RiskTimelineFactor[];
    resolvedBlockingIssues: RiskTimelineFactor[];
    source: string;
    actor: string;
    summary: string;
  };
};
type RiskTimelineSourceFilter = (typeof RISK_TIMELINE_SOURCE_FILTERS)[number];
type RiskTimelineFilters = { source: RiskTimelineSourceFilter; limit: string };
type LedgerEntryRow = {
  id: string;
  ledgerType: string;
  allocationId: string | null;
  investorId: string | null;
  monthlyReportId: string | null;
  entryType: string;
  amount: string;
  currency: string;
  quantity: number | null;
  unitCost: string | null;
  occurredAt: string;
  sourceType: string;
  sourceId: string | null;
  description: string;
  metadataJson: string | null;
  createdBy: string;
  isReversal: boolean;
  reversesLedgerEntryId: string | null;
  reversalReason: string | null;
  correctedByLedgerEntryId: string | null;
  voidedAt: string | null;
  voidedBy: string | null;
  createdAt: string;
  updatedAt: string;
};
type ReconciliationSummary = {
  status: "BALANCED" | "WARNING" | "BROKEN";
  score: number;
  blockingIssues: ReconciliationException[];
  warnings: ReconciliationException[];
  metrics: { entryCount: number; latestEntryAt: string | null };
  ledgerSummary: {
    inventory: { purchased: number; received: number; sold: number; returned: number; remainingAdjustment: number; remaining: number; inventoryVariance: number };
    cash: { cashIn: number; supplierPayments: number; logisticsCosts: number; marketplaceSettlements: number; marketplaceFees: number; refunds: number; payouts: number; reinvestments: number; netCashPosition: number };
    investorLiability: { capitalAllocated: number; profitAccrued: number; payoutsApproved: number; payoutsPaid: number; reinvested: number; lossesRecognized: number; liabilityAdjustments: number; liabilityOutstanding: number; deferredUnpaidShare: number };
  };
  latestLedgerEntries: LedgerEntryRow[];
};
type LedgerEntryAuditTrailRecord = Omit<LedgerEntryRow, "metadataJson"> & {
  metadataPreview: string | null;
  statusFlags: { isOriginal: boolean; isReversal: boolean; isReversed: boolean; isCorrected: boolean };
};
type LedgerEntryAuditTrail = {
  requestedEntry: LedgerEntryAuditTrailRecord;
  originalEntry: LedgerEntryAuditTrailRecord;
  reversalEntries: LedgerEntryAuditTrailRecord[];
  correctionEntry: LedgerEntryAuditTrailRecord | null;
  auditEvents: Array<{ id: string; actor: string; action: string; entityType: string; entityId: string; beforePreview: string | null; afterPreview: string | null; createdAt: string }>;
};
type AllocationDetail = {
  id: string;
  investorId: string;
  supplyCode: string;
  productName: string;
  marketplace: string | null;
  allocationAmount: string;
  currency: string;
  status: string;
  expectedCycleDays: number | null;
  expectedPayoutAt: string | null;
  riskLevel: string;
  estimatedResult: string | null;
  actualProfit: string | null;
  startedAt: string | null;
  completedAt: string | null;
  payoutStatus: string;
  reinvestDecision: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  investor: { id: string; fullName: string; email: string; telegram: string | null; status: string };
  proofs: Proof[];
  proofCompleteness: ProofCompleteness | null;
  proofRequirementsGuide: ProofRequirementGuideItem[];
  reconciliation: ReconciliationSummary | null;
  risk: RiskSummary | null;
};
type AuditLog = { id: string; action: string; createdAt: string; actor: string };
type NotificationEvent = { id: string; type: string; status: string; createdAt: string };

type AllocationDraft = { status: string; payoutStatus: string; reinvestDecision: string; marketplace: string; allocationAmount: string; expectedCycleDays: string; expectedPayoutAt: string; riskLevel: string; estimatedResult: string; actualProfit: string; notes: string };
type ProofDraft = { type: string; title: string; description: string; proofUrl: string; status: string };
type LedgerType = (typeof LEDGER_TYPES)[number];
type LedgerReversalStatus = (typeof LEDGER_REVERSAL_STATUS_OPTIONS)[number];
type LedgerEntryDraft = { ledgerType: LedgerType; entryType: string; amount: string; currency: string; quantity: string; unitCost: string; occurredAt: string; sourceType: string; sourceId: string; description: string; metadataJson: string };
type LedgerFilterDraft = { ledgerType: "ALL" | LedgerType; entryType: string; sourceType: string; reversalStatus: LedgerReversalStatus; dateFrom: string; dateTo: string; minAmount: string; maxAmount: string; query: string; limit: string };
type LedgerFilterView = { entries: LedgerEntryRow[]; appliedFilters: Record<string, string | number | null> };

function getCookieValue(name: string) {
  if (typeof document === "undefined") return "";
  return document.cookie.split("; ").find((cookie) => cookie.startsWith(`${name}=`))?.split("=").slice(1).join("=") || "";
}
function getAdminMutationHeaders() { return { "Content-Type": "application/json", [ADMIN_CSRF_HEADER]: getCookieValue(ADMIN_CSRF_COOKIE) }; }
function getGuideStatusRank(status: ProofRequirementGuideItem["policyStatus"]) { return status === "Required" ? 0 : status === "Recommended" ? 1 : 2; }
function isGuideItemMissing(item: ProofRequirementGuideItem, missingEvidence: Set<string>) { return missingEvidence.has(item.componentKey) || item.acceptedProofTypes.some((proofType) => missingEvidence.has(proofType)); }
function formatAcceptedProofTypes(types: string[], emptyLabel: string) { return types.length ? types.join(", ") : emptyLabel; }
function createDefaultLedgerEntryDraft(): LedgerEntryDraft { return { ledgerType: "INVENTORY", entryType: "UNITS_PURCHASED", amount: "0", currency: "USD", quantity: "", unitCost: "", occurredAt: "", sourceType: "MANUAL_ADJUSTMENT", sourceId: "", description: "", metadataJson: "" }; }
function createDefaultLedgerFilterDraft(): LedgerFilterDraft { return { ledgerType: "ALL", entryType: "ALL", sourceType: "ALL", reversalStatus: "ALL", dateFrom: "", dateTo: "", minAmount: "", maxAmount: "", query: "", limit: "50" }; }
function getLedgerEntryOptions(ledgerType: string) { return LEDGER_ENTRY_OPTIONS[ledgerType as LedgerType] ?? LEDGER_ENTRY_OPTIONS.INVENTORY; }
function getLedgerFilterEntryOptions(ledgerType: string) { return ledgerType === "ALL" ? ALL_LEDGER_ENTRY_OPTIONS : getLedgerEntryOptions(ledgerType); }
function buildLedgerFilterSearchParams(filters: LedgerFilterDraft) {
  const params = new URLSearchParams();
  if (filters.ledgerType !== "ALL") params.set("ledgerType", filters.ledgerType);
  if (filters.entryType !== "ALL") params.set("entryType", filters.entryType);
  if (filters.sourceType !== "ALL") params.set("sourceType", filters.sourceType);
  if (filters.reversalStatus !== "ALL") params.set("reversalStatus", filters.reversalStatus);
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  if (filters.minAmount) params.set("minAmount", filters.minAmount);
  if (filters.maxAmount) params.set("maxAmount", filters.maxAmount);
  if (filters.query.trim()) params.set("query", filters.query.trim());
  if (filters.limit) params.set("limit", filters.limit);
  return params;
}
function validateLedgerEntryDraft(draft: LedgerEntryDraft, t: Strings) {
  if (!draft.ledgerType) return t.VAL_LEDGER_TYPE_REQUIRED;
  if (!draft.entryType) return t.VAL_ENTRY_TYPE_REQUIRED;
  if (!draft.occurredAt) return t.VAL_OCCURRED_AT_REQUIRED;
  if ((draft.ledgerType === "CASH" || draft.ledgerType === "INVESTOR_LIABILITY") && !draft.amount.trim()) return t.VAL_AMOUNT_REQUIRED;
  if (draft.amount.trim() && !draft.currency.trim()) return t.VAL_CURRENCY_REQUIRED;
  if (draft.amount.trim() && !Number.isFinite(Number(draft.amount))) return t.VAL_AMOUNT_NUMERIC;
  if (draft.ledgerType === "INVENTORY" && !draft.quantity.trim()) return t.VAL_QUANTITY_REQUIRED;
  if (draft.quantity.trim() && !Number.isFinite(Number(draft.quantity))) return t.VAL_QUANTITY_NUMERIC;
  if (draft.quantity.trim() && Number(draft.quantity) < 0 && draft.entryType !== "UNITS_REMAINING_ADJUSTMENT") return t.VAL_QUANTITY_NEGATIVE;
  if (!draft.description.trim()) return t.VAL_DESCRIPTION_REQUIRED;
  if (draft.metadataJson.trim()) {
    try { JSON.parse(draft.metadataJson); } catch { return t.VAL_METADATA_JSON; }
  }
  return null;
}

export function AdminAllocationDetailPage({ locale, allocation: initialAllocation, auditLogs, notificationEvents, riskTimeline }: { locale: Locale; allocation: AllocationDetail; auditLogs: AuditLog[]; notificationEvents: NotificationEvent[]; riskTimeline: RiskTimelineEvent[] }) {
  const t = getStrings(locale);
  const formatters = createAdminFormatters(locale);
  const formatMoney = (value: string | number | null | undefined) => { const amount = Number(value || 0); return formatters.currency(Number.isFinite(amount) ? amount : 0); };
  const formatDate = (value: string | null) => formatters.dateTime(value);
  const policyLabel = (status: ProofRequirementGuideItem["policyStatus"]) => status === "Required" ? t.REQUIRED : status === "Recommended" ? t.RECOMMENDED : t.OPTIONAL;
  const [allocation, setAllocation] = React.useState(initialAllocation);
  const [currentRiskTimeline, setCurrentRiskTimeline] = React.useState(riskTimeline);
  const [draft, setDraft] = React.useState<AllocationDraft>({
    status: initialAllocation.status,
    payoutStatus: initialAllocation.payoutStatus,
    reinvestDecision: initialAllocation.reinvestDecision,
    marketplace: initialAllocation.marketplace || "",
    allocationAmount: initialAllocation.allocationAmount,
    expectedCycleDays: initialAllocation.expectedCycleDays ? String(initialAllocation.expectedCycleDays) : "",
    expectedPayoutAt: initialAllocation.expectedPayoutAt ? initialAllocation.expectedPayoutAt.slice(0, 10) : "",
    riskLevel: initialAllocation.riskLevel,
    estimatedResult: initialAllocation.estimatedResult || "",
    actualProfit: initialAllocation.actualProfit || "",
    notes: initialAllocation.notes || ""
  });
  const [proofDraft, setProofDraft] = React.useState<ProofDraft>({ type: "SHIPMENT_PROOF", title: "", description: "", proofUrl: "", status: "PENDING" });
  const [ledgerDraft, setLedgerDraft] = React.useState<LedgerEntryDraft>(() => createDefaultLedgerEntryDraft());
  const [ledgerFilters, setLedgerFilters] = React.useState<LedgerFilterDraft>(() => createDefaultLedgerFilterDraft());
  const [ledgerFilterView, setLedgerFilterView] = React.useState<LedgerFilterView | null>(null);
  const [reversalDraft, setReversalDraft] = React.useState<{ entryId: string; reason: string } | null>(null);
  const [auditTrailState, setAuditTrailState] = React.useState<{ entryId: string; isLoading: boolean; data: LedgerEntryAuditTrail | null; error: string | null } | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isCreatingProof, setIsCreatingProof] = React.useState(false);
  const [isCreatingLedgerEntry, setIsCreatingLedgerEntry] = React.useState(false);
  const [isFilteringLedgerEntries, setIsFilteringLedgerEntries] = React.useState(false);
  const [isReversingLedgerEntry, setIsReversingLedgerEntry] = React.useState(false);
  const [isEvaluatingRisk, setIsEvaluatingRisk] = React.useState(false);
  const [updatingProofId, setUpdatingProofId] = React.useState<string | null>(null);
  const missingEvidence = React.useMemo(() => new Set([...(allocation.proofCompleteness?.missingRequiredCategories ?? []), ...(allocation.proofCompleteness?.missingRecommendedCategories ?? [])]), [allocation.proofCompleteness]);
  const sortedProofRequirementsGuide = React.useMemo(() => [...allocation.proofRequirementsGuide].sort((first, second) => {
    const firstMissing = isGuideItemMissing(first, missingEvidence);
    const secondMissing = isGuideItemMissing(second, missingEvidence);
    if (firstMissing !== secondMissing) return firstMissing ? -1 : 1;
    const statusRank = getGuideStatusRank(first.policyStatus) - getGuideStatusRank(second.policyStatus);
    if (statusRank !== 0) return statusRank;
    return first.displayName.localeCompare(second.displayName);
  }), [allocation.proofRequirementsGuide, missingEvidence]);
  const missingRequirementGuideItems = sortedProofRequirementsGuide.filter((item) => isGuideItemMissing(item, missingEvidence));
  const visibleLedgerEntries = ledgerFilterView?.entries ?? allocation.reconciliation?.latestLedgerEntries ?? [];
  const ledgerExportHref = React.useMemo(() => {
    const params = buildLedgerFilterSearchParams(ledgerFilters).toString();
    return `/api/allocations/${allocation.id}/reconciliation/export${params ? `?${params}` : ""}`;
  }, [allocation.id, ledgerFilters]);

  async function saveAllocation() {
    setIsSaving(true); setNotice(null); setError(null);
    try {
      const response = await fetch(`/api/allocations/${allocation.id}`, { method: "PATCH", headers: getAdminMutationHeaders(), body: JSON.stringify({ ...draft, expectedCycleDays: draft.expectedCycleDays ? Number(draft.expectedCycleDays) : null, expectedPayoutAt: draft.expectedPayoutAt || null }) });
      const payload = (await response.json()) as { ok: boolean; data?: AllocationDetail; error?: string };
      if (!response.ok || !payload.ok || !payload.data) throw new Error(payload.error || t.UNABLE_UPDATE_ALLOCATION);
      setAllocation((current) => ({ ...current, ...payload.data, proofs: current.proofs, investor: current.investor }));
      setNotice(t.ALLOCATION_UPDATED);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : t.UNABLE_UPDATE_ALLOCATION); }
    finally { setIsSaving(false); }
  }

  async function createProof() {
    setIsCreatingProof(true); setNotice(null); setError(null);
    try {
      const response = await fetch(`/api/allocations/${allocation.id}/proofs`, { method: "POST", headers: getAdminMutationHeaders(), body: JSON.stringify(proofDraft) });
      const payload = (await response.json()) as { ok: boolean; data?: Proof; error?: string };
      if (!response.ok || !payload.ok || !payload.data) throw new Error(payload.error || t.UNABLE_CREATE_PROOF);
      setAllocation((current) => ({ ...current, proofs: [payload.data as Proof, ...current.proofs] }));
      setProofDraft({ type: "SHIPMENT_PROOF", title: "", description: "", proofUrl: "", status: "PENDING" });
      setNotice(t.PROOF_PLACEHOLDER_CREATED);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : t.UNABLE_CREATE_PROOF); }
    finally { setIsCreatingProof(false); }
  }

  async function createLedgerEntry() {
    const validationError = validateLedgerEntryDraft(ledgerDraft, t);
    if (validationError) {
      setError(validationError);
      setNotice(null);
      return;
    }

    setIsCreatingLedgerEntry(true); setNotice(null); setError(null);
    try {
      const response = await fetch(`/api/allocations/${allocation.id}/reconciliation`, {
        method: "POST",
        headers: getAdminMutationHeaders(),
        body: JSON.stringify({
          ledgerType: ledgerDraft.ledgerType,
          entryType: ledgerDraft.entryType,
          amount: ledgerDraft.amount.trim() || "0",
          currency: ledgerDraft.currency.trim() || "USD",
          quantity: ledgerDraft.quantity.trim() ? Number(ledgerDraft.quantity) : null,
          unitCost: ledgerDraft.unitCost.trim() || null,
          occurredAt: ledgerDraft.occurredAt,
          sourceType: ledgerDraft.sourceType,
          sourceId: ledgerDraft.sourceId.trim() || null,
          description: ledgerDraft.description.trim(),
          metadataJson: ledgerDraft.metadataJson.trim() || null
        })
      });
      const payload = (await response.json()) as { ok: boolean; data?: { reconciliation?: ReconciliationSummary }; error?: string };
      if (!response.ok || !payload.ok || !payload.data?.reconciliation) throw new Error(payload.error || t.UNABLE_CREATE_LEDGER);
      setAllocation((current) => ({ ...current, reconciliation: payload.data?.reconciliation ?? current.reconciliation }));
      setLedgerFilterView(null);
      setLedgerDraft(createDefaultLedgerEntryDraft());
      setNotice(t.LEDGER_ENTRY_CREATED);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : t.UNABLE_CREATE_LEDGER); }
    finally { setIsCreatingLedgerEntry(false); }
  }

  async function reverseLedgerEntry(entryId: string) {
    const reversalReason = reversalDraft?.entryId === entryId ? reversalDraft.reason.trim() : "";
    if (!reversalReason) {
      setError(t.REVERSAL_REASON_REQUIRED);
      setNotice(null);
      return;
    }

    setIsReversingLedgerEntry(true); setNotice(null); setError(null);
    try {
      const response = await fetch(`/api/allocations/${allocation.id}/reconciliation/${entryId}/reverse`, {
        method: "POST",
        headers: getAdminMutationHeaders(),
        body: JSON.stringify({ reversalReason })
      });
      const payload = (await response.json()) as { ok: boolean; data?: { reconciliation?: ReconciliationSummary }; error?: string };
      if (!response.ok || !payload.ok || !payload.data?.reconciliation) throw new Error(payload.error || t.UNABLE_REVERSE_LEDGER);
      setAllocation((current) => ({ ...current, reconciliation: payload.data?.reconciliation ?? current.reconciliation }));
      setLedgerFilterView(null);
      setReversalDraft(null);
      setNotice(t.LEDGER_ENTRY_REVERSED);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : t.UNABLE_REVERSE_LEDGER); }
    finally { setIsReversingLedgerEntry(false); }
  }

  async function toggleLedgerAuditTrail(entryId: string) {
    if (auditTrailState?.entryId === entryId && !auditTrailState.isLoading) {
      setAuditTrailState(null);
      return;
    }

    setAuditTrailState({ entryId, isLoading: true, data: null, error: null });
    try {
      const response = await fetch(`/api/allocations/${allocation.id}/reconciliation/${entryId}/audit-trail`);
      const payload = (await response.json()) as { ok: boolean; data?: LedgerEntryAuditTrail; error?: string };
      if (!response.ok || !payload.ok || !payload.data) throw new Error(payload.error || t.UNABLE_LOAD_AUDIT_TRAIL);
      setAuditTrailState({ entryId, isLoading: false, data: payload.data, error: null });
    } catch (requestError) {
      setAuditTrailState({ entryId, isLoading: false, data: null, error: requestError instanceof Error ? requestError.message : t.UNABLE_LOAD_AUDIT_TRAIL });
    }
  }

  async function applyLedgerFilters() {
    setIsFilteringLedgerEntries(true); setNotice(null); setError(null);
    try {
      const params = buildLedgerFilterSearchParams(ledgerFilters);
      const response = await fetch(`/api/allocations/${allocation.id}/reconciliation?${params.toString()}`);
      const payload = (await response.json()) as { ok: boolean; data?: { reconciliation?: ReconciliationSummary; filteredLedgerEntries?: LedgerEntryRow[]; appliedFilters?: Record<string, string | number | null> }; error?: string };
      if (!response.ok || !payload.ok || !payload.data?.reconciliation || !payload.data.filteredLedgerEntries || !payload.data.appliedFilters) throw new Error(payload.error || t.UNABLE_FILTER_LEDGER);
      setAllocation((current) => ({ ...current, reconciliation: payload.data?.reconciliation ?? current.reconciliation }));
      setLedgerFilterView({ entries: payload.data.filteredLedgerEntries, appliedFilters: payload.data.appliedFilters });
      setAuditTrailState(null);
      setNotice(t.LEDGER_FILTERS_APPLIED);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : t.UNABLE_FILTER_LEDGER); }
    finally { setIsFilteringLedgerEntries(false); }
  }

  async function evaluateRiskNow() {
    setIsEvaluatingRisk(true); setNotice(null); setError(null);
    try {
      const response = await fetch(`/api/allocations/${allocation.id}/risk/evaluate`, { method: "POST", headers: getAdminMutationHeaders() });
      const payload = (await response.json()) as { ok: boolean; data?: { risk?: RiskSummary; audit?: { eventCount: number; summary: string } }; error?: string };
      if (!response.ok || !payload.ok || !payload.data?.risk) throw new Error(payload.error || t.UNABLE_EVALUATE_RISK);

      const timelineResponse = await fetch(`/api/allocations/${allocation.id}/risk/timeline?limit=20`);
      const timelinePayload = (await timelineResponse.json()) as { ok: boolean; data?: { events: RiskTimelineEvent[] }; error?: string };
      if (!timelineResponse.ok || !timelinePayload.ok || !timelinePayload.data?.events) throw new Error(timelinePayload.error || t.UNABLE_REFRESH_TIMELINE);

      setAllocation((current) => ({ ...current, risk: payload.data?.risk ?? current.risk }));
      setCurrentRiskTimeline(timelinePayload.data.events);
      setNotice(payload.data.audit?.summary ? `${t.RISK_EVALUATED_PREFIX} ${payload.data.audit.summary}` : t.RISK_EVALUATED_TIMELINE);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : t.UNABLE_EVALUATE_RISK); }
    finally { setIsEvaluatingRisk(false); }
  }

  function clearLedgerFilters() {
    setLedgerFilters(createDefaultLedgerFilterDraft());
    setLedgerFilterView(null);
    setAuditTrailState(null);
    setNotice(t.LEDGER_FILTERS_CLEARED);
    setError(null);
  }

  async function runAllocationAction(payload: Record<string, unknown>, message: string) {
    setIsSaving(true); setNotice(null); setError(null);
    try {
      const response = await fetch(`/api/allocations/${allocation.id}`, { method: "PATCH", headers: getAdminMutationHeaders(), body: JSON.stringify(payload) });
      const responsePayload = (await response.json()) as { ok: boolean; data?: AllocationDetail; error?: string };
      if (!response.ok || !responsePayload.ok || !responsePayload.data) throw new Error(responsePayload.error || t.UNABLE_UPDATE_ALLOCATION);
      setAllocation((current) => ({ ...current, ...responsePayload.data, proofs: current.proofs, investor: current.investor }));
      setDraft((current) => ({
        ...current,
        status: responsePayload.data?.status ?? current.status,
        riskLevel: responsePayload.data?.riskLevel ?? current.riskLevel,
        actualProfit: responsePayload.data?.actualProfit ?? current.actualProfit
      }));
      setNotice(message);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : t.UNABLE_UPDATE_ALLOCATION); }
    finally { setIsSaving(false); }
  }

  async function updateProof(proof: Proof, payload: Partial<Proof>) {
    setUpdatingProofId(proof.id); setNotice(null); setError(null);
    try {
      const response = await fetch(`/api/allocation-proofs/${proof.id}`, { method: "PATCH", headers: getAdminMutationHeaders(), body: JSON.stringify(payload) });
      const responsePayload = (await response.json()) as { ok: boolean; data?: Proof; error?: string };
      if (!response.ok || !responsePayload.ok || !responsePayload.data) throw new Error(responsePayload.error || t.UNABLE_UPDATE_PROOF);
      setAllocation((current) => ({ ...current, proofs: current.proofs.map((item) => item.id === responsePayload.data?.id ? responsePayload.data : item) }));
      setNotice(t.PROOF_UPDATED);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : t.UNABLE_UPDATE_PROOF); }
    finally { setUpdatingProofId(null); }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground micro-noise">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(212,175,95,0.14),transparent_34rem),radial-gradient(circle_at_86%_10%,rgba(255,255,255,0.07),transparent_28rem)]" />
      <div className="macro-grid absolute inset-0 opacity-45" />
      <section className="relative z-10 py-8 sm:py-10"><div className="container">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link href={`/${locale}/admin/investors/${allocation.investorId}`} className="inline-flex items-center gap-3 text-sm text-muted-foreground transition-colors hover:text-foreground"><ArrowLeft className="size-4" />{t.BACK_TO_INVESTOR}</Link>
          <div className="flex gap-2"><Badge>{enumLabel("allocationStatus", allocation.status, locale)}</Badge><Badge variant="secondary">{enumLabel("payoutStatus", allocation.payoutStatus, locale)}</Badge><Badge variant="secondary">{enumLabel("reinvestDecision", allocation.reinvestDecision, locale)}</Badge></div>
        </div>
        <Card className="mb-6 rounded-[1.35rem] bg-graphite-900/[0.78]"><CardContent className="grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-100">{t.EYEBROW}</p><h1 className="mt-3 font-display text-4xl tracking-[-0.04em] text-foreground md:text-5xl">{allocation.supplyCode}</h1><p className="mt-3 text-sm leading-7 text-muted-foreground">{allocation.productName} · {allocation.investor.fullName}</p></div><div className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{t.AMOUNT}</p><p className="mt-2 text-2xl font-semibold text-foreground">{formatMoney(allocation.allocationAmount)}</p></div></CardContent></Card>
        {notice ? <AdminNotice tone="success" message={notice} /> : null}{error ? <AdminNotice tone="error" message={error} /> : null}
        <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
          <div className="grid gap-6">
            <Card className="rounded-[1.35rem] bg-graphite-900/[0.72]"><CardHeader><CardTitle>{t.OVERVIEW_TITLE}</CardTitle><CardDescription>{t.OVERVIEW_DESC}</CardDescription></CardHeader><CardContent className="grid gap-4"><Metric label={t.INVESTOR} value={`${allocation.investor.fullName} · ${allocation.investor.email}`} /><Metric label={t.MARKETPLACE} value={allocation.marketplace || t.NOT_SET} /><Metric label={t.EXPECTED_CYCLE} value={allocation.expectedCycleDays ? `${allocation.expectedCycleDays} ${t.DAYS}` : t.NOT_SET} /><Metric label={t.EXPECTED_PAYOUT} value={formatDate(allocation.expectedPayoutAt)} /><Metric label={t.RISK_LEVEL} value={enumLabel("riskLevel", allocation.riskLevel, locale)} /><Metric label={t.ESTIMATED_RESULT} value={allocation.estimatedResult || t.NOT_SET} /><Metric label={t.ACTUAL_PROFIT} value={allocation.actualProfit ? formatMoney(allocation.actualProfit) : t.NOT_BOOKED} /><Metric label={t.STARTED_COMPLETED} value={`${formatDate(allocation.startedAt)} / ${formatDate(allocation.completedAt)}`} /></CardContent></Card>
            <Card id="proofs" className="rounded-[1.35rem] bg-graphite-900/[0.72]">
              <CardHeader><CardTitle>{t.PROOF_COMPLETENESS_TITLE}</CardTitle><CardDescription>{t.PROOF_COMPLETENESS_DESC}</CardDescription></CardHeader>
              <CardContent className="grid gap-4">
                {allocation.proofCompleteness ? <>
                  <Metric label={t.SCORE} value={`${allocation.proofCompleteness.score}% / ${allocation.proofCompleteness.policyThreshold}% ${t.THRESHOLD}`} />
                  <Metric label={t.STATE} value={allocation.proofCompleteness.state} />
                  <Metric label={t.PRESENT_CATEGORIES} value={allocation.proofCompleteness.presentCategories.join(", ") || t.NONE} />
                  <Metric label={t.MISSING_REQUIRED} value={allocation.proofCompleteness.missingRequiredCategories.join(", ") || t.NONE} />
                  <Metric label={t.MISSING_RECOMMENDED} value={allocation.proofCompleteness.missingRecommendedCategories.slice(0, 6).join(", ") || t.NONE} />
                  <Metric label={t.HIDDEN_REJECTED_UNREVIEWED} value={`${allocation.proofCompleteness.hiddenProofCount} / ${allocation.proofCompleteness.rejectedProofCount} / ${allocation.proofCompleteness.unreviewedProofCount}`} />
                  {missingRequirementGuideItems.length ? <div className="rounded-2xl border border-gold-200/20 bg-gold-200/10 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-100">{t.HOW_TO_SATISFY}</p>
                    <div className="mt-3 grid gap-3">
                      {missingRequirementGuideItems.slice(0, 3).map((item) => <div key={item.componentKey} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                        <div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold text-foreground">{item.displayName}</p><Badge variant="secondary">{policyLabel(item.policyStatus)}</Badge></div>
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">{t.ACCEPTED_PROOF_TYPES} {formatAcceptedProofTypes(item.acceptedProofTypes, t.NO_PROOF_PLACEHOLDER)}</p>
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">{t.EXPECTED_METADATA} {item.acceptableMetadataExamples.slice(0, 4).join(", ")}</p>
                        <p className="mt-2 text-xs leading-5 text-gold-100">{t.INVESTOR_VISIBILITY} {item.investorVisibleExplanation}</p>
                      </div>)}
                    </div>
                  </div> : null}
                  {allocation.proofCompleteness.adminWarnings.length ? <div className="rounded-2xl border border-gold-200/20 bg-gold-200/10 p-4 text-xs leading-5 text-gold-100">{allocation.proofCompleteness.adminWarnings.slice(0, 4).join(" ")}</div> : null}
                </> : <Metric label={t.STATE} value={t.NOT_EVALUATED} />}
              </CardContent>
            </Card>
            <Card id="risk" className="rounded-[1.35rem] bg-graphite-900/[0.72]">
              <CardHeader><CardTitle>{t.PROOF_GUIDE_TITLE}</CardTitle><CardDescription>{t.PROOF_GUIDE_DESC}</CardDescription></CardHeader>
              <CardContent className="grid gap-3">
                {sortedProofRequirementsGuide.map((item) => {
                  const isMissing = isGuideItemMissing(item, missingEvidence);
                  return <div key={item.componentKey} className={`rounded-[1.35rem] border p-4 ${isMissing ? "border-gold-200/30 bg-gold-200/10" : "border-white/10 bg-black/20"}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div><p className="text-sm font-semibold text-foreground">{item.displayName}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{t.ACCEPTED_PROOF_TYPES} {formatAcceptedProofTypes(item.acceptedProofTypes, t.NO_PROOF_PLACEHOLDER)}</p></div>
                      <div className="flex flex-wrap gap-2"><Badge variant={item.policyStatus === "Optional" ? "secondary" : undefined}>{policyLabel(item.policyStatus)}</Badge>{isMissing ? <Badge variant="secondary">{t.MISSING}</Badge> : null}</div>
                    </div>
                    <p className="mt-3 text-xs leading-5 text-muted-foreground">{item.adminInstruction}</p>
                    <div className="mt-3 grid gap-2 rounded-2xl border border-white/10 bg-black/20 p-3 text-xs leading-5 text-muted-foreground">
                      <p><span className="text-foreground">{t.METADATA_LABEL}</span> {item.acceptableMetadataExamples.slice(0, 4).join(", ")}</p>
                      <p><span className="text-foreground">{t.COMMON_MISTAKES}</span> {item.commonMistakes.slice(0, 3).join(", ")}</p>
                    </div>
                  </div>;
                })}
              </CardContent>
            </Card>
            <Card id="reconciliation" className="rounded-[1.35rem] bg-graphite-900/[0.72]">
              <CardHeader><CardTitle>{t.RISK_ENGINE_TITLE}</CardTitle><CardDescription>{t.RISK_ENGINE_DESC}</CardDescription></CardHeader>
              <CardContent className="grid gap-4">
                {allocation.risk ? <>
                  <div className="flex flex-wrap items-center gap-2"><Badge>{allocation.risk.level}</Badge><Badge variant="secondary">{allocation.risk.score}/100 {t.RISK_SCORE}</Badge><Badge variant="secondary">{allocation.risk.riskFactors.length} {t.FACTORS}</Badge></div>
                  <Metric label={t.ADMIN_SUMMARY} value={allocation.risk.adminSummary} />
                  <Metric label={t.INVESTOR_SAFE_SUMMARY} value={allocation.risk.investorSafeSummary.summary} />
                  <div className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs leading-5 text-muted-foreground">{t.EVALUATE_RISK_HELP}</p>
                      <Button type="button" size="sm" onClick={evaluateRiskNow} disabled={isEvaluatingRisk}>{isEvaluatingRisk ? t.EVALUATING : t.EVALUATE_RISK}</Button>
                    </div>
                  </div>
                  <RiskFactorList title={t.BLOCKING_RISK_ISSUES} items={allocation.risk.blockingIssues} emptyText={t.NO_BLOCKING_RISK} />
                  <RiskFactorList title={t.RISK_WARNINGS} items={allocation.risk.warnings} emptyText={t.NO_RISK_WARNINGS} />
                  <div className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t.RECOMMENDED_ACTIONS}</p>
                    <div className="mt-3 grid gap-2">{allocation.risk.recommendedActions.slice(0, 5).map((action) => <p key={action} className="rounded-2xl border border-white/10 bg-black/20 p-3 text-xs leading-5 text-muted-foreground">{action}</p>)}</div>
                  </div>
                </> : <Metric label={t.STATE} value={t.RISK_ENGINE_UNAVAILABLE} />}
              </CardContent>
            </Card>
            <RiskTimelineCard locale={locale} title={t.RISK_TIMELINE_TITLE} description={t.RISK_TIMELINE_DESC} events={currentRiskTimeline} endpoint={`/api/allocations/${allocation.id}/risk/timeline`} emptyText={t.RISK_TIMELINE_EMPTY} />
            <Card className="rounded-[1.35rem] bg-graphite-900/[0.72]">
              <CardHeader><CardTitle>{t.RECONCILIATION_TITLE}</CardTitle><CardDescription>{t.RECONCILIATION_DESC}</CardDescription></CardHeader>
              <CardContent className="grid gap-4">
                {allocation.reconciliation ? <>
                  <div className="flex flex-wrap items-center gap-2"><Badge>{allocation.reconciliation.status}</Badge><Badge variant="secondary">{allocation.reconciliation.score}% {t.SCORE_WORD}</Badge><Badge variant="secondary">{allocation.reconciliation.metrics.entryCount} {t.LEDGER_ENTRIES}</Badge></div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Metric label={t.INVENTORY} value={`${allocation.reconciliation.ledgerSummary.inventory.purchased} ${t.INV_PURCHASED} · ${allocation.reconciliation.ledgerSummary.inventory.received} ${t.INV_RECEIVED} · ${allocation.reconciliation.ledgerSummary.inventory.sold} ${t.INV_SOLD} · ${allocation.reconciliation.ledgerSummary.inventory.remaining} ${t.INV_REMAINING}`} />
                    <Metric label={t.CASH_NET_POSITION} value={formatMoney(allocation.reconciliation.ledgerSummary.cash.netCashPosition)} />
                    <Metric label={t.INVESTOR_LIABILITY_OUTSTANDING} value={formatMoney(allocation.reconciliation.ledgerSummary.investorLiability.liabilityOutstanding)} />
                    <Metric label={t.LATEST_LEDGER_ENTRY} value={formatDate(allocation.reconciliation.metrics.latestEntryAt)} />
                  </div>
                  <ReconciliationIssueList title={t.BLOCKING_ISSUES} items={allocation.reconciliation.blockingIssues} emptyText={t.NO_BLOCKING_RECON} />
                  <ReconciliationIssueList title={t.WARNINGS} items={allocation.reconciliation.warnings} emptyText={t.NO_RECON_WARNINGS} />
                  <div className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t.LEDGER_FILTERS}</p>
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">{t.LEDGER_FILTERS_HELP}</p>
                      </div>
                      {ledgerFilterView ? <Badge variant="secondary">{ledgerFilterView.entries.length} {t.FILTERED_ENTRIES}</Badge> : <Badge variant="secondary">{t.SHOWING_LATEST}</Badge>}
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <SelectField label={t.LEDGER_TYPE} value={ledgerFilters.ledgerType} options={["ALL", ...LEDGER_TYPES]} formatOption={(value) => value === "ALL" ? t.ALL : enumLabel("ledgerType", value, locale)} onChange={(value) => setLedgerFilters((current) => {
                        const entryOptions = getLedgerFilterEntryOptions(value);
                        return { ...current, ledgerType: value as LedgerFilterDraft["ledgerType"], entryType: current.entryType === "ALL" || entryOptions.includes(current.entryType as never) ? current.entryType : "ALL" };
                      })} />
                      <SelectField label={t.ENTRY_TYPE} value={ledgerFilters.entryType} options={["ALL", ...getLedgerFilterEntryOptions(ledgerFilters.ledgerType)]} formatOption={(value) => value === "ALL" ? t.ALL : enumLabel("ledgerEntry", value, locale)} onChange={(value) => setLedgerFilters((current) => ({ ...current, entryType: value }))} />
                      <SelectField label={t.SOURCE_TYPE} value={ledgerFilters.sourceType} options={["ALL", ...LEDGER_SOURCE_TYPES]} formatOption={(value) => value === "ALL" ? t.ALL : enumLabel("ledgerSourceType", value, locale)} onChange={(value) => setLedgerFilters((current) => ({ ...current, sourceType: value }))} />
                      <SelectField label={t.REVERSAL_STATUS} value={ledgerFilters.reversalStatus} options={LEDGER_REVERSAL_STATUS_OPTIONS} formatOption={(value) => enumLabel("ledgerReversalStatus", value, locale)} onChange={(value) => setLedgerFilters((current) => ({ ...current, reversalStatus: value as LedgerReversalStatus }))} />
                      <TextField label={t.DATE_FROM} type="date" value={ledgerFilters.dateFrom} onChange={(value) => setLedgerFilters((current) => ({ ...current, dateFrom: value }))} />
                      <TextField label={t.DATE_TO} type="date" value={ledgerFilters.dateTo} onChange={(value) => setLedgerFilters((current) => ({ ...current, dateTo: value }))} />
                      <TextField label={t.MIN_AMOUNT} value={ledgerFilters.minAmount} onChange={(value) => setLedgerFilters((current) => ({ ...current, minAmount: value }))} />
                      <TextField label={t.MAX_AMOUNT} value={ledgerFilters.maxAmount} onChange={(value) => setLedgerFilters((current) => ({ ...current, maxAmount: value }))} />
                      <TextField label={t.LIMIT} value={ledgerFilters.limit} onChange={(value) => setLedgerFilters((current) => ({ ...current, limit: value }))} />
                      <div className="md:col-span-3"><TextField label={t.SEARCH_DESC} value={ledgerFilters.query} onChange={(value) => setLedgerFilters((current) => ({ ...current, query: value }))} /></div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button type="button" size="sm" onClick={applyLedgerFilters} disabled={isFilteringLedgerEntries}>{isFilteringLedgerEntries ? t.FILTERING : t.APPLY_FILTERS}</Button>
                      <Button type="button" size="sm" variant="outline" onClick={clearLedgerFilters} disabled={isFilteringLedgerEntries}>{t.CLEAR_FILTERS}</Button>
                      <a href={ledgerExportHref} className="inline-flex h-9 items-center justify-center rounded-full border border-white/10 bg-black/20 px-4 text-sm font-medium text-foreground transition-colors hover:bg-white/10">{t.EXPORT_CSV}</a>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{ledgerFilterView ? t.FILTERED_LEDGER_ENTRIES : t.LATEST_LEDGER_ENTRIES}</p>
                    {visibleLedgerEntries.length === 0 ? <p className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-muted-foreground">{ledgerFilterView ? t.NO_ENTRIES_MATCH : t.NO_ENTRIES_YET}</p> : visibleLedgerEntries.slice(0, 50).map((entry) => {
                      const isSelectedForReversal = reversalDraft?.entryId === entry.id;
                      const canReverse = !entry.isReversal && !entry.voidedAt;
                      return <div key={entry.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-foreground">{enumLabel("ledgerEntry", entry.entryType, locale)}</p>
                              {entry.isReversal ? <Badge variant="secondary">{t.REVERSAL}</Badge> : null}
                              {entry.voidedAt ? <Badge variant="secondary">{t.REVERSED}</Badge> : null}
                              {entry.correctedByLedgerEntryId ? <Badge variant="secondary">{t.CORRECTED}</Badge> : null}
                            </div>
                            <p className="mt-2 text-xs leading-5 text-muted-foreground">{enumLabel("ledgerType", entry.ledgerType, locale)} · {entry.description}</p>
                            {entry.isReversal && entry.reversesLedgerEntryId ? <p className="mt-2 text-xs leading-5 text-gold-100">{t.REVERSES_ENTRY} {entry.reversesLedgerEntryId}</p> : null}
                            {entry.voidedAt && !entry.isReversal ? <p className="mt-2 text-xs leading-5 text-gold-100">{t.VOIDED} {formatDate(entry.voidedAt)} {t.BY} {entry.voidedBy || t.ADMIN}.</p> : null}
                            {entry.correctedByLedgerEntryId ? <p className="mt-2 text-xs leading-5 text-gold-100">{t.CORRECTED_BY_ENTRY} {entry.correctedByLedgerEntryId}</p> : null}
                          </div>
                          <div className="text-right text-xs text-muted-foreground"><p>{formatMoney(entry.amount)}</p><p>{entry.quantity ?? "-"} {t.UNITS}</p></div>
                        </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <Button type="button" size="sm" variant="outline" onClick={() => toggleLedgerAuditTrail(entry.id)}>{auditTrailState?.entryId === entry.id ? t.HIDE_AUDIT_TRAIL : t.AUDIT_TRAIL}</Button>
                            {canReverse && !isSelectedForReversal ? <Button type="button" size="sm" variant="outline" onClick={() => setReversalDraft({ entryId: entry.id, reason: "" })}>{t.REVERSE_ENTRY}</Button> : null}
                          </div>
                          {auditTrailState?.entryId === entry.id ? <LedgerAuditTrailPanel locale={locale} state={auditTrailState} /> : null}
                          {canReverse && isSelectedForReversal ? <div className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-3">
                            <p className="text-xs leading-5 text-muted-foreground">{t.REVERSAL_HELP}</p>
                            <textarea value={reversalDraft.reason} onChange={(event) => setReversalDraft({ entryId: entry.id, reason: event.target.value })} className="min-h-20 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-foreground outline-none" placeholder={t.REVERSAL_REASON_PLACEHOLDER} />
                            <div className="flex flex-wrap gap-2">
                              <Button type="button" size="sm" onClick={() => reverseLedgerEntry(entry.id)} disabled={isReversingLedgerEntry}>{isReversingLedgerEntry ? t.REVERSING : t.CONFIRM_REVERSAL}</Button>
                              <Button type="button" size="sm" variant="outline" onClick={() => setReversalDraft(null)} disabled={isReversingLedgerEntry}>{t.CANCEL}</Button>
                            </div>
                          </div> : null}
                      </div>;
                    })}
                  </div>
                </> : <Metric label={t.STATE} value={t.RECON_NOT_EVALUATED} />}
              </CardContent>
            </Card>
            <Card className="rounded-[1.35rem] bg-graphite-900/[0.72]"><CardHeader><CardTitle>{t.STATUS_TIMELINE_TITLE}</CardTitle><CardDescription>{t.STATUS_TIMELINE_DESC}</CardDescription></CardHeader><CardContent><div className="grid gap-3">{["DRAFT", "PURCHASING", "SHIPPING", "RECEIVED", "SELLING", "COMPLETED"].map((step) => <div key={step} className={`rounded-2xl border p-3 text-sm ${step === allocation.status ? "border-gold-200/35 bg-gold-200/10 text-gold-100" : "border-white/10 bg-black/20 text-muted-foreground"}`}>{enumLabel("allocationStatus", step, locale)}</div>)}</div></CardContent></Card>
            <Card className="rounded-[1.35rem] bg-graphite-900/[0.72]"><CardHeader><CardTitle>{t.AUDIT_TITLE}</CardTitle><CardDescription>{t.AUDIT_DESC}</CardDescription></CardHeader><CardContent className="grid gap-3"><Metric label={t.AUDIT_EVENTS} value={String(auditLogs.length)} /><Metric label={t.NOTIFICATION_EVENTS} value={String(notificationEvents.length)} />{auditLogs.slice(0, 4).map((log) => <Metric key={log.id} label={log.action} value={`${formatDate(log.createdAt)} · ${log.actor}`} />)}</CardContent></Card>
          </div>
          <div className="grid gap-6">
            <Card className="rounded-[1.35rem] bg-graphite-900/[0.72]"><CardHeader><CardTitle>{t.EDIT_TITLE}</CardTitle><CardDescription>{t.EDIT_DESC}</CardDescription></CardHeader><CardContent className="grid gap-4 md:grid-cols-2"><SelectField label={t.STATUS} value={draft.status} options={ALLOCATION_STATUSES} formatOption={(value) => enumLabel("allocationStatus", value, locale)} onChange={(value) => setDraft((current) => ({ ...current, status: value }))} /><SelectField label={t.RISK_LEVEL} value={draft.riskLevel} options={RISK_LEVELS} formatOption={(value) => enumLabel("riskLevel", value, locale)} onChange={(value) => setDraft((current) => ({ ...current, riskLevel: value }))} /><SelectField label={t.PAYOUT_STATUS} value={draft.payoutStatus} options={PAYOUT_STATUSES} formatOption={(value) => enumLabel("payoutStatus", value, locale)} onChange={(value) => setDraft((current) => ({ ...current, payoutStatus: value }))} /><SelectField label={t.REINVEST_DECISION} value={draft.reinvestDecision} options={REINVEST_DECISIONS} formatOption={(value) => enumLabel("reinvestDecision", value, locale)} onChange={(value) => setDraft((current) => ({ ...current, reinvestDecision: value }))} /><TextField label={t.MARKETPLACE} value={draft.marketplace} onChange={(value) => setDraft((current) => ({ ...current, marketplace: value }))} /><TextField label={t.AMOUNT} value={draft.allocationAmount} onChange={(value) => setDraft((current) => ({ ...current, allocationAmount: value }))} /><TextField label={t.EXPECTED_DAYS} value={draft.expectedCycleDays} onChange={(value) => setDraft((current) => ({ ...current, expectedCycleDays: value }))} /><TextField label={t.EXPECTED_PAYOUT} type="date" value={draft.expectedPayoutAt} onChange={(value) => setDraft((current) => ({ ...current, expectedPayoutAt: value }))} /><TextField label={t.ESTIMATED_RESULT} value={draft.estimatedResult} onChange={(value) => setDraft((current) => ({ ...current, estimatedResult: value }))} /><TextField label={t.ACTUAL_PROFIT} value={draft.actualProfit} onChange={(value) => setDraft((current) => ({ ...current, actualProfit: value }))} /><label className="grid gap-2 md:col-span-2"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t.NOTES}</span><textarea value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} className="min-h-24 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-foreground outline-none" /></label><div className="flex flex-wrap gap-2 md:col-span-2"><Button type="button" onClick={saveAllocation} disabled={isSaving}><Save data-icon="inline-start" />{isSaving ? t.SAVING : t.SAVE_ALLOCATION}</Button><Button type="button" variant="outline" disabled={isSaving} onClick={() => runAllocationAction({ action: "mark-completed", actualProfit: draft.actualProfit || null }, t.ALLOCATION_MARKED_COMPLETED)}>{t.MARK_COMPLETED}</Button><Button type="button" variant="outline" disabled={isSaving} onClick={() => runAllocationAction({ action: "mark-loss", notes: draft.notes || "Marked as loss by admin." }, t.ALLOCATION_MARKED_LOSS)}>{t.MARK_LOSS}</Button></div></CardContent></Card>
            <Card className="rounded-[1.35rem] bg-graphite-900/[0.72]"><CardHeader><CardTitle>{t.PREVIEW_TITLE}</CardTitle><CardDescription>{t.PREVIEW_DESC}</CardDescription></CardHeader><CardContent className="grid gap-3 md:grid-cols-2"><Metric label={t.PRODUCT} value={allocation.productName} /><Metric label={t.STAGE} value={enumLabel("allocationStatus", allocation.status, locale)} /><Metric label={t.RISK} value={allocation.risk?.investorSafeSummary.level || enumLabel("riskLevel", allocation.riskLevel, locale)} /><Metric label={t.EXPECTED_PAYOUT} value={formatDate(allocation.expectedPayoutAt)} /><Metric label={t.PROOF_HEALTH} value={allocation.proofCompleteness ? `${allocation.proofCompleteness.state} · ${allocation.proofCompleteness.score}%` : t.UNDER_MANAGER_REVIEW} /><Metric label={t.INVESTOR_SUMMARY} value={allocation.proofCompleteness?.investorSafeSummary || t.EVIDENCE_UNDER_REVIEW} /><Metric label={t.RISK_SUMMARY} value={allocation.risk?.investorSafeSummary.summary || t.RISK_UNDER_REVIEW} /></CardContent></Card>
            <Card className="rounded-[1.35rem] bg-graphite-900/[0.72]">
              <CardHeader><CardTitle>{t.ADD_LEDGER_TITLE}</CardTitle><CardDescription>{t.ADD_LEDGER_DESC}</CardDescription></CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <SelectField label={t.LEDGER_TYPE} value={ledgerDraft.ledgerType} options={LEDGER_TYPES} formatOption={(value) => enumLabel("ledgerType", value, locale)} onChange={(value) => setLedgerDraft((current) => { const ledgerType = value as LedgerType; return { ...current, ledgerType, entryType: getLedgerEntryOptions(ledgerType)[0] ?? "" }; })} />
                <SelectField label={t.ENTRY_TYPE} value={ledgerDraft.entryType} options={getLedgerEntryOptions(ledgerDraft.ledgerType)} formatOption={(value) => enumLabel("ledgerEntry", value, locale)} onChange={(value) => setLedgerDraft((current) => ({ ...current, entryType: value }))} />
                <TextField label={t.AMOUNT} value={ledgerDraft.amount} onChange={(value) => setLedgerDraft((current) => ({ ...current, amount: value }))} />
                <TextField label={t.CURRENCY} value={ledgerDraft.currency} onChange={(value) => setLedgerDraft((current) => ({ ...current, currency: value.toUpperCase() }))} />
                <TextField label={t.QUANTITY} value={ledgerDraft.quantity} onChange={(value) => setLedgerDraft((current) => ({ ...current, quantity: value }))} />
                <TextField label={t.UNIT_COST} value={ledgerDraft.unitCost} onChange={(value) => setLedgerDraft((current) => ({ ...current, unitCost: value }))} />
                <TextField label={t.OCCURRED_AT} type="datetime-local" value={ledgerDraft.occurredAt} onChange={(value) => setLedgerDraft((current) => ({ ...current, occurredAt: value }))} />
                <SelectField label={t.SOURCE_TYPE} value={ledgerDraft.sourceType} options={LEDGER_SOURCE_TYPES} formatOption={(value) => enumLabel("ledgerSourceType", value, locale)} onChange={(value) => setLedgerDraft((current) => ({ ...current, sourceType: value }))} />
                <TextField label={t.SOURCE_ID} value={ledgerDraft.sourceId} onChange={(value) => setLedgerDraft((current) => ({ ...current, sourceId: value }))} />
                <label className="grid gap-2 md:col-span-2"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t.DESCRIPTION}</span><textarea value={ledgerDraft.description} onChange={(event) => setLedgerDraft((current) => ({ ...current, description: event.target.value }))} className="min-h-20 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-foreground outline-none" placeholder={t.LEDGER_DESC_PLACEHOLDER} /></label>
                <label className="grid gap-2 md:col-span-2"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t.METADATA_JSON}</span><textarea value={ledgerDraft.metadataJson} onChange={(event) => setLedgerDraft((current) => ({ ...current, metadataJson: event.target.value }))} className="min-h-20 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 font-mono text-xs leading-6 text-foreground outline-none" placeholder='{\"reference\":\"masked-source-id\"}' /></label>
                <div className="md:col-span-2"><Button type="button" onClick={createLedgerEntry} disabled={isCreatingLedgerEntry}>{isCreatingLedgerEntry ? t.CREATING : t.CREATE_LEDGER_ENTRY}</Button></div>
              </CardContent>
            </Card>
            <Card className="rounded-[1.35rem] bg-graphite-900/[0.72]"><CardHeader><CardTitle>{t.CREATE_PROOF_TITLE}</CardTitle><CardDescription>{t.CREATE_PROOF_DESC}</CardDescription></CardHeader><CardContent className="grid gap-4 md:grid-cols-2"><SelectField label={t.TYPE} value={proofDraft.type} options={PROOF_TYPES} formatOption={(value) => enumLabel("proofType", value, locale)} onChange={(value) => setProofDraft((current) => ({ ...current, type: value }))} /><SelectField label={t.STATUS} value={proofDraft.status} options={PROOF_STATUSES} formatOption={(value) => enumLabel("proofStatus", value, locale)} onChange={(value) => setProofDraft((current) => ({ ...current, status: value }))} /><TextField label={t.TITLE} value={proofDraft.title} onChange={(value) => setProofDraft((current) => ({ ...current, title: value }))} /><TextField label={t.PROOF_URL} value={proofDraft.proofUrl} onChange={(value) => setProofDraft((current) => ({ ...current, proofUrl: value }))} /><label className="grid gap-2 md:col-span-2"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t.DESCRIPTION}</span><textarea value={proofDraft.description} onChange={(event) => setProofDraft((current) => ({ ...current, description: event.target.value }))} className="min-h-20 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-foreground outline-none" /></label><div className="md:col-span-2"><Button type="button" onClick={createProof} disabled={isCreatingProof}><FileText data-icon="inline-start" />{isCreatingProof ? t.CREATING : t.CREATE_PROOF}</Button></div></CardContent></Card>
            <Card className="rounded-[1.35rem] bg-graphite-900/[0.72]"><CardHeader><CardTitle>{t.PROOF_LIST_TITLE}</CardTitle><CardDescription>{t.PROOF_LIST_DESC}</CardDescription></CardHeader><CardContent className="grid gap-3">{allocation.proofs.length === 0 ? <EmptyState t={t} /> : allocation.proofs.map((proof) => <div key={proof.id} className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{enumLabel("proofType", proof.type, locale)}</p><p className="mt-2 font-semibold text-foreground">{proof.title}</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{proof.description || t.NO_DESCRIPTION}</p>{proof.proofUrl ? <p className="mt-2 break-words text-xs text-gold-100">{proof.proofUrl}</p> : null}</div><Badge>{enumLabel("proofStatus", proof.status, locale)}</Badge></div><Separator className="my-4" /><div className="flex flex-wrap gap-2">{PROOF_STATUSES.map((status) => <Button key={status} type="button" variant="outline" size="sm" disabled={updatingProofId === proof.id || proof.status === status} onClick={() => updateProof(proof, { status })}>{enumLabel("proofStatus", status, locale)}</Button>)}</div></div>)}</CardContent></Card>
          </div>
        </div>
      </div></section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p><p className="mt-2 text-sm leading-6 text-foreground">{value}</p></div>; }
function TextField({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { return <label className="grid gap-2"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="h-12 rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-foreground outline-none" /></label>; }
function SelectField({ label, value, options, onChange, formatOption }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void; formatOption?: (value: string) => string }) { return <label className="grid gap-2"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="h-12 rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-foreground outline-none">{options.map((option) => <option key={option} value={option} className="bg-graphite-900">{formatOption ? formatOption(option) : option}</option>)}</select></label>; }
function EmptyState({ t }: { t: Strings }) { return <div className="rounded-[1.35rem] border border-white/10 bg-black/20 p-6 text-center"><PackageCheck className="mx-auto size-8 text-gold-100" /><p className="mt-4 font-semibold text-foreground">{t.EMPTY_TITLE}</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{t.EMPTY_DESC}</p></div>; }
function AdminNotice({ tone, message }: { tone: "success" | "error"; message: string }) { return <div className={`mb-6 rounded-[1.35rem] border p-4 text-sm ${tone === "success" ? "border-gold-200/25 bg-gold-200/10 text-gold-100" : "border-white/10 bg-black/30 text-foreground"}`}>{message}</div>; }
function ReconciliationIssueList({ title, items, emptyText }: { title: string; items: ReconciliationException[]; emptyText: string }) { return <div className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{title}</p>{items.length === 0 ? <p className="mt-3 text-sm leading-6 text-muted-foreground">{emptyText}</p> : <div className="mt-3 grid gap-2">{items.map((item) => <div key={item.id} className="rounded-2xl border border-gold-200/20 bg-gold-200/10 p-3 text-xs leading-5 text-gold-100">{item.message}</div>)}</div>}</div>; }
function RiskFactorList({ title, items, emptyText }: { title: string; items: RiskFactor[]; emptyText: string }) { return <div className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{title}</p>{items.length === 0 ? <p className="mt-3 text-sm leading-6 text-muted-foreground">{emptyText}</p> : <div className="mt-3 grid gap-2">{items.slice(0, 6).map((item) => <div key={item.id} className="rounded-2xl border border-gold-200/20 bg-gold-200/10 p-3 text-xs leading-5 text-gold-100"><span className="font-semibold text-foreground">{item.severity} · {item.category}</span><br />{item.label}: {item.description}</div>)}</div>}</div>; }

function RiskTimelineSelectField({ label, value, options, onChange, formatOption }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void; formatOption?: (value: string) => string }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-12 rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-foreground outline-none">
        {options.map((option) => <option key={option} value={option} className="bg-graphite-900">{formatOption ? formatOption(option) : option}</option>)}
      </select>
    </label>
  );
}

function RiskTimelineCard({ locale, title, description, events: initialEvents, endpoint, emptyText }: { locale: Locale; title: string; description: string; events: RiskTimelineEvent[]; endpoint: string; emptyText: string }) {
  const t = getStrings(locale);
  const formatters = createAdminFormatters(locale);
  const formatDate = (value: string | null) => formatters.dateTime(value);
  const [events, setEvents] = React.useState(initialEvents);
  const [filters, setFilters] = React.useState<RiskTimelineFilters>({ source: "all", limit: "20" });
  const [isLoading, setIsLoading] = React.useState(false);
  const [filterError, setFilterError] = React.useState<string | null>(null);
  const [expandedEventId, setExpandedEventId] = React.useState<string | null>(null);

  React.useEffect(() => {
    setEvents(initialEvents);
  }, [initialEvents]);

  async function reloadTimeline(nextFilters: RiskTimelineFilters) {
    setFilters(nextFilters);
    setIsLoading(true);
    setFilterError(null);
    try {
      const params = new URLSearchParams();
      params.set("source", nextFilters.source);
      params.set("limit", nextFilters.limit);
      const response = await fetch(`${endpoint}?${params.toString()}`);
      const payload = (await response.json()) as { ok: boolean; data?: { events: RiskTimelineEvent[] }; error?: string };
      if (!response.ok || !payload.ok || !payload.data?.events) throw new Error(payload.error || t.UNABLE_LOAD_TIMELINE);
      setEvents(payload.data.events);
    } catch (requestError) {
      setFilterError(requestError instanceof Error ? requestError.message : t.UNABLE_LOAD_TIMELINE);
    } finally {
      setIsLoading(false);
    }
  }

  return <Card className="rounded-[1.35rem] bg-graphite-900/[0.72]">
    <CardHeader><CardTitle>{title}</CardTitle><CardDescription>{description}</CardDescription></CardHeader>
    <CardContent className="grid gap-3">
      <div className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-end">
          <RiskTimelineSelectField label={t.SOURCE} value={filters.source} options={RISK_TIMELINE_SOURCE_FILTERS} formatOption={(value) => enumLabel("riskSource", value, locale)} onChange={(value) => void reloadTimeline({ ...filters, source: value as RiskTimelineSourceFilter })} />
          <RiskTimelineSelectField label={t.LIMIT} value={filters.limit} options={RISK_TIMELINE_LIMIT_OPTIONS} onChange={(value) => void reloadTimeline({ ...filters, limit: value })} />
          <Badge variant="secondary">{isLoading ? t.LOADING : `${events.length} ${t.EVENTS}`}</Badge>
        </div>
        {filterError ? <p className="mt-3 text-xs leading-5 text-gold-100">{filterError}</p> : null}
      </div>
      {events.length === 0 ? <p className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4 text-sm text-muted-foreground">{emptyText}</p> : events.map((event) => <div key={event.id} className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-foreground">{event.summary}</p>
              {event.risk ? <Badge>{event.risk.level}</Badge> : null}
              {event.risk ? <Badge variant="secondary">{event.risk.score}/100</Badge> : null}
            </div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">{enumLabel("riskSource", event.source, locale)} · {event.actor}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => setExpandedEventId((current) => current === event.id ? null : event.id)}>{t.DETAILS}</Button>
            <span className="text-xs text-muted-foreground">{formatDate(event.createdAt)}</span>
          </div>
        </div>
        {expandedEventId === event.id ? <RiskTimelineEventDetailsPanel locale={locale} event={event} /> : null}
      </div>)}
    </CardContent>
  </Card>;
}

function RiskTimelineEventDetailsPanel({ locale, event }: { locale: Locale; event: RiskTimelineEvent }) {
  const t = getStrings(locale);
  const details = event.details;
  const hasDiff = Boolean(details.currentLevel || details.currentScore !== null || details.previousLevel || details.previousScore !== null || details.newFactors.length || details.resolvedFactors.length || details.newBlockingIssues.length || details.resolvedBlockingIssues.length);

  if (!hasDiff) {
    return <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-muted-foreground">{t.NO_DIFF}</div>;
  }

  return (
    <div className="mt-3 rounded-[1.35rem] border border-white/10 bg-black/20 p-4">
      <div className="grid gap-3 md:grid-cols-4">
        <RiskTimelineDetail label={t.LEVEL} value={`${formatRiskDetailValue(details.previousLevel)} -> ${formatRiskDetailValue(details.currentLevel)}`} />
        <RiskTimelineDetail label={t.SCORE} value={`${formatRiskDetailValue(details.previousScore)} -> ${formatRiskDetailValue(details.currentScore)}`} />
        <RiskTimelineDetail label={t.SOURCE} value={enumLabel("riskSource", details.source, locale)} />
        <RiskTimelineDetail label={t.ACTOR} value={details.actor} />
      </div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">{details.summary}</p>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <RiskTimelineFactors t={t} title={t.NEW_FACTORS} items={details.newFactors} />
        <RiskTimelineFactors t={t} title={t.RESOLVED_FACTORS} items={details.resolvedFactors} />
        <RiskTimelineFactors t={t} title={t.NEW_BLOCKING_ISSUES} items={details.newBlockingIssues} />
        <RiskTimelineFactors t={t} title={t.RESOLVED_BLOCKING_ISSUES} items={details.resolvedBlockingIssues} />
      </div>
    </div>
  );
}

function RiskTimelineDetail({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-white/10 bg-black/20 p-3"><p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p><p className="mt-2 text-xs leading-5 text-foreground">{value}</p></div>;
}

function formatRiskDetailValue(value: string | number | null) {
  return value === null || value === "" ? "-" : String(value);
}

function RiskTimelineFactors({ t, title, items }: { t: Strings; title: string; items: RiskTimelineFactor[] }) {
  return <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{title}</p>
    {items.length === 0 ? <p className="mt-2 text-xs leading-5 text-muted-foreground">{t.NONE}</p> : <div className="mt-2 flex flex-wrap gap-2">{items.slice(0, 4).map((item) => <Badge key={`${item.id}-${item.label}`} variant="secondary">{item.severity} · {item.label}</Badge>)}</div>}
  </div>;
}
function LedgerAuditTrailPanel({ locale, state }: { locale: Locale; state: { isLoading: boolean; data: LedgerEntryAuditTrail | null; error: string | null } }) {
  const t = getStrings(locale);
  const formatters = createAdminFormatters(locale);
  const formatMoney = (value: string | number | null | undefined) => { const amount = Number(value || 0); return formatters.currency(Number.isFinite(amount) ? amount : 0); };
  const formatDate = (value: string | null) => formatters.dateTime(value);
  if (state.isLoading) return <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-muted-foreground">{t.LOADING_AUDIT_TRAIL}</div>;
  if (state.error) return <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-foreground">{state.error}</div>;
  if (!state.data) return null;

  const chain = [state.data.originalEntry, ...state.data.reversalEntries, ...(state.data.correctionEntry ? [state.data.correctionEntry] : [])];
  return <div className="mt-4 grid gap-4 rounded-[1.35rem] border border-white/10 bg-black/20 p-4">
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t.LEDGER_AUDIT_TRAIL}</p>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{t.IMMUTABLE_CHAIN}</p>
    </div>
    <div className="grid gap-3">
      {chain.map((entry) => <div key={entry.id} className="rounded-2xl border border-white/10 bg-black/20 p-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-foreground">{enumLabel("ledgerEntry", entry.entryType, locale)}</p>
              {entry.statusFlags.isOriginal ? <Badge>{t.ORIGINAL}</Badge> : null}
              {entry.statusFlags.isReversal ? <Badge variant="secondary">{t.REVERSAL}</Badge> : null}
              {entry.statusFlags.isReversed ? <Badge variant="secondary">{t.REVERSED}</Badge> : null}
              {entry.statusFlags.isCorrected ? <Badge variant="secondary">{t.CORRECTED}</Badge> : null}
            </div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">{enumLabel("ledgerType", entry.ledgerType, locale)} · {formatDate(entry.occurredAt)} · {t.CREATED_BY} {entry.createdBy}</p>
            {entry.reversalReason ? <p className="mt-2 text-xs leading-5 text-gold-100">{t.REASON} {entry.reversalReason}</p> : null}
            {entry.reversesLedgerEntryId ? <p className="mt-2 text-xs leading-5 text-muted-foreground">{t.REVERSES} {entry.reversesLedgerEntryId}</p> : null}
            {entry.correctedByLedgerEntryId ? <p className="mt-2 text-xs leading-5 text-muted-foreground">{t.CORRECTED_BY} {entry.correctedByLedgerEntryId}</p> : null}
            {entry.metadataPreview ? <p className="mt-2 break-words rounded-xl border border-white/10 bg-black/20 p-2 font-mono text-[0.68rem] leading-5 text-muted-foreground">{t.METADATA_PREVIEW} {entry.metadataPreview}</p> : null}
          </div>
          <div className="text-right text-xs text-muted-foreground"><p>{formatMoney(entry.amount)}</p><p>{entry.quantity ?? "-"} {t.UNITS}</p></div>
        </div>
      </div>)}
    </div>
    <div className="grid gap-2">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t.AUDIT_EVENTS}</p>
      {state.data.auditEvents.length === 0 ? <p className="rounded-2xl border border-white/10 bg-black/20 p-3 text-xs text-muted-foreground">{t.NO_AUDIT_EVENTS}</p> : state.data.auditEvents.map((event) => <div key={event.id} className="rounded-2xl border border-white/10 bg-black/20 p-3 text-xs leading-5 text-muted-foreground">
        <p className="font-semibold text-foreground">{event.action}</p>
        <p>{formatDate(event.createdAt)} · {event.actor}</p>
        {event.afterPreview ? <p className="mt-2 break-words font-mono text-[0.68rem]">{event.afterPreview}</p> : null}
      </div>)}
    </div>
  </div>;
}

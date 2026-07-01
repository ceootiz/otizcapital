"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, Link2, RefreshCw, Save, Trash2 } from "lucide-react";
import { createAdminFormatters, enumLabel, type AdminFormatters, type Locale } from "@otiz/lib";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Separator } from "@otiz/ui";
import { AdminNavigation } from "./admin-navigation";

const ADMIN_CSRF_COOKIE = "admin_csrf_token";
const ADMIN_CSRF_HEADER = "x-csrf-token";
const RISK_TIMELINE_SOURCE_FILTERS = ["all", "manual_evaluation", "report_snapshot", "readiness_gate", "unknown"] as const;
const RISK_TIMELINE_LIMIT_OPTIONS = ["10", "20", "50", "100"] as const;

const STRINGS = {
  en: {
    eyebrow: "Monthly report detail",
    backToInvestor: "Back to investor",
    published: "Published",
    notPublished: "Not published",

    reportStatusTitle: "Report status",
    reportStatusDesc: "Admin visibility includes draft, published, and archived report records.",
    labelStatus: "Status",
    labelReportPeriod: "Report period",
    labelCreated: "Created",
    labelUpdated: "Updated",
    labelPublished: "Published",
    publishGateEvaluate: "Evaluate readiness before publishing this report.",
    publishGateReady: "This report passed all required operational checks.",
    publishGateWarnings: "This report contains non-blocking warnings. Review carefully before publishing.",
    publishGateNeedsReview: "This report needs manager review. Publishing requires explicit acknowledgment.",
    publishGateBlocked: "Publishing blocked until critical report integrity issues are resolved.",
    acknowledgeWarnings: "I have reviewed the non-blocking readiness warnings and approve publishing with this operational context.",
    publishReport: "Publish report",
    publishing: "Publishing...",
    returnToDraft: "Return to draft",
    returning: "Returning...",
    reportStatusHelp: "Published reports are read-only. Return to draft before editing fields or regenerating the proof snapshot.",

    readinessTitle: "Report Readiness",
    readinessDesc: "Operational publish gate for trust, completeness, and snapshot integrity.",
    readinessStateLabel: "Readiness state",
    labelLinkedAllocations: "Linked allocations",
    labelSnapshotAllocations: "Snapshot allocations",
    labelVisibleProofs: "Visible proofs",
    labelExcludedProofs: "Excluded proofs",
    labelCompletenessScore: "Completeness score",
    labelSnapshotGenerated: "Snapshot generated",
    labelPolicy: "Policy",
    labelPolicyThreshold: "Policy threshold",
    readinessPolicyFallback: "Readiness policy",
    manageReadinessPolicy: "Manage readiness policy",
    blockingIssues: "Blocking issues",
    noBlockingIssues: "No critical blocking issues.",
    warnings: "Warnings",
    noReadinessWarnings: "No readiness warnings.",
    checklist: "Checklist",
    noChecks: "No readiness checks available.",
    evaluateReadiness: "Evaluate readiness",
    evaluating: "Evaluating...",
    readinessUnavailable: "Readiness evaluation is unavailable for this report.",
    passed: "Passed",

    reconciliationTitle: "Report reconciliation",
    reconciliationDesc: "Three-ledger status for linked allocations and the frozen report snapshot.",
    score: "score",
    snapshotExists: "Snapshot exists",
    noSnapshot: "No snapshot",
    labelLinkedAllocationStatuses: "Linked allocation statuses",
    noLinkedAllocations: "No linked allocations",
    reconBlockingEmpty: "No blocking reconciliation issues.",
    reconWarningsEmpty: "No reconciliation warnings.",
    regenerateReportSnapshot: "Regenerate report snapshot",
    regenerating: "Regenerating...",
    reconciliationUnavailable: "Report reconciliation is unavailable.",

    riskOverviewTitle: "Portfolio risk overview",
    riskOverviewDesc: "Risk engine summary for linked allocations. Investor reports receive only the frozen safe summary.",
    riskScore: "risk score",
    generated: "Generated",
    labelAdminSummary: "Admin summary",
    labelHighRiskAllocations: "High-risk allocations",
    noHighRiskAllocations: "No high-risk linked allocations.",
    materialRiskEvents: "Material risk events",
    noMaterialRiskEvents: "No material risk events.",
    recommendedActions: "Recommended actions",
    riskUnavailable: "Portfolio risk summary is unavailable.",

    riskTimelineTitle: "Report risk timeline",
    riskTimelineDesc: "Portfolio risk evaluation events recorded from explicit report snapshot regeneration.",
    riskTimelineEmpty: "No report risk evaluation events recorded yet.",

    snapshotControlsTitle: "Snapshot controls",
    snapshotControlsDesc: "Proof snapshot regeneration is explicit and only available while the report is draft.",
    regenerateProofSnapshot: "Regenerate proof snapshot",
    snapshotControlsHelpDraft: "This replaces the saved snapshot from current allocation proof metadata.",
    snapshotControlsHelpLocked: "Return the report to draft before regenerating the proof snapshot.",

    investorTitle: "Investor",
    investorDesc: "Linked investor profile for this monthly report.",
    labelName: "Name",
    labelEmail: "Email",
    labelTelegram: "Telegram",
    notSet: "Not set",
    labelInvestorStatus: "Investor status",

    editDraftTitle: "Edit draft report",
    editDraftDesc: "Financial fields remain admin-written notes. Published reports are frozen until returned to draft.",
    labelTitle: "Title",
    labelSummary: "Summary",
    labelPerformanceNote: "Performance note",
    labelPayoutNote: "Payout note",
    saveDraft: "Save draft",
    saving: "Saving...",
    returnToDraftHint: "Return to draft before editing report fields.",
    internalAdminNote: "Internal admin note",
    internalAdminNoteBody: "Not available on the MonthlyReport model yet. No fake note action is rendered.",

    linkedAllocationsTitle: "Linked allocations",
    linkedAllocationsDesc: "Explicit supply allocations included in this draft report. Investor snapshots are generated only from these links.",
    noAllocationsLinked: "No allocations linked yet. Add eligible allocations before regenerating the report snapshot.",
    includedBy: "Included by",
    includedOn: "on",
    labelInvested: "Invested",
    labelExpectedResult: "Expected result",
    labelProofTotal: "Proof total",
    adminLinkageNote: "Admin linkage note",
    saveNote: "Save note",
    remove: "Remove",
    removing: "Removing...",

    eligibleAllocationsTitle: "Eligible allocations",
    eligibleAllocationsDesc: "Allocations for this investor that are not yet linked to the report.",
    noEligibleAllocations: "No eligible allocations available for this report.",
    marketplaceNotSet: "Marketplace not set",
    addAllocation: "Add allocation to report",
    adding: "Adding...",

    proofSnapshotTitle: "Proof snapshot",
    proofSnapshotDesc: "Read from MonthlyReport.proofSummaryJson. This page does not recalculate current allocation proofs.",
    availableProofs: "Available proofs",
    noAvailableProofs: "No available proofs in snapshot.",
    verifiedProofs: "Verified proofs",
    noVerifiedProofs: "No verified proofs in snapshot.",
    excludedProofs: "Excluded / not counted",
    noExcludedProofs: "No excluded proof categories in snapshot.",

    frozenSnapshotTitle: "Frozen allocation snapshot",
    frozenSnapshotDesc: "Saved allocation state from the last explicit snapshot regeneration. This is what investor report detail reads.",
    noAllocationSummary: "No allocation summary exists in the current snapshot.",
    snapshotUpdated: "Snapshot updated",

    lifecycleTitle: "Lifecycle timeline",
    lifecycleDesc: "Report lifecycle and available audit events.",
    noLifecycleEvents: "No lifecycle events recorded.",
    lifecycleCreatedLabel: "Report created",
    lifecycleCreatedDetail: "Monthly report record created.",
    lifecycleUpdatedLabel: "Report updated",
    lifecycleUpdatedDetail: "Latest report metadata update.",
    lifecyclePublishedLabel: "Report published",
    lifecyclePublishedDetail: "publishedAt recorded for investor visibility.",
    auditEventDetail: "audit event",

    timelineSource: "Source",
    timelineLimit: "Limit",
    loading: "Loading...",
    shown: "shown",
    details: "Details",
    timelineLoadError: "Unable to load risk timeline.",
    noDiffStored: "No detailed diff stored for this event.",
    detailLevel: "Level",
    detailScore: "Score",
    detailSource: "Source",
    detailActor: "Actor",
    newFactors: "New factors",
    resolvedFactors: "Resolved factors",
    newBlockingIssues: "New blocking issues",
    resolvedBlockingIssues: "Resolved blocking issues",
    none: "None",

    errUpdateReport: "Unable to update monthly report.",
    errEvaluateReadiness: "Unable to evaluate report readiness.",
    errRegenerateSnapshot: "Unable to regenerate proof snapshot.",
    errLinkAllocation: "Unable to link allocation.",
    errRemoveAllocation: "Unable to remove linked allocation.",
    errUpdateNote: "Unable to update allocation note.",

    noticeDraftSaved: "Draft report saved.",
    noticePublished: "Report published to the investor.",
    noticeReturnedDraft: "Report returned to draft.",
    noticeReadinessEvaluated: "Report readiness evaluated.",
    noticeSnapshotRegenerated: "Proof snapshot regenerated from linked allocations.",
    noticeAllocationLinked: "Allocation linked. Regenerate the snapshot before publishing if this allocation should appear in the frozen report.",
    noticeAllocationRemoved: "Allocation removed from draft report. Regenerate the snapshot before publishing.",
    noticeNoteUpdated: "Linked allocation note updated."
  },
  ru: {
    eyebrow: "Детали ежемесячного отчёта",
    backToInvestor: "Назад к инвестору",
    published: "Опубликован",
    notPublished: "Не опубликован",

    reportStatusTitle: "Статус отчёта",
    reportStatusDesc: "Администратору видны черновики, опубликованные и архивные отчёты.",
    labelStatus: "Статус",
    labelReportPeriod: "Период отчёта",
    labelCreated: "Создан",
    labelUpdated: "Обновлён",
    labelPublished: "Опубликован",
    publishGateEvaluate: "Оцените готовность перед публикацией этого отчёта.",
    publishGateReady: "Отчёт прошёл все обязательные операционные проверки.",
    publishGateWarnings: "Отчёт содержит неблокирующие предупреждения. Внимательно проверьте перед публикацией.",
    publishGateNeedsReview: "Отчёт требует проверки менеджером. Для публикации нужно явное подтверждение.",
    publishGateBlocked: "Публикация заблокирована до устранения критических проблем целостности отчёта.",
    acknowledgeWarnings: "Я изучил неблокирующие предупреждения готовности и одобряю публикацию с учётом этого операционного контекста.",
    publishReport: "Опубликовать отчёт",
    publishing: "Публикация...",
    returnToDraft: "Вернуть в черновик",
    returning: "Возврат...",
    reportStatusHelp: "Опубликованные отчёты доступны только для чтения. Верните в черновик перед редактированием полей или регенерацией снимка подтверждений.",

    readinessTitle: "Готовность отчёта",
    readinessDesc: "Операционный гейт публикации для доверия, полноты и целостности снимка.",
    readinessStateLabel: "Состояние готовности",
    labelLinkedAllocations: "Связанные аллокации",
    labelSnapshotAllocations: "Аллокации в снимке",
    labelVisibleProofs: "Видимые подтверждения",
    labelExcludedProofs: "Исключённые подтверждения",
    labelCompletenessScore: "Оценка полноты",
    labelSnapshotGenerated: "Снимок создан",
    labelPolicy: "Политика",
    labelPolicyThreshold: "Порог политики",
    readinessPolicyFallback: "Политика готовности",
    manageReadinessPolicy: "Управление политикой готовности",
    blockingIssues: "Блокирующие проблемы",
    noBlockingIssues: "Нет критических блокирующих проблем.",
    warnings: "Предупреждения",
    noReadinessWarnings: "Нет предупреждений готовности.",
    checklist: "Чек-лист",
    noChecks: "Нет доступных проверок готовности.",
    evaluateReadiness: "Оценить готовность",
    evaluating: "Оценка...",
    readinessUnavailable: "Оценка готовности недоступна для этого отчёта.",
    passed: "Пройдено",

    reconciliationTitle: "Сверка отчёта",
    reconciliationDesc: "Статус по трём реестрам для связанных аллокаций и замороженного снимка отчёта.",
    score: "оценка",
    snapshotExists: "Снимок существует",
    noSnapshot: "Нет снимка",
    labelLinkedAllocationStatuses: "Статусы связанных аллокаций",
    noLinkedAllocations: "Нет связанных аллокаций",
    reconBlockingEmpty: "Нет блокирующих проблем сверки.",
    reconWarningsEmpty: "Нет предупреждений сверки.",
    regenerateReportSnapshot: "Регенерировать снимок отчёта",
    regenerating: "Регенерация...",
    reconciliationUnavailable: "Сверка отчёта недоступна.",

    riskOverviewTitle: "Обзор риска портфеля",
    riskOverviewDesc: "Сводка движка рисков по связанным аллокациям. Отчёты инвестора получают только замороженную безопасную сводку.",
    riskScore: "оценка риска",
    generated: "Создано",
    labelAdminSummary: "Сводка для администратора",
    labelHighRiskAllocations: "Аллокации высокого риска",
    noHighRiskAllocations: "Нет связанных аллокаций высокого риска.",
    materialRiskEvents: "Существенные события риска",
    noMaterialRiskEvents: "Нет существенных событий риска.",
    recommendedActions: "Рекомендуемые действия",
    riskUnavailable: "Сводка риска портфеля недоступна.",

    riskTimelineTitle: "Хронология риска отчёта",
    riskTimelineDesc: "События оценки риска портфеля, записанные при явной регенерации снимка отчёта.",
    riskTimelineEmpty: "Событий оценки риска отчёта пока не записано.",

    snapshotControlsTitle: "Управление снимком",
    snapshotControlsDesc: "Регенерация снимка подтверждений выполняется явно и доступна только пока отчёт в черновике.",
    regenerateProofSnapshot: "Регенерировать снимок подтверждений",
    snapshotControlsHelpDraft: "Это заменит сохранённый снимок текущими метаданными подтверждений аллокаций.",
    snapshotControlsHelpLocked: "Верните отчёт в черновик перед регенерацией снимка подтверждений.",

    investorTitle: "Инвестор",
    investorDesc: "Связанный профиль инвестора для этого ежемесячного отчёта.",
    labelName: "Имя",
    labelEmail: "Email",
    labelTelegram: "Telegram",
    notSet: "Не указано",
    labelInvestorStatus: "Статус инвестора",

    editDraftTitle: "Редактировать черновик отчёта",
    editDraftDesc: "Финансовые поля остаются заметками, написанными администратором. Опубликованные отчёты заморожены до возврата в черновик.",
    labelTitle: "Заголовок",
    labelSummary: "Сводка",
    labelPerformanceNote: "Заметка о результатах",
    labelPayoutNote: "Заметка о выплате",
    saveDraft: "Сохранить черновик",
    saving: "Сохранение...",
    returnToDraftHint: "Верните в черновик перед редактированием полей отчёта.",
    internalAdminNote: "Внутренняя заметка администратора",
    internalAdminNoteBody: "Пока недоступно в модели MonthlyReport. Фиктивное действие с заметкой не отображается.",

    linkedAllocationsTitle: "Связанные аллокации",
    linkedAllocationsDesc: "Явные товарные аллокации, включённые в этот черновик отчёта. Снимки инвестора создаются только из этих связей.",
    noAllocationsLinked: "Аллокации пока не связаны. Добавьте подходящие аллокации перед регенерацией снимка отчёта.",
    includedBy: "Добавлено:",
    includedOn: "·",
    labelInvested: "Инвестировано",
    labelExpectedResult: "Ожидаемый результат",
    labelProofTotal: "Всего подтверждений",
    adminLinkageNote: "Заметка администратора о связи",
    saveNote: "Сохранить заметку",
    remove: "Удалить",
    removing: "Удаление...",

    eligibleAllocationsTitle: "Подходящие аллокации",
    eligibleAllocationsDesc: "Аллокации этого инвестора, ещё не связанные с отчётом.",
    noEligibleAllocations: "Нет подходящих аллокаций для этого отчёта.",
    marketplaceNotSet: "Маркетплейс не указан",
    addAllocation: "Добавить аллокацию в отчёт",
    adding: "Добавление...",

    proofSnapshotTitle: "Снимок подтверждений",
    proofSnapshotDesc: "Читается из MonthlyReport.proofSummaryJson. Эта страница не пересчитывает текущие подтверждения аллокаций.",
    availableProofs: "Доступные подтверждения",
    noAvailableProofs: "Нет доступных подтверждений в снимке.",
    verifiedProofs: "Проверенные подтверждения",
    noVerifiedProofs: "Нет проверенных подтверждений в снимке.",
    excludedProofs: "Исключено / не учтено",
    noExcludedProofs: "Нет исключённых категорий подтверждений в снимке.",

    frozenSnapshotTitle: "Замороженный снимок аллокаций",
    frozenSnapshotDesc: "Сохранённое состояние аллокаций из последней явной регенерации снимка. Именно это читает детальный отчёт инвестора.",
    noAllocationSummary: "В текущем снимке нет сводки по аллокациям.",
    snapshotUpdated: "Снимок обновлён",

    lifecycleTitle: "Хронология жизненного цикла",
    lifecycleDesc: "Жизненный цикл отчёта и доступные события аудита.",
    noLifecycleEvents: "События жизненного цикла не записаны.",
    lifecycleCreatedLabel: "Отчёт создан",
    lifecycleCreatedDetail: "Запись ежемесячного отчёта создана.",
    lifecycleUpdatedLabel: "Отчёт обновлён",
    lifecycleUpdatedDetail: "Последнее обновление метаданных отчёта.",
    lifecyclePublishedLabel: "Отчёт опубликован",
    lifecyclePublishedDetail: "publishedAt записан для видимости инвестору.",
    auditEventDetail: "событие аудита",

    timelineSource: "Источник",
    timelineLimit: "Лимит",
    loading: "Загрузка...",
    shown: "показано",
    details: "Подробнее",
    timelineLoadError: "Не удалось загрузить хронологию рисков.",
    noDiffStored: "Для этого события не сохранён подробный дифф.",
    detailLevel: "Уровень",
    detailScore: "Оценка",
    detailSource: "Источник",
    detailActor: "Пользователь",
    newFactors: "Новые факторы",
    resolvedFactors: "Устранённые факторы",
    newBlockingIssues: "Новые блокирующие проблемы",
    resolvedBlockingIssues: "Устранённые блокирующие проблемы",
    none: "Нет",

    errUpdateReport: "Не удалось обновить ежемесячный отчёт.",
    errEvaluateReadiness: "Не удалось оценить готовность отчёта.",
    errRegenerateSnapshot: "Не удалось регенерировать снимок подтверждений.",
    errLinkAllocation: "Не удалось связать аллокацию.",
    errRemoveAllocation: "Не удалось удалить связанную аллокацию.",
    errUpdateNote: "Не удалось обновить заметку аллокации.",

    noticeDraftSaved: "Черновик отчёта сохранён.",
    noticePublished: "Отчёт опубликован инвестору.",
    noticeReturnedDraft: "Отчёт возвращён в черновик.",
    noticeReadinessEvaluated: "Готовность отчёта оценена.",
    noticeSnapshotRegenerated: "Снимок подтверждений регенерирован из связанных аллокаций.",
    noticeAllocationLinked: "Аллокация связана. Регенерируйте снимок перед публикацией, если эта аллокация должна попасть в замороженный отчёт.",
    noticeAllocationRemoved: "Аллокация удалена из черновика отчёта. Регенерируйте снимок перед публикацией.",
    noticeNoteUpdated: "Заметка связанной аллокации обновлена."
  }
} as const;

type Strings = typeof STRINGS.en;
const getStrings = (locale: Locale): Strings => (STRINGS as unknown as Record<string, Strings>)[locale] ?? STRINGS.en;

type ProofSummary = Record<string, number>;
type ProofSummaryBreakdown = {
  available: ProofSummary;
  verified: ProofSummary;
  excluded: ProofSummary;
};

type SnapshotAllocation = {
  id: string;
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
  payoutStatus: string;
  reinvestDecision: string;
  updatedAt: string;
  proofSummaryBreakdown: ProofSummaryBreakdown;
};

type MonthlyReportDetail = {
  id: string;
  investorId: string;
  month: string;
  title: string;
  summary: string;
  performanceNote: string | null;
  payoutNote: string | null;
  proofSummary: ProofSummary;
  proofSummaryBreakdown: ProofSummaryBreakdown;
  allocationSnapshot: SnapshotAllocation[];
  status: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  investor: {
    id: string;
    fullName: string;
    email: string;
    telegram: string | null;
    status: string;
  };
};

type AllocationSummary = {
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
  payoutStatus: string;
  reinvestDecision: string;
  updatedAt: string;
  proofCount: number;
  investorVisibleProofCount: number;
};

type ReportAllocation = {
  id: string;
  monthlyReportId: string;
  allocationId: string;
  includedAt: string;
  includedBy: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  allocation: AllocationSummary;
};

type ReadinessIssue = {
  id: string;
  label: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  passed: boolean;
  message: string;
};

type ReadinessEvaluation = {
  state: "BLOCKED" | "NEEDS_REVIEW" | "READY" | "READY_WITH_WARNINGS";
  readinessPercentage: number;
  publishAllowed: boolean;
  requiresAcknowledgment: boolean;
  blockingIssues: ReadinessIssue[];
  warnings: ReadinessIssue[];
  checks: ReadinessIssue[];
  metrics: {
    linkedAllocationCount: number;
    snapshotAllocationCount: number;
    visibleProofCount: number;
    excludedProofCount: number;
    pendingProofCount: number;
    proofCompletenessScore: number;
    snapshotGeneratedAt: string | null;
    latestLinkageChangeAt: string | null;
  };
  policySnapshot?: {
    id: string;
    name: string;
    source: "database" | "default";
    requiredProofCategories: string[];
    warningProofCategories: string[];
    minimumProofCompletenessScore: number;
  };
  evaluatedAt: string;
};

type ReportReconciliation = {
  monthlyReportId: string;
  status: "BALANCED" | "WARNING" | "BROKEN";
  score: number;
  snapshotExists: boolean;
  linkedAllocationCount: number;
  blockingIssues: Array<{ id: string; severity: "BLOCKING" | "WARNING"; message: string }>;
  warnings: Array<{ id: string; severity: "BLOCKING" | "WARNING"; message: string }>;
  allocationSummaries: Array<{ allocationId: string; supplyCode: string; productName: string; status: "BALANCED" | "WARNING" | "BROKEN"; score: number }>;
};

type ReportRiskSnapshot = {
  generatedAt: string;
  portfolioRisk: {
    score: number;
    level: string;
    adminSummary: string;
    recommendedActions: string[];
    blockingIssues: Array<{ id: string; category: string; severity: string; label: string; description: string }>;
    warnings: Array<{ id: string; category: string; severity: string; label: string; description: string }>;
  };
  allocations: Array<{
    allocationId: string;
    supplyCode: string;
    productName: string;
    investorSafeSummary: { score: number; level: string; summary: string; visibleFactors: string[] };
  }>;
  materialRiskEvents: Array<{ allocationId: string; severity: string; category: string; label: string; investorSafeSummary: string }>;
};

type RiskTimelineFactor = { id: string; category: string; severity: string; label: string };
type RiskTimelineSourceFilter = (typeof RISK_TIMELINE_SOURCE_FILTERS)[number];
type RiskTimelineFilters = { source: RiskTimelineSourceFilter; limit: string };
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

type AuditLog = {
  id: string;
  actor: string;
  action: string;
  createdAt: string;
};

type ReportDraft = {
  month: string;
  title: string;
  summary: string;
  performanceNote: string;
  payoutNote: string;
};

const PROOF_TYPE_ORDER = [
  "SHIPMENT_PROOF",
  "MARKETPLACE_REPORT",
  "WAREHOUSE_MEDIA",
  "PAYOUT_PROOF",
  "PURCHASE_INVOICE",
  "SERIAL_VERIFICATION",
  "OTHER"
];

function getCookieValue(name: string) {
  if (typeof document === "undefined") return "";
  return document.cookie.split("; ").find((cookie) => cookie.startsWith(`${name}=`))?.split("=").slice(1).join("=") || "";
}

function getAdminMutationHeaders() {
  return {
    "Content-Type": "application/json",
    [ADMIN_CSRF_HEADER]: getCookieValue(ADMIN_CSRF_COOKIE)
  };
}

function formatMoney(fmt: AdminFormatters, value: string | number | null | undefined, currency = "USD") {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) return "-";
  if (currency === "USD") return fmt.currency(amount);
  return `${currency} ${fmt.number(amount)}`;
}

function proofEntries(summary: ProofSummary) {
  return Object.entries(summary)
    .filter(([, count]) => count > 0)
    .sort(([left], [right]) => {
      const leftIndex = PROOF_TYPE_ORDER.indexOf(left);
      const rightIndex = PROOF_TYPE_ORDER.indexOf(right);
      return (leftIndex === -1 ? 999 : leftIndex) - (rightIndex === -1 ? 999 : rightIndex) || left.localeCompare(right);
    });
}

function buildLifecycle(report: MonthlyReportDetail, auditLogs: AuditLog[], t: Strings, locale: Locale) {
  const lifecycle = [
    { id: "created", label: t.lifecycleCreatedLabel, at: report.createdAt, detail: t.lifecycleCreatedDetail },
    { id: "updated", label: t.lifecycleUpdatedLabel, at: report.updatedAt, detail: t.lifecycleUpdatedDetail },
    ...(report.publishedAt ? [{ id: "published", label: t.lifecyclePublishedLabel, at: report.publishedAt, detail: t.lifecyclePublishedDetail }] : []),
    ...auditLogs.map((log) => ({
      id: log.id,
      label: enumLabel("auditAction", log.action, locale),
      at: log.createdAt,
      detail: `${log.actor} ${t.auditEventDetail}`
    }))
  ];

  return lifecycle.sort((left, right) => new Date(right.at).getTime() - new Date(left.at).getTime());
}

function buildAllocationNoteState(allocations: ReportAllocation[]) {
  return Object.fromEntries(allocations.map((item) => [item.allocationId, item.note || ""]));
}

export function AdminReportDetailPage({
  locale,
  report,
  auditLogs,
  linkedAllocations,
  readiness,
  reconciliation,
  risk,
  riskTimeline,
  eligibleAllocations
}: {
  locale: Locale;
  report: MonthlyReportDetail;
  auditLogs: AuditLog[];
  linkedAllocations: ReportAllocation[];
  readiness: ReadinessEvaluation | null;
  reconciliation: ReportReconciliation | null;
  risk: ReportRiskSnapshot | null;
  riskTimeline: RiskTimelineEvent[];
  eligibleAllocations: AllocationSummary[];
}) {
  const t = getStrings(locale);
  const fmt = createAdminFormatters(locale);
  const router = useRouter();
  const [currentReport, setCurrentReport] = React.useState(report);
  const [currentAuditLogs, setCurrentAuditLogs] = React.useState(auditLogs);
  const [currentLinkedAllocations, setCurrentLinkedAllocations] = React.useState(linkedAllocations);
  const [currentEligibleAllocations, setCurrentEligibleAllocations] = React.useState(eligibleAllocations);
  const [currentReadiness, setCurrentReadiness] = React.useState(readiness);
  const [allocationNotes, setAllocationNotes] = React.useState<Record<string, string>>(() => buildAllocationNoteState(linkedAllocations));
  const [acknowledgeWarnings, setAcknowledgeWarnings] = React.useState(false);
  const [draft, setDraft] = React.useState<ReportDraft>(() => ({
    month: report.month,
    title: report.title,
    summary: report.summary,
    performanceNote: report.performanceNote || "",
    payoutNote: report.payoutNote || ""
  }));
  const [notice, setNotice] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [pendingAction, setPendingAction] = React.useState<string | null>(null);
  const lifecycle = buildLifecycle(currentReport, currentAuditLogs, t, locale);
  const canEditDraft = currentReport.status === "DRAFT";

  React.useEffect(() => {
    setCurrentReport(report);
    setCurrentAuditLogs(auditLogs);
    setCurrentLinkedAllocations(linkedAllocations);
    setCurrentEligibleAllocations(eligibleAllocations);
    setCurrentReadiness(readiness);
    setAllocationNotes(buildAllocationNoteState(linkedAllocations));
    setAcknowledgeWarnings(false);
    setDraft({
      month: report.month,
      title: report.title,
      summary: report.summary,
      performanceNote: report.performanceNote || "",
      payoutNote: report.payoutNote || ""
    });
  }, [report, auditLogs, linkedAllocations, eligibleAllocations, readiness]);

  async function mutateReport(actionLabel: string, payload: Record<string, unknown>, successMessage: string) {
    setPendingAction(actionLabel);
    setNotice(null);
    setError(null);

    try {
      const response = await fetch(`/api/monthly-reports/${currentReport.id}`, {
        method: "PATCH",
        headers: getAdminMutationHeaders(),
        body: JSON.stringify(payload)
      });
      const responsePayload = (await response.json()) as { ok: boolean; data?: MonthlyReportDetail; readiness?: ReadinessEvaluation; error?: string };

      if (!response.ok || !responsePayload.ok || !responsePayload.data) {
        if (responsePayload.readiness) setCurrentReadiness(responsePayload.readiness);
        throw new Error(responsePayload.error || t.errUpdateReport);
      }

      setCurrentReport((previous) => ({ ...previous, ...responsePayload.data, investor: previous.investor }));
      setNotice(successMessage);
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t.errUpdateReport);
    } finally {
      setPendingAction(null);
    }
  }

  function saveDraft() {
    void mutateReport("save", {
      month: draft.month,
      title: draft.title,
      summary: draft.summary,
      performanceNote: draft.performanceNote || null,
      payoutNote: draft.payoutNote || null
    }, t.noticeDraftSaved);
  }

  function publishReport() {
    void mutateReport("publish", { status: "PUBLISHED", acknowledgeWarnings }, t.noticePublished);
  }

  function unpublishReport() {
    void mutateReport("unpublish", { status: "DRAFT" }, t.noticeReturnedDraft);
  }

  function regenerateSnapshot() {
    void regenerateSnapshotFromLinkedAllocations();
  }

  async function refreshReadiness() {
    setPendingAction("readiness");
    setNotice(null);
    setError(null);

    try {
      const response = await fetch(`/api/monthly-reports/${currentReport.id}/readiness`, {
        method: "POST",
        headers: getAdminMutationHeaders()
      });
      const payload = (await response.json()) as { ok: boolean; data?: ReadinessEvaluation; error?: string };
      if (!response.ok || !payload.ok || !payload.data) throw new Error(payload.error || t.errEvaluateReadiness);
      setCurrentReadiness(payload.data);
      setNotice(t.noticeReadinessEvaluated);
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t.errEvaluateReadiness);
    } finally {
      setPendingAction(null);
    }
  }

  async function regenerateSnapshotFromLinkedAllocations() {
    setPendingAction("regenerate");
    setNotice(null);
    setError(null);

    try {
      const response = await fetch(`/api/monthly-reports/${currentReport.id}/regenerate-snapshot`, {
        method: "POST",
        headers: getAdminMutationHeaders()
      });
      const responsePayload = (await response.json()) as { ok: boolean; data?: MonthlyReportDetail; error?: string };
      if (!response.ok || !responsePayload.ok || !responsePayload.data) throw new Error(responsePayload.error || t.errRegenerateSnapshot);
      setCurrentReport((previous) => ({ ...previous, ...responsePayload.data, investor: previous.investor }));
      setNotice(t.noticeSnapshotRegenerated);
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t.errRegenerateSnapshot);
    } finally {
      setPendingAction(null);
    }
  }

  async function addAllocation(allocation: AllocationSummary) {
    setPendingAction(`add-${allocation.id}`);
    setNotice(null);
    setError(null);

    try {
      const response = await fetch(`/api/monthly-reports/${currentReport.id}/allocations`, {
        method: "POST",
        headers: getAdminMutationHeaders(),
        body: JSON.stringify({ allocationId: allocation.id })
      });
      const payload = (await response.json()) as { ok: boolean; data?: ReportAllocation; error?: string };
      if (!response.ok || !payload.ok || !payload.data) throw new Error(payload.error || t.errLinkAllocation);
      setCurrentLinkedAllocations((current) => [...current, payload.data as ReportAllocation]);
      setCurrentEligibleAllocations((current) => current.filter((item) => item.id !== allocation.id));
      setAllocationNotes((current) => ({ ...current, [allocation.id]: payload.data?.note || "" }));
      setNotice(t.noticeAllocationLinked);
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t.errLinkAllocation);
    } finally {
      setPendingAction(null);
    }
  }

  async function removeAllocation(link: ReportAllocation) {
    setPendingAction(`remove-${link.allocationId}`);
    setNotice(null);
    setError(null);

    try {
      const response = await fetch(`/api/monthly-reports/${currentReport.id}/allocations/${link.allocationId}`, {
        method: "DELETE",
        headers: getAdminMutationHeaders()
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.error || t.errRemoveAllocation);
      setCurrentLinkedAllocations((current) => current.filter((item) => item.allocationId !== link.allocationId));
      setCurrentEligibleAllocations((current) => [link.allocation, ...current]);
      setAllocationNotes((current) => {
        const next = { ...current };
        delete next[link.allocationId];
        return next;
      });
      setNotice(t.noticeAllocationRemoved);
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t.errRemoveAllocation);
    } finally {
      setPendingAction(null);
    }
  }

  async function saveAllocationNote(link: ReportAllocation) {
    setPendingAction(`note-${link.allocationId}`);
    setNotice(null);
    setError(null);

    try {
      const response = await fetch(`/api/monthly-reports/${currentReport.id}/allocations/${link.allocationId}`, {
        method: "PATCH",
        headers: getAdminMutationHeaders(),
        body: JSON.stringify({ note: allocationNotes[link.allocationId] || null })
      });
      const payload = (await response.json()) as { ok: boolean; data?: ReportAllocation; error?: string };
      if (!response.ok || !payload.ok || !payload.data) throw new Error(payload.error || t.errUpdateNote);
      setCurrentLinkedAllocations((current) => current.map((item) => (item.allocationId === link.allocationId ? payload.data as ReportAllocation : item)));
      setNotice(t.noticeNoteUpdated);
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t.errUpdateNote);
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground micro-noise">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(212,175,95,0.14),transparent_34rem),radial-gradient(circle_at_86%_10%,rgba(255,255,255,0.07),transparent_28rem)]" />
      <div className="macro-grid absolute inset-0 opacity-45" />
      <section className="relative z-10 py-8 sm:py-10">
        <div className="container">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link href={`/${locale}/admin/investors/${currentReport.investorId}`} className="inline-flex items-center gap-3 text-sm text-muted-foreground transition-colors hover:text-foreground">
              <ArrowLeft className="size-4" />
              {t.backToInvestor}
            </Link>
            <AdminNavigation locale={locale} activeSection="investors" />
          </div>

          <Card className="mb-6 rounded-[1.35rem] bg-graphite-900/[0.78]">
            <CardContent className="grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-100">{t.eyebrow}</p>
                <h1 className="mt-3 font-display text-4xl tracking-[-0.04em] text-foreground md:text-5xl">{currentReport.title}</h1>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{currentReport.month} · {currentReport.investor.fullName} · {currentReport.investor.email}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge>{enumLabel("reportStatus", currentReport.status, locale)}</Badge>
                <Badge variant="secondary">{currentReport.publishedAt ? t.published : t.notPublished}</Badge>
              </div>
            </CardContent>
          </Card>

          {notice ? <AdminNotice tone="success" message={notice} /> : null}
          {error ? <AdminNotice tone="error" message={error} /> : null}

          <div className="grid gap-6 xl:grid-cols-[0.84fr_1.16fr]">
            <div className="grid gap-6">
              <Card id="readiness" className="rounded-[1.35rem] bg-graphite-900/[0.72]">
                <CardHeader>
                  <CardTitle>{t.reportStatusTitle}</CardTitle>
                  <CardDescription>{t.reportStatusDesc}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <Metric label={t.labelStatus} value={enumLabel("reportStatus", currentReport.status, locale)} />
                  <Metric label={t.labelReportPeriod} value={currentReport.month} />
                  <Metric label={t.labelCreated} value={fmt.dateTime(currentReport.createdAt)} />
                  <Metric label={t.labelUpdated} value={fmt.dateTime(currentReport.updatedAt)} />
                  <Metric label={t.labelPublished} value={fmt.dateTime(currentReport.publishedAt)} />
                  <PublishGateNotice readiness={currentReadiness} t={t} />
                  {currentReadiness?.requiresAcknowledgment && canEditDraft ? (
                    <label className="flex items-start gap-3 rounded-[1.35rem] border border-white/10 bg-black/20 p-4 text-sm leading-6 text-muted-foreground">
                      <input type="checkbox" className="mt-1" checked={acknowledgeWarnings} onChange={(event) => setAcknowledgeWarnings(event.target.checked)} />
                      {t.acknowledgeWarnings}
                    </label>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" disabled={pendingAction !== null || currentReport.status === "PUBLISHED" || currentReadiness?.publishAllowed === false || Boolean(currentReadiness?.requiresAcknowledgment && !acknowledgeWarnings)} onClick={publishReport}>
                      {pendingAction === "publish" ? t.publishing : t.publishReport}
                    </Button>
                    <Button type="button" variant="outline" disabled={pendingAction !== null || currentReport.status !== "PUBLISHED"} onClick={unpublishReport}>
                      {pendingAction === "unpublish" ? t.returning : t.returnToDraft}
                    </Button>
                  </div>
                  <p className="text-xs leading-5 text-muted-foreground">{t.reportStatusHelp}</p>
                </CardContent>
              </Card>

              <Card id="reconciliation" className="rounded-[1.35rem] bg-graphite-900/[0.72]">
                <CardHeader>
                  <CardTitle>{t.readinessTitle}</CardTitle>
                  <CardDescription>{t.readinessDesc}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  {currentReadiness ? (
                    <>
                      <div className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t.readinessStateLabel}</p>
                            <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground">{enumLabel("readinessState", currentReadiness.state, locale)}</p>
                          </div>
                          <Badge>{currentReadiness.readinessPercentage}%</Badge>
                        </div>
                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                          <div className="h-full rounded-full bg-gold-200/70" style={{ width: `${currentReadiness.readinessPercentage}%` }} />
                        </div>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <Metric label={t.labelLinkedAllocations} value={String(currentReadiness.metrics.linkedAllocationCount)} />
                        <Metric label={t.labelSnapshotAllocations} value={String(currentReadiness.metrics.snapshotAllocationCount)} />
                        <Metric label={t.labelVisibleProofs} value={String(currentReadiness.metrics.visibleProofCount)} />
                        <Metric label={t.labelExcludedProofs} value={String(currentReadiness.metrics.excludedProofCount)} />
                        <Metric label={t.labelCompletenessScore} value={`${currentReadiness.metrics.proofCompletenessScore}%`} />
                        <Metric label={t.labelSnapshotGenerated} value={fmt.dateTime(currentReadiness.metrics.snapshotGeneratedAt)} />
                        <Metric label={t.labelPolicy} value={currentReadiness.policySnapshot?.name || t.readinessPolicyFallback} />
                        <Metric label={t.labelPolicyThreshold} value={`${currentReadiness.policySnapshot?.minimumProofCompletenessScore ?? 50}%`} />
                      </div>
                      <Link href={`/${locale}/admin/settings/readiness-policy`} className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-100 hover:text-gold-50">
                        {t.manageReadinessPolicy}
                      </Link>
                      <ReadinessGroup title={t.blockingIssues} items={currentReadiness.blockingIssues} emptyText={t.noBlockingIssues} t={t} />
                      <ReadinessGroup title={t.warnings} items={currentReadiness.warnings} emptyText={t.noReadinessWarnings} t={t} />
                      <ReadinessGroup title={t.checklist} items={currentReadiness.checks} emptyText={t.noChecks} t={t} showPassed />
                      <Button type="button" variant="outline" disabled={pendingAction !== null} onClick={refreshReadiness}>
                        {pendingAction === "readiness" ? t.evaluating : t.evaluateReadiness}
                      </Button>
                    </>
                  ) : (
                    <EmptyState text={t.readinessUnavailable} />
                  )}
                </CardContent>
              </Card>

              <Card id="risk" className="rounded-[1.35rem] bg-graphite-900/[0.72]">
                <CardHeader>
                  <CardTitle>{t.reconciliationTitle}</CardTitle>
                  <CardDescription>{t.reconciliationDesc}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  {reconciliation ? (
                    <>
                      <div className="flex flex-wrap items-center gap-2"><Badge>{enumLabel("reconciliationState", reconciliation.status, locale)}</Badge><Badge variant="secondary">{reconciliation.score}% {t.score}</Badge><Badge variant="secondary">{reconciliation.snapshotExists ? t.snapshotExists : t.noSnapshot}</Badge></div>
                      <Metric label={t.labelLinkedAllocationStatuses} value={reconciliation.allocationSummaries.map((allocation) => `${allocation.supplyCode}: ${enumLabel("reconciliationState", allocation.status, locale)}`).join(" · ") || t.noLinkedAllocations} />
                      <IssueSummary title={t.blockingIssues} items={reconciliation.blockingIssues} emptyText={t.reconBlockingEmpty} />
                      <IssueSummary title={t.warnings} items={reconciliation.warnings} emptyText={t.reconWarningsEmpty} />
                      <Button type="button" variant="outline" disabled={pendingAction !== null || !canEditDraft} onClick={regenerateSnapshot}>
                        <RefreshCw data-icon="inline-start" />
                        {pendingAction === "regenerate" ? t.regenerating : t.regenerateReportSnapshot}
                      </Button>
                    </>
                  ) : (
                    <EmptyState text={t.reconciliationUnavailable} />
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-[1.35rem] bg-graphite-900/[0.72]">
                <CardHeader>
                  <CardTitle>{t.riskOverviewTitle}</CardTitle>
                  <CardDescription>{t.riskOverviewDesc}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  {risk ? (
                    <>
                      <div className="flex flex-wrap items-center gap-2"><Badge>{enumLabel("riskLevel", risk.portfolioRisk.level, locale)}</Badge><Badge variant="secondary">{risk.portfolioRisk.score}/100 {t.riskScore}</Badge><Badge variant="secondary">{t.generated} {fmt.dateTime(risk.generatedAt)}</Badge></div>
                      <Metric label={t.labelAdminSummary} value={risk.portfolioRisk.adminSummary} />
                      <Metric label={t.labelHighRiskAllocations} value={risk.allocations.filter((allocation) => ["HIGH", "CRITICAL"].includes(allocation.investorSafeSummary.level)).map((allocation) => `${allocation.supplyCode}: ${enumLabel("riskLevel", allocation.investorSafeSummary.level, locale)}`).join(" · ") || t.noHighRiskAllocations} />
                      <IssueSummary title={t.materialRiskEvents} items={risk.materialRiskEvents.map((event) => ({ id: `${event.allocationId}-${event.label}`, severity: event.severity === "CRITICAL" ? "BLOCKING" : "WARNING", message: `${event.category} · ${event.label}` }))} emptyText={t.noMaterialRiskEvents} />
                      <div className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t.recommendedActions}</p>
                        <div className="mt-3 grid gap-2">{risk.portfolioRisk.recommendedActions.slice(0, 5).map((action) => <p key={action} className="rounded-2xl border border-white/10 bg-black/20 p-3 text-xs leading-5 text-muted-foreground">{action}</p>)}</div>
                      </div>
                    </>
                  ) : (
                    <EmptyState text={t.riskUnavailable} />
                  )}
                </CardContent>
              </Card>

              <RiskTimelineCard title={t.riskTimelineTitle} description={t.riskTimelineDesc} events={riskTimeline} endpoint={`/api/monthly-reports/${currentReport.id}/risk/timeline`} emptyText={t.riskTimelineEmpty} t={t} fmt={fmt} locale={locale} />

              <Card id="snapshots" className="rounded-[1.35rem] border-white/10 bg-graphite-900/[0.72]">
                <CardHeader>
                  <CardTitle>{t.snapshotControlsTitle}</CardTitle>
                  <CardDescription>{t.snapshotControlsDesc}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <Button type="button" variant="outline" disabled={pendingAction !== null || !canEditDraft} onClick={regenerateSnapshot}>
                    <RefreshCw data-icon="inline-start" />
                    {pendingAction === "regenerate" ? t.regenerating : t.regenerateProofSnapshot}
                  </Button>
                  <p className="text-xs leading-5 text-muted-foreground">{canEditDraft ? t.snapshotControlsHelpDraft : t.snapshotControlsHelpLocked}</p>
                </CardContent>
              </Card>

              <Card className="rounded-[1.35rem] bg-graphite-900/[0.72]">
                <CardHeader>
                  <CardTitle>{t.investorTitle}</CardTitle>
                  <CardDescription>{t.investorDesc}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <Metric label={t.labelName} value={currentReport.investor.fullName} />
                  <Metric label={t.labelEmail} value={currentReport.investor.email} />
                  <Metric label={t.labelTelegram} value={currentReport.investor.telegram || t.notSet} />
                  <Metric label={t.labelInvestorStatus} value={enumLabel("investorStatus", currentReport.investor.status, locale)} />
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6">
              <Card className="rounded-[1.35rem] bg-graphite-900/[0.72]">
                <CardHeader>
                  <CardTitle>{t.editDraftTitle}</CardTitle>
                  <CardDescription>{t.editDraftDesc}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <TextField label={t.labelReportPeriod} value={draft.month} disabled={!canEditDraft} onChange={(value) => setDraft((current) => ({ ...current, month: value }))} />
                  <TextField label={t.labelTitle} value={draft.title} disabled={!canEditDraft} onChange={(value) => setDraft((current) => ({ ...current, title: value }))} />
                  <TextArea label={t.labelSummary} value={draft.summary} disabled={!canEditDraft} onChange={(value) => setDraft((current) => ({ ...current, summary: value }))} />
                  <TextArea label={t.labelPerformanceNote} value={draft.performanceNote} disabled={!canEditDraft} onChange={(value) => setDraft((current) => ({ ...current, performanceNote: value }))} />
                  <TextArea label={t.labelPayoutNote} value={draft.payoutNote} disabled={!canEditDraft} onChange={(value) => setDraft((current) => ({ ...current, payoutNote: value }))} />
                  <div className="flex flex-wrap items-center gap-3">
                    <Button type="button" disabled={pendingAction !== null || !canEditDraft} onClick={saveDraft}>
                      <Save data-icon="inline-start" />
                      {pendingAction === "save" ? t.saving : t.saveDraft}
                    </Button>
                    {!canEditDraft ? <span className="text-xs text-muted-foreground">{t.returnToDraftHint}</span> : null}
                  </div>
                  <div className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t.internalAdminNote}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{t.internalAdminNoteBody}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[1.35rem] bg-graphite-900/[0.72]">
                <CardHeader>
                  <CardTitle>{t.linkedAllocationsTitle}</CardTitle>
                  <CardDescription>{t.linkedAllocationsDesc}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  {currentLinkedAllocations.length === 0 ? (
                    <EmptyState text={t.noAllocationsLinked} />
                  ) : currentLinkedAllocations.map((link) => (
                    <div key={link.id} className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{link.allocation.supplyCode}</p>
                          <Link href={`/${locale}/admin/allocations/${link.allocationId}`} className="mt-2 block text-lg font-semibold text-foreground transition-colors hover:text-gold-100">{link.allocation.productName}</Link>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">{t.includedBy} {link.includedBy} {t.includedOn} {fmt.dateTime(link.includedAt)}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge>{enumLabel("allocationStatus", link.allocation.status, locale)}</Badge>
                          <Badge variant="secondary">{enumLabel("riskLevel", link.allocation.riskLevel, locale)}</Badge>
                        </div>
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-4">
                        <Metric label={t.labelInvested} value={formatMoney(fmt, link.allocation.allocationAmount, link.allocation.currency)} />
                        <Metric label={t.labelExpectedResult} value={link.allocation.estimatedResult || "-"} />
                        <Metric label={t.labelVisibleProofs} value={String(link.allocation.investorVisibleProofCount)} />
                        <Metric label={t.labelProofTotal} value={String(link.allocation.proofCount)} />
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-end">
                        <TextField label={t.adminLinkageNote} value={allocationNotes[link.allocationId] || ""} disabled={!canEditDraft} onChange={(value) => setAllocationNotes((current) => ({ ...current, [link.allocationId]: value }))} />
                        <Button type="button" variant="outline" disabled={pendingAction !== null || !canEditDraft} onClick={() => saveAllocationNote(link)}>
                          {pendingAction === `note-${link.allocationId}` ? t.saving : t.saveNote}
                        </Button>
                        <Button type="button" variant="outline" disabled={pendingAction !== null || !canEditDraft} onClick={() => removeAllocation(link)}>
                          <Trash2 data-icon="inline-start" />
                          {pendingAction === `remove-${link.allocationId}` ? t.removing : t.remove}
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="rounded-[1.35rem] bg-graphite-900/[0.72]">
                <CardHeader>
                  <CardTitle>{t.eligibleAllocationsTitle}</CardTitle>
                  <CardDescription>{t.eligibleAllocationsDesc}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  {currentEligibleAllocations.length === 0 ? (
                    <EmptyState text={t.noEligibleAllocations} />
                  ) : currentEligibleAllocations.map((allocation) => (
                    <div key={allocation.id} className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{allocation.supplyCode}</p>
                          <p className="mt-2 text-lg font-semibold text-foreground">{allocation.productName}</p>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">{allocation.marketplace || t.marketplaceNotSet}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge>{enumLabel("allocationStatus", allocation.status, locale)}</Badge>
                          <Badge variant="secondary">{enumLabel("riskLevel", allocation.riskLevel, locale)}</Badge>
                        </div>
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-4">
                        <Metric label={t.labelInvested} value={formatMoney(fmt, allocation.allocationAmount, allocation.currency)} />
                        <Metric label={t.labelExpectedResult} value={allocation.estimatedResult || "-"} />
                        <Metric label={t.labelVisibleProofs} value={String(allocation.investorVisibleProofCount)} />
                        <Metric label={t.labelProofTotal} value={String(allocation.proofCount)} />
                      </div>
                      <div className="mt-4">
                        <Button type="button" variant="outline" disabled={pendingAction !== null || !canEditDraft} onClick={() => addAllocation(allocation)}>
                          <Link2 data-icon="inline-start" />
                          {pendingAction === `add-${allocation.id}` ? t.adding : t.addAllocation}
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="rounded-[1.35rem] bg-graphite-900/[0.72]">
                <CardHeader>
                  <CardTitle>{t.proofSnapshotTitle}</CardTitle>
                  <CardDescription>{t.proofSnapshotDesc}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                  <ProofBreakdown title={t.availableProofs} summary={currentReport.proofSummaryBreakdown.available} emptyText={t.noAvailableProofs} locale={locale} />
                  <ProofBreakdown title={t.verifiedProofs} summary={currentReport.proofSummaryBreakdown.verified} emptyText={t.noVerifiedProofs} locale={locale} />
                  <ProofBreakdown title={t.excludedProofs} summary={currentReport.proofSummaryBreakdown.excluded} emptyText={t.noExcludedProofs} locale={locale} />
                </CardContent>
              </Card>

              <Card className="rounded-[1.35rem] bg-graphite-900/[0.72]">
                <CardHeader>
                  <CardTitle>{t.frozenSnapshotTitle}</CardTitle>
                  <CardDescription>{t.frozenSnapshotDesc}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  {currentReport.allocationSnapshot.length === 0 ? (
                    <EmptyState text={t.noAllocationSummary} />
                  ) : currentReport.allocationSnapshot.map((allocation) => (
                    <div key={allocation.id} className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{allocation.supplyCode}</p>
                          <p className="mt-2 font-semibold text-foreground">{allocation.productName}</p>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">{t.snapshotUpdated} {fmt.dateTime(allocation.updatedAt)}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge>{enumLabel("allocationStatus", allocation.status, locale)}</Badge>
                          <Badge variant="secondary">{enumLabel("riskLevel", allocation.riskLevel, locale)}</Badge>
                        </div>
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-4">
                        <Metric label={t.labelInvested} value={formatMoney(fmt, allocation.allocationAmount, allocation.currency)} />
                        <Metric label={t.labelExpectedResult} value={allocation.estimatedResult || "-"} />
                        <Metric label={t.availableProofs} value={String(Object.values(allocation.proofSummaryBreakdown.available).reduce((sum, count) => sum + count, 0))} />
                        <Metric label={t.verifiedProofs} value={String(Object.values(allocation.proofSummaryBreakdown.verified).reduce((sum, count) => sum + count, 0))} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="rounded-[1.35rem] bg-graphite-900/[0.72]">
                <CardHeader>
                  <CardTitle>{t.lifecycleTitle}</CardTitle>
                  <CardDescription>{t.lifecycleDesc}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                  {lifecycle.length === 0 ? (
                    <EmptyState text={t.noLifecycleEvents} />
                  ) : lifecycle.map((item) => (
                    <div key={item.id} className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-foreground">{item.label}</p>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.detail}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">{fmt.dateTime(item.at)}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function TextField({ label, value, disabled, onChange }: { label: string; value: string; disabled: boolean; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      <input value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className="h-12 rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-foreground outline-none disabled:cursor-not-allowed disabled:opacity-60" />
    </label>
  );
}

function TextArea({ label, value, disabled, onChange }: { label: string; value: string; disabled: boolean; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      <textarea value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className="min-h-24 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-foreground outline-none disabled:cursor-not-allowed disabled:opacity-60" />
    </label>
  );
}

function AdminNotice({ tone, message }: { tone: "success" | "error"; message: string }) {
  return (
    <div className={`mb-6 rounded-[1.35rem] border p-4 text-sm ${tone === "success" ? "border-gold-200/25 bg-gold-200/10 text-gold-100" : "border-white/10 bg-black/30 text-foreground"}`}>
      {message}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm leading-6 text-foreground">{value}</p>
    </div>
  );
}

function ProofBreakdown({ title, summary, emptyText, locale }: { title: string; summary: ProofSummary; emptyText: string; locale: Locale }) {
  const entries = proofEntries(summary);

  return (
    <div className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4">
      <div className="mb-4 flex items-center gap-2">
        <FileText className="size-4 text-gold-100" />
        <p className="text-sm font-semibold text-foreground">{title}</p>
      </div>
      {entries.length === 0 ? (
        <p className="text-sm leading-6 text-muted-foreground">{emptyText}</p>
      ) : (
        <div className="grid gap-3">
          {entries.map(([type, count]) => (
            <div key={type}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">{enumLabel("proofType", type, locale)}</span>
                <Badge variant="secondary">{count}</Badge>
              </div>
              <Separator className="mt-3" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PublishGateNotice({ readiness, t }: { readiness: ReadinessEvaluation | null; t: Strings }) {
  if (!readiness) {
    return <div className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4 text-sm leading-6 text-muted-foreground">{t.publishGateEvaluate}</div>;
  }

  const message =
    readiness.state === "READY"
      ? t.publishGateReady
      : readiness.state === "READY_WITH_WARNINGS"
        ? t.publishGateWarnings
        : readiness.state === "NEEDS_REVIEW"
          ? t.publishGateNeedsReview
          : t.publishGateBlocked;

  return (
    <div className="rounded-[1.35rem] border border-gold-200/20 bg-gold-200/10 p-4 text-sm leading-6 text-gold-100">
      {message}
    </div>
  );
}

function ReadinessGroup({ title, items, emptyText, t, showPassed = false }: { title: string; items: ReadinessIssue[]; emptyText: string; t: Strings; showPassed?: boolean }) {
  const visibleItems = showPassed ? items : items.filter((item) => !item.passed);

  return (
    <div className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {visibleItems.length === 0 ? (
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{emptyText}</p>
      ) : (
        <div className="mt-3 grid gap-2">
          {visibleItems.map((item) => (
            <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">{item.label}</p>
                <Badge variant={item.passed ? "secondary" : "default"}>{item.passed ? t.passed : item.severity}</Badge>
              </div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-[1.35rem] border border-white/10 bg-black/20 p-6 text-center text-sm text-muted-foreground">{text}</div>;
}

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

function RiskTimelineCard({ title, description, events: initialEvents, endpoint, emptyText, t, fmt, locale }: { title: string; description: string; events: RiskTimelineEvent[]; endpoint: string; emptyText: string; t: Strings; fmt: AdminFormatters; locale: Locale }) {
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
      const params = new URLSearchParams({ source: nextFilters.source, limit: nextFilters.limit });
      const response = await fetch(`${endpoint}?${params.toString()}`);
      const payload = await response.json();

      if (!response.ok || !payload?.data?.events) {
        throw new Error(payload?.error || t.timelineLoadError);
      }

      setEvents(payload.data.events);
    } catch (error) {
      setFilterError(error instanceof Error ? error.message : t.timelineLoadError);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="rounded-[1.35rem] bg-graphite-900/[0.72]">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_160px_120px]">
            <RiskTimelineSelectField label={t.timelineSource} value={filters.source} options={RISK_TIMELINE_SOURCE_FILTERS} onChange={(value) => void reloadTimeline({ ...filters, source: value as RiskTimelineSourceFilter })} formatOption={(option) => enumLabel("riskSource", option, locale)} />
            <RiskTimelineSelectField label={t.timelineLimit} value={filters.limit} options={RISK_TIMELINE_LIMIT_OPTIONS} onChange={(value) => void reloadTimeline({ ...filters, limit: value })} />
            <div className="flex items-end">
              <Badge variant="secondary" className="h-12 rounded-2xl px-4">{isLoading ? t.loading : `${events.length} ${t.shown}`}</Badge>
            </div>
          </div>
          {filterError ? <p className="mt-3 text-sm leading-6 text-gold-100">{filterError}</p> : null}
        </div>
        {events.length === 0 ? (
          <EmptyState text={emptyText} />
        ) : events.map((event) => (
          <div key={event.id} className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{event.summary}</p>
                  {event.risk ? <Badge>{enumLabel("riskLevel", event.risk.level, locale)}</Badge> : null}
                  {event.risk ? <Badge variant="secondary">{event.risk.score}/100</Badge> : null}
                </div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">{enumLabel("riskSource", event.source, locale)} · {event.actor}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => setExpandedEventId((current) => current === event.id ? null : event.id)}>{t.details}</Button>
                <span className="text-xs text-muted-foreground">{fmt.dateTime(event.createdAt)}</span>
              </div>
            </div>
            {expandedEventId === event.id ? <RiskTimelineEventDetailsPanel event={event} t={t} locale={locale} /> : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function RiskTimelineEventDetailsPanel({ event, t, locale }: { event: RiskTimelineEvent; t: Strings; locale: Locale }) {
  const details = event.details;
  const hasDiff = Boolean(details.currentLevel || details.currentScore !== null || details.previousLevel || details.previousScore !== null || details.newFactors.length || details.resolvedFactors.length || details.newBlockingIssues.length || details.resolvedBlockingIssues.length);

  if (!hasDiff) {
    return <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-muted-foreground">{t.noDiffStored}</div>;
  }

  return (
    <div className="mt-3 rounded-[1.35rem] border border-white/10 bg-black/20 p-4">
      <div className="grid gap-3 md:grid-cols-4">
        <RiskTimelineDetail label={t.detailLevel} value={`${formatRiskDetailValue(details.previousLevel)} -> ${formatRiskDetailValue(details.currentLevel)}`} />
        <RiskTimelineDetail label={t.detailScore} value={`${formatRiskDetailValue(details.previousScore)} -> ${formatRiskDetailValue(details.currentScore)}`} />
        <RiskTimelineDetail label={t.detailSource} value={enumLabel("riskSource", details.source, locale)} />
        <RiskTimelineDetail label={t.detailActor} value={details.actor} />
      </div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">{details.summary}</p>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <RiskTimelineFactors title={t.newFactors} items={details.newFactors} t={t} />
        <RiskTimelineFactors title={t.resolvedFactors} items={details.resolvedFactors} t={t} />
        <RiskTimelineFactors title={t.newBlockingIssues} items={details.newBlockingIssues} t={t} />
        <RiskTimelineFactors title={t.resolvedBlockingIssues} items={details.resolvedBlockingIssues} t={t} />
      </div>
    </div>
  );
}

function RiskTimelineDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-xs leading-5 text-foreground">{value}</p>
    </div>
  );
}

function formatRiskDetailValue(value: string | number | null) {
  return value === null || value === "" ? "-" : String(value);
}

function RiskTimelineFactors({ title, items, t }: { title: string; items: RiskTimelineFactor[]; t: Strings }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{title}</p>
      {items.length === 0 ? (
        <p className="mt-2 text-xs leading-5 text-muted-foreground">{t.none}</p>
      ) : (
        <div className="mt-2 flex flex-wrap gap-2">
          {items.slice(0, 4).map((item) => <Badge key={`${item.id}-${item.label}`} variant="secondary">{item.severity} · {item.label}</Badge>)}
        </div>
      )}
    </div>
  );
}

function IssueSummary({ title, items, emptyText }: { title: string; items: Array<{ id: string; message: string }>; emptyText: string }) {
  return (
    <div className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{title}</p>
      {items.length === 0 ? (
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{emptyText}</p>
      ) : (
        <div className="mt-3 grid gap-2">
          {items.map((item) => <div key={item.id} className="rounded-2xl border border-gold-200/20 bg-gold-200/10 p-3 text-xs leading-5 text-gold-100">{item.message}</div>)}
        </div>
      )}
    </div>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, PackagePlus, Save, ShieldCheck } from "lucide-react";
import { createAdminFormatters, enumLabel, type Locale } from "@otiz/lib";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Separator } from "@otiz/ui";
import { AdminNavigation } from "./admin-navigation";

const ADMIN_CSRF_COOKIE = "admin_csrf_token";
const ADMIN_CSRF_HEADER = "x-csrf-token";
const INVESTOR_STATUSES = ["ACTIVE", "PAUSED", "CLOSED"] as const;
const ALLOCATION_STATUSES = ["DRAFT", "PURCHASING", "SHIPPING", "RECEIVED", "SELLING", "COMPLETED", "CANCELED", "LOSS"] as const;
const REPORT_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
const ACTIVE_ALLOCATION_STATUSES = ["DRAFT", "PURCHASING", "SHIPPING", "RECEIVED", "SELLING"];

type Allocation = {
  id: string;
  investorId: string;
  supplyCode: string;
  productName: string;
  marketplace: string | null;
  allocationAmount: string;
  currency: string;
  status: string;
  expectedCycleDays: number | null;
  estimatedResult: string | null;
  actualProfit: string | null;
  startedAt: string | null;
  completedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type MonthlyReport = {
  id: string;
  investorId: string;
  month: string;
  title: string;
  summary: string;
  performanceNote: string | null;
  payoutNote: string | null;
  proofSummary: Record<string, number>;
  status: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type InvestorDetail = {
  id: string;
  fullName: string;
  email: string;
  telegram: string | null;
  status: string;
  sourceApplicationId: string | null;
  totalCapital: string;
  reinvestEnabled: boolean;
  lastReportAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  allocations: Allocation[];
  monthlyReports: MonthlyReport[];
  sourceApplication: {
    id: string;
    fullName: string;
    email: string | null;
    status: string;
    plannedAllocationAmount: number;
    createdAt: string;
  } | null;
};

type InvestorDraft = {
  status: string;
  totalCapital: string;
  reinvestEnabled: boolean;
  lastReportAt: string;
  notes: string;
};

type AllocationDraft = {
  supplyCode: string;
  productName: string;
  marketplace: string;
  allocationAmount: string;
  currency: string;
  status: string;
  expectedCycleDays: string;
  estimatedResult: string;
  notes: string;
};

type ReportDraft = {
  month: string;
  title: string;
  summary: string;
  performanceNote: string;
  payoutNote: string;
  status: string;
};

const STRINGS = {
  en: {
    BACK_TO_INVESTORS: "Back to investors",
    EYEBROW: "Managed investor profile",
    REINVEST_ON: "Reinvest enabled",
    REINVEST_OFF: "Reinvest disabled",
    KPI_ACTIVE_CAPITAL: "Active capital",
    KPI_TOTAL_PROFIT: "Total profit",
    KPI_ACTIVE_ALLOCATIONS: "Active allocations",
    KPI_COMPLETED_ALLOCATIONS: "Completed allocations",
    EDIT_INVESTOR_TITLE: "Edit investor",
    EDIT_INVESTOR_DESC: "Admin-managed profile fields only. No money movement is performed here.",
    LABEL_STATUS: "Status",
    LABEL_TOTAL_CAPITAL: "Total capital",
    PH_TOTAL_CAPITAL: "25000",
    LABEL_REINVEST_ENABLED: "Reinvest enabled",
    LABEL_LAST_REPORT_DATE: "Last report date",
    LABEL_NOTES: "Notes",
    SAVE_INVESTOR_IDLE: "Save investor",
    SAVE_INVESTOR_BUSY: "Saving...",
    SOURCE_APPLICATION_TITLE: "Source application",
    SOURCE_APPLICATION_DESC: "Original approved lead context.",
    NO_EMAIL: "No email",
    PLANNED_ALLOCATION: "Planned allocation:",
    OPEN_SOURCE_APPLICATION: "Open source application",
    NO_SOURCE_APPLICATION: "No source application linked.",
    CREATE_ALLOCATION_TITLE: "Create managed allocation",
    CREATE_ALLOCATION_DESC: "One supply allocation assigned to this investor. No investor self-service creation.",
    LABEL_SUPPLY_CODE: "Supply code",
    PH_SUPPLY_CODE: "SUP-APL-0526-102",
    LABEL_PRODUCT: "Product",
    PH_PRODUCT: "iPhone 15 Pro batch",
    LABEL_MARKETPLACE: "Marketplace",
    PH_MARKETPLACE: "Amazon / eBay / local",
    LABEL_ALLOCATION_AMOUNT: "Allocation amount",
    PH_ALLOCATION_AMOUNT: "10000",
    LABEL_CURRENCY: "Currency",
    PH_CURRENCY: "USD",
    LABEL_EXPECTED_CYCLE_DAYS: "Expected cycle days",
    PH_EXPECTED_CYCLE_DAYS: "45",
    LABEL_ESTIMATED_RESULT: "Estimated result",
    PH_ESTIMATED_RESULT: "Operational estimate",
    CREATE_ALLOCATION_IDLE: "Create allocation",
    CREATE_ALLOCATION_BUSY: "Creating...",
    ALLOCATIONS_TITLE: "Allocations",
    ALLOCATIONS_DESC: "Managed electronics commerce allocations for this investor.",
    NO_ALLOCATIONS_TITLE: "No allocations yet",
    NO_ALLOCATIONS_DESC: "Create the first managed allocation when capital is assigned to a real supply cycle.",
    MARKETPLACE_NOT_SET: "Marketplace not set",
    METRIC_AMOUNT: "Amount",
    METRIC_EXPECTED_CYCLE: "Expected cycle",
    METRIC_ESTIMATED: "Estimated",
    METRIC_ACTUAL_PROFIT: "Actual profit",
    DAYS: "days",
    LABEL_UPDATE_STATUS: "Update status",
    LABEL_ACTUAL_PROFIT: "Actual profit",
    PH_ACTUAL_PROFIT: "0",
    UPDATED_LABEL: "Updated",
    COMPLETED_AT_LABEL: "Completed",
    REPORTS_TITLE: "Monthly reports",
    REPORTS_DESC: "Admin-managed reporting. Proof summary includes only available or verified proof categories.",
    LABEL_MONTH: "Month",
    PH_MONTH: "May 2026",
    LABEL_TITLE: "Title",
    PH_TITLE: "May operational report",
    LABEL_SUMMARY: "Summary",
    LABEL_PERFORMANCE_NOTE: "Performance note",
    PH_PERFORMANCE_NOTE: "Operational performance note",
    LABEL_PAYOUT_NOTE: "Payout note",
    PH_PAYOUT_NOTE: "Payout or reinvest note",
    CREATE_REPORT_IDLE: "Create report",
    CREATE_REPORT_BUSY: "Creating...",
    NO_REPORTS_TITLE: "No reports yet",
    NO_REPORTS_DESC: "Create a draft report when monthly operations are ready for manager review.",
    METRIC_PUBLISHED: "Published",
    METRIC_PROOF_CATEGORIES: "Proof categories",
    METRIC_UPDATED: "Updated",
    NO_AVAILABLE_PROOFS: "No available proofs",
    PUBLISH: "Publish",
    OPEN_REPORT: "Open report",
    NOTICE_INVESTOR_UPDATED: "Investor profile updated.",
    NOTICE_ALLOCATION_CREATED: "Allocation created.",
    NOTICE_ALLOCATION_UPDATED: "Allocation updated.",
    NOTICE_REPORT_CREATED: "Monthly report created.",
    NOTICE_REPORT_UPDATED: "Monthly report updated.",
    ERROR_UPDATE_INVESTOR: "Unable to update investor.",
    ERROR_CREATE_ALLOCATION: "Unable to create allocation.",
    ERROR_UPDATE_ALLOCATION: "Unable to update allocation.",
    ERROR_CREATE_REPORT: "Unable to create report.",
    ERROR_UPDATE_REPORT: "Unable to update report."
  },
  ru: {
    BACK_TO_INVESTORS: "К инвесторам",
    EYEBROW: "Управляемый профиль инвестора",
    REINVEST_ON: "Реинвест включён",
    REINVEST_OFF: "Реинвест отключён",
    KPI_ACTIVE_CAPITAL: "Активный капитал",
    KPI_TOTAL_PROFIT: "Общая прибыль",
    KPI_ACTIVE_ALLOCATIONS: "Активные аллокации",
    KPI_COMPLETED_ALLOCATIONS: "Завершённые аллокации",
    EDIT_INVESTOR_TITLE: "Редактировать инвестора",
    EDIT_INVESTOR_DESC: "Только управляемые администратором поля профиля. Движение средств здесь не выполняется.",
    LABEL_STATUS: "Статус",
    LABEL_TOTAL_CAPITAL: "Общий капитал",
    PH_TOTAL_CAPITAL: "25000",
    LABEL_REINVEST_ENABLED: "Реинвест включён",
    LABEL_LAST_REPORT_DATE: "Дата последнего отчёта",
    LABEL_NOTES: "Заметки",
    SAVE_INVESTOR_IDLE: "Сохранить инвестора",
    SAVE_INVESTOR_BUSY: "Сохранение...",
    SOURCE_APPLICATION_TITLE: "Исходная заявка",
    SOURCE_APPLICATION_DESC: "Контекст исходного одобренного лида.",
    NO_EMAIL: "Нет email",
    PLANNED_ALLOCATION: "Планируемая аллокация:",
    OPEN_SOURCE_APPLICATION: "Открыть исходную заявку",
    NO_SOURCE_APPLICATION: "Исходная заявка не привязана.",
    CREATE_ALLOCATION_TITLE: "Создать управляемую аллокацию",
    CREATE_ALLOCATION_DESC: "Одна аллокация поставки, назначенная этому инвестору. Самостоятельное создание инвестором недоступно.",
    LABEL_SUPPLY_CODE: "Код поставки",
    PH_SUPPLY_CODE: "SUP-APL-0526-102",
    LABEL_PRODUCT: "Товар",
    PH_PRODUCT: "Партия iPhone 15 Pro",
    LABEL_MARKETPLACE: "Маркетплейс",
    PH_MARKETPLACE: "Amazon / eBay / локальный",
    LABEL_ALLOCATION_AMOUNT: "Сумма аллокации",
    PH_ALLOCATION_AMOUNT: "10000",
    LABEL_CURRENCY: "Валюта",
    PH_CURRENCY: "USD",
    LABEL_EXPECTED_CYCLE_DAYS: "Ожидаемый цикл, дней",
    PH_EXPECTED_CYCLE_DAYS: "45",
    LABEL_ESTIMATED_RESULT: "Оценочный результат",
    PH_ESTIMATED_RESULT: "Операционная оценка",
    CREATE_ALLOCATION_IDLE: "Создать аллокацию",
    CREATE_ALLOCATION_BUSY: "Создание...",
    ALLOCATIONS_TITLE: "Аллокации",
    ALLOCATIONS_DESC: "Управляемые аллокации в торговле электроникой для этого инвестора.",
    NO_ALLOCATIONS_TITLE: "Аллокаций пока нет",
    NO_ALLOCATIONS_DESC: "Создайте первую управляемую аллокацию, когда капитал назначен на реальный цикл поставки.",
    MARKETPLACE_NOT_SET: "Маркетплейс не указан",
    METRIC_AMOUNT: "Сумма",
    METRIC_EXPECTED_CYCLE: "Ожидаемый цикл",
    METRIC_ESTIMATED: "Оценка",
    METRIC_ACTUAL_PROFIT: "Фактическая прибыль",
    DAYS: "дней",
    LABEL_UPDATE_STATUS: "Обновить статус",
    LABEL_ACTUAL_PROFIT: "Фактическая прибыль",
    PH_ACTUAL_PROFIT: "0",
    UPDATED_LABEL: "Обновлено",
    COMPLETED_AT_LABEL: "Завершено",
    REPORTS_TITLE: "Ежемесячные отчёты",
    REPORTS_DESC: "Управляемая администратором отчётность. Сводка подтверждений включает только доступные или проверенные категории.",
    LABEL_MONTH: "Месяц",
    PH_MONTH: "Май 2026",
    LABEL_TITLE: "Заголовок",
    PH_TITLE: "Операционный отчёт за май",
    LABEL_SUMMARY: "Сводка",
    LABEL_PERFORMANCE_NOTE: "Заметка о результатах",
    PH_PERFORMANCE_NOTE: "Заметка об операционных результатах",
    LABEL_PAYOUT_NOTE: "Заметка о выплате",
    PH_PAYOUT_NOTE: "Заметка о выплате или реинвесте",
    CREATE_REPORT_IDLE: "Создать отчёт",
    CREATE_REPORT_BUSY: "Создание...",
    NO_REPORTS_TITLE: "Отчётов пока нет",
    NO_REPORTS_DESC: "Создайте черновик отчёта, когда операции за месяц готовы к проверке менеджером.",
    METRIC_PUBLISHED: "Опубликовано",
    METRIC_PROOF_CATEGORIES: "Категории подтверждений",
    METRIC_UPDATED: "Обновлено",
    NO_AVAILABLE_PROOFS: "Нет доступных подтверждений",
    PUBLISH: "Опубликовать",
    OPEN_REPORT: "Открыть отчёт",
    NOTICE_INVESTOR_UPDATED: "Профиль инвестора обновлён.",
    NOTICE_ALLOCATION_CREATED: "Аллокация создана.",
    NOTICE_ALLOCATION_UPDATED: "Аллокация обновлена.",
    NOTICE_REPORT_CREATED: "Ежемесячный отчёт создан.",
    NOTICE_REPORT_UPDATED: "Ежемесячный отчёт обновлён.",
    ERROR_UPDATE_INVESTOR: "Не удалось обновить инвестора.",
    ERROR_CREATE_ALLOCATION: "Не удалось создать аллокацию.",
    ERROR_UPDATE_ALLOCATION: "Не удалось обновить аллокацию.",
    ERROR_CREATE_REPORT: "Не удалось создать отчёт.",
    ERROR_UPDATE_REPORT: "Не удалось обновить отчёт."
  }
} as const;

type Strings = typeof STRINGS.en;
const getStrings = (locale: Locale): Strings => (STRINGS as unknown as Record<string, Strings>)[locale] ?? STRINGS.en;

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

function toDateInputValue(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function calculateKpis(allocations: Allocation[]) {
  return {
    activeCapital: allocations.filter((item) => ACTIVE_ALLOCATION_STATUSES.includes(item.status)).reduce((sum, item) => sum + Number(item.allocationAmount || 0), 0),
    totalProfit: allocations.filter((item) => item.status === "COMPLETED").reduce((sum, item) => sum + Number(item.actualProfit || 0), 0),
    activeAllocations: allocations.filter((item) => ACTIVE_ALLOCATION_STATUSES.includes(item.status)).length,
    completedAllocations: allocations.filter((item) => item.status === "COMPLETED").length
  };
}

export function AdminInvestorDetailPage({ locale, investor: initialInvestor }: { locale: Locale; investor: InvestorDetail }) {
  const t = getStrings(locale);
  const formatters = createAdminFormatters(locale);

  function formatMoney(value: string | number | null | undefined) {
    const amount = Number(value || 0);
    return formatters.currency(Number.isFinite(amount) ? amount : 0);
  }

  function formatDate(value: string | null) {
    return formatters.dateTime(value);
  }

  const [investor, setInvestor] = React.useState(initialInvestor);
  const [investorDraft, setInvestorDraft] = React.useState<InvestorDraft>(() => ({
    status: initialInvestor.status,
    totalCapital: initialInvestor.totalCapital,
    reinvestEnabled: initialInvestor.reinvestEnabled,
    lastReportAt: toDateInputValue(initialInvestor.lastReportAt),
    notes: initialInvestor.notes || ""
  }));
  const [allocationDraft, setAllocationDraft] = React.useState<AllocationDraft>({
    supplyCode: "",
    productName: "",
    marketplace: "",
    allocationAmount: "",
    currency: "USD",
    status: "DRAFT",
    expectedCycleDays: "45",
    estimatedResult: "",
    notes: ""
  });
  const [reportDraft, setReportDraft] = React.useState<ReportDraft>({ month: "", title: "", summary: "", performanceNote: "", payoutNote: "", status: "DRAFT" });
  const [notice, setNotice] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isSavingInvestor, setIsSavingInvestor] = React.useState(false);
  const [isCreatingAllocation, setIsCreatingAllocation] = React.useState(false);
  const [isCreatingReport, setIsCreatingReport] = React.useState(false);
  const [updatingReportId, setUpdatingReportId] = React.useState<string | null>(null);
  const [updatingAllocationId, setUpdatingAllocationId] = React.useState<string | null>(null);
  const kpis = calculateKpis(investor.allocations);

  async function saveInvestor() {
    setIsSavingInvestor(true);
    setNotice(null);
    setError(null);

    try {
      const response = await fetch(`/api/investors/${investor.id}`, {
        method: "PATCH",
        headers: getAdminMutationHeaders(),
        body: JSON.stringify({
          status: investorDraft.status,
          totalCapital: investorDraft.totalCapital,
          reinvestEnabled: investorDraft.reinvestEnabled,
          lastReportAt: investorDraft.lastReportAt || null,
          notes: investorDraft.notes
        })
      });
      const payload = (await response.json()) as { ok: boolean; data?: Partial<InvestorDetail>; error?: string };
      if (!response.ok || !payload.ok || !payload.data) throw new Error(payload.error || t.ERROR_UPDATE_INVESTOR);
      setInvestor((current) => ({ ...current, ...payload.data }));
      setNotice(t.NOTICE_INVESTOR_UPDATED);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t.ERROR_UPDATE_INVESTOR);
    } finally {
      setIsSavingInvestor(false);
    }
  }

  async function createAllocation() {
    setIsCreatingAllocation(true);
    setNotice(null);
    setError(null);

    try {
      const response = await fetch(`/api/investors/${investor.id}/allocations`, {
        method: "POST",
        headers: getAdminMutationHeaders(),
        body: JSON.stringify({
          ...allocationDraft,
          expectedCycleDays: allocationDraft.expectedCycleDays ? Number(allocationDraft.expectedCycleDays) : null
        })
      });
      const payload = (await response.json()) as { ok: boolean; data?: Allocation; error?: string };
      if (!response.ok || !payload.ok || !payload.data) throw new Error(payload.error || t.ERROR_CREATE_ALLOCATION);
      setInvestor((current) => ({ ...current, allocations: [payload.data as Allocation, ...current.allocations] }));
      setAllocationDraft({ supplyCode: "", productName: "", marketplace: "", allocationAmount: "", currency: "USD", status: "DRAFT", expectedCycleDays: "45", estimatedResult: "", notes: "" });
      setNotice(t.NOTICE_ALLOCATION_CREATED);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t.ERROR_CREATE_ALLOCATION);
    } finally {
      setIsCreatingAllocation(false);
    }
  }

  async function updateAllocation(allocation: Allocation, payload: Partial<Allocation>) {
    setUpdatingAllocationId(allocation.id);
    setNotice(null);
    setError(null);

    try {
      const response = await fetch(`/api/allocations/${allocation.id}`, {
        method: "PATCH",
        headers: getAdminMutationHeaders(),
        body: JSON.stringify(payload)
      });
      const responsePayload = (await response.json()) as { ok: boolean; data?: Allocation; error?: string };
      if (!response.ok || !responsePayload.ok || !responsePayload.data) throw new Error(responsePayload.error || t.ERROR_UPDATE_ALLOCATION);
      setInvestor((current) => ({
        ...current,
        allocations: current.allocations.map((item) => (item.id === responsePayload.data?.id ? responsePayload.data : item))
      }));
      setNotice(t.NOTICE_ALLOCATION_UPDATED);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t.ERROR_UPDATE_ALLOCATION);
    } finally {
      setUpdatingAllocationId(null);
    }
  }

  async function createReport() {
    setIsCreatingReport(true);
    setNotice(null);
    setError(null);

    try {
      const response = await fetch(`/api/investors/${investor.id}/reports`, {
        method: "POST",
        headers: getAdminMutationHeaders(),
        body: JSON.stringify(reportDraft)
      });
      const payload = (await response.json()) as { ok: boolean; data?: MonthlyReport; error?: string };
      if (!response.ok || !payload.ok || !payload.data) throw new Error(payload.error || t.ERROR_CREATE_REPORT);
      setInvestor((current) => ({ ...current, monthlyReports: [payload.data as MonthlyReport, ...current.monthlyReports] }));
      setReportDraft({ month: "", title: "", summary: "", performanceNote: "", payoutNote: "", status: "DRAFT" });
      setNotice(t.NOTICE_REPORT_CREATED);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t.ERROR_CREATE_REPORT);
    } finally {
      setIsCreatingReport(false);
    }
  }

  async function updateReport(report: MonthlyReport, payload: Partial<MonthlyReport>) {
    setUpdatingReportId(report.id);
    setNotice(null);
    setError(null);

    try {
      const response = await fetch(`/api/monthly-reports/${report.id}`, {
        method: "PATCH",
        headers: getAdminMutationHeaders(),
        body: JSON.stringify(payload)
      });
      const responsePayload = (await response.json()) as { ok: boolean; data?: MonthlyReport; error?: string };
      if (!response.ok || !responsePayload.ok || !responsePayload.data) throw new Error(responsePayload.error || t.ERROR_UPDATE_REPORT);
      setInvestor((current) => ({
        ...current,
        monthlyReports: current.monthlyReports.map((item) => (item.id === responsePayload.data?.id ? responsePayload.data : item))
      }));
      setNotice(t.NOTICE_REPORT_UPDATED);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t.ERROR_UPDATE_REPORT);
    } finally {
      setUpdatingReportId(null);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground micro-noise">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(212,175,95,0.14),transparent_34rem),radial-gradient(circle_at_86%_10%,rgba(255,255,255,0.07),transparent_28rem)]" />
      <div className="macro-grid absolute inset-0 opacity-45" />
      <section className="relative z-10 py-8 sm:py-10">
        <div className="container">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link href={`/${locale}/admin/investors`} className="inline-flex items-center gap-3 text-sm text-muted-foreground transition-colors hover:text-foreground">
              <ArrowLeft className="size-4" />
              {t.BACK_TO_INVESTORS}
            </Link>
            <AdminNavigation locale={locale} activeSection="investors" />
          </div>

          <Card className="mb-6 rounded-[1.35rem] bg-graphite-900/[0.78]">
            <CardContent className="grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-100">{t.EYEBROW}</p>
                <h1 className="mt-3 font-display text-4xl tracking-[-0.04em] text-foreground md:text-5xl">{investor.fullName}</h1>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{investor.email} {investor.telegram ? `· ${investor.telegram}` : ""}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge>{enumLabel("investorStatus", investor.status, locale)}</Badge>
                <Badge variant="secondary">{investor.reinvestEnabled ? t.REINVEST_ON : t.REINVEST_OFF}</Badge>
              </div>
            </CardContent>
          </Card>

          {notice ? <AdminNotice tone="success" message={notice} /> : null}
          {error ? <AdminNotice tone="error" message={error} /> : null}

          <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard label={t.KPI_ACTIVE_CAPITAL} value={formatMoney(kpis.activeCapital)} />
            <KpiCard label={t.KPI_TOTAL_PROFIT} value={formatMoney(kpis.totalProfit)} />
            <KpiCard label={t.KPI_ACTIVE_ALLOCATIONS} value={String(kpis.activeAllocations)} />
            <KpiCard label={t.KPI_COMPLETED_ALLOCATIONS} value={String(kpis.completedAllocations)} />
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
            <div className="grid gap-6">
              <Card className="rounded-[1.35rem] bg-graphite-900/[0.72]">
                <CardHeader>
                  <CardTitle>{t.EDIT_INVESTOR_TITLE}</CardTitle>
                  <CardDescription>{t.EDIT_INVESTOR_DESC}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <label className="grid gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t.LABEL_STATUS}</span>
                    <select value={investorDraft.status} onChange={(event) => setInvestorDraft((current) => ({ ...current, status: event.target.value }))} className="h-12 rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-foreground outline-none">
                      {INVESTOR_STATUSES.map((status) => <option key={status} value={status} className="bg-graphite-900">{enumLabel("investorStatus", status, locale)}</option>)}
                    </select>
                  </label>
                  <CrmInput label={t.LABEL_TOTAL_CAPITAL} value={investorDraft.totalCapital} onChange={(value) => setInvestorDraft((current) => ({ ...current, totalCapital: value }))} placeholder={t.PH_TOTAL_CAPITAL} />
                  <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-muted-foreground">
                    <input type="checkbox" checked={investorDraft.reinvestEnabled} onChange={(event) => setInvestorDraft((current) => ({ ...current, reinvestEnabled: event.target.checked }))} />
                    {t.LABEL_REINVEST_ENABLED}
                  </label>
                  <CrmInput label={t.LABEL_LAST_REPORT_DATE} type="date" value={investorDraft.lastReportAt} onChange={(value) => setInvestorDraft((current) => ({ ...current, lastReportAt: value }))} placeholder="" />
                  <label className="grid gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t.LABEL_NOTES}</span>
                    <textarea value={investorDraft.notes} onChange={(event) => setInvestorDraft((current) => ({ ...current, notes: event.target.value }))} className="min-h-28 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-foreground outline-none" />
                  </label>
                  <Button type="button" disabled={isSavingInvestor} onClick={saveInvestor}>
                    <Save data-icon="inline-start" />
                    {isSavingInvestor ? t.SAVE_INVESTOR_BUSY : t.SAVE_INVESTOR_IDLE}
                  </Button>
                </CardContent>
              </Card>

              <Card className="rounded-[1.35rem] bg-graphite-900/[0.72]">
                <CardHeader>
                  <CardTitle>{t.SOURCE_APPLICATION_TITLE}</CardTitle>
                  <CardDescription>{t.SOURCE_APPLICATION_DESC}</CardDescription>
                </CardHeader>
                <CardContent>
                  {investor.sourceApplication ? (
                    <div className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4">
                      <p className="font-semibold text-foreground">{investor.sourceApplication.fullName}</p>
                      <p className="mt-2 text-sm text-muted-foreground">{investor.sourceApplication.email || t.NO_EMAIL} · {enumLabel("applicationStatus", investor.sourceApplication.status, locale)}</p>
                      <p className="mt-2 text-sm text-muted-foreground">{t.PLANNED_ALLOCATION} {formatMoney(investor.sourceApplication.plannedAllocationAmount)}</p>
                      <Link href={`/${locale}/admin/applications?search=${investor.sourceApplication.id}`} className="mt-3 inline-flex text-sm font-semibold text-gold-100">{t.OPEN_SOURCE_APPLICATION}</Link>
                    </div>
                  ) : (
                    <p className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4 text-sm text-muted-foreground">{t.NO_SOURCE_APPLICATION}</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6">
              <Card className="rounded-[1.35rem] bg-graphite-900/[0.72]">
                <CardHeader>
                  <CardTitle>{t.CREATE_ALLOCATION_TITLE}</CardTitle>
                  <CardDescription>{t.CREATE_ALLOCATION_DESC}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <CrmInput label={t.LABEL_SUPPLY_CODE} value={allocationDraft.supplyCode} onChange={(value) => setAllocationDraft((current) => ({ ...current, supplyCode: value }))} placeholder={t.PH_SUPPLY_CODE} />
                  <CrmInput label={t.LABEL_PRODUCT} value={allocationDraft.productName} onChange={(value) => setAllocationDraft((current) => ({ ...current, productName: value }))} placeholder={t.PH_PRODUCT} />
                  <CrmInput label={t.LABEL_MARKETPLACE} value={allocationDraft.marketplace} onChange={(value) => setAllocationDraft((current) => ({ ...current, marketplace: value }))} placeholder={t.PH_MARKETPLACE} />
                  <CrmInput label={t.LABEL_ALLOCATION_AMOUNT} value={allocationDraft.allocationAmount} onChange={(value) => setAllocationDraft((current) => ({ ...current, allocationAmount: value }))} placeholder={t.PH_ALLOCATION_AMOUNT} />
                  <CrmInput label={t.LABEL_CURRENCY} value={allocationDraft.currency} onChange={(value) => setAllocationDraft((current) => ({ ...current, currency: value }))} placeholder={t.PH_CURRENCY} />
                  <label className="grid gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t.LABEL_STATUS}</span>
                    <select value={allocationDraft.status} onChange={(event) => setAllocationDraft((current) => ({ ...current, status: event.target.value }))} className="h-12 rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-foreground outline-none">
                      {ALLOCATION_STATUSES.map((status) => <option key={status} value={status} className="bg-graphite-900">{enumLabel("allocationStatus", status, locale)}</option>)}
                    </select>
                  </label>
                  <CrmInput label={t.LABEL_EXPECTED_CYCLE_DAYS} value={allocationDraft.expectedCycleDays} onChange={(value) => setAllocationDraft((current) => ({ ...current, expectedCycleDays: value }))} placeholder={t.PH_EXPECTED_CYCLE_DAYS} />
                  <CrmInput label={t.LABEL_ESTIMATED_RESULT} value={allocationDraft.estimatedResult} onChange={(value) => setAllocationDraft((current) => ({ ...current, estimatedResult: value }))} placeholder={t.PH_ESTIMATED_RESULT} />
                  <label className="grid gap-2 md:col-span-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t.LABEL_NOTES}</span>
                    <textarea value={allocationDraft.notes} onChange={(event) => setAllocationDraft((current) => ({ ...current, notes: event.target.value }))} className="min-h-24 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-foreground outline-none" />
                  </label>
                  <div className="md:col-span-2">
                    <Button type="button" disabled={isCreatingAllocation} onClick={createAllocation}>
                      <PackagePlus data-icon="inline-start" />
                      {isCreatingAllocation ? t.CREATE_ALLOCATION_BUSY : t.CREATE_ALLOCATION_IDLE}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[1.35rem] bg-graphite-900/[0.72]">
                <CardHeader>
                  <CardTitle>{t.ALLOCATIONS_TITLE}</CardTitle>
                  <CardDescription>{t.ALLOCATIONS_DESC}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  {investor.allocations.length === 0 ? (
                    <div className="rounded-[1.35rem] border border-white/10 bg-black/20 p-6 text-center">
                      <ShieldCheck className="mx-auto size-8 text-gold-100" />
                      <p className="mt-4 font-semibold text-foreground">{t.NO_ALLOCATIONS_TITLE}</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{t.NO_ALLOCATIONS_DESC}</p>
                    </div>
                  ) : (
                    investor.allocations.map((allocation) => (
                      <div key={allocation.id} className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4">
                        <Link href={`/${locale}/admin/allocations/${allocation.id}`} className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{allocation.supplyCode}</p>
                            <h3 className="mt-2 text-lg font-semibold text-foreground">{allocation.productName}</h3>
                            <p className="mt-1 text-sm text-muted-foreground">{allocation.marketplace || t.MARKETPLACE_NOT_SET}</p>
                          </div>
                          <Badge>{enumLabel("allocationStatus", allocation.status, locale)}</Badge>
                        </Link>
                        <div className="mt-4 grid gap-3 md:grid-cols-4">
                          <Metric label={t.METRIC_AMOUNT} value={formatMoney(allocation.allocationAmount)} />
                          <Metric label={t.METRIC_EXPECTED_CYCLE} value={allocation.expectedCycleDays ? `${allocation.expectedCycleDays} ${t.DAYS}` : "—"} />
                          <Metric label={t.METRIC_ESTIMATED} value={allocation.estimatedResult || "—"} />
                          <Metric label={t.METRIC_ACTUAL_PROFIT} value={allocation.actualProfit ? formatMoney(allocation.actualProfit) : "—"} />
                        </div>
                        <Separator className="my-4" />
                        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
                          <label className="grid gap-2">
                            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t.LABEL_UPDATE_STATUS}</span>
                            <select defaultValue={allocation.status} onChange={(event) => updateAllocation(allocation, { status: event.target.value })} disabled={updatingAllocationId === allocation.id} className="h-11 rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-foreground outline-none">
                              {ALLOCATION_STATUSES.map((status) => <option key={status} value={status} className="bg-graphite-900">{enumLabel("allocationStatus", status, locale)}</option>)}
                            </select>
                          </label>
                          <CrmInput label={t.LABEL_ACTUAL_PROFIT} value={allocation.actualProfit || ""} onChange={(value) => updateAllocation(allocation, { actualProfit: value || null })} placeholder={t.PH_ACTUAL_PROFIT} />
                          <span className="text-xs leading-5 text-muted-foreground">{t.UPDATED_LABEL} {formatDate(allocation.updatedAt)}<br />{t.COMPLETED_AT_LABEL} {formatDate(allocation.completedAt)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-[1.35rem] bg-graphite-900/[0.72]">
                <CardHeader>
                  <CardTitle>{t.REPORTS_TITLE}</CardTitle>
                  <CardDescription>{t.REPORTS_DESC}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <CrmInput label={t.LABEL_MONTH} value={reportDraft.month} onChange={(value) => setReportDraft((current) => ({ ...current, month: value }))} placeholder={t.PH_MONTH} />
                    <CrmInput label={t.LABEL_TITLE} value={reportDraft.title} onChange={(value) => setReportDraft((current) => ({ ...current, title: value }))} placeholder={t.PH_TITLE} />
                    <label className="grid gap-2 md:col-span-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t.LABEL_SUMMARY}</span>
                      <textarea value={reportDraft.summary} onChange={(event) => setReportDraft((current) => ({ ...current, summary: event.target.value }))} className="min-h-24 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-foreground outline-none" />
                    </label>
                    <CrmInput label={t.LABEL_PERFORMANCE_NOTE} value={reportDraft.performanceNote} onChange={(value) => setReportDraft((current) => ({ ...current, performanceNote: value }))} placeholder={t.PH_PERFORMANCE_NOTE} />
                    <CrmInput label={t.LABEL_PAYOUT_NOTE} value={reportDraft.payoutNote} onChange={(value) => setReportDraft((current) => ({ ...current, payoutNote: value }))} placeholder={t.PH_PAYOUT_NOTE} />
                    <label className="grid gap-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t.LABEL_STATUS}</span>
                      <select value={reportDraft.status} onChange={(event) => setReportDraft((current) => ({ ...current, status: event.target.value }))} className="h-12 rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-foreground outline-none">
                        {REPORT_STATUSES.map((status) => <option key={status} value={status} className="bg-graphite-900">{enumLabel("reportStatus", status, locale)}</option>)}
                      </select>
                    </label>
                    <div className="flex items-end">
                      <Button type="button" disabled={isCreatingReport} onClick={createReport}>{isCreatingReport ? t.CREATE_REPORT_BUSY : t.CREATE_REPORT_IDLE}</Button>
                    </div>
                  </div>
                  <Separator />
                  {investor.monthlyReports.length === 0 ? (
                    <div className="rounded-[1.35rem] border border-white/10 bg-black/20 p-6 text-center">
                      <p className="font-semibold text-foreground">{t.NO_REPORTS_TITLE}</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{t.NO_REPORTS_DESC}</p>
                    </div>
                  ) : (
                    investor.monthlyReports.map((report) => (
                      <div key={report.id} className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{report.month}</p>
                            <Link href={`/${locale}/admin/reports/${report.id}`} className="mt-2 block text-lg font-semibold text-foreground transition-colors hover:text-gold-100">{report.title}</Link>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">{report.summary}</p>
                          </div>
                          <Badge>{enumLabel("reportStatus", report.status, locale)}</Badge>
                        </div>
                        <div className="mt-4 grid gap-3 md:grid-cols-3">
                          <Metric label={t.METRIC_PUBLISHED} value={formatDate(report.publishedAt)} />
                          <Metric label={t.METRIC_PROOF_CATEGORIES} value={Object.keys(report.proofSummary).length ? Object.entries(report.proofSummary).map(([type, count]) => `${enumLabel("proofType", type, locale)}: ${count}`).join(", ") : t.NO_AVAILABLE_PROOFS} />
                          <Metric label={t.METRIC_UPDATED} value={formatDate(report.updatedAt)} />
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {REPORT_STATUSES.map((status) => (
                            <Button key={status} type="button" variant="outline" size="sm" disabled={updatingReportId === report.id || report.status === status} onClick={() => updateReport(report, { status })}>{enumLabel("reportStatus", status, locale)}</Button>
                          ))}
                          <Button type="button" size="sm" disabled={updatingReportId === report.id || report.status === "PUBLISHED"} onClick={() => updateReport(report, { status: "PUBLISHED" })}>{t.PUBLISH}</Button>
                          <Link href={`/${locale}/admin/reports/${report.id}`} className="inline-flex h-9 items-center rounded-full border border-white/10 px-4 text-sm font-semibold text-gold-100 transition-colors hover:bg-white/[0.06]">{t.OPEN_REPORT}</Link>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="rounded-[1.35rem] bg-graphite-900/[0.72]">
      <CardContent className="p-5">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
        <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-3">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm leading-6 text-foreground">{value}</p>
    </div>
  );
}

function CrmInput({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-12 rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground/60" />
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

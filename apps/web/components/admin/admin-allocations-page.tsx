"use client";

import * as React from "react";
import Link from "next/link";
import { PackagePlus } from "lucide-react";
import { createAdminFormatters, enumLabel, type Locale } from "@otiz/lib";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Separator } from "@otiz/ui";
import { AdminNavigation } from "./admin-navigation";

const STRINGS = {
  en: {
    eyebrow: "Admin operations",
    h1: "Allocations manager",
    createTitle: "Create allocation",
    createDesc: "Manager-created supply allocation. No marketplace or payment integration is performed.",
    fieldInvestor: "Investor",
    fieldSupplyCode: "Supply code",
    fieldProduct: "Product",
    fieldMarketplace: "Marketplace",
    fieldInvestedAmount: "Invested amount",
    fieldExpectedReturn: "Expected return",
    fieldStageStatus: "Stage/status",
    fieldRisk: "Risk",
    fieldExpectedPayoutDate: "Expected payout date",
    filterStatus: "Status",
    filterInvestor: "Investor",
    filterRisk: "Risk",
    filterPayout: "Payout",
    all: "All",
    createButton: "Create allocation",
    creating: "Creating...",
    metricInvested: "Invested",
    metricExpectedReturn: "Expected return",
    metricExpectedPayout: "Expected payout",
    metricPayoutStatus: "Payout status",
    metricProofScore: "Proof score",
    metricMissingEvidence: "Missing evidence",
    notEstimated: "Not estimated",
    notEvaluated: "Not evaluated",
    none: "None",
    proofPending: "Proof pending",
    belowThreshold: "Proof completeness is below current readiness policy threshold.",
    emptyState: "No allocations match the current filters.",
    noticeCreated: "Allocation created.",
    noticeError: "Unable to create allocation."
  },
  ru: {
    eyebrow: "Операции администратора",
    h1: "Менеджер аллокаций",
    createTitle: "Создать аллокацию",
    createDesc: "Аллокация поставки, созданная менеджером. Интеграция с маркетплейсом или платежами не выполняется.",
    fieldInvestor: "Инвестор",
    fieldSupplyCode: "Код поставки",
    fieldProduct: "Товар",
    fieldMarketplace: "Маркетплейс",
    fieldInvestedAmount: "Сумма инвестиций",
    fieldExpectedReturn: "Ожидаемая доходность",
    fieldStageStatus: "Этап/статус",
    fieldRisk: "Риск",
    fieldExpectedPayoutDate: "Ожидаемая дата выплаты",
    filterStatus: "Статус",
    filterInvestor: "Инвестор",
    filterRisk: "Риск",
    filterPayout: "Выплата",
    all: "Все",
    createButton: "Создать аллокацию",
    creating: "Создание...",
    metricInvested: "Инвестировано",
    metricExpectedReturn: "Ожидаемая доходность",
    metricExpectedPayout: "Ожидаемая выплата",
    metricPayoutStatus: "Статус выплаты",
    metricProofScore: "Оценка подтверждения",
    metricMissingEvidence: "Отсутствующие подтверждения",
    notEstimated: "Не оценено",
    notEvaluated: "Не оценено",
    none: "Нет",
    proofPending: "Подтверждение ожидается",
    belowThreshold: "Полнота подтверждений ниже текущего порога политики готовности.",
    emptyState: "Нет аллокаций, соответствующих текущим фильтрам.",
    noticeCreated: "Аллокация создана.",
    noticeError: "Не удалось создать аллокацию."
  }
} as const;

type Strings = typeof STRINGS.en;
const getStrings = (locale: Locale): Strings => (STRINGS as unknown as Record<string, Strings>)[locale] ?? STRINGS.en;

const ADMIN_CSRF_COOKIE = "admin_csrf_token";
const ADMIN_CSRF_HEADER = "x-csrf-token";
const STATUSES = ["ALL", "DRAFT", "PURCHASING", "SHIPPING", "RECEIVED", "SELLING", "COMPLETED", "CANCELED", "LOSS"] as const;
const RISK_LEVELS = ["ALL", "STANDARD", "MONITORED", "ELEVATED"] as const;
const PAYOUT_STATUSES = ["ALL", "NOT_READY", "PENDING", "APPROVED", "PAID", "REINVESTED"] as const;

type InvestorOption = { id: string; fullName: string; email: string };
type ProofCompleteness = {
  score: number;
  state: string;
  missingRequiredCategories: string[];
  missingRecommendedCategories: string[];
  hiddenProofCount: number;
  rejectedProofCount: number;
  unreviewedProofCount: number;
  supersededProofCount: number;
  adminWarnings: string[];
  policyThreshold: number;
};
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
  proofs: Array<{ id: string; status: string }>;
  proofCompleteness?: ProofCompleteness | null;
};

type Draft = {
  investorId: string;
  supplyCode: string;
  productName: string;
  marketplace: string;
  allocationAmount: string;
  currency: string;
  status: string;
  riskLevel: string;
  expectedCycleDays: string;
  expectedPayoutAt: string;
  estimatedResult: string;
  notes: string;
};

function getCookieValue(name: string) {
  if (typeof document === "undefined") return "";
  return document.cookie.split("; ").find((cookie) => cookie.startsWith(`${name}=`))?.split("=").slice(1).join("=") || "";
}

function getAdminMutationHeaders() {
  return { "Content-Type": "application/json", [ADMIN_CSRF_HEADER]: getCookieValue(ADMIN_CSRF_COOKIE) };
}

function stageFromStatus(status: string, payoutStatus: string) {
  if (status === "LOSS" || status === "CANCELED") return "loss";
  if (status === "COMPLETED" && ["PAID", "REINVESTED"].includes(payoutStatus)) return "paid_out";
  if (status === "COMPLETED") return "completed";
  if (status === "DRAFT") return "funding";
  if (status === "PURCHASING") return "purchasing";
  if (status === "SHIPPING") return "shipping";
  if (status === "RECEIVED") return "warehouse";
  if (status === "SELLING") return "selling";
  return "funding";
}

function progressFromStage(stage: string) {
  return ({ funding: 10, purchasing: 28, shipping: 46, warehouse: 64, selling: 82, completed: 95, paid_out: 100, loss: 100 } as Record<string, number>)[stage] ?? 10;
}

export function AdminAllocationsPage({ locale, allocations: initialAllocations, investors }: { locale: Locale; allocations: Allocation[]; investors: InvestorOption[] }) {
  const t = getStrings(locale);
  const formatters = createAdminFormatters(locale);
  const [allocations, setAllocations] = React.useState(initialAllocations);
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [riskFilter, setRiskFilter] = React.useState("ALL");
  const [payoutFilter, setPayoutFilter] = React.useState("ALL");
  const [investorFilter, setInvestorFilter] = React.useState("ALL");
  const [notice, setNotice] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isCreating, setIsCreating] = React.useState(false);
  const [draft, setDraft] = React.useState<Draft>({
    investorId: investors[0]?.id || "",
    supplyCode: "",
    productName: "",
    marketplace: "",
    allocationAmount: "",
    currency: "USD",
    status: "DRAFT",
    riskLevel: "STANDARD",
    expectedCycleDays: "45",
    expectedPayoutAt: "",
    estimatedResult: "",
    notes: ""
  });
  const visibleAllocations = allocations.filter((allocation) =>
    (statusFilter === "ALL" || allocation.status === statusFilter) &&
    (riskFilter === "ALL" || allocation.riskLevel === riskFilter) &&
    (payoutFilter === "ALL" || allocation.payoutStatus === payoutFilter) &&
    (investorFilter === "ALL" || allocation.investorId === investorFilter)
  );

  async function createAllocation() {
    setIsCreating(true);
    setNotice(null);
    setError(null);
    try {
      const response = await fetch("/api/admin/allocations", {
        method: "POST",
        headers: getAdminMutationHeaders(),
        body: JSON.stringify({ ...draft, expectedCycleDays: draft.expectedCycleDays ? Number(draft.expectedCycleDays) : null, expectedPayoutAt: draft.expectedPayoutAt || null })
      });
      const payload = (await response.json()) as { ok: boolean; data?: Allocation; error?: string };
      if (!response.ok || !payload.ok || !payload.data) throw new Error(payload.error || t.noticeError);
      const investor = investors.find((item) => item.id === payload.data?.investorId);
      setAllocations((current) => [{ ...payload.data as Allocation, investor: investor ? { ...investor, telegram: null, status: "ACTIVE" } : payload.data!.investor, proofs: [] }, ...current]);
      setDraft((current) => ({ ...current, supplyCode: "", productName: "", marketplace: "", allocationAmount: "", expectedPayoutAt: "", estimatedResult: "", notes: "" }));
      setNotice(t.noticeCreated);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t.noticeError);
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground micro-noise">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(212,175,95,0.14),transparent_34rem),radial-gradient(circle_at_86%_10%,rgba(255,255,255,0.07),transparent_28rem)]" />
      <div className="macro-grid absolute inset-0 opacity-45" />
      <section className="relative z-10 py-8 sm:py-10">
        <div className="container">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-100">{t.eyebrow}</p>
              <h1 className="mt-3 font-display text-4xl tracking-[-0.04em] text-foreground md:text-5xl">{t.h1}</h1>
            </div>
            <AdminNavigation locale={locale} activeSection="allocations" />
          </div>

          {notice ? <Notice tone="success" message={notice} /> : null}
          {error ? <Notice tone="error" message={error} /> : null}

          <Card className="mb-6 rounded-[2rem] bg-graphite-900/[0.72]">
            <CardHeader><CardTitle>{t.createTitle}</CardTitle><CardDescription>{t.createDesc}</CardDescription></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <SelectField label={t.fieldInvestor} value={draft.investorId} options={investors.map((investor) => ({ label: `${investor.fullName} · ${investor.email}`, value: investor.id }))} onChange={(value) => setDraft((current) => ({ ...current, investorId: value }))} />
              <TextField label={t.fieldSupplyCode} value={draft.supplyCode} onChange={(value) => setDraft((current) => ({ ...current, supplyCode: value }))} />
              <TextField label={t.fieldProduct} value={draft.productName} onChange={(value) => setDraft((current) => ({ ...current, productName: value }))} />
              <TextField label={t.fieldMarketplace} value={draft.marketplace} onChange={(value) => setDraft((current) => ({ ...current, marketplace: value }))} />
              <TextField label={t.fieldInvestedAmount} value={draft.allocationAmount} onChange={(value) => setDraft((current) => ({ ...current, allocationAmount: value }))} />
              <TextField label={t.fieldExpectedReturn} value={draft.estimatedResult} onChange={(value) => setDraft((current) => ({ ...current, estimatedResult: value }))} />
              <SelectField label={t.fieldStageStatus} value={draft.status} options={STATUSES.filter((status) => status !== "ALL").map((status) => ({ label: enumLabel("allocationStatus", status, locale), value: status }))} onChange={(value) => setDraft((current) => ({ ...current, status: value }))} />
              <SelectField label={t.fieldRisk} value={draft.riskLevel} options={RISK_LEVELS.filter((risk) => risk !== "ALL").map((risk) => ({ label: enumLabel("riskLevel", risk, locale), value: risk }))} onChange={(value) => setDraft((current) => ({ ...current, riskLevel: value }))} />
              <TextField label={t.fieldExpectedPayoutDate} type="date" value={draft.expectedPayoutAt} onChange={(value) => setDraft((current) => ({ ...current, expectedPayoutAt: value }))} />
              <div className="md:col-span-3"><Button type="button" onClick={createAllocation} disabled={isCreating || !draft.investorId}><PackagePlus data-icon="inline-start" />{isCreating ? t.creating : t.createButton}</Button></div>
            </CardContent>
          </Card>

          <div className="mb-6 grid gap-3 md:grid-cols-4">
            <SelectField label={t.filterStatus} value={statusFilter} options={STATUSES.map((status) => ({ label: enumLabel("allocationStatus", status, locale), value: status }))} onChange={setStatusFilter} />
            <SelectField label={t.filterInvestor} value={investorFilter} options={[{ label: t.all, value: "ALL" }, ...investors.map((investor) => ({ label: investor.fullName, value: investor.id }))]} onChange={setInvestorFilter} />
            <SelectField label={t.filterRisk} value={riskFilter} options={RISK_LEVELS.map((risk) => ({ label: enumLabel("riskLevel", risk, locale), value: risk }))} onChange={setRiskFilter} />
            <SelectField label={t.filterPayout} value={payoutFilter} options={PAYOUT_STATUSES.map((status) => ({ label: enumLabel("payoutStatus", status, locale), value: status }))} onChange={setPayoutFilter} />
          </div>

          <div className="grid gap-4">
            {visibleAllocations.length === 0 ? (
              <Card className="rounded-[2rem] bg-graphite-900/[0.72]"><CardContent className="p-8 text-center text-sm text-muted-foreground">{t.emptyState}</CardContent></Card>
            ) : visibleAllocations.map((allocation) => {
              const stage = stageFromStatus(allocation.status, allocation.payoutStatus);
              const progress = progressFromStage(stage);
              return (
                <Link key={allocation.id} href={`/${locale}/admin/allocations/${allocation.id}`} className="block">
                  <Card className="rounded-[2rem] bg-graphite-900/[0.72] transition-colors hover:border-gold-200/30">
                    <CardContent className="p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{allocation.supplyCode} · {allocation.investor.fullName}</p><h2 className="mt-2 text-xl font-semibold text-foreground">{allocation.productName}</h2></div>
                        <div className="flex flex-wrap gap-2"><Badge>{stage}</Badge><Badge variant="secondary">{enumLabel("riskLevel", allocation.riskLevel, locale)}</Badge><Badge variant="secondary">{allocation.proofCompleteness ? `${allocation.proofCompleteness.state} · ${allocation.proofCompleteness.score}%` : t.proofPending}</Badge></div>
                      </div>
                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gold-200/70" style={{ width: `${progress}%` }} /></div>
                      <div className="mt-4 grid gap-3 md:grid-cols-5">
                        <Metric label={t.metricInvested} value={formatters.currency(Number(allocation.allocationAmount || 0))} />
                        <Metric label={t.metricExpectedReturn} value={allocation.estimatedResult || t.notEstimated} />
                        <Metric label={t.metricExpectedPayout} value={formatters.date(allocation.expectedPayoutAt)} />
                        <Metric label={t.metricPayoutStatus} value={enumLabel("payoutStatus", allocation.payoutStatus, locale)} />
                        <Metric label={t.metricProofScore} value={allocation.proofCompleteness ? `${allocation.proofCompleteness.score}% / ${allocation.proofCompleteness.policyThreshold}%` : t.notEvaluated} />
                        <Metric label={t.metricMissingEvidence} value={allocation.proofCompleteness ? [...allocation.proofCompleteness.missingRequiredCategories, ...allocation.proofCompleteness.missingRecommendedCategories].slice(0, 3).join(", ") || t.none : t.notEvaluated} />
                      </div>
                      {allocation.proofCompleteness && allocation.proofCompleteness.score < allocation.proofCompleteness.policyThreshold ? <p className="mt-3 text-xs leading-5 text-gold-100">{t.belowThreshold}</p> : null}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}

function TextField({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <label className="grid gap-2"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="h-11 rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-foreground outline-none" /></label>;
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: Array<{ label: string; value: string }>; onChange: (value: string) => void }) {
  return <label className="grid gap-2"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-foreground outline-none">{options.map((option) => <option key={option.value} value={option.value} className="bg-graphite-900">{option.label}</option>)}</select></label>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-white/10 bg-black/20 p-3"><p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p><p className="mt-2 text-sm leading-6 text-foreground">{value}</p></div>;
}

function Notice({ tone, message }: { tone: "success" | "error"; message: string }) {
  return <div className={`mb-6 rounded-[1.5rem] border p-4 text-sm ${tone === "success" ? "border-gold-200/25 bg-gold-200/10 text-gold-100" : "border-white/10 bg-black/30 text-foreground"}`}>{message}</div>;
}

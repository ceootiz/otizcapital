import Link from "next/link";
import { ArrowLeft, FileText, PackageCheck } from "lucide-react";
import type { Investor } from "@prisma/client";
import { createAdminFormatters, enumLabel, type Locale } from "@otiz/lib";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Separator } from "@otiz/ui";
import { InvestorShell } from "./investor-pages";

type Proof = { id: string; type: string; title: string; description: string | null; proofUrl: string | null; status: string; createdAt: string; updatedAt: string };
type AllocationDetail = {
  id: string;
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
  payoutStatus: string;
  reinvestDecision: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  proofs: Proof[];
  proofHealth: {
    score: number;
    state: string;
    investorSafeSummary: string;
    presentCategories: string[];
  } | null;
  riskHealth: {
    score: number;
    level: string;
    summary: string;
    visibleFactors: string[];
  } | null;
};

const STRINGS = {
  en: {
    eyebrow: "Allocation visibility",
    description: "A focused view of one managed electronics commerce allocation, proof availability, and payout or reinvest state.",
    backToAllocations: "Back to allocations",
    marketplacePending: "Marketplace pending",
    allocationAmount: "Allocation amount",
    expectedCycle: "Expected cycle",
    days: "days",
    notSet: "Not set",
    estimatedResult: "Estimated result",
    notEstimated: "Not estimated",
    actualProfit: "Actual profit",
    visibleAfterCompletion: "Visible after completion",
    payoutStatus: "Payout status",
    reinvestDecision: "Reinvest decision",
    started: "Started",
    completed: "Completed",
    proofHealth: "Proof health",
    underManagerReview: "Under manager review",
    evidenceSummary: "Evidence summary",
    evidenceCoverageReview: "Evidence coverage is under manager review.",
    riskVisibility: "Risk visibility",
    riskSummary: "Risk summary",
    operationalRiskReview: "Operational risk is under manager review.",
    operationalTimeline: "Operational timeline",
    operationalTimelineDesc: "Current lifecycle view without trading-style noise.",
    proofPlaceholders: "Proof placeholders",
    proofPlaceholdersDesc: "Only available or verified proof metadata is visible here.",
    noProofsTitle: "No available proofs yet",
    noProofsBody: "Shipment documentation, warehouse media, marketplace reporting, and serial verification placeholders appear after manager review.",
    availableProofMetadata: "Available proof metadata."
  },
  ru: {
    eyebrow: "Видимость аллокации",
    description: "Сфокусированный обзор одной управляемой аллокации в коммерции электроники, доступности подтверждений и статуса выплаты или реинвеста.",
    backToAllocations: "Назад к аллокациям",
    marketplacePending: "Маркетплейс не назначен",
    allocationAmount: "Сумма аллокации",
    expectedCycle: "Ожидаемый цикл",
    days: "дн.",
    notSet: "Не задано",
    estimatedResult: "Ожидаемый результат",
    notEstimated: "Не оценено",
    actualProfit: "Фактическая прибыль",
    visibleAfterCompletion: "Доступно после завершения",
    payoutStatus: "Статус выплаты",
    reinvestDecision: "Решение о реинвесте",
    started: "Начато",
    completed: "Завершено",
    proofHealth: "Состояние подтверждений",
    underManagerReview: "На проверке у менеджера",
    evidenceSummary: "Сводка по подтверждениям",
    evidenceCoverageReview: "Полнота подтверждений на проверке у менеджера.",
    riskVisibility: "Видимость рисков",
    riskSummary: "Сводка по рискам",
    operationalRiskReview: "Операционный риск на проверке у менеджера.",
    operationalTimeline: "Операционный таймлайн",
    operationalTimelineDesc: "Текущий обзор жизненного цикла без биржевого шума.",
    proofPlaceholders: "Заготовки подтверждений",
    proofPlaceholdersDesc: "Здесь видны только доступные или проверенные метаданные подтверждений.",
    noProofsTitle: "Пока нет доступных подтверждений",
    noProofsBody: "Заготовки для документов об отгрузке, складских материалов, отчётов маркетплейса и проверки серийных номеров появятся после проверки менеджером.",
    availableProofMetadata: "Доступные метаданные подтверждения."
  }
} as const;
type Strings = typeof STRINGS.en;
const getStrings = (locale: Locale): Strings => (STRINGS as unknown as Record<string, Strings>)[locale] ?? STRINGS.en;

export function InvestorAllocationDetailPage({ locale, investor, allocation }: { locale: Locale; investor: Investor; allocation: AllocationDetail }) {
  const t = getStrings(locale);
  const fmt = createAdminFormatters(locale);
  return (
    <InvestorShell locale={locale} investor={investor} active="allocations" eyebrow={t.eyebrow} title={allocation.supplyCode} description={t.description}>
      <div className="mb-6">
        <Link href={`/${locale}/investor/allocations`} className="inline-flex items-center gap-3 text-sm text-muted-foreground transition-colors hover:text-foreground"><ArrowLeft className="size-4" />{t.backToAllocations}</Link>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-[1.35rem] bg-card dark:bg-graphite-900/[0.72]">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><CardTitle>{allocation.productName}</CardTitle><CardDescription>{allocation.marketplace || t.marketplacePending}</CardDescription></div>
              <Badge>{enumLabel("allocationStatus", allocation.status, locale)}</Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <ProofLine label={t.allocationAmount} value={fmt.currency(Number(allocation.allocationAmount || 0))} />
            <ProofLine label={t.expectedCycle} value={allocation.expectedCycleDays ? `${allocation.expectedCycleDays} ${t.days}` : t.notSet} />
            <ProofLine label={t.estimatedResult} value={allocation.estimatedResult || t.notEstimated} />
            <ProofLine label={t.actualProfit} value={allocation.status === "COMPLETED" && allocation.actualProfit ? fmt.currency(Number(allocation.actualProfit || 0)) : t.visibleAfterCompletion} />
            <ProofLine label={t.payoutStatus} value={enumLabel("payoutStatus", allocation.payoutStatus, locale)} />
            <ProofLine label={t.reinvestDecision} value={enumLabel("reinvestDecision", allocation.reinvestDecision, locale)} />
            <ProofLine label={t.started} value={fmt.date(allocation.startedAt)} />
            <ProofLine label={t.completed} value={fmt.date(allocation.completedAt)} />
            <ProofLine label={t.proofHealth} value={allocation.proofHealth ? `${allocation.proofHealth.state} · ${allocation.proofHealth.score}%` : t.underManagerReview} />
            <ProofLine label={t.evidenceSummary} value={allocation.proofHealth?.investorSafeSummary || t.evidenceCoverageReview} />
            <ProofLine label={t.riskVisibility} value={allocation.riskHealth ? `${allocation.riskHealth.level} · ${allocation.riskHealth.score}/100` : t.underManagerReview} />
            <ProofLine label={t.riskSummary} value={allocation.riskHealth?.summary || t.operationalRiskReview} />
          </CardContent>
        </Card>

        <Card className="rounded-[1.35rem] bg-card dark:bg-graphite-900/[0.72]">
          <CardHeader><CardTitle>{t.operationalTimeline}</CardTitle><CardDescription>{t.operationalTimelineDesc}</CardDescription></CardHeader>
          <CardContent><div className="grid gap-3">{["DRAFT", "PURCHASING", "SHIPPING", "RECEIVED", "SELLING", "COMPLETED"].map((step) => <div key={step} className={`rounded-2xl border p-3 text-sm ${step === allocation.status ? "border-gold-200/35 bg-gold-300/20 dark:bg-gold-200/10 text-amber-700 dark:text-gold-100" : "border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 text-muted-foreground"}`}>{enumLabel("allocationStatus", step, locale)}</div>)}</div></CardContent>
        </Card>
      </div>

      <Card className="mt-6 rounded-[1.35rem] bg-card dark:bg-graphite-900/[0.72]">
        <CardHeader><CardTitle>{t.proofPlaceholders}</CardTitle><CardDescription>{t.proofPlaceholdersDesc}</CardDescription></CardHeader>
        <CardContent className="grid gap-4">
          {allocation.proofs.length === 0 ? (
            <div className="rounded-[1.35rem] border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 p-8 text-center"><PackageCheck className="mx-auto size-9 text-amber-700 dark:text-gold-100" /><p className="mt-4 font-semibold text-foreground">{t.noProofsTitle}</p><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{t.noProofsBody}</p></div>
          ) : allocation.proofs.map((proof) => (
            <div key={proof.id} className="rounded-[1.35rem] border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{enumLabel("proofType", proof.type, locale)}</p><p className="mt-2 font-semibold text-foreground">{proof.title}</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{proof.description || t.availableProofMetadata}</p></div><Badge>{enumLabel("proofStatus", proof.status, locale)}</Badge></div>
              {proof.proofUrl ? <><Separator className="my-4" /><p className="break-words text-xs text-amber-700 dark:text-gold-100"><FileText className="mr-2 inline size-3" />{proof.proofUrl}</p></> : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </InvestorShell>
  );
}

function ProofLine({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 p-4"><p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p><p className="mt-2 text-sm leading-6 text-foreground">{value}</p></div>; }

import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import type { Investor } from "@prisma/client";
import type { Locale } from "@otiz/lib";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Separator } from "@otiz/ui";
import { InvestorShell } from "./investor-pages";

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
  proofCompleteness: {
    score: number;
    state: string;
    investorSafeSummary: string;
    presentCategories: string[];
  } | null;
  reconciliation: {
    status: string;
    score: number;
    capitalDeployed: string;
    capitalReturned: string;
    payoutStatus: string;
    inventoryProgressSummary: string;
    exceptionNotice: string | null;
  } | null;
  risk: {
    score: number;
    level: string;
    summary: string;
    visibleFactors: string[];
  } | null;
};

type MonthlyReportDetail = {
  id: string;
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
};

const PROOF_TYPE_ORDER = ["SHIPMENT_PROOF", "MARKETPLACE_REPORT", "WAREHOUSE_MEDIA", "PAYOUT_PROOF", "PURCHASE_INVOICE", "SERIAL_VERIFICATION", "OTHER"];
const moneyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const dateTimeFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

function formatDateTime(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : dateTimeFormatter.format(date);
}

function formatProofType(type: string) {
  return type.toLowerCase().split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function formatMoney(value: string | number | null | undefined, currency = "USD") {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) return "-";
  if (currency === "USD") return moneyFormatter.format(amount);
  return `${currency} ${amount.toLocaleString("en-US")}`;
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

export function InvestorReportDetailPage({ locale, investor, report }: { locale: Locale; investor: Investor; report: MonthlyReportDetail }) {
  const lifecycle = [
    { id: "created", label: "Report created", at: report.createdAt, detail: "The monthly report record was prepared for review." },
    { id: "updated", label: "Report updated", at: report.updatedAt, detail: "The report was updated by the operations team." },
    ...(report.publishedAt ? [{ id: "published", label: "Report published", at: report.publishedAt, detail: "The report is available for investor review." }] : [])
  ].sort((left, right) => new Date(right.at).getTime() - new Date(left.at).getTime());

  return (
    <InvestorShell locale={locale} investor={investor} active="reports" eyebrow="Monthly report detail" title={report.title} description="A focused view of one published operational report, including report notes and available proof categories from the stored snapshot.">
      <div className="mb-6">
        <Link href={`/${locale}/investor/reports`} className="inline-flex items-center gap-3 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="size-4" />
          Back to reports
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <Card className="rounded-[2rem] bg-graphite-900/[0.72]">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>{report.month}</CardTitle>
                <CardDescription>Published {report.publishedAt ? formatDateTime(report.publishedAt) : "after manager review"}</CardDescription>
              </div>
              <Badge variant="secondary">Published</Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4">
            <ReportLine label="Summary" value={report.summary} />
            <ReportLine label="Performance note" value={report.performanceNote || "No performance note published."} />
            <ReportLine label="Payout note" value={report.payoutNote || "No payout note published."} />
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] bg-graphite-900/[0.72]">
          <CardHeader>
            <CardTitle>Lifecycle timeline</CardTitle>
            <CardDescription>Published report lifecycle without internal audit details.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {lifecycle.map((item) => (
              <div key={item.id} className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{item.label}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.detail}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDateTime(item.at)}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 rounded-[2rem] bg-graphite-900/[0.72]">
        <CardHeader>
          <CardTitle>Proof summary</CardTitle>
          <CardDescription>Only available and verified proof categories from the report snapshot are shown here.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <ProofBreakdown title="Available proofs" summary={report.proofSummaryBreakdown.available} emptyText="No available proofs in this report snapshot." />
          <ProofBreakdown title="Verified proofs" summary={report.proofSummaryBreakdown.verified} emptyText="No verified proofs in this report snapshot." />
        </CardContent>
      </Card>

      <Card className="mt-6 rounded-[2rem] bg-graphite-900/[0.72]">
        <CardHeader>
          <CardTitle>Linked allocation summary</CardTitle>
          <CardDescription>Allocation stages and proof categories are read from the frozen report snapshot, not current live operations.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {report.allocationSnapshot.length === 0 ? (
            <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-6 text-center text-sm text-muted-foreground">No allocation summary was included in this report snapshot.</div>
          ) : report.allocationSnapshot.map((allocation) => (
            <div key={allocation.id} className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{allocation.supplyCode}</p>
                  <p className="mt-2 text-lg font-semibold text-foreground">{allocation.productName}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{allocation.marketplace || "Marketplace operations"} · Snapshot updated {formatDateTime(allocation.updatedAt)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge>{allocation.status}</Badge>
                  <Badge variant="secondary">{allocation.riskLevel}</Badge>
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <ReportLine label="Invested amount" value={formatMoney(allocation.allocationAmount, allocation.currency)} />
                <ReportLine label="Expected cycle" value={allocation.expectedCycleDays ? `${allocation.expectedCycleDays} days` : "Not set"} />
                <ReportLine label="Estimated result" value={allocation.estimatedResult || "Not estimated"} />
                <ReportLine label="Payout state" value={allocation.payoutStatus} />
                <ReportLine label="Proof health" value={allocation.proofCompleteness ? `${allocation.proofCompleteness.state} · ${allocation.proofCompleteness.score}%` : "Under manager review"} />
                <ReportLine label="Evidence summary" value={allocation.proofCompleteness?.investorSafeSummary || "Evidence coverage is under manager review."} />
                <ReportLine label="Reconciliation" value={allocation.reconciliation ? `${allocation.reconciliation.status} · ${allocation.reconciliation.score}%` : "Under manager review"} />
                <ReportLine label="Inventory progress" value={allocation.reconciliation?.inventoryProgressSummary || "Inventory progress is under manager review."} />
                <ReportLine label="Capital returned" value={allocation.reconciliation ? formatMoney(allocation.reconciliation.capitalReturned, allocation.currency) : "Under review"} />
                <ReportLine label="Payout status" value={allocation.reconciliation?.payoutStatus || "Not ready"} />
                <ReportLine label="Risk visibility" value={allocation.risk ? `${allocation.risk.level} · ${allocation.risk.score}/100` : "Under manager review"} />
                <ReportLine label="Risk summary" value={allocation.risk?.summary || "Operational risk is under manager review."} />
              </div>
              {allocation.reconciliation?.exceptionNotice ? <div className="mt-4 rounded-[1.5rem] border border-gold-200/20 bg-gold-200/10 p-4 text-sm leading-6 text-gold-100">{allocation.reconciliation.exceptionNotice}</div> : null}
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <ProofBreakdown title="Available allocation proofs" summary={allocation.proofSummaryBreakdown.available} emptyText="No available proof categories for this allocation in the snapshot." />
                <ProofBreakdown title="Verified allocation proofs" summary={allocation.proofSummaryBreakdown.verified} emptyText="No verified proof categories for this allocation in the snapshot." />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </InvestorShell>
  );
}

function ReportLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm leading-6 text-foreground">{value}</p>
    </div>
  );
}

function ProofBreakdown({ title, summary, emptyText }: { title: string; summary: ProofSummary; emptyText: string }) {
  const entries = proofEntries(summary);

  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
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
                <span className="text-muted-foreground">{formatProofType(type)}</span>
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

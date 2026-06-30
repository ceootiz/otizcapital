import Link from "next/link";
import { ArrowLeft, FileText, PackageCheck } from "lucide-react";
import type { Investor } from "@prisma/client";
import type { Locale } from "@otiz/lib";
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

const moneyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

function formatMoney(value: string | number | null | undefined) { const amount = Number(value || 0); return moneyFormatter.format(Number.isFinite(amount) ? amount : 0); }
function formatDate(value: string | null) { if (!value) return "-"; const date = new Date(value); return Number.isNaN(date.getTime()) ? "-" : dateFormatter.format(date); }

export function InvestorAllocationDetailPage({ locale, investor, allocation }: { locale: Locale; investor: Investor; allocation: AllocationDetail }) {
  return (
    <InvestorShell locale={locale} investor={investor} active="allocations" eyebrow="Allocation visibility" title={allocation.supplyCode} description="A focused view of one managed electronics commerce allocation, proof availability, and payout or reinvest state.">
      <div className="mb-6">
        <Link href={`/${locale}/investor/allocations`} className="inline-flex items-center gap-3 text-sm text-muted-foreground transition-colors hover:text-foreground"><ArrowLeft className="size-4" />Back to allocations</Link>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-[2rem] bg-graphite-900/[0.72]">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><CardTitle>{allocation.productName}</CardTitle><CardDescription>{allocation.marketplace || "Marketplace pending"}</CardDescription></div>
              <Badge>{allocation.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <ProofLine label="Allocation amount" value={formatMoney(allocation.allocationAmount)} />
            <ProofLine label="Expected cycle" value={allocation.expectedCycleDays ? `${allocation.expectedCycleDays} days` : "Not set"} />
            <ProofLine label="Estimated result" value={allocation.estimatedResult || "Not estimated"} />
            <ProofLine label="Actual profit" value={allocation.status === "COMPLETED" && allocation.actualProfit ? formatMoney(allocation.actualProfit) : "Visible after completion"} />
            <ProofLine label="Payout status" value={allocation.payoutStatus} />
            <ProofLine label="Reinvest decision" value={allocation.reinvestDecision} />
            <ProofLine label="Started" value={formatDate(allocation.startedAt)} />
            <ProofLine label="Completed" value={formatDate(allocation.completedAt)} />
            <ProofLine label="Proof health" value={allocation.proofHealth ? `${allocation.proofHealth.state} · ${allocation.proofHealth.score}%` : "Under manager review"} />
            <ProofLine label="Evidence summary" value={allocation.proofHealth?.investorSafeSummary || "Evidence coverage is under manager review."} />
            <ProofLine label="Risk visibility" value={allocation.riskHealth ? `${allocation.riskHealth.level} · ${allocation.riskHealth.score}/100` : "Under manager review"} />
            <ProofLine label="Risk summary" value={allocation.riskHealth?.summary || "Operational risk is under manager review."} />
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] bg-graphite-900/[0.72]">
          <CardHeader><CardTitle>Operational timeline</CardTitle><CardDescription>Current lifecycle view without trading-style noise.</CardDescription></CardHeader>
          <CardContent><div className="grid gap-3">{["DRAFT", "PURCHASING", "SHIPPING", "RECEIVED", "SELLING", "COMPLETED"].map((step) => <div key={step} className={`rounded-2xl border p-3 text-sm ${step === allocation.status ? "border-gold-200/35 bg-gold-200/10 text-gold-100" : "border-white/10 bg-black/20 text-muted-foreground"}`}>{step}</div>)}</div></CardContent>
        </Card>
      </div>

      <Card className="mt-6 rounded-[2rem] bg-graphite-900/[0.72]">
        <CardHeader><CardTitle>Proof placeholders</CardTitle><CardDescription>Only available or verified proof metadata is visible here.</CardDescription></CardHeader>
        <CardContent className="grid gap-4">
          {allocation.proofs.length === 0 ? (
            <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-8 text-center"><PackageCheck className="mx-auto size-9 text-gold-100" /><p className="mt-4 font-semibold text-foreground">No available proofs yet</p><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">Shipment documentation, warehouse media, marketplace reporting, and serial verification placeholders appear after manager review.</p></div>
          ) : allocation.proofs.map((proof) => (
            <div key={proof.id} className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{proof.type}</p><p className="mt-2 font-semibold text-foreground">{proof.title}</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{proof.description || "Available proof metadata."}</p></div><Badge>{proof.status}</Badge></div>
              {proof.proofUrl ? <><Separator className="my-4" /><p className="break-words text-xs text-gold-100"><FileText className="mr-2 inline size-3" />{proof.proofUrl}</p></> : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </InvestorShell>
  );
}

function ProofLine({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p><p className="mt-2 text-sm leading-6 text-foreground">{value}</p></div>; }

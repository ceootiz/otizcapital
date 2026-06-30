import Link from "next/link";
import { ArrowLeft, BarChart3, CalendarClock, CheckCircle2, FileText, PackageCheck, RefreshCw, WalletCards } from "lucide-react";
import type { Investor } from "@prisma/client";
import type { Locale } from "@otiz/lib";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Separator } from "@otiz/ui";
import type { InvestorDashboardAllocation, InvestorDashboardData, InvestorWithdrawal } from "@/lib/investor-dashboard-data";
import { InvestorLogoutButton, ReinvestPreferenceControl } from "./investor-actions";

type InvestorPageKey = "dashboard" | "allocations" | "reports" | "withdrawals" | "reinvest";

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

const navigation: Array<{ key: InvestorPageKey; label: string; href: string }> = [
  { key: "dashboard", label: "Dashboard", href: "dashboard" },
  { key: "allocations", label: "Allocations", href: "allocations" },
  { key: "reports", label: "Reports", href: "reports" },
  { key: "withdrawals", label: "Withdrawals", href: "withdrawals" },
  { key: "reinvest", label: "Reinvest", href: "reinvest" }
];

const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});
const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

function formatMoney(value: number) {
  return moneyFormatter.format(value);
}

function formatDate(value: string | null) {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not scheduled" : dateFormatter.format(date);
}

function formatPercent(value: number | null) {
  return value === null ? "Not available" : `${value.toFixed(1)}%`;
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
  children
}: {
  locale: Locale;
  investor: Investor;
  active: InvestorPageKey;
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground micro-noise">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(212,175,95,0.13),transparent_34rem),radial-gradient(circle_at_88%_6%,rgba(255,255,255,0.07),transparent_30rem)]" />
      <div className="macro-grid absolute inset-0 opacity-45" />
      <section className="relative z-10 py-8 sm:py-10">
        <div className="container">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Link href={`/${locale}`} className="inline-flex items-center gap-3 text-sm text-muted-foreground transition-colors hover:text-foreground">
              <ArrowLeft className="size-4" />
              Back to homepage
            </Link>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold tracking-[0.24em] text-foreground">OTIZ INVESTOR</span>
              <InvestorLogoutButton locale={locale} />
            </div>
          </div>

          <Card className="mb-6 rounded-[2rem] bg-graphite-900/[0.72]">
            <CardContent className="grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-100">{eyebrow}</p>
                <h1 className="mt-3 max-w-3xl font-display text-4xl tracking-[-0.04em] text-foreground md:text-5xl">{title}</h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">{description}</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Investor</p>
                <p className="mt-2 font-semibold text-foreground">{investor.fullName}</p>
                <p className="mt-1 text-sm text-muted-foreground">{investor.email}</p>
                <Badge className="mt-3" variant={statusTone(investor.status)}>{investor.status}</Badge>
              </div>
            </CardContent>
          </Card>

          <div className="mb-6 flex gap-2 overflow-x-auto rounded-[1.5rem] border border-white/10 bg-black/20 p-2">
            {navigation.map((item) => {
              const isActive = item.key === active;

              return (
                <Link
                  key={item.key}
                  href={`/${locale}/investor/${item.href}`}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors ${isActive ? "bg-gold-200/15 text-gold-100" : "text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {children}
        </div>
      </section>
    </main>
  );
}

export function InvestorDashboardHome({ locale, data }: { locale: Locale; data: InvestorDashboardData }) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <KpiCard icon={<WalletCards className="size-5" />} label="Active capital" value={formatMoney(data.summary.activeCapital)} />
        <KpiCard icon={<BarChart3 className="size-5" />} label="Total invested" value={formatMoney(data.summary.totalInvested)} />
        <KpiCard icon={<CheckCircle2 className="size-5" />} label="Realized profit" value={formatMoney(data.summary.realizedProfit)} />
        <KpiCard icon={<CalendarClock className="size-5" />} label="Expected profit" value={formatMoney(data.summary.expectedProfit)} />
        <KpiCard icon={<WalletCards className="size-5" />} label="Total payouts" value={formatMoney(data.summary.totalPayouts)} />
        <KpiCard icon={<CalendarClock className="size-5" />} label="Pending payouts" value={formatMoney(data.summary.pendingPayouts)} />
        <KpiCard icon={<PackageCheck className="size-5" />} label="Active allocations" value={String(data.summary.activeAllocationsCount)} />
        <KpiCard icon={<CheckCircle2 className="size-5" />} label="Completed allocations" value={String(data.summary.completedAllocationsCount)} />
        <KpiCard icon={<BarChart3 className="size-5" />} label="Current average ROI" value={formatPercent(data.summary.currentAverageRoi)} />
        <KpiCard icon={<FileText className="size-5" />} label="Next expected payout" value={formatDate(data.summary.nextExpectedPayoutDate)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-[2rem] bg-graphite-900/[0.72]">
          <CardHeader>
            <CardTitle>Active allocations</CardTitle>
            <CardDescription>Current capital assigned to managed electronics procurement, logistics, and marketplace sale operations.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {data.activeAllocations.length === 0 ? (
              <InvestorEmptyState title="No active allocations yet." description="Managed allocations will appear here after OTIZ assigns capital to a real commerce supply cycle." />
            ) : (
              data.activeAllocations.slice(0, 2).map((allocation) => <AllocationCard key={allocation.id} locale={locale} allocation={allocation} compact />)
            )}
          </CardContent>
        </Card>
        <Card className="rounded-[2rem] bg-graphite-900/[0.72]">
          <CardHeader>
            <CardTitle>Latest monthly report</CardTitle>
            <CardDescription>Published report visibility stays separate from internal audit and draft records.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.latestPublishedMonthlyReport ? (
              <Link href={`/${locale}/investor/reports/${data.latestPublishedMonthlyReport.id}`} className="block rounded-[1.5rem] border border-white/10 bg-black/20 p-4 transition-colors hover:border-gold-200/30">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{data.latestPublishedMonthlyReport.month}</p>
                <p className="mt-2 font-semibold text-foreground">{data.latestPublishedMonthlyReport.title}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{data.latestPublishedMonthlyReport.summary}</p>
                <p className="mt-3 text-xs text-gold-100">Published {formatDate(data.latestPublishedMonthlyReport.publishedAt)}</p>
              </Link>
            ) : (
              <InvestorEmptyState title="No published report yet." description="Published monthly reports will appear here after manager review. Draft reports remain hidden from investor access." />
            )}
            <ProofLine label="Reinvest preference" value={data.summary.reinvestEnabled ? "Enabled" : "Disabled"} />
            <ProofLine label="Risk note" value="Allocation outcomes depend on operational commerce execution. No return is promised." />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function InvestorAllocationsPage({ locale, data }: { locale: Locale; data: InvestorDashboardData }) {
  return (
    <div className="grid gap-4">
      {data.activeAllocations.length === 0 ? (
        <InvestorEmptyState title="No active allocations yet." description="Your investor profile is active. Allocations will appear once a manager assigns capital to an electronics commerce cycle." />
      ) : (
        data.activeAllocations.map((allocation) => <AllocationCard key={allocation.id} locale={locale} allocation={allocation} />)
      )}
    </div>
  );
}

export function InvestorReportsPage({ locale, reports }: { locale: Locale; reports: InvestorMonthlyReport[] }) {
  return (
    <div className="grid gap-4">
      {reports.length === 0 ? (
        <InvestorEmptyState title="No published reports yet." description="Monthly reports will appear after OTIZ publishes an operational reporting summary for your investor profile." />
      ) : reports.map((report) => (
        <Link key={report.id} href={`/${locale}/investor/reports/${report.id}`} className="block">
          <Card className="rounded-[2rem] bg-graphite-900/[0.72] transition-colors hover:border-gold-200/30">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>{report.title}</CardTitle>
                  <CardDescription>{report.month} · Published {report.publishedAt ? formatDate(report.publishedAt) : "after manager review"}</CardDescription>
                </div>
                <Badge variant="secondary">Published</Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <ProofLine label="Summary" value={report.summary} />
              <ProofLine label="Performance" value={report.performanceNote || "No performance note published."} />
              <ProofLine label="Payouts" value={report.payoutNote || "No payout note published."} />
              <ProofLine label="Proof categories" value={Object.keys(report.proofSummary).length ? Object.entries(report.proofSummary).map(([type, count]) => `${type}: ${count}`).join(", ") : "No available proof categories in this report."} />
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

export function InvestorWithdrawalsPage({ withdrawals, summary }: { withdrawals: InvestorWithdrawal[]; summary: InvestorDashboardData["summary"] }) {
  const pending = withdrawals.filter((withdrawal) => ["REQUESTED", "APPROVED"].includes(withdrawal.status));
  const scheduled = withdrawals.filter((withdrawal) => withdrawal.status === "SCHEDULED");
  const paid = withdrawals.filter((withdrawal) => withdrawal.status === "PAID");

  return (
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <Card className="rounded-[2rem] bg-graphite-900/[0.72]">
        <CardHeader>
          <CardTitle>Withdrawal availability</CardTitle>
          <CardDescription>Requests are manager-reviewed and use masked payout destination metadata only.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <ProofLine label="Available for withdrawal" value={formatMoney(Math.max(0, summary.realizedProfit - summary.totalPayouts - summary.pendingPayouts))} />
          <ProofLine label="Pending payouts" value={formatMoney(summary.pendingPayouts)} />
          <ProofLine label="Scheduled next payout" value={formatDate(summary.nextExpectedPayoutDate)} />
          <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
            <p className="font-semibold text-foreground">Request form disabled</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Self-service withdrawal creation is intentionally disabled until available balance rules are finalized. Managers can record requests from the admin payout schedule.</p>
          </div>
        </CardContent>
      </Card>
      <Card className="rounded-[2rem] bg-graphite-900/[0.72]">
        <CardHeader>
          <CardTitle>Withdrawal history</CardTitle>
          <CardDescription>Investor-safe payout request history with masked method and destination details.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {withdrawals.length === 0 ? (
            <InvestorEmptyState title="No withdrawal requests yet." description="Manager-reviewed payout requests and paid history will appear here after a request is recorded." />
          ) : (
            <>
              <WithdrawalGroup title="Pending review" withdrawals={pending} emptyText="No pending withdrawal requests." />
              <WithdrawalGroup title="Scheduled payouts" withdrawals={scheduled} emptyText="No scheduled payouts." />
              <WithdrawalGroup title="Paid history" withdrawals={paid} emptyText="No paid withdrawals yet." />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function InvestorReinvestPage({ enabled }: { enabled: boolean }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <ReinvestPreferenceControl initialEnabled={enabled} />
      <Card className="rounded-[2rem] bg-graphite-900/[0.72]">
        <CardHeader>
          <CardTitle>Reinvest approach</CardTitle>
          <CardDescription>Reinvest instructions keep completed cycle proceeds inside future commerce allocations after manager review.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <ProofLine label="What it changes" value="Eligible payouts can be rolled into future procurement cycles instead of being queued for withdrawal." />
          <ProofLine label="What it does not change" value="It does not guarantee allocation availability, cycle timing, or commercial outcome." />
          <ProofLine label="Review model" value="Manager confirmation remains required before permanent instruction changes." />
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="rounded-[1.5rem] bg-graphite-900/[0.72]">
      <CardContent className="p-5">
        <div className="mb-5 flex size-10 items-center justify-center rounded-full border border-gold-200/20 bg-gold-200/10 text-gold-100">{icon}</div>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
        <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}

function AllocationCard({ locale, allocation, compact = false }: { locale: Locale; allocation: InvestorDashboardAllocation; compact?: boolean }) {
  return (
    <Link href={`/${locale}/investor/allocations/${allocation.id}`}>
    <Card className="rounded-[1.5rem] bg-white/[0.035] transition-colors hover:bg-white/[0.055]">
      <CardContent className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{allocation.supplyId}</p>
            <h3 className="mt-2 text-lg font-semibold text-foreground">{allocation.product}</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>{allocation.currentStage}</Badge>
            <Badge variant="secondary">{allocation.riskLevel}</Badge>
          </div>
        </div>
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>Lifecycle progress</span>
            <span>{allocation.progressPercent}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gold-200/70" style={{ width: `${allocation.progressPercent}%` }} />
          </div>
        </div>
        <div className={`mt-5 grid gap-3 ${compact ? "sm:grid-cols-2" : "md:grid-cols-4"}`}>
          <ProofLine label="Invested amount" value={formatMoney(allocation.investedAmount)} />
          <ProofLine label="Expected return" value={allocation.expectedReturnNote} />
          <ProofLine label="Expected payout" value={formatDate(allocation.expectedPayoutAt)} />
          <ProofLine label="Updated" value={formatDate(allocation.updatedAt)} />
          <ProofLine label="Proof health" value={allocation.proofHealth ? `${allocation.proofHealth.state} · ${allocation.proofHealth.score}%` : "Under manager review"} />
          <ProofLine label="Risk visibility" value={allocation.riskHealth ? `${allocation.riskHealth.level} · ${allocation.riskHealth.score}/100` : "Under manager review"} />
          {!compact ? <ProofLine label="Started" value={formatDate(allocation.startedAt)} /> : null}
          {!compact ? <ProofLine label="Latest proof" value={allocation.latestProofReference ? `${allocation.latestProofReference.type}: ${allocation.latestProofReference.title}` : "No investor-visible proof yet."} /> : null}
          {!compact ? <ProofLine label="Latest report" value={allocation.latestReportReference ? allocation.latestReportReference.title : "No published report yet."} /> : null}
          {!compact ? <ProofLine label="Risk note" value={allocation.riskHealth?.summary || (allocation.riskLevel === "elevated" ? "Manager review required." : "Normal operational monitoring.")} /> : null}
        </div>
      </CardContent>
    </Card>
    </Link>
  );
}

function InvestorEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <Card className="rounded-[1.5rem] bg-white/[0.035]">
      <CardContent className="p-8 text-center">
        <PackageCheck className="mx-auto size-9 text-gold-100" />
        <p className="mt-4 font-semibold text-foreground">{title}</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function WithdrawalGroup({ title, withdrawals, emptyText }: { title: string; withdrawals: InvestorWithdrawal[]; emptyText: string }) {
  return (
    <div className="grid gap-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{title}</p>
      {withdrawals.length === 0 ? (
        <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4 text-sm text-muted-foreground">{emptyText}</div>
      ) : withdrawals.map((withdrawal) => (
        <div key={withdrawal.id} className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-lg font-semibold text-foreground">{withdrawal.currency} {Number(withdrawal.amount || 0).toLocaleString("en-US")}</p>
            <Badge variant="secondary">{withdrawal.status}</Badge>
          </div>
          <Separator className="my-4" />
          <div className="grid gap-3 sm:grid-cols-2">
            <ProofLine label="Requested" value={formatDate(withdrawal.requestedAt)} />
            <ProofLine label="Scheduled" value={formatDate(withdrawal.scheduledFor)} />
            <ProofLine label="Paid" value={formatDate(withdrawal.paidAt)} />
            <ProofLine label="Method" value={withdrawal.method || "Not set"} />
            <ProofLine label="Destination" value={withdrawal.destinationMasked || "Not set"} />
            <ProofLine label="Investor note" value={withdrawal.investorNote || withdrawal.rejectionReason || "No investor-visible note."} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ProofLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm leading-6 text-foreground">{value}</p>
    </div>
  );
}

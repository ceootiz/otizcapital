import Link from "next/link";
import { ArrowLeft, Activity, Bell, Boxes, FileCheck2, ShieldAlert, ShieldCheck, Siren, WalletCards } from "lucide-react";
import type { CheckpointHealthCategory, CheckpointHealthSnapshot } from "@otiz/database";
import type { Locale } from "@otiz/lib";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Separator } from "@otiz/ui";
import { AdminNavigation } from "./admin-navigation";

const categoryLabels: Record<CheckpointHealthCategory, string> = {
  READINESS: "Readiness",
  RECONCILIATION: "Reconciliation",
  RISK: "Risk",
  WITHDRAWALS: "Withdrawals",
  PROOF: "Proof completeness",
  NOTIFICATIONS: "Notifications",
  INCIDENTS: "Incidents",
  SNAPSHOT_INTEGRITY: "Snapshot integrity"
};

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : dateFormatter.format(date);
}

function statusTone(status: string) {
  if (status === "CRITICAL") return "border-red-300/25 bg-red-300/10 text-red-100";
  if (status === "ATTENTION") return "border-gold-200/30 bg-gold-200/10 text-gold-100";
  return "border-emerald-300/25 bg-emerald-300/10 text-emerald-100";
}

function severityTone(severity: string) {
  if (severity === "CRITICAL") return "border-red-300/25 bg-red-300/10 text-red-100";
  if (severity === "WARNING") return "border-gold-200/25 bg-gold-200/10 text-gold-100";
  return "border-white/10 bg-white/[0.04] text-muted-foreground";
}

function formatIncidentSourceSummary(bySource: Record<string, number>) {
  const entries = Object.entries(bySource).sort((left, right) => right[1] - left[1]).slice(0, 3);
  if (entries.length === 0) return "None";
  return entries.map(([source, count]) => `${source.replace(/_/g, " ")}: ${count}`).join(" · ");
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function HealthCard({ title, description, icon, children }: { title: string; description: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card className="rounded-[2rem] bg-graphite-900/[0.72]">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-gold-100">{icon}</div>
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">{children}</CardContent>
    </Card>
  );
}

export function AdminCheckpointHealthPage({ locale, snapshot }: { locale: Locale; snapshot: CheckpointHealthSnapshot }) {
  const { metrics } = snapshot;

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground micro-noise">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(212,175,95,0.14),transparent_34rem),radial-gradient(circle_at_86%_10%,rgba(255,255,255,0.07),transparent_28rem)]" />
      <div className="macro-grid absolute inset-0 opacity-45" />
      <section className="relative z-10 py-8 sm:py-10">
        <div className="container">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link href={`/${locale}/admin/applications`} className="inline-flex items-center gap-3 text-sm text-muted-foreground transition-colors hover:text-foreground"><ArrowLeft className="size-4" />Back to CRM</Link>
            <AdminNavigation locale={locale} activeSection="checkpoint-health" />
          </div>

          <Card className="mb-6 rounded-[2rem] bg-graphite-900/[0.78]">
            <CardContent className="grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-100">Internal ops dashboard</p>
                <h1 className="mt-3 font-display text-4xl tracking-[-0.04em] text-foreground md:text-5xl">Checkpoint health</h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">Operational health across readiness, reconciliation, risk, withdrawals, proof coverage, notifications, and frozen report snapshot integrity.</p>
              </div>
              <div className="grid gap-2 text-right">
                <Badge className={`justify-center rounded-full border px-4 py-2 ${statusTone(snapshot.overallStatus)}`}>{snapshot.overallStatus}</Badge>
                <p className="text-3xl font-semibold text-foreground">{snapshot.score}/100</p>
                <p className="text-xs text-muted-foreground">Evaluated {formatDate(snapshot.lastEvaluatedAt)}</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <HealthCard title="Readiness" description="Draft monthly report publish control state." icon={<FileCheck2 className="size-5" />}>
              <Metric label="Draft reports" value={metrics.readiness.draftReportsCount} />
              <Metric label="Blocked reports" value={metrics.readiness.blockedReportsCount} />
              <Metric label="Need acknowledgment" value={metrics.readiness.reportsNeedingWarningAcknowledgment} />
              <Metric label="Stale snapshots" value={metrics.readiness.staleSnapshotCount} />
            </HealthCard>

            <HealthCard title="Reconciliation" description="Three-ledger allocation balance checks." icon={<Boxes className="size-5" />}>
              <Metric label="Broken allocations" value={metrics.reconciliation.brokenAllocationsCount} />
              <Metric label="Warning allocations" value={metrics.reconciliation.warningAllocationsCount} />
              <Metric label="Current issues" value={metrics.reconciliation.latestReconciliationIssueCount} />
              <Metric label="Status" value={metrics.reconciliation.brokenAllocationsCount ? "Broken" : metrics.reconciliation.warningAllocationsCount ? "Warnings" : "Balanced"} />
            </HealthCard>

            <HealthCard title="Risk" description="Current allocation risk state and evaluation freshness." icon={<Siren className="size-5" />}>
              <Metric label="Critical risk" value={metrics.risk.criticalRiskAllocationsCount} />
              <Metric label="High risk" value={metrics.risk.highRiskAllocationsCount} />
              <Metric label="Risk events 7d" value={metrics.risk.latestRiskEventCount} />
              <Metric label="Overdue evaluations" value={metrics.risk.overdueRiskEvaluations} />
            </HealthCard>

            <HealthCard title="Withdrawals" description="Pending and scheduled payout operations." icon={<WalletCards className="size-5" />}>
              <Metric label="Requested" value={metrics.withdrawals.requestedCount} />
              <Metric label="Approved" value={metrics.withdrawals.approvedCount} />
              <Metric label="Scheduled" value={metrics.withdrawals.scheduledCount} />
              <Metric label="Overdue scheduled" value={metrics.withdrawals.overdueScheduledPayoutsCount} />
            </HealthCard>

            <HealthCard title="Proof completeness" description="Evidence coverage over managed allocations." icon={<ShieldCheck className="size-5" />}>
              <Metric label="Average score" value={`${metrics.proof.averageProofCompleteness}%`} />
              <Metric label="Incomplete allocations" value={metrics.proof.incompleteAllocationsCount} />
              <Metric label="High-risk proof gaps" value={metrics.proof.highRiskProofGapsCount} />
              <Metric label="Status" value={metrics.proof.highRiskProofGapsCount ? "Review" : "Tracked"} />
            </HealthCard>

            <HealthCard title="Notifications" description="Internal notification queue foundation." icon={<Bell className="size-5" />}>
              <Metric label="Available" value={metrics.notifications.available ? "Yes" : "No"} />
              <Metric label="Pending" value={metrics.notifications.pendingCount} />
              <Metric label="Failed" value={metrics.notifications.failedCount} />
              <Metric label="Delivery" value="Disabled-safe" />
            </HealthCard>

            <HealthCard title="Incidents" description="Unresolved operational incidents from risk, reconciliation, readiness, withdrawals, proof, and manual checks." icon={<ShieldAlert className="size-5" />}>
              <Metric label="Open" value={metrics.incidents.openCount} />
              <Metric label="Acknowledged" value={metrics.incidents.acknowledgedCount} />
              <Metric label="Critical unresolved" value={metrics.incidents.criticalOpenCount} />
              <Metric label="Stale unresolved" value={metrics.incidents.staleUnresolvedCount} />
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:col-span-2">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Source summary</p>
                <p className="mt-2 text-sm leading-6 text-foreground">{formatIncidentSourceSummary(metrics.incidents.bySource)}</p>
              </div>
            </HealthCard>
          </div>

          <Card className="mt-4 rounded-[2rem] bg-graphite-900/[0.72]">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-gold-100"><Activity className="size-5" /></div>
                <div>
                  <CardTitle>Snapshot integrity</CardTitle>
                  <CardDescription>Published reports should keep frozen proof, reconciliation, and risk snapshots.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-4">
              <Metric label="Missing proof snapshot" value={metrics.snapshotIntegrity.publishedReportsMissingProofSnapshot} />
              <Metric label="Missing reconciliation" value={metrics.snapshotIntegrity.publishedReportsMissingReconciliationSnapshot} />
              <Metric label="Missing risk snapshot" value={metrics.snapshotIntegrity.publishedReportsMissingRiskSnapshot} />
              <Metric label="Stale draft snapshots" value={metrics.snapshotIntegrity.draftReportsWithStaleSnapshot} />
            </CardContent>
          </Card>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
            <Card className="rounded-[2rem] bg-graphite-900/[0.72]">
              <CardHeader>
                <CardTitle>Issue list</CardTitle>
                <CardDescription>Current operational issues grouped by severity and subsystem.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {snapshot.issues.length === 0 ? (
                  <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5 text-sm leading-6 text-muted-foreground">No checkpoint issues detected.</div>
                ) : snapshot.issues.map((issue) => (
                  <div key={issue.id} className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={`border ${severityTone(issue.severity)}`}>{issue.severity}</Badge>
                          <Badge variant="secondary">{categoryLabels[issue.category]}</Badge>
                          <Badge variant="secondary">{issue.count}</Badge>
                        </div>
                        <p className="mt-3 font-semibold text-foreground">{issue.title}</p>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">{issue.detail}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] bg-graphite-900/[0.72]">
              <CardHeader>
                <CardTitle>Recommended actions</CardTitle>
                <CardDescription>Operational next steps derived from current issue categories.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {snapshot.recommendedActions.length === 0 ? (
                  <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5 text-sm leading-6 text-muted-foreground">No immediate manager action required.</div>
                ) : snapshot.recommendedActions.map((action, index) => (
                  <div key={action} className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-100">Action {index + 1}</p>
                    <Separator className="my-3" />
                    <p className="text-sm leading-6 text-foreground">{action}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}

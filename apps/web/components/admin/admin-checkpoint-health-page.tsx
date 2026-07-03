import Link from "next/link";
import { ArrowLeft, Activity, Bell, Boxes, FileCheck2, ShieldAlert, ShieldCheck, Siren, WalletCards } from "lucide-react";
import type { CheckpointHealthSnapshot } from "@otiz/database";
import { createAdminFormatters, enumLabel, type Locale } from "@otiz/lib";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Separator } from "@otiz/ui";
import { AdminNavigation } from "./admin-navigation";

const STRINGS = {
  en: {
    backToCrm: "Back to CRM",
    eyebrow: "Internal ops dashboard",
    title: "Checkpoint health",
    description:
      "Operational health across readiness, reconciliation, risk, withdrawals, proof coverage, notifications, and frozen report snapshot integrity.",
    evaluatedPrefix: "Evaluated",
    readinessTitle: "Readiness",
    readinessDesc: "Draft monthly report publish control state.",
    reconciliationTitle: "Reconciliation",
    reconciliationDesc: "Three-ledger allocation balance checks.",
    riskTitle: "Risk",
    riskDesc: "Current allocation risk state and evaluation freshness.",
    withdrawalsTitle: "Withdrawals",
    withdrawalsDesc: "Pending and scheduled payout operations.",
    proofTitle: "Proof completeness",
    proofDesc: "Evidence coverage over managed allocations.",
    notificationsTitle: "Notifications",
    notificationsDesc: "Internal notification queue foundation.",
    incidentsTitle: "Incidents",
    incidentsDesc:
      "Unresolved operational incidents from risk, reconciliation, readiness, withdrawals, proof, and manual checks.",
    snapshotIntegrityTitle: "Snapshot integrity",
    snapshotIntegrityDesc: "Published reports should keep frozen proof, reconciliation, and risk snapshots.",
    issueListTitle: "Issue list",
    issueListDesc: "Current operational issues grouped by severity and subsystem.",
    recommendedTitle: "Recommended actions",
    recommendedDesc: "Operational next steps derived from current issue categories.",
    draftReports: "Draft reports",
    blockedReports: "Blocked reports",
    needAcknowledgment: "Need acknowledgment",
    staleSnapshots: "Stale snapshots",
    brokenAllocations: "Broken allocations",
    warningAllocations: "Warning allocations",
    currentIssues: "Current issues",
    status: "Status",
    criticalRisk: "Critical risk",
    highRisk: "High risk",
    riskEvents7d: "Risk events 7d",
    overdueEvaluations: "Overdue evaluations",
    requested: "Requested",
    approved: "Approved",
    scheduled: "Scheduled",
    overdueScheduled: "Overdue scheduled",
    averageScore: "Average score",
    incompleteAllocations: "Incomplete allocations",
    highRiskProofGaps: "High-risk proof gaps",
    available: "Available",
    pending: "Pending",
    failed: "Failed",
    delivery: "Delivery",
    open: "Open",
    acknowledged: "Acknowledged",
    criticalUnresolved: "Critical unresolved",
    staleUnresolved: "Stale unresolved",
    sourceSummary: "Source summary",
    missingProofSnapshot: "Missing proof snapshot",
    missingReconciliation: "Missing reconciliation",
    missingRiskSnapshot: "Missing risk snapshot",
    staleDraftSnapshots: "Stale draft snapshots",
    yes: "Yes",
    no: "No",
    review: "Review",
    tracked: "Tracked",
    disabledSafe: "Disabled-safe",
    none: "None",
    broken: "Broken",
    warnings: "Warnings",
    balanced: "Balanced",
    noIssues: "No checkpoint issues detected.",
    noAction: "No immediate manager action required.",
    actionPrefix: "Action"
  },
  ru: {
    backToCrm: "Назад в CRM",
    eyebrow: "Внутренняя панель операций",
    title: "Состояние контрольных точек",
    description:
      "Операционное состояние по готовности, сверке, рискам, выводам, покрытию подтверждений, уведомлениям и целостности замороженных снимков отчётов.",
    evaluatedPrefix: "Оценено",
    readinessTitle: "Готовность",
    readinessDesc: "Состояние контроля публикации черновиков ежемесячных отчётов.",
    reconciliationTitle: "Сверка",
    reconciliationDesc: "Проверки баланса аллокаций по трём реестрам.",
    riskTitle: "Риск",
    riskDesc: "Текущее состояние рисков аллокаций и актуальность оценок.",
    withdrawalsTitle: "Выводы",
    withdrawalsDesc: "Ожидающие и запланированные операции выплат.",
    proofTitle: "Полнота подтверждений",
    proofDesc: "Покрытие доказательствами по управляемым аллокациям.",
    notificationsTitle: "Уведомления",
    notificationsDesc: "Основа внутренней очереди уведомлений.",
    incidentsTitle: "Инциденты",
    incidentsDesc:
      "Нерешённые операционные инциденты из рисков, сверки, готовности, выводов, подтверждений и ручных проверок.",
    snapshotIntegrityTitle: "Целостность снимков",
    snapshotIntegrityDesc: "Опубликованные отчёты должны сохранять замороженные снимки подтверждений, сверки и рисков.",
    issueListTitle: "Список проблем",
    issueListDesc: "Текущие операционные проблемы, сгруппированные по серьёзности и подсистеме.",
    recommendedTitle: "Рекомендуемые действия",
    recommendedDesc: "Операционные следующие шаги на основе текущих категорий проблем.",
    draftReports: "Черновики отчётов",
    blockedReports: "Заблокированные отчёты",
    needAcknowledgment: "Требуют подтверждения",
    staleSnapshots: "Устаревшие снимки",
    brokenAllocations: "Нарушенные аллокации",
    warningAllocations: "Аллокации с предупреждениями",
    currentIssues: "Текущие проблемы",
    status: "Статус",
    criticalRisk: "Критический риск",
    highRisk: "Высокий риск",
    riskEvents7d: "События риска за 7 дней",
    overdueEvaluations: "Просроченные оценки",
    requested: "Запрошено",
    approved: "Одобрено",
    scheduled: "Запланировано",
    overdueScheduled: "Просроченные запланированные",
    averageScore: "Средний балл",
    incompleteAllocations: "Неполные аллокации",
    highRiskProofGaps: "Пробелы подтверждений высокого риска",
    available: "Доступно",
    pending: "В ожидании",
    failed: "Ошибки",
    delivery: "Доставка",
    open: "Открыто",
    acknowledged: "Принято",
    criticalUnresolved: "Критические нерешённые",
    staleUnresolved: "Устаревшие нерешённые",
    sourceSummary: "Сводка по источникам",
    missingProofSnapshot: "Нет снимка подтверждений",
    missingReconciliation: "Нет снимка сверки",
    missingRiskSnapshot: "Нет снимка рисков",
    staleDraftSnapshots: "Устаревшие снимки черновиков",
    yes: "Да",
    no: "Нет",
    review: "Проверить",
    tracked: "Отслеживается",
    disabledSafe: "Безопасно отключено",
    none: "Нет",
    broken: "Нарушено",
    warnings: "Предупреждения",
    balanced: "Сбалансировано",
    noIssues: "Проблемы контрольных точек не обнаружены.",
    noAction: "Немедленные действия менеджера не требуются.",
    actionPrefix: "Действие"
  }
} as const;

type Strings = typeof STRINGS.en;

const getStrings = (locale: Locale): Strings => (STRINGS as unknown as Record<string, Strings>)[locale] ?? STRINGS.en;

function statusTone(status: string) {
  if (status === "CRITICAL") return "border-red-300/25 bg-red-300/10 text-red-100";
  if (status === "ATTENTION") return "border-gold-200/30 bg-gold-300/20 dark:bg-gold-200/10 text-amber-700 dark:text-gold-100";
  return "border-emerald-300/25 bg-emerald-300/10 text-emerald-100";
}

function severityTone(severity: string) {
  if (severity === "CRITICAL") return "border-red-300/25 bg-red-300/10 text-red-100";
  if (severity === "WARNING") return "border-gold-200/25 bg-gold-300/20 dark:bg-gold-200/10 text-amber-700 dark:text-gold-100";
  return "border-border dark:border-white/10 bg-muted/30 dark:bg-white/[0.04] text-muted-foreground";
}

function formatIncidentSourceSummary(bySource: Record<string, number>, noneLabel: string) {
  const entries = Object.entries(bySource).sort((left, right) => right[1] - left[1]).slice(0, 3);
  if (entries.length === 0) return noneLabel;
  return entries.map(([source, count]) => `${source.replace(/_/g, " ")}: ${count}`).join(" · ");
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 p-4">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function HealthCard({ title, description, icon, children }: { title: string; description: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card className="rounded-[1.35rem] bg-card dark:bg-graphite-900/[0.72]">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="rounded-2xl border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 p-3 text-amber-700 dark:text-gold-100">{icon}</div>
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
  const t = getStrings(locale);
  const formatters = createAdminFormatters(locale);

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground micro-noise">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(212,175,95,0.14),transparent_34rem),radial-gradient(circle_at_86%_10%,rgba(255,255,255,0.07),transparent_28rem)]" />
      <div className="macro-grid absolute inset-0 opacity-45" />
      <section className="relative z-10 py-8 sm:py-10">
        <div className="container">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link href={`/${locale}/admin/applications`} className="inline-flex items-center gap-3 text-sm text-muted-foreground transition-colors hover:text-foreground"><ArrowLeft className="size-4" />{t.backToCrm}</Link>
            <AdminNavigation locale={locale} activeSection="checkpoint-health" />
          </div>

          <Card className="mb-6 rounded-[1.35rem] bg-card dark:bg-graphite-900/[0.78]">
            <CardContent className="grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700 dark:text-gold-100">{t.eyebrow}</p>
                <h1 className="mt-3 font-display text-4xl tracking-[-0.04em] text-foreground md:text-5xl">{t.title}</h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">{t.description}</p>
              </div>
              <div className="grid gap-2 text-right">
                <Badge className={`justify-center rounded-full border px-4 py-2 ${statusTone(snapshot.overallStatus)}`}>{enumLabel("healthStatus", snapshot.overallStatus, locale)}</Badge>
                <p className="text-3xl font-semibold text-foreground">{snapshot.score}/100</p>
                <p className="text-xs text-muted-foreground">{t.evaluatedPrefix} {formatters.dateTime(snapshot.lastEvaluatedAt)}</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <HealthCard title={t.readinessTitle} description={t.readinessDesc} icon={<FileCheck2 className="size-5" />}>
              <Metric label={t.draftReports} value={metrics.readiness.draftReportsCount} />
              <Metric label={t.blockedReports} value={metrics.readiness.blockedReportsCount} />
              <Metric label={t.needAcknowledgment} value={metrics.readiness.reportsNeedingWarningAcknowledgment} />
              <Metric label={t.staleSnapshots} value={metrics.readiness.staleSnapshotCount} />
            </HealthCard>

            <HealthCard title={t.reconciliationTitle} description={t.reconciliationDesc} icon={<Boxes className="size-5" />}>
              <Metric label={t.brokenAllocations} value={metrics.reconciliation.brokenAllocationsCount} />
              <Metric label={t.warningAllocations} value={metrics.reconciliation.warningAllocationsCount} />
              <Metric label={t.currentIssues} value={metrics.reconciliation.latestReconciliationIssueCount} />
              <Metric label={t.status} value={metrics.reconciliation.brokenAllocationsCount ? t.broken : metrics.reconciliation.warningAllocationsCount ? t.warnings : t.balanced} />
            </HealthCard>

            <HealthCard title={t.riskTitle} description={t.riskDesc} icon={<Siren className="size-5" />}>
              <Metric label={t.criticalRisk} value={metrics.risk.criticalRiskAllocationsCount} />
              <Metric label={t.highRisk} value={metrics.risk.highRiskAllocationsCount} />
              <Metric label={t.riskEvents7d} value={metrics.risk.latestRiskEventCount} />
              <Metric label={t.overdueEvaluations} value={metrics.risk.overdueRiskEvaluations} />
            </HealthCard>

            <HealthCard title={t.withdrawalsTitle} description={t.withdrawalsDesc} icon={<WalletCards className="size-5" />}>
              <Metric label={t.requested} value={metrics.withdrawals.requestedCount} />
              <Metric label={t.approved} value={metrics.withdrawals.approvedCount} />
              <Metric label={t.scheduled} value={metrics.withdrawals.scheduledCount} />
              <Metric label={t.overdueScheduled} value={metrics.withdrawals.overdueScheduledPayoutsCount} />
            </HealthCard>

            <HealthCard title={t.proofTitle} description={t.proofDesc} icon={<ShieldCheck className="size-5" />}>
              <Metric label={t.averageScore} value={`${metrics.proof.averageProofCompleteness}%`} />
              <Metric label={t.incompleteAllocations} value={metrics.proof.incompleteAllocationsCount} />
              <Metric label={t.highRiskProofGaps} value={metrics.proof.highRiskProofGapsCount} />
              <Metric label={t.status} value={metrics.proof.highRiskProofGapsCount ? t.review : t.tracked} />
            </HealthCard>

            <HealthCard title={t.notificationsTitle} description={t.notificationsDesc} icon={<Bell className="size-5" />}>
              <Metric label={t.available} value={metrics.notifications.available ? t.yes : t.no} />
              <Metric label={t.pending} value={metrics.notifications.pendingCount} />
              <Metric label={t.failed} value={metrics.notifications.failedCount} />
              <Metric label={t.delivery} value={t.disabledSafe} />
            </HealthCard>

            <HealthCard title={t.incidentsTitle} description={t.incidentsDesc} icon={<ShieldAlert className="size-5" />}>
              <Metric label={t.open} value={metrics.incidents.openCount} />
              <Metric label={t.acknowledged} value={metrics.incidents.acknowledgedCount} />
              <Metric label={t.criticalUnresolved} value={metrics.incidents.criticalOpenCount} />
              <Metric label={t.staleUnresolved} value={metrics.incidents.staleUnresolvedCount} />
              <div className="rounded-2xl border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 p-4 sm:col-span-2">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t.sourceSummary}</p>
                <p className="mt-2 text-sm leading-6 text-foreground">{formatIncidentSourceSummary(metrics.incidents.bySource, t.none)}</p>
              </div>
            </HealthCard>
          </div>

          <Card className="mt-4 rounded-[1.35rem] bg-card dark:bg-graphite-900/[0.72]">
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="rounded-2xl border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 p-3 text-amber-700 dark:text-gold-100"><Activity className="size-5" /></div>
                <div>
                  <CardTitle>{t.snapshotIntegrityTitle}</CardTitle>
                  <CardDescription>{t.snapshotIntegrityDesc}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-4">
              <Metric label={t.missingProofSnapshot} value={metrics.snapshotIntegrity.publishedReportsMissingProofSnapshot} />
              <Metric label={t.missingReconciliation} value={metrics.snapshotIntegrity.publishedReportsMissingReconciliationSnapshot} />
              <Metric label={t.missingRiskSnapshot} value={metrics.snapshotIntegrity.publishedReportsMissingRiskSnapshot} />
              <Metric label={t.staleDraftSnapshots} value={metrics.snapshotIntegrity.draftReportsWithStaleSnapshot} />
            </CardContent>
          </Card>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
            <Card className="rounded-[1.35rem] bg-card dark:bg-graphite-900/[0.72]">
              <CardHeader>
                <CardTitle>{t.issueListTitle}</CardTitle>
                <CardDescription>{t.issueListDesc}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {snapshot.issues.length === 0 ? (
                  <div className="rounded-[1.35rem] border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 p-5 text-sm leading-6 text-muted-foreground">{t.noIssues}</div>
                ) : snapshot.issues.map((issue) => (
                  <div key={issue.id} className="rounded-[1.35rem] border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={`border ${severityTone(issue.severity)}`}>{enumLabel("healthStatus", issue.severity, locale)}</Badge>
                          <Badge variant="secondary">{enumLabel("checkpointCategory", issue.category, locale)}</Badge>
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

            <Card className="rounded-[1.35rem] bg-card dark:bg-graphite-900/[0.72]">
              <CardHeader>
                <CardTitle>{t.recommendedTitle}</CardTitle>
                <CardDescription>{t.recommendedDesc}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {snapshot.recommendedActions.length === 0 ? (
                  <div className="rounded-[1.35rem] border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 p-5 text-sm leading-6 text-muted-foreground">{t.noAction}</div>
                ) : snapshot.recommendedActions.map((action, index) => (
                  <div key={action} className="rounded-[1.35rem] border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 dark:text-gold-100">{t.actionPrefix} {index + 1}</p>
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

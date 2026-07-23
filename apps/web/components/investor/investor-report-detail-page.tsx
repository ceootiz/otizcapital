import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import type { Investor } from "@prisma/client";
import { createAdminFormatters, enumLabel, type Locale } from "@otiz/lib";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Separator } from "@otiz/ui";
import { localizeInventoryProgress, localizePayoutStatus, localizeProofSummary, localizeReconciliationNotice, localizeRiskSummary } from "@/lib/investor-health-copy";
import { InvestorShell } from "./investor-pages";

const STRINGS = {
  en: {
    shellEyebrow: "Monthly report detail",
    shellDescription: "A focused view of one published operational report, including report notes and available proof categories from the stored snapshot.",
    backToReports: "Back to reports",
    createdLabel: "Report created",
    createdDetail: "The monthly report record was prepared for review.",
    updatedLabel: "Report updated",
    updatedDetail: "The report was updated by the operations team.",
    publishedLabel: "Report published",
    publishedDetail: "The report is available for investor review.",
    publishedWord: "Published",
    afterManagerReview: "after manager review",
    publishedBadge: "Published",
    lifecycleTitle: "Lifecycle timeline",
    lifecycleDescription: "Published report lifecycle without internal audit details.",
    proofSummaryTitle: "Proof summary",
    proofSummaryDescription: "Only available and verified proof categories from the report snapshot are shown here.",
    availableProofs: "Available proofs",
    verifiedProofs: "Verified proofs",
    noAvailableProofs: "No available proofs in this report snapshot.",
    noVerifiedProofs: "No verified proofs in this report snapshot.",
    linkedAllocationTitle: "Linked allocation summary",
    linkedAllocationDescription: "Allocation stages and proof categories are read from the frozen report snapshot, not current live operations.",
    noAllocationSummary: "No allocation summary was included in this report snapshot.",
    marketplaceOperations: "Marketplace operations",
    snapshotUpdated: "Snapshot updated",
    summary: "Summary",
    performanceNote: "Performance note",
    payoutNote: "Payout note",
    investedAmount: "Invested amount",
    expectedCycle: "Expected cycle",
    estimatedResult: "Estimated result",
    payoutState: "Payout state",
    proofHealth: "Document status",
    evidenceSummary: "Evidence summary",
    reconciliation: "Verification",
    inventoryProgress: "Inventory progress",
    capitalReturned: "Capital returned",
    payoutStatus: "Payout status",
    riskVisibility: "Attention level",
    riskSummary: "Risk summary",
    noPerformanceNote: "No performance note published.",
    noPayoutNote: "No payout note published.",
    notSet: "Not set",
    notEstimated: "Not estimated",
    underManagerReview: "Under manager review",
    notReady: "Not ready",
    underReview: "Under review",
    evidenceUnderReview: "Evidence coverage is under manager review.",
    inventoryUnderReview: "Inventory progress is under manager review.",
    riskUnderReview: "Operational risk is under manager review.",
    days: "days",
    availableAllocationProofs: "Available allocation proofs",
    verifiedAllocationProofs: "Verified allocation proofs",
    noAvailableAllocationProofs: "No available proof categories for this allocation in the snapshot.",
    noVerifiedAllocationProofs: "No verified proof categories for this allocation in the snapshot."
  },
  ru: {
    shellEyebrow: "Детали ежемесячного отчёта",
    shellDescription: "Целостный обзор одного опубликованного операционного отчёта, включая заметки по отчёту и доступные категории подтверждений из сохранённого снимка.",
    backToReports: "Назад к отчётам",
    createdLabel: "Отчёт создан",
    createdDetail: "Запись ежемесячного отчёта была подготовлена к проверке.",
    updatedLabel: "Отчёт обновлён",
    updatedDetail: "Отчёт был обновлён операционной командой.",
    publishedLabel: "Отчёт опубликован",
    publishedDetail: "Отчёт доступен для просмотра инвестором.",
    publishedWord: "Опубликовано",
    afterManagerReview: "после проверки менеджером",
    publishedBadge: "Опубликовано",
    lifecycleTitle: "Хронология жизненного цикла",
    lifecycleDescription: "Жизненный цикл опубликованного отчёта без деталей внутреннего аудита.",
    proofSummaryTitle: "Сводка подтверждений",
    proofSummaryDescription: "Здесь показаны только доступные и проверенные категории подтверждений из снимка отчёта.",
    availableProofs: "Доступные подтверждения",
    verifiedProofs: "Проверенные подтверждения",
    noAvailableProofs: "В этом снимке отчёта нет доступных подтверждений.",
    noVerifiedProofs: "В этом снимке отчёта нет проверенных подтверждений.",
    linkedAllocationTitle: "Сводка по связанным аллокациям",
    linkedAllocationDescription: "Этапы аллокации и категории подтверждений считываются из зафиксированного снимка отчёта, а не из текущих операций.",
    noAllocationSummary: "В этот снимок отчёта не была включена сводка по аллокациям.",
    marketplaceOperations: "Операции на маркетплейсе",
    snapshotUpdated: "Снимок обновлён",
    summary: "Сводка",
    performanceNote: "Заметка о результатах",
    payoutNote: "Заметка о выплате",
    investedAmount: "Инвестированная сумма",
    expectedCycle: "Ожидаемый цикл",
    estimatedResult: "Оценочный результат",
    payoutState: "Состояние выплаты",
    proofHealth: "Статус документов",
    evidenceSummary: "Сводка по доказательствам",
    reconciliation: "Проверка",
    inventoryProgress: "Прогресс по запасам",
    capitalReturned: "Возвращённый капитал",
    payoutStatus: "Статус выплаты",
    riskVisibility: "Уровень внимания",
    riskSummary: "Сводка по рискам",
    noPerformanceNote: "Заметка о результатах не опубликована.",
    noPayoutNote: "Заметка о выплате не опубликована.",
    notSet: "Не задано",
    notEstimated: "Не оценено",
    underManagerReview: "На проверке у менеджера",
    notReady: "Не готово",
    underReview: "На проверке",
    evidenceUnderReview: "Охват доказательств находится на проверке у менеджера.",
    inventoryUnderReview: "Прогресс по запасам находится на проверке у менеджера.",
    riskUnderReview: "Операционный риск находится на проверке у менеджера.",
    days: "дней",
    availableAllocationProofs: "Доступные подтверждения аллокации",
    verifiedAllocationProofs: "Проверенные подтверждения аллокации",
    noAvailableAllocationProofs: "В снимке нет доступных категорий подтверждений для этой аллокации.",
    noVerifiedAllocationProofs: "В снимке нет проверенных категорий подтверждений для этой аллокации."
  },
  es: {
    shellEyebrow: "Detalle del informe mensual",
    shellDescription: "Vista enfocada de un informe operativo publicado, incluidas las notas del informe y las categorías de pruebas disponibles a partir de la instantánea almacenada.",
    backToReports: "Volver a los informes",
    createdLabel: "Informe creado",
    createdDetail: "El registro del informe mensual se preparó para su revisión.",
    updatedLabel: "Informe actualizado",
    updatedDetail: "El informe fue actualizado por el equipo de operaciones.",
    publishedLabel: "Informe publicado",
    publishedDetail: "El informe está disponible para la revisión del inversor.",
    publishedWord: "Publicado",
    afterManagerReview: "tras la revisión del gestor",
    publishedBadge: "Publicado",
    lifecycleTitle: "Cronología del ciclo de vida",
    lifecycleDescription: "Ciclo de vida del informe publicado sin detalles de auditoría interna.",
    proofSummaryTitle: "Resumen de pruebas",
    proofSummaryDescription: "Aquí solo se muestran las categorías de pruebas disponibles y verificadas de la instantánea del informe.",
    availableProofs: "Pruebas disponibles",
    verifiedProofs: "Pruebas verificadas",
    noAvailableProofs: "No hay pruebas disponibles en esta instantánea del informe.",
    noVerifiedProofs: "No hay pruebas verificadas en esta instantánea del informe.",
    linkedAllocationTitle: "Resumen de asignaciones vinculadas",
    linkedAllocationDescription: "Las etapas de la asignación y las categorías de pruebas se leen de la instantánea fija del informe, no de las operaciones en vivo actuales.",
    noAllocationSummary: "No se incluyó ningún resumen de asignaciones en esta instantánea del informe.",
    marketplaceOperations: "Operaciones en el marketplace",
    snapshotUpdated: "Instantánea actualizada",
    summary: "Resumen",
    performanceNote: "Nota de rendimiento",
    payoutNote: "Nota de distribución",
    investedAmount: "Importe invertido",
    expectedCycle: "Ciclo previsto",
    estimatedResult: "Resultado estimado",
    payoutState: "Estado de la distribución",
    proofHealth: "Estado de las pruebas",
    evidenceSummary: "Resumen de la evidencia",
    reconciliation: "Conciliación",
    inventoryProgress: "Progreso del inventario",
    capitalReturned: "Capital devuelto",
    payoutStatus: "Estado de la distribución",
    riskVisibility: "Visibilidad del riesgo",
    riskSummary: "Resumen del riesgo",
    noPerformanceNote: "No se ha publicado ninguna nota de rendimiento.",
    noPayoutNote: "No se ha publicado ninguna nota de distribución.",
    notSet: "Sin definir",
    notEstimated: "Sin estimar",
    underManagerReview: "En revisión por el gestor",
    notReady: "No preparado",
    underReview: "En revisión",
    evidenceUnderReview: "La cobertura de la evidencia está en revisión por el gestor.",
    inventoryUnderReview: "El progreso del inventario está en revisión por el gestor.",
    riskUnderReview: "El riesgo operativo está en revisión por el gestor.",
    days: "días",
    availableAllocationProofs: "Pruebas de asignación disponibles",
    verifiedAllocationProofs: "Pruebas de asignación verificadas",
    noAvailableAllocationProofs: "No hay categorías de pruebas disponibles para esta asignación en la instantánea.",
    noVerifiedAllocationProofs: "No hay categorías de pruebas verificadas para esta asignación en la instantánea."
  },
  de: {
    shellEyebrow: "Detail des Monatsberichts",
    shellDescription: "Eine fokussierte Ansicht eines veröffentlichten operativen Berichts, einschließlich Berichtsnotizen und verfügbarer Nachweiskategorien aus der gespeicherten Momentaufnahme.",
    backToReports: "Zurück zu den Berichten",
    createdLabel: "Bericht erstellt",
    createdDetail: "Der Datensatz des Monatsberichts wurde zur Prüfung vorbereitet.",
    updatedLabel: "Bericht aktualisiert",
    updatedDetail: "Der Bericht wurde vom Operations-Team aktualisiert.",
    publishedLabel: "Bericht veröffentlicht",
    publishedDetail: "Der Bericht steht zur Prüfung durch den Investor bereit.",
    publishedWord: "Veröffentlicht",
    afterManagerReview: "nach der Prüfung durch den Manager",
    publishedBadge: "Veröffentlicht",
    lifecycleTitle: "Verlauf des Lebenszyklus",
    lifecycleDescription: "Lebenszyklus des veröffentlichten Berichts ohne interne Auditdetails.",
    proofSummaryTitle: "Nachweiszusammenfassung",
    proofSummaryDescription: "Hier werden nur die verfügbaren und verifizierten Nachweiskategorien aus der Momentaufnahme des Berichts angezeigt.",
    availableProofs: "Verfügbare Nachweise",
    verifiedProofs: "Verifizierte Nachweise",
    noAvailableProofs: "In dieser Momentaufnahme des Berichts sind keine verfügbaren Nachweise vorhanden.",
    noVerifiedProofs: "In dieser Momentaufnahme des Berichts sind keine verifizierten Nachweise vorhanden.",
    linkedAllocationTitle: "Zusammenfassung der verknüpften Allokationen",
    linkedAllocationDescription: "Allokationsphasen und Nachweiskategorien werden aus der fixierten Momentaufnahme des Berichts gelesen, nicht aus dem aktuellen Live-Betrieb.",
    noAllocationSummary: "In diese Momentaufnahme des Berichts wurde keine Allokationszusammenfassung aufgenommen.",
    marketplaceOperations: "Marktplatz-Operationen",
    snapshotUpdated: "Momentaufnahme aktualisiert",
    summary: "Zusammenfassung",
    performanceNote: "Leistungsnotiz",
    payoutNote: "Ausschüttungsnotiz",
    investedAmount: "Investierter Betrag",
    expectedCycle: "Erwarteter Zyklus",
    estimatedResult: "Geschätztes Ergebnis",
    payoutState: "Ausschüttungsstatus",
    proofHealth: "Nachweisqualität",
    evidenceSummary: "Zusammenfassung der Nachweise",
    reconciliation: "Abstimmung",
    inventoryProgress: "Bestandsfortschritt",
    capitalReturned: "Zurückgeführtes Kapital",
    payoutStatus: "Ausschüttungsstatus",
    riskVisibility: "Risikotransparenz",
    riskSummary: "Risikozusammenfassung",
    noPerformanceNote: "Es wurde keine Leistungsnotiz veröffentlicht.",
    noPayoutNote: "Es wurde keine Ausschüttungsnotiz veröffentlicht.",
    notSet: "Nicht festgelegt",
    notEstimated: "Nicht geschätzt",
    underManagerReview: "In Prüfung durch den Manager",
    notReady: "Nicht bereit",
    underReview: "In Prüfung",
    evidenceUnderReview: "Die Abdeckung der Nachweise wird vom Manager geprüft.",
    inventoryUnderReview: "Der Bestandsfortschritt wird vom Manager geprüft.",
    riskUnderReview: "Das operative Risiko wird vom Manager geprüft.",
    days: "Tage",
    availableAllocationProofs: "Verfügbare Allokationsnachweise",
    verifiedAllocationProofs: "Verifizierte Allokationsnachweise",
    noAvailableAllocationProofs: "In der Momentaufnahme sind keine verfügbaren Nachweiskategorien für diese Allokation vorhanden.",
    noVerifiedAllocationProofs: "In der Momentaufnahme sind keine verifizierten Nachweiskategorien für diese Allokation vorhanden."
  },
  zh: {
    shellEyebrow: "月度报告详情",
    shellDescription: "针对单份已发布运营报告的聚焦视图，包含报告备注以及存储快照中可用的凭证类别。",
    backToReports: "返回报告",
    createdLabel: "报告已创建",
    createdDetail: "月度报告记录已准备好接受审核。",
    updatedLabel: "报告已更新",
    updatedDetail: "该报告已由运营团队更新。",
    publishedLabel: "报告已发布",
    publishedDetail: "该报告已可供投资者查阅。",
    publishedWord: "已发布",
    afterManagerReview: "经理审核后",
    publishedBadge: "已发布",
    lifecycleTitle: "生命周期时间线",
    lifecycleDescription: "已发布报告的生命周期，不含内部审计细节。",
    proofSummaryTitle: "凭证摘要",
    proofSummaryDescription: "此处仅显示报告快照中可用且已核实的凭证类别。",
    availableProofs: "可用凭证",
    verifiedProofs: "已核实凭证",
    noAvailableProofs: "此报告快照中没有可用凭证。",
    noVerifiedProofs: "此报告快照中没有已核实凭证。",
    linkedAllocationTitle: "关联资金配置摘要",
    linkedAllocationDescription: "资金配置阶段和凭证类别读取自固定的报告快照，而非当前实时运营数据。",
    noAllocationSummary: "此报告快照中未包含资金配置摘要。",
    marketplaceOperations: "电商平台运营",
    snapshotUpdated: "快照已更新",
    summary: "摘要",
    performanceNote: "业绩备注",
    payoutNote: "派息备注",
    investedAmount: "投资金额",
    expectedCycle: "预计周期",
    estimatedResult: "预计结果",
    payoutState: "派息状态",
    proofHealth: "凭证健康度",
    evidenceSummary: "证据摘要",
    reconciliation: "对账",
    inventoryProgress: "库存进度",
    capitalReturned: "已返还资本",
    payoutStatus: "派息状态",
    riskVisibility: "风险透明度",
    riskSummary: "风险摘要",
    noPerformanceNote: "未发布业绩备注。",
    noPayoutNote: "未发布派息备注。",
    notSet: "未设置",
    notEstimated: "未估算",
    underManagerReview: "经理审核中",
    notReady: "未就绪",
    underReview: "审核中",
    evidenceUnderReview: "证据覆盖情况正由经理审核。",
    inventoryUnderReview: "库存进度正由经理审核。",
    riskUnderReview: "运营风险正由经理审核。",
    days: "天",
    availableAllocationProofs: "可用资金配置凭证",
    verifiedAllocationProofs: "已核实资金配置凭证",
    noAvailableAllocationProofs: "快照中没有此资金配置的可用凭证类别。",
    noVerifiedAllocationProofs: "快照中没有此资金配置的已核实凭证类别。"
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
  const t = getStrings(locale);
  const fmt = createAdminFormatters(locale);

  const formatMoney = (value: string | number | null | undefined, currency = "USD") => {
    const amount = Number(value || 0);
    if (!Number.isFinite(amount)) return "—";
    if (currency === "USD") return fmt.currency(amount);
    return `${currency} ${fmt.number(amount)}`;
  };

  const lifecycle = [
    { id: "created", label: t.createdLabel, at: report.createdAt, detail: t.createdDetail },
    { id: "updated", label: t.updatedLabel, at: report.updatedAt, detail: t.updatedDetail },
    ...(report.publishedAt ? [{ id: "published", label: t.publishedLabel, at: report.publishedAt, detail: t.publishedDetail }] : [])
  ].sort((left, right) => new Date(right.at).getTime() - new Date(left.at).getTime());

  return (
    <InvestorShell locale={locale} investor={investor} active="reports" eyebrow={t.shellEyebrow} title={report.title} description={t.shellDescription}>
      <div className="mb-6">
        <Link href={`/${locale}/investor/reports`} className="inline-flex items-center gap-3 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="size-4" />
          {t.backToReports}
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <Card className="rounded-[1.35rem] bg-card dark:bg-graphite-900/[0.72]">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>{report.month}</CardTitle>
                <CardDescription>{t.publishedWord} {report.publishedAt ? fmt.dateTime(report.publishedAt) : t.afterManagerReview}</CardDescription>
              </div>
              <Badge variant="secondary">{t.publishedBadge}</Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4">
            <ReportLine label={t.summary} value={report.summary} />
            <ReportLine label={t.performanceNote} value={report.performanceNote || t.noPerformanceNote} />
            <ReportLine label={t.payoutNote} value={report.payoutNote || t.noPayoutNote} />
          </CardContent>
        </Card>

        <Card className="rounded-[1.35rem] bg-card dark:bg-graphite-900/[0.72]">
          <CardHeader>
            <CardTitle>{t.lifecycleTitle}</CardTitle>
            <CardDescription>{t.lifecycleDescription}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {lifecycle.map((item) => (
              <div key={item.id} className="rounded-[1.35rem] border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 p-4">
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

      <Card className="mt-6 rounded-[1.35rem] bg-card dark:bg-graphite-900/[0.72]">
        <CardHeader>
          <CardTitle>{t.proofSummaryTitle}</CardTitle>
          <CardDescription>{t.proofSummaryDescription}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <ProofBreakdown locale={locale} title={t.availableProofs} summary={report.proofSummaryBreakdown.available} emptyText={t.noAvailableProofs} />
          <ProofBreakdown locale={locale} title={t.verifiedProofs} summary={report.proofSummaryBreakdown.verified} emptyText={t.noVerifiedProofs} />
        </CardContent>
      </Card>

      <Card className="mt-6 rounded-[1.35rem] bg-card dark:bg-graphite-900/[0.72]">
        <CardHeader>
          <CardTitle>{t.linkedAllocationTitle}</CardTitle>
          <CardDescription>{t.linkedAllocationDescription}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {report.allocationSnapshot.length === 0 ? (
            <div className="rounded-[1.35rem] border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 p-6 text-center text-sm text-muted-foreground">{t.noAllocationSummary}</div>
          ) : report.allocationSnapshot.map((allocation) => (
            <div key={allocation.id} className="rounded-[1.35rem] border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{allocation.supplyCode}</p>
                  <p className="mt-2 text-lg font-semibold text-foreground">{allocation.productName}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{allocation.marketplace || t.marketplaceOperations} · {t.snapshotUpdated} {fmt.dateTime(allocation.updatedAt)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge>{enumLabel("allocationStatus", allocation.status, locale)}</Badge>
                  <Badge variant="secondary">{enumLabel("riskLevel", allocation.riskLevel, locale)}</Badge>
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <ReportLine label={t.investedAmount} value={formatMoney(allocation.allocationAmount, allocation.currency)} privateValue />
                <ReportLine label={t.expectedCycle} value={allocation.expectedCycleDays ? `${allocation.expectedCycleDays} ${t.days}` : t.notSet} />
                <ReportLine label={t.estimatedResult} value={allocation.estimatedResult || t.notEstimated} privateValue={Boolean(allocation.estimatedResult)} />
                <ReportLine label={t.payoutState} value={enumLabel("payoutStatus", allocation.payoutStatus, locale)} />
                <ReportLine label={t.proofHealth} value={allocation.proofCompleteness ? `${enumLabel("proofCompletenessState", allocation.proofCompleteness.state, locale)} · ${allocation.proofCompleteness.score}%` : t.underManagerReview} />
                <ReportLine label={t.evidenceSummary} value={allocation.proofCompleteness ? localizeProofSummary(locale, allocation.proofCompleteness.state, allocation.proofCompleteness.score) : t.evidenceUnderReview} />
                <ReportLine label={t.reconciliation} value={allocation.reconciliation ? `${enumLabel("reconciliationState", allocation.reconciliation.status, locale)} · ${allocation.reconciliation.score}%` : t.underManagerReview} />
                <ReportLine label={t.inventoryProgress} value={allocation.reconciliation ? localizeInventoryProgress(locale, allocation.reconciliation.inventoryProgressSummary) : t.inventoryUnderReview} />
                <ReportLine label={t.capitalReturned} value={allocation.reconciliation ? formatMoney(allocation.reconciliation.capitalReturned, allocation.currency) : t.underReview} />
                <ReportLine label={t.payoutStatus} value={allocation.reconciliation ? localizePayoutStatus(locale, allocation.reconciliation.payoutStatus) : t.notReady} />
                <ReportLine label={t.riskVisibility} value={allocation.risk ? `${enumLabel("riskLevel", allocation.risk.level, locale)} · ${allocation.risk.score}/100` : t.underManagerReview} />
                <ReportLine label={t.riskSummary} value={allocation.risk ? localizeRiskSummary(locale, allocation.risk.level) : t.riskUnderReview} />
              </div>
              {allocation.reconciliation?.exceptionNotice ? <div className="mt-4 rounded-[1.35rem] border border-gold-200/20 bg-gold-300/20 dark:bg-gold-200/10 p-4 text-sm leading-6 text-amber-700 dark:text-gold-100">{localizeReconciliationNotice(locale, allocation.reconciliation.status)}</div> : null}
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <ProofBreakdown locale={locale} title={t.availableAllocationProofs} summary={allocation.proofSummaryBreakdown.available} emptyText={t.noAvailableAllocationProofs} />
                <ProofBreakdown locale={locale} title={t.verifiedAllocationProofs} summary={allocation.proofSummaryBreakdown.verified} emptyText={t.noVerifiedAllocationProofs} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </InvestorShell>
  );
}

function ReportLine({ label, value, privateValue = false }: { label: string; value: string; privateValue?: boolean }) {
  return (
    <div className="rounded-2xl border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 p-4">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p data-private-amount={privateValue || undefined} className="mt-2 text-sm leading-6 text-foreground">{value}</p>
    </div>
  );
}

function ProofBreakdown({ locale, title, summary, emptyText }: { locale: Locale; title: string; summary: ProofSummary; emptyText: string }) {
  const entries = proofEntries(summary);

  return (
    <div className="rounded-[1.35rem] border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 p-4">
      <div className="mb-4 flex items-center gap-2">
        <FileText className="size-4 text-amber-700 dark:text-gold-100" />
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

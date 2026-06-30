"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, Link2, RefreshCw, Save, Trash2 } from "lucide-react";
import type { Locale } from "@otiz/lib";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Separator } from "@otiz/ui";
import { AdminNavigation } from "./admin-navigation";

const ADMIN_CSRF_COOKIE = "admin_csrf_token";
const ADMIN_CSRF_HEADER = "x-csrf-token";
const RISK_TIMELINE_SOURCE_FILTERS = ["all", "manual_evaluation", "report_snapshot", "readiness_gate", "unknown"] as const;
const RISK_TIMELINE_LIMIT_OPTIONS = ["10", "20", "50", "100"] as const;

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

const moneyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const dateTimeFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

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

function formatAuditAction(action: string) {
  return action.toLowerCase().split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function buildLifecycle(report: MonthlyReportDetail, auditLogs: AuditLog[]) {
  const lifecycle = [
    { id: "created", label: "Report created", at: report.createdAt, detail: "Monthly report record created." },
    { id: "updated", label: "Report updated", at: report.updatedAt, detail: "Latest report metadata update." },
    ...(report.publishedAt ? [{ id: "published", label: "Report published", at: report.publishedAt, detail: "publishedAt recorded for investor visibility." }] : []),
    ...auditLogs.map((log) => ({
      id: log.id,
      label: formatAuditAction(log.action),
      at: log.createdAt,
      detail: `${log.actor} audit event`
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
  const lifecycle = buildLifecycle(currentReport, currentAuditLogs);
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
        throw new Error(responsePayload.error || "Unable to update monthly report.");
      }

      setCurrentReport((previous) => ({ ...previous, ...responsePayload.data, investor: previous.investor }));
      setNotice(successMessage);
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to update monthly report.");
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
    }, "Draft report saved.");
  }

  function publishReport() {
    void mutateReport("publish", { status: "PUBLISHED", acknowledgeWarnings }, "Report published to the investor.");
  }

  function unpublishReport() {
    void mutateReport("unpublish", { status: "DRAFT" }, "Report returned to draft.");
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
      if (!response.ok || !payload.ok || !payload.data) throw new Error(payload.error || "Unable to evaluate report readiness.");
      setCurrentReadiness(payload.data);
      setNotice("Report readiness evaluated.");
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to evaluate report readiness.");
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
      if (!response.ok || !responsePayload.ok || !responsePayload.data) throw new Error(responsePayload.error || "Unable to regenerate proof snapshot.");
      setCurrentReport((previous) => ({ ...previous, ...responsePayload.data, investor: previous.investor }));
      setNotice("Proof snapshot regenerated from linked allocations.");
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to regenerate proof snapshot.");
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
      if (!response.ok || !payload.ok || !payload.data) throw new Error(payload.error || "Unable to link allocation.");
      setCurrentLinkedAllocations((current) => [...current, payload.data as ReportAllocation]);
      setCurrentEligibleAllocations((current) => current.filter((item) => item.id !== allocation.id));
      setAllocationNotes((current) => ({ ...current, [allocation.id]: payload.data?.note || "" }));
      setNotice("Allocation linked. Regenerate the snapshot before publishing if this allocation should appear in the frozen report.");
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to link allocation.");
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
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Unable to remove linked allocation.");
      setCurrentLinkedAllocations((current) => current.filter((item) => item.allocationId !== link.allocationId));
      setCurrentEligibleAllocations((current) => [link.allocation, ...current]);
      setAllocationNotes((current) => {
        const next = { ...current };
        delete next[link.allocationId];
        return next;
      });
      setNotice("Allocation removed from draft report. Regenerate the snapshot before publishing.");
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to remove linked allocation.");
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
      if (!response.ok || !payload.ok || !payload.data) throw new Error(payload.error || "Unable to update allocation note.");
      setCurrentLinkedAllocations((current) => current.map((item) => (item.allocationId === link.allocationId ? payload.data as ReportAllocation : item)));
      setNotice("Linked allocation note updated.");
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to update allocation note.");
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
              Back to investor
            </Link>
            <AdminNavigation locale={locale} activeSection="investors" />
          </div>

          <Card className="mb-6 rounded-[2rem] bg-graphite-900/[0.78]">
            <CardContent className="grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-100">Monthly report detail</p>
                <h1 className="mt-3 font-display text-4xl tracking-[-0.04em] text-foreground md:text-5xl">{currentReport.title}</h1>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{currentReport.month} · {currentReport.investor.fullName} · {currentReport.investor.email}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge>{currentReport.status}</Badge>
                <Badge variant="secondary">{currentReport.publishedAt ? "Published" : "Not published"}</Badge>
              </div>
            </CardContent>
          </Card>

          {notice ? <AdminNotice tone="success" message={notice} /> : null}
          {error ? <AdminNotice tone="error" message={error} /> : null}

          <div className="grid gap-6 xl:grid-cols-[0.84fr_1.16fr]">
            <div className="grid gap-6">
              <Card id="readiness" className="rounded-[2rem] bg-graphite-900/[0.72]">
                <CardHeader>
                  <CardTitle>Report status</CardTitle>
                  <CardDescription>Admin visibility includes draft, published, and archived report records.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <Metric label="Status" value={currentReport.status} />
                  <Metric label="Report period" value={currentReport.month} />
                  <Metric label="Created" value={formatDateTime(currentReport.createdAt)} />
                  <Metric label="Updated" value={formatDateTime(currentReport.updatedAt)} />
                  <Metric label="Published" value={formatDateTime(currentReport.publishedAt)} />
                  <PublishGateNotice readiness={currentReadiness} />
                  {currentReadiness?.requiresAcknowledgment && canEditDraft ? (
                    <label className="flex items-start gap-3 rounded-[1.5rem] border border-white/10 bg-black/20 p-4 text-sm leading-6 text-muted-foreground">
                      <input type="checkbox" className="mt-1" checked={acknowledgeWarnings} onChange={(event) => setAcknowledgeWarnings(event.target.checked)} />
                      I have reviewed the non-blocking readiness warnings and approve publishing with this operational context.
                    </label>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" disabled={pendingAction !== null || currentReport.status === "PUBLISHED" || currentReadiness?.publishAllowed === false || Boolean(currentReadiness?.requiresAcknowledgment && !acknowledgeWarnings)} onClick={publishReport}>
                      {pendingAction === "publish" ? "Publishing..." : "Publish report"}
                    </Button>
                    <Button type="button" variant="outline" disabled={pendingAction !== null || currentReport.status !== "PUBLISHED"} onClick={unpublishReport}>
                      {pendingAction === "unpublish" ? "Returning..." : "Return to draft"}
                    </Button>
                  </div>
                  <p className="text-xs leading-5 text-muted-foreground">Published reports are read-only. Return to draft before editing fields or regenerating the proof snapshot.</p>
                </CardContent>
              </Card>

              <Card id="reconciliation" className="rounded-[2rem] bg-graphite-900/[0.72]">
                <CardHeader>
                  <CardTitle>Report Readiness</CardTitle>
                  <CardDescription>Operational publish gate for trust, completeness, and snapshot integrity.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  {currentReadiness ? (
                    <>
                      <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Readiness state</p>
                            <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground">{currentReadiness.state}</p>
                          </div>
                          <Badge>{currentReadiness.readinessPercentage}%</Badge>
                        </div>
                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                          <div className="h-full rounded-full bg-gold-200/70" style={{ width: `${currentReadiness.readinessPercentage}%` }} />
                        </div>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <Metric label="Linked allocations" value={String(currentReadiness.metrics.linkedAllocationCount)} />
                        <Metric label="Snapshot allocations" value={String(currentReadiness.metrics.snapshotAllocationCount)} />
                        <Metric label="Visible proofs" value={String(currentReadiness.metrics.visibleProofCount)} />
                        <Metric label="Excluded proofs" value={String(currentReadiness.metrics.excludedProofCount)} />
                        <Metric label="Completeness score" value={`${currentReadiness.metrics.proofCompletenessScore}%`} />
                        <Metric label="Snapshot generated" value={formatDateTime(currentReadiness.metrics.snapshotGeneratedAt)} />
                        <Metric label="Policy" value={currentReadiness.policySnapshot?.name || "Readiness policy"} />
                        <Metric label="Policy threshold" value={`${currentReadiness.policySnapshot?.minimumProofCompletenessScore ?? 50}%`} />
                      </div>
                      <Link href={`/${locale}/admin/settings/readiness-policy`} className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-100 hover:text-gold-50">
                        Manage readiness policy
                      </Link>
                      <ReadinessGroup title="Blocking issues" items={currentReadiness.blockingIssues} emptyText="No critical blocking issues." />
                      <ReadinessGroup title="Warnings" items={currentReadiness.warnings} emptyText="No readiness warnings." />
                      <ReadinessGroup title="Checklist" items={currentReadiness.checks} emptyText="No readiness checks available." showPassed />
                      <Button type="button" variant="outline" disabled={pendingAction !== null} onClick={refreshReadiness}>
                        {pendingAction === "readiness" ? "Evaluating..." : "Evaluate readiness"}
                      </Button>
                    </>
                  ) : (
                    <EmptyState text="Readiness evaluation is unavailable for this report." />
                  )}
                </CardContent>
              </Card>

              <Card id="risk" className="rounded-[2rem] bg-graphite-900/[0.72]">
                <CardHeader>
                  <CardTitle>Report reconciliation</CardTitle>
                  <CardDescription>Three-ledger status for linked allocations and the frozen report snapshot.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  {reconciliation ? (
                    <>
                      <div className="flex flex-wrap items-center gap-2"><Badge>{reconciliation.status}</Badge><Badge variant="secondary">{reconciliation.score}% score</Badge><Badge variant="secondary">{reconciliation.snapshotExists ? "Snapshot exists" : "No snapshot"}</Badge></div>
                      <Metric label="Linked allocation statuses" value={reconciliation.allocationSummaries.map((allocation) => `${allocation.supplyCode}: ${allocation.status}`).join(" · ") || "No linked allocations"} />
                      <IssueSummary title="Blocking issues" items={reconciliation.blockingIssues} emptyText="No blocking reconciliation issues." />
                      <IssueSummary title="Warnings" items={reconciliation.warnings} emptyText="No reconciliation warnings." />
                      <Button type="button" variant="outline" disabled={pendingAction !== null || !canEditDraft} onClick={regenerateSnapshot}>
                        <RefreshCw data-icon="inline-start" />
                        {pendingAction === "regenerate" ? "Regenerating..." : "Regenerate report snapshot"}
                      </Button>
                    </>
                  ) : (
                    <EmptyState text="Report reconciliation is unavailable." />
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-[2rem] bg-graphite-900/[0.72]">
                <CardHeader>
                  <CardTitle>Portfolio risk overview</CardTitle>
                  <CardDescription>Risk engine summary for linked allocations. Investor reports receive only the frozen safe summary.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  {risk ? (
                    <>
                      <div className="flex flex-wrap items-center gap-2"><Badge>{risk.portfolioRisk.level}</Badge><Badge variant="secondary">{risk.portfolioRisk.score}/100 risk score</Badge><Badge variant="secondary">Generated {formatDateTime(risk.generatedAt)}</Badge></div>
                      <Metric label="Admin summary" value={risk.portfolioRisk.adminSummary} />
                      <Metric label="High-risk allocations" value={risk.allocations.filter((allocation) => ["HIGH", "CRITICAL"].includes(allocation.investorSafeSummary.level)).map((allocation) => `${allocation.supplyCode}: ${allocation.investorSafeSummary.level}`).join(" · ") || "No high-risk linked allocations."} />
                      <IssueSummary title="Material risk events" items={risk.materialRiskEvents.map((event) => ({ id: `${event.allocationId}-${event.label}`, severity: event.severity === "CRITICAL" ? "BLOCKING" : "WARNING", message: `${event.category} · ${event.label}` }))} emptyText="No material risk events." />
                      <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Recommended actions</p>
                        <div className="mt-3 grid gap-2">{risk.portfolioRisk.recommendedActions.slice(0, 5).map((action) => <p key={action} className="rounded-2xl border border-white/10 bg-black/20 p-3 text-xs leading-5 text-muted-foreground">{action}</p>)}</div>
                      </div>
                    </>
                  ) : (
                    <EmptyState text="Portfolio risk summary is unavailable." />
                  )}
                </CardContent>
              </Card>

              <RiskTimelineCard title="Report risk timeline" description="Portfolio risk evaluation events recorded from explicit report snapshot regeneration." events={riskTimeline} endpoint={`/api/monthly-reports/${currentReport.id}/risk/timeline`} emptyText="No report risk evaluation events recorded yet." />

              <Card id="snapshots" className="rounded-[2rem] border-white/10 bg-graphite-900/[0.72]">
                <CardHeader>
                  <CardTitle>Snapshot controls</CardTitle>
                  <CardDescription>Proof snapshot regeneration is explicit and only available while the report is draft.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <Button type="button" variant="outline" disabled={pendingAction !== null || !canEditDraft} onClick={regenerateSnapshot}>
                    <RefreshCw data-icon="inline-start" />
                    {pendingAction === "regenerate" ? "Regenerating..." : "Regenerate proof snapshot"}
                  </Button>
                  <p className="text-xs leading-5 text-muted-foreground">{canEditDraft ? "This replaces the saved snapshot from current allocation proof metadata." : "Return the report to draft before regenerating the proof snapshot."}</p>
                </CardContent>
              </Card>

              <Card className="rounded-[2rem] bg-graphite-900/[0.72]">
                <CardHeader>
                  <CardTitle>Investor</CardTitle>
                  <CardDescription>Linked investor profile for this monthly report.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <Metric label="Name" value={currentReport.investor.fullName} />
                  <Metric label="Email" value={currentReport.investor.email} />
                  <Metric label="Telegram" value={currentReport.investor.telegram || "Not set"} />
                  <Metric label="Investor status" value={currentReport.investor.status} />
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6">
              <Card className="rounded-[2rem] bg-graphite-900/[0.72]">
                <CardHeader>
                  <CardTitle>Edit draft report</CardTitle>
                  <CardDescription>Financial fields remain admin-written notes. Published reports are frozen until returned to draft.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <TextField label="Report period" value={draft.month} disabled={!canEditDraft} onChange={(value) => setDraft((current) => ({ ...current, month: value }))} />
                  <TextField label="Title" value={draft.title} disabled={!canEditDraft} onChange={(value) => setDraft((current) => ({ ...current, title: value }))} />
                  <TextArea label="Summary" value={draft.summary} disabled={!canEditDraft} onChange={(value) => setDraft((current) => ({ ...current, summary: value }))} />
                  <TextArea label="Performance note" value={draft.performanceNote} disabled={!canEditDraft} onChange={(value) => setDraft((current) => ({ ...current, performanceNote: value }))} />
                  <TextArea label="Payout note" value={draft.payoutNote} disabled={!canEditDraft} onChange={(value) => setDraft((current) => ({ ...current, payoutNote: value }))} />
                  <div className="flex flex-wrap items-center gap-3">
                    <Button type="button" disabled={pendingAction !== null || !canEditDraft} onClick={saveDraft}>
                      <Save data-icon="inline-start" />
                      {pendingAction === "save" ? "Saving..." : "Save draft"}
                    </Button>
                    {!canEditDraft ? <span className="text-xs text-muted-foreground">Return to draft before editing report fields.</span> : null}
                  </div>
                  <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Internal admin note</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">Not available on the MonthlyReport model yet. No fake note action is rendered.</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-[2rem] bg-graphite-900/[0.72]">
                <CardHeader>
                  <CardTitle>Linked allocations</CardTitle>
                  <CardDescription>Explicit supply allocations included in this draft report. Investor snapshots are generated only from these links.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  {currentLinkedAllocations.length === 0 ? (
                    <EmptyState text="No allocations linked yet. Add eligible allocations before regenerating the report snapshot." />
                  ) : currentLinkedAllocations.map((link) => (
                    <div key={link.id} className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{link.allocation.supplyCode}</p>
                          <Link href={`/${locale}/admin/allocations/${link.allocationId}`} className="mt-2 block text-lg font-semibold text-foreground transition-colors hover:text-gold-100">{link.allocation.productName}</Link>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">Included by {link.includedBy} on {formatDateTime(link.includedAt)}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge>{link.allocation.status}</Badge>
                          <Badge variant="secondary">{link.allocation.riskLevel}</Badge>
                        </div>
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-4">
                        <Metric label="Invested" value={formatMoney(link.allocation.allocationAmount, link.allocation.currency)} />
                        <Metric label="Expected result" value={link.allocation.estimatedResult || "-"} />
                        <Metric label="Visible proofs" value={String(link.allocation.investorVisibleProofCount)} />
                        <Metric label="Proof total" value={String(link.allocation.proofCount)} />
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-end">
                        <TextField label="Admin linkage note" value={allocationNotes[link.allocationId] || ""} disabled={!canEditDraft} onChange={(value) => setAllocationNotes((current) => ({ ...current, [link.allocationId]: value }))} />
                        <Button type="button" variant="outline" disabled={pendingAction !== null || !canEditDraft} onClick={() => saveAllocationNote(link)}>
                          {pendingAction === `note-${link.allocationId}` ? "Saving..." : "Save note"}
                        </Button>
                        <Button type="button" variant="outline" disabled={pendingAction !== null || !canEditDraft} onClick={() => removeAllocation(link)}>
                          <Trash2 data-icon="inline-start" />
                          {pendingAction === `remove-${link.allocationId}` ? "Removing..." : "Remove"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="rounded-[2rem] bg-graphite-900/[0.72]">
                <CardHeader>
                  <CardTitle>Eligible allocations</CardTitle>
                  <CardDescription>Allocations for this investor that are not yet linked to the report.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  {currentEligibleAllocations.length === 0 ? (
                    <EmptyState text="No eligible allocations available for this report." />
                  ) : currentEligibleAllocations.map((allocation) => (
                    <div key={allocation.id} className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{allocation.supplyCode}</p>
                          <p className="mt-2 text-lg font-semibold text-foreground">{allocation.productName}</p>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">{allocation.marketplace || "Marketplace not set"}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge>{allocation.status}</Badge>
                          <Badge variant="secondary">{allocation.riskLevel}</Badge>
                        </div>
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-4">
                        <Metric label="Invested" value={formatMoney(allocation.allocationAmount, allocation.currency)} />
                        <Metric label="Expected result" value={allocation.estimatedResult || "-"} />
                        <Metric label="Visible proofs" value={String(allocation.investorVisibleProofCount)} />
                        <Metric label="Proof total" value={String(allocation.proofCount)} />
                      </div>
                      <div className="mt-4">
                        <Button type="button" variant="outline" disabled={pendingAction !== null || !canEditDraft} onClick={() => addAllocation(allocation)}>
                          <Link2 data-icon="inline-start" />
                          {pendingAction === `add-${allocation.id}` ? "Adding..." : "Add allocation to report"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="rounded-[2rem] bg-graphite-900/[0.72]">
                <CardHeader>
                  <CardTitle>Proof snapshot</CardTitle>
                  <CardDescription>Read from MonthlyReport.proofSummaryJson. This page does not recalculate current allocation proofs.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                  <ProofBreakdown title="Available proofs" summary={currentReport.proofSummaryBreakdown.available} emptyText="No available proofs in snapshot." />
                  <ProofBreakdown title="Verified proofs" summary={currentReport.proofSummaryBreakdown.verified} emptyText="No verified proofs in snapshot." />
                  <ProofBreakdown title="Excluded / not counted" summary={currentReport.proofSummaryBreakdown.excluded} emptyText="No excluded proof categories in snapshot." />
                </CardContent>
              </Card>

              <Card className="rounded-[2rem] bg-graphite-900/[0.72]">
                <CardHeader>
                  <CardTitle>Frozen allocation snapshot</CardTitle>
                  <CardDescription>Saved allocation state from the last explicit snapshot regeneration. This is what investor report detail reads.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  {currentReport.allocationSnapshot.length === 0 ? (
                    <EmptyState text="No allocation summary exists in the current snapshot." />
                  ) : currentReport.allocationSnapshot.map((allocation) => (
                    <div key={allocation.id} className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{allocation.supplyCode}</p>
                          <p className="mt-2 font-semibold text-foreground">{allocation.productName}</p>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">Snapshot updated {formatDateTime(allocation.updatedAt)}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge>{allocation.status}</Badge>
                          <Badge variant="secondary">{allocation.riskLevel}</Badge>
                        </div>
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-4">
                        <Metric label="Invested" value={formatMoney(allocation.allocationAmount, allocation.currency)} />
                        <Metric label="Expected result" value={allocation.estimatedResult || "-"} />
                        <Metric label="Available proofs" value={String(Object.values(allocation.proofSummaryBreakdown.available).reduce((sum, count) => sum + count, 0))} />
                        <Metric label="Verified proofs" value={String(Object.values(allocation.proofSummaryBreakdown.verified).reduce((sum, count) => sum + count, 0))} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="rounded-[2rem] bg-graphite-900/[0.72]">
                <CardHeader>
                  <CardTitle>Lifecycle timeline</CardTitle>
                  <CardDescription>Report lifecycle and available audit events.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                  {lifecycle.length === 0 ? (
                    <EmptyState text="No lifecycle events recorded." />
                  ) : lifecycle.map((item) => (
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
    <div className={`mb-6 rounded-[1.5rem] border p-4 text-sm ${tone === "success" ? "border-gold-200/25 bg-gold-200/10 text-gold-100" : "border-white/10 bg-black/30 text-foreground"}`}>
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

function PublishGateNotice({ readiness }: { readiness: ReadinessEvaluation | null }) {
  if (!readiness) {
    return <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4 text-sm leading-6 text-muted-foreground">Evaluate readiness before publishing this report.</div>;
  }

  const message =
    readiness.state === "READY"
      ? "This report passed all required operational checks."
      : readiness.state === "READY_WITH_WARNINGS"
        ? "This report contains non-blocking warnings. Review carefully before publishing."
        : readiness.state === "NEEDS_REVIEW"
          ? "This report needs manager review. Publishing requires explicit acknowledgment."
          : "Publishing blocked until critical report integrity issues are resolved.";

  return (
    <div className="rounded-[1.5rem] border border-gold-200/20 bg-gold-200/10 p-4 text-sm leading-6 text-gold-100">
      {message}
    </div>
  );
}

function ReadinessGroup({ title, items, emptyText, showPassed = false }: { title: string; items: ReadinessIssue[]; emptyText: string; showPassed?: boolean }) {
  const visibleItems = showPassed ? items : items.filter((item) => !item.passed);

  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {visibleItems.length === 0 ? (
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{emptyText}</p>
      ) : (
        <div className="mt-3 grid gap-2">
          {visibleItems.map((item) => (
            <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">{item.label}</p>
                <Badge variant={item.passed ? "secondary" : "default"}>{item.passed ? "Passed" : item.severity}</Badge>
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
  return <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-6 text-center text-sm text-muted-foreground">{text}</div>;
}

function formatRiskSource(source: string) {
  if (source === "all") return "All";
  const label = source.replace(/_/g, " ").toLowerCase();
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function RiskTimelineSelectField({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-12 rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-foreground outline-none">
        {options.map((option) => <option key={option} value={option} className="bg-graphite-900">{label === "Source" ? formatRiskSource(option) : option}</option>)}
      </select>
    </label>
  );
}

function RiskTimelineCard({ title, description, events: initialEvents, endpoint, emptyText }: { title: string; description: string; events: RiskTimelineEvent[]; endpoint: string; emptyText: string }) {
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
        throw new Error(payload?.error || "Unable to load risk timeline.");
      }

      setEvents(payload.data.events);
    } catch (error) {
      setFilterError(error instanceof Error ? error.message : "Unable to load risk timeline.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="rounded-[2rem] bg-graphite-900/[0.72]">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_160px_120px]">
            <RiskTimelineSelectField label="Source" value={filters.source} options={RISK_TIMELINE_SOURCE_FILTERS} onChange={(value) => void reloadTimeline({ ...filters, source: value as RiskTimelineSourceFilter })} />
            <RiskTimelineSelectField label="Limit" value={filters.limit} options={RISK_TIMELINE_LIMIT_OPTIONS} onChange={(value) => void reloadTimeline({ ...filters, limit: value })} />
            <div className="flex items-end">
              <Badge variant="secondary" className="h-12 rounded-2xl px-4">{isLoading ? "Loading..." : `${events.length} shown`}</Badge>
            </div>
          </div>
          {filterError ? <p className="mt-3 text-sm leading-6 text-gold-100">{filterError}</p> : null}
        </div>
        {events.length === 0 ? (
          <EmptyState text={emptyText} />
        ) : events.map((event) => (
          <div key={event.id} className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{event.summary}</p>
                  {event.risk ? <Badge>{event.risk.level}</Badge> : null}
                  {event.risk ? <Badge variant="secondary">{event.risk.score}/100</Badge> : null}
                </div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">{formatRiskSource(event.source)} · {event.actor}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => setExpandedEventId((current) => current === event.id ? null : event.id)}>Details</Button>
                <span className="text-xs text-muted-foreground">{formatDateTime(event.createdAt)}</span>
              </div>
            </div>
            {expandedEventId === event.id ? <RiskTimelineEventDetailsPanel event={event} /> : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function RiskTimelineEventDetailsPanel({ event }: { event: RiskTimelineEvent }) {
  const details = event.details;
  const hasDiff = Boolean(details.currentLevel || details.currentScore !== null || details.previousLevel || details.previousScore !== null || details.newFactors.length || details.resolvedFactors.length || details.newBlockingIssues.length || details.resolvedBlockingIssues.length);

  if (!hasDiff) {
    return <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-muted-foreground">No detailed diff stored for this event.</div>;
  }

  return (
    <div className="mt-3 rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
      <div className="grid gap-3 md:grid-cols-4">
        <RiskTimelineDetail label="Level" value={`${formatRiskDetailValue(details.previousLevel)} -> ${formatRiskDetailValue(details.currentLevel)}`} />
        <RiskTimelineDetail label="Score" value={`${formatRiskDetailValue(details.previousScore)} -> ${formatRiskDetailValue(details.currentScore)}`} />
        <RiskTimelineDetail label="Source" value={formatRiskSource(details.source)} />
        <RiskTimelineDetail label="Actor" value={details.actor} />
      </div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">{details.summary}</p>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <RiskTimelineFactors title="New factors" items={details.newFactors} />
        <RiskTimelineFactors title="Resolved factors" items={details.resolvedFactors} />
        <RiskTimelineFactors title="New blocking issues" items={details.newBlockingIssues} />
        <RiskTimelineFactors title="Resolved blocking issues" items={details.resolvedBlockingIssues} />
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

function RiskTimelineFactors({ title, items }: { title: string; items: RiskTimelineFactor[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{title}</p>
      {items.length === 0 ? (
        <p className="mt-2 text-xs leading-5 text-muted-foreground">None</p>
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
    <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
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

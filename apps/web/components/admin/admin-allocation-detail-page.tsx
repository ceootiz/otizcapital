"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, FileText, PackageCheck, Save } from "lucide-react";
import type { Locale } from "@otiz/lib";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Separator } from "@otiz/ui";

const ADMIN_CSRF_COOKIE = "admin_csrf_token";
const ADMIN_CSRF_HEADER = "x-csrf-token";
const ALLOCATION_STATUSES = ["DRAFT", "PURCHASING", "SHIPPING", "RECEIVED", "SELLING", "COMPLETED", "CANCELED", "LOSS"] as const;
const PROOF_TYPES = ["SHIPMENT_PROOF", "WAREHOUSE_MEDIA", "MARKETPLACE_REPORT", "PURCHASE_INVOICE", "PAYOUT_PROOF", "SERIAL_VERIFICATION", "OTHER"] as const;
const PROOF_STATUSES = ["PENDING", "AVAILABLE", "VERIFIED", "HIDDEN"] as const;
const PAYOUT_STATUSES = ["NOT_READY", "PENDING", "APPROVED", "PAID", "REINVESTED"] as const;
const REINVEST_DECISIONS = ["UNDECIDED", "REINVEST", "PAYOUT"] as const;
const RISK_LEVELS = ["STANDARD", "MONITORED", "ELEVATED"] as const;
const LEDGER_TYPES = ["INVENTORY", "CASH", "INVESTOR_LIABILITY"] as const;
const LEDGER_ENTRY_OPTIONS = {
  INVENTORY: ["UNITS_PURCHASED", "UNITS_RECEIVED", "UNITS_SOLD", "UNITS_RETURNED", "UNITS_REMAINING_ADJUSTMENT"],
  CASH: ["INVESTOR_CASH_IN", "SUPPLIER_PAYMENT", "LOGISTICS_COST", "MARKETPLACE_SETTLEMENT", "MARKETPLACE_FEE", "REFUND", "PAYOUT", "REINVESTMENT"],
  INVESTOR_LIABILITY: ["CAPITAL_ALLOCATED", "PROFIT_ACCRUED", "PAYOUT_APPROVED", "PAYOUT_PAID", "REINVESTED", "LOSS_RECOGNIZED", "LIABILITY_ADJUSTMENT"]
} as const;
const LEDGER_SOURCE_TYPES = ["ALLOCATION", "WITHDRAWAL_REQUEST", "MONTHLY_REPORT", "MANUAL_ADJUSTMENT", "MARKETPLACE_SETTLEMENT", "PROOF_ARTIFACT", "OTHER"] as const;
const LEDGER_REVERSAL_STATUS_OPTIONS = ["ALL", "ORIGINAL_ONLY", "REVERSALS_ONLY", "REVERSED_ONLY", "CORRECTED_ONLY"] as const;
const ALL_LEDGER_ENTRY_OPTIONS = [...LEDGER_ENTRY_OPTIONS.INVENTORY, ...LEDGER_ENTRY_OPTIONS.CASH, ...LEDGER_ENTRY_OPTIONS.INVESTOR_LIABILITY] as const;
const RISK_TIMELINE_SOURCE_FILTERS = ["all", "manual_evaluation", "report_snapshot", "readiness_gate", "unknown"] as const;
const RISK_TIMELINE_LIMIT_OPTIONS = ["10", "20", "50", "100"] as const;

type Proof = { id: string; allocationId: string; type: string; title: string; description: string | null; proofUrl: string | null; status: string; createdAt: string; updatedAt: string };
type ProofCompleteness = {
  score: number;
  state: string;
  presentCategories: string[];
  missingRequiredCategories: string[];
  missingRecommendedCategories: string[];
  hiddenProofCount: number;
  rejectedProofCount: number;
  unreviewedProofCount: number;
  supersededProofCount: number;
  investorSafeSummary: string;
  adminWarnings: string[];
  policyThreshold: number;
};
type ProofRequirementGuideItem = {
  componentKey: string;
  displayName: string;
  acceptedProofTypes: string[];
  policyStatus: "Required" | "Recommended" | "Optional";
  investorVisibleExplanation: string;
  adminInstruction: string;
  acceptableMetadataExamples: string[];
  commonMistakes: string[];
};
type ReconciliationException = { id: string; severity: "BLOCKING" | "WARNING"; message: string };
type RiskFactor = { id: string; category: string; severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"; label: string; description: string; investorVisible: boolean };
type RiskSummary = {
  score: number;
  level: "LOW" | "MODERATE" | "ELEVATED" | "HIGH" | "CRITICAL";
  riskFactors: RiskFactor[];
  blockingIssues: RiskFactor[];
  warnings: RiskFactor[];
  investorSafeSummary: { score: number; level: string; summary: string; visibleFactors: string[] };
  adminSummary: string;
  recommendedActions: string[];
};
type RiskTimelineFactor = { id: string; category: string; severity: string; label: string };
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
type RiskTimelineSourceFilter = (typeof RISK_TIMELINE_SOURCE_FILTERS)[number];
type RiskTimelineFilters = { source: RiskTimelineSourceFilter; limit: string };
type LedgerEntryRow = {
  id: string;
  ledgerType: string;
  allocationId: string | null;
  investorId: string | null;
  monthlyReportId: string | null;
  entryType: string;
  amount: string;
  currency: string;
  quantity: number | null;
  unitCost: string | null;
  occurredAt: string;
  sourceType: string;
  sourceId: string | null;
  description: string;
  metadataJson: string | null;
  createdBy: string;
  isReversal: boolean;
  reversesLedgerEntryId: string | null;
  reversalReason: string | null;
  correctedByLedgerEntryId: string | null;
  voidedAt: string | null;
  voidedBy: string | null;
  createdAt: string;
  updatedAt: string;
};
type ReconciliationSummary = {
  status: "BALANCED" | "WARNING" | "BROKEN";
  score: number;
  blockingIssues: ReconciliationException[];
  warnings: ReconciliationException[];
  metrics: { entryCount: number; latestEntryAt: string | null };
  ledgerSummary: {
    inventory: { purchased: number; received: number; sold: number; returned: number; remainingAdjustment: number; remaining: number; inventoryVariance: number };
    cash: { cashIn: number; supplierPayments: number; logisticsCosts: number; marketplaceSettlements: number; marketplaceFees: number; refunds: number; payouts: number; reinvestments: number; netCashPosition: number };
    investorLiability: { capitalAllocated: number; profitAccrued: number; payoutsApproved: number; payoutsPaid: number; reinvested: number; lossesRecognized: number; liabilityAdjustments: number; liabilityOutstanding: number; deferredUnpaidShare: number };
  };
  latestLedgerEntries: LedgerEntryRow[];
};
type LedgerEntryAuditTrailRecord = Omit<LedgerEntryRow, "metadataJson"> & {
  metadataPreview: string | null;
  statusFlags: { isOriginal: boolean; isReversal: boolean; isReversed: boolean; isCorrected: boolean };
};
type LedgerEntryAuditTrail = {
  requestedEntry: LedgerEntryAuditTrailRecord;
  originalEntry: LedgerEntryAuditTrailRecord;
  reversalEntries: LedgerEntryAuditTrailRecord[];
  correctionEntry: LedgerEntryAuditTrailRecord | null;
  auditEvents: Array<{ id: string; actor: string; action: string; entityType: string; entityId: string; beforePreview: string | null; afterPreview: string | null; createdAt: string }>;
};
type AllocationDetail = {
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
  proofs: Proof[];
  proofCompleteness: ProofCompleteness | null;
  proofRequirementsGuide: ProofRequirementGuideItem[];
  reconciliation: ReconciliationSummary | null;
  risk: RiskSummary | null;
};
type AuditLog = { id: string; action: string; createdAt: string; actor: string };
type NotificationEvent = { id: string; type: string; status: string; createdAt: string };

type AllocationDraft = { status: string; payoutStatus: string; reinvestDecision: string; marketplace: string; allocationAmount: string; expectedCycleDays: string; expectedPayoutAt: string; riskLevel: string; estimatedResult: string; actualProfit: string; notes: string };
type ProofDraft = { type: string; title: string; description: string; proofUrl: string; status: string };
type LedgerType = (typeof LEDGER_TYPES)[number];
type LedgerReversalStatus = (typeof LEDGER_REVERSAL_STATUS_OPTIONS)[number];
type LedgerEntryDraft = { ledgerType: LedgerType; entryType: string; amount: string; currency: string; quantity: string; unitCost: string; occurredAt: string; sourceType: string; sourceId: string; description: string; metadataJson: string };
type LedgerFilterDraft = { ledgerType: "ALL" | LedgerType; entryType: string; sourceType: string; reversalStatus: LedgerReversalStatus; dateFrom: string; dateTo: string; minAmount: string; maxAmount: string; query: string; limit: string };
type LedgerFilterView = { entries: LedgerEntryRow[]; appliedFilters: Record<string, string | number | null> };

const moneyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

function getCookieValue(name: string) {
  if (typeof document === "undefined") return "";
  return document.cookie.split("; ").find((cookie) => cookie.startsWith(`${name}=`))?.split("=").slice(1).join("=") || "";
}
function getAdminMutationHeaders() { return { "Content-Type": "application/json", [ADMIN_CSRF_HEADER]: getCookieValue(ADMIN_CSRF_COOKIE) }; }
function formatMoney(value: string | number | null | undefined) { const amount = Number(value || 0); return moneyFormatter.format(Number.isFinite(amount) ? amount : 0); }
function formatDate(value: string | null) { if (!value) return "-"; const date = new Date(value); return Number.isNaN(date.getTime()) ? "-" : dateFormatter.format(date); }
function getGuideStatusRank(status: ProofRequirementGuideItem["policyStatus"]) { return status === "Required" ? 0 : status === "Recommended" ? 1 : 2; }
function isGuideItemMissing(item: ProofRequirementGuideItem, missingEvidence: Set<string>) { return missingEvidence.has(item.componentKey) || item.acceptedProofTypes.some((proofType) => missingEvidence.has(proofType)); }
function formatAcceptedProofTypes(types: string[]) { return types.length ? types.join(", ") : "No proof placeholder; use report linkage."; }
function createDefaultLedgerEntryDraft(): LedgerEntryDraft { return { ledgerType: "INVENTORY", entryType: "UNITS_PURCHASED", amount: "0", currency: "USD", quantity: "", unitCost: "", occurredAt: "", sourceType: "MANUAL_ADJUSTMENT", sourceId: "", description: "", metadataJson: "" }; }
function createDefaultLedgerFilterDraft(): LedgerFilterDraft { return { ledgerType: "ALL", entryType: "ALL", sourceType: "ALL", reversalStatus: "ALL", dateFrom: "", dateTo: "", minAmount: "", maxAmount: "", query: "", limit: "50" }; }
function getLedgerEntryOptions(ledgerType: string) { return LEDGER_ENTRY_OPTIONS[ledgerType as LedgerType] ?? LEDGER_ENTRY_OPTIONS.INVENTORY; }
function getLedgerFilterEntryOptions(ledgerType: string) { return ledgerType === "ALL" ? ALL_LEDGER_ENTRY_OPTIONS : getLedgerEntryOptions(ledgerType); }
function buildLedgerFilterSearchParams(filters: LedgerFilterDraft) {
  const params = new URLSearchParams();
  if (filters.ledgerType !== "ALL") params.set("ledgerType", filters.ledgerType);
  if (filters.entryType !== "ALL") params.set("entryType", filters.entryType);
  if (filters.sourceType !== "ALL") params.set("sourceType", filters.sourceType);
  if (filters.reversalStatus !== "ALL") params.set("reversalStatus", filters.reversalStatus);
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  if (filters.minAmount) params.set("minAmount", filters.minAmount);
  if (filters.maxAmount) params.set("maxAmount", filters.maxAmount);
  if (filters.query.trim()) params.set("query", filters.query.trim());
  if (filters.limit) params.set("limit", filters.limit);
  return params;
}
function validateLedgerEntryDraft(draft: LedgerEntryDraft) {
  if (!draft.ledgerType) return "ledgerType is required.";
  if (!draft.entryType) return "entryType is required.";
  if (!draft.occurredAt) return "occurredAt is required.";
  if ((draft.ledgerType === "CASH" || draft.ledgerType === "INVESTOR_LIABILITY") && !draft.amount.trim()) return "amount is required for cash and investor liability entries.";
  if (draft.amount.trim() && !draft.currency.trim()) return "currency is required when amount is provided.";
  if (draft.amount.trim() && !Number.isFinite(Number(draft.amount))) return "amount must be numeric.";
  if (draft.ledgerType === "INVENTORY" && !draft.quantity.trim()) return "quantity is required for inventory entries.";
  if (draft.quantity.trim() && !Number.isFinite(Number(draft.quantity))) return "quantity must be numeric.";
  if (draft.quantity.trim() && Number(draft.quantity) < 0 && draft.entryType !== "UNITS_REMAINING_ADJUSTMENT") return "quantity cannot be negative unless entryType is UNITS_REMAINING_ADJUSTMENT.";
  if (!draft.description.trim()) return "description is required.";
  if (draft.metadataJson.trim()) {
    try { JSON.parse(draft.metadataJson); } catch { return "metadataJson must be valid JSON."; }
  }
  return null;
}

export function AdminAllocationDetailPage({ locale, allocation: initialAllocation, auditLogs, notificationEvents, riskTimeline }: { locale: Locale; allocation: AllocationDetail; auditLogs: AuditLog[]; notificationEvents: NotificationEvent[]; riskTimeline: RiskTimelineEvent[] }) {
  const [allocation, setAllocation] = React.useState(initialAllocation);
  const [currentRiskTimeline, setCurrentRiskTimeline] = React.useState(riskTimeline);
  const [draft, setDraft] = React.useState<AllocationDraft>({
    status: initialAllocation.status,
    payoutStatus: initialAllocation.payoutStatus,
    reinvestDecision: initialAllocation.reinvestDecision,
    marketplace: initialAllocation.marketplace || "",
    allocationAmount: initialAllocation.allocationAmount,
    expectedCycleDays: initialAllocation.expectedCycleDays ? String(initialAllocation.expectedCycleDays) : "",
    expectedPayoutAt: initialAllocation.expectedPayoutAt ? initialAllocation.expectedPayoutAt.slice(0, 10) : "",
    riskLevel: initialAllocation.riskLevel,
    estimatedResult: initialAllocation.estimatedResult || "",
    actualProfit: initialAllocation.actualProfit || "",
    notes: initialAllocation.notes || ""
  });
  const [proofDraft, setProofDraft] = React.useState<ProofDraft>({ type: "SHIPMENT_PROOF", title: "", description: "", proofUrl: "", status: "PENDING" });
  const [ledgerDraft, setLedgerDraft] = React.useState<LedgerEntryDraft>(() => createDefaultLedgerEntryDraft());
  const [ledgerFilters, setLedgerFilters] = React.useState<LedgerFilterDraft>(() => createDefaultLedgerFilterDraft());
  const [ledgerFilterView, setLedgerFilterView] = React.useState<LedgerFilterView | null>(null);
  const [reversalDraft, setReversalDraft] = React.useState<{ entryId: string; reason: string } | null>(null);
  const [auditTrailState, setAuditTrailState] = React.useState<{ entryId: string; isLoading: boolean; data: LedgerEntryAuditTrail | null; error: string | null } | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isCreatingProof, setIsCreatingProof] = React.useState(false);
  const [isCreatingLedgerEntry, setIsCreatingLedgerEntry] = React.useState(false);
  const [isFilteringLedgerEntries, setIsFilteringLedgerEntries] = React.useState(false);
  const [isReversingLedgerEntry, setIsReversingLedgerEntry] = React.useState(false);
  const [isEvaluatingRisk, setIsEvaluatingRisk] = React.useState(false);
  const [updatingProofId, setUpdatingProofId] = React.useState<string | null>(null);
  const missingEvidence = React.useMemo(() => new Set([...(allocation.proofCompleteness?.missingRequiredCategories ?? []), ...(allocation.proofCompleteness?.missingRecommendedCategories ?? [])]), [allocation.proofCompleteness]);
  const sortedProofRequirementsGuide = React.useMemo(() => [...allocation.proofRequirementsGuide].sort((first, second) => {
    const firstMissing = isGuideItemMissing(first, missingEvidence);
    const secondMissing = isGuideItemMissing(second, missingEvidence);
    if (firstMissing !== secondMissing) return firstMissing ? -1 : 1;
    const statusRank = getGuideStatusRank(first.policyStatus) - getGuideStatusRank(second.policyStatus);
    if (statusRank !== 0) return statusRank;
    return first.displayName.localeCompare(second.displayName);
  }), [allocation.proofRequirementsGuide, missingEvidence]);
  const missingRequirementGuideItems = sortedProofRequirementsGuide.filter((item) => isGuideItemMissing(item, missingEvidence));
  const visibleLedgerEntries = ledgerFilterView?.entries ?? allocation.reconciliation?.latestLedgerEntries ?? [];
  const ledgerExportHref = React.useMemo(() => {
    const params = buildLedgerFilterSearchParams(ledgerFilters).toString();
    return `/api/allocations/${allocation.id}/reconciliation/export${params ? `?${params}` : ""}`;
  }, [allocation.id, ledgerFilters]);

  async function saveAllocation() {
    setIsSaving(true); setNotice(null); setError(null);
    try {
      const response = await fetch(`/api/allocations/${allocation.id}`, { method: "PATCH", headers: getAdminMutationHeaders(), body: JSON.stringify({ ...draft, expectedCycleDays: draft.expectedCycleDays ? Number(draft.expectedCycleDays) : null, expectedPayoutAt: draft.expectedPayoutAt || null }) });
      const payload = (await response.json()) as { ok: boolean; data?: AllocationDetail; error?: string };
      if (!response.ok || !payload.ok || !payload.data) throw new Error(payload.error || "Unable to update allocation.");
      setAllocation((current) => ({ ...current, ...payload.data, proofs: current.proofs, investor: current.investor }));
      setNotice("Allocation updated.");
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to update allocation."); }
    finally { setIsSaving(false); }
  }

  async function createProof() {
    setIsCreatingProof(true); setNotice(null); setError(null);
    try {
      const response = await fetch(`/api/allocations/${allocation.id}/proofs`, { method: "POST", headers: getAdminMutationHeaders(), body: JSON.stringify(proofDraft) });
      const payload = (await response.json()) as { ok: boolean; data?: Proof; error?: string };
      if (!response.ok || !payload.ok || !payload.data) throw new Error(payload.error || "Unable to create proof.");
      setAllocation((current) => ({ ...current, proofs: [payload.data as Proof, ...current.proofs] }));
      setProofDraft({ type: "SHIPMENT_PROOF", title: "", description: "", proofUrl: "", status: "PENDING" });
      setNotice("Proof placeholder created.");
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to create proof."); }
    finally { setIsCreatingProof(false); }
  }

  async function createLedgerEntry() {
    const validationError = validateLedgerEntryDraft(ledgerDraft);
    if (validationError) {
      setError(validationError);
      setNotice(null);
      return;
    }

    setIsCreatingLedgerEntry(true); setNotice(null); setError(null);
    try {
      const response = await fetch(`/api/allocations/${allocation.id}/reconciliation`, {
        method: "POST",
        headers: getAdminMutationHeaders(),
        body: JSON.stringify({
          ledgerType: ledgerDraft.ledgerType,
          entryType: ledgerDraft.entryType,
          amount: ledgerDraft.amount.trim() || "0",
          currency: ledgerDraft.currency.trim() || "USD",
          quantity: ledgerDraft.quantity.trim() ? Number(ledgerDraft.quantity) : null,
          unitCost: ledgerDraft.unitCost.trim() || null,
          occurredAt: ledgerDraft.occurredAt,
          sourceType: ledgerDraft.sourceType,
          sourceId: ledgerDraft.sourceId.trim() || null,
          description: ledgerDraft.description.trim(),
          metadataJson: ledgerDraft.metadataJson.trim() || null
        })
      });
      const payload = (await response.json()) as { ok: boolean; data?: { reconciliation?: ReconciliationSummary }; error?: string };
      if (!response.ok || !payload.ok || !payload.data?.reconciliation) throw new Error(payload.error || "Unable to create ledger entry.");
      setAllocation((current) => ({ ...current, reconciliation: payload.data?.reconciliation ?? current.reconciliation }));
      setLedgerFilterView(null);
      setLedgerDraft(createDefaultLedgerEntryDraft());
      setNotice("Ledger entry created and reconciliation refreshed.");
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to create ledger entry."); }
    finally { setIsCreatingLedgerEntry(false); }
  }

  async function reverseLedgerEntry(entryId: string) {
    const reversalReason = reversalDraft?.entryId === entryId ? reversalDraft.reason.trim() : "";
    if (!reversalReason) {
      setError("reversalReason is required.");
      setNotice(null);
      return;
    }

    setIsReversingLedgerEntry(true); setNotice(null); setError(null);
    try {
      const response = await fetch(`/api/allocations/${allocation.id}/reconciliation/${entryId}/reverse`, {
        method: "POST",
        headers: getAdminMutationHeaders(),
        body: JSON.stringify({ reversalReason })
      });
      const payload = (await response.json()) as { ok: boolean; data?: { reconciliation?: ReconciliationSummary }; error?: string };
      if (!response.ok || !payload.ok || !payload.data?.reconciliation) throw new Error(payload.error || "Unable to reverse ledger entry.");
      setAllocation((current) => ({ ...current, reconciliation: payload.data?.reconciliation ?? current.reconciliation }));
      setLedgerFilterView(null);
      setReversalDraft(null);
      setNotice("Ledger entry reversed and reconciliation refreshed.");
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to reverse ledger entry."); }
    finally { setIsReversingLedgerEntry(false); }
  }

  async function toggleLedgerAuditTrail(entryId: string) {
    if (auditTrailState?.entryId === entryId && !auditTrailState.isLoading) {
      setAuditTrailState(null);
      return;
    }

    setAuditTrailState({ entryId, isLoading: true, data: null, error: null });
    try {
      const response = await fetch(`/api/allocations/${allocation.id}/reconciliation/${entryId}/audit-trail`);
      const payload = (await response.json()) as { ok: boolean; data?: LedgerEntryAuditTrail; error?: string };
      if (!response.ok || !payload.ok || !payload.data) throw new Error(payload.error || "Unable to load audit trail.");
      setAuditTrailState({ entryId, isLoading: false, data: payload.data, error: null });
    } catch (requestError) {
      setAuditTrailState({ entryId, isLoading: false, data: null, error: requestError instanceof Error ? requestError.message : "Unable to load audit trail." });
    }
  }

  async function applyLedgerFilters() {
    setIsFilteringLedgerEntries(true); setNotice(null); setError(null);
    try {
      const params = buildLedgerFilterSearchParams(ledgerFilters);
      const response = await fetch(`/api/allocations/${allocation.id}/reconciliation?${params.toString()}`);
      const payload = (await response.json()) as { ok: boolean; data?: { reconciliation?: ReconciliationSummary; filteredLedgerEntries?: LedgerEntryRow[]; appliedFilters?: Record<string, string | number | null> }; error?: string };
      if (!response.ok || !payload.ok || !payload.data?.reconciliation || !payload.data.filteredLedgerEntries || !payload.data.appliedFilters) throw new Error(payload.error || "Unable to filter ledger entries.");
      setAllocation((current) => ({ ...current, reconciliation: payload.data?.reconciliation ?? current.reconciliation }));
      setLedgerFilterView({ entries: payload.data.filteredLedgerEntries, appliedFilters: payload.data.appliedFilters });
      setAuditTrailState(null);
      setNotice("Ledger filters applied.");
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to filter ledger entries."); }
    finally { setIsFilteringLedgerEntries(false); }
  }

  async function evaluateRiskNow() {
    setIsEvaluatingRisk(true); setNotice(null); setError(null);
    try {
      const response = await fetch(`/api/allocations/${allocation.id}/risk/evaluate`, { method: "POST", headers: getAdminMutationHeaders() });
      const payload = (await response.json()) as { ok: boolean; data?: { risk?: RiskSummary; audit?: { eventCount: number; summary: string } }; error?: string };
      if (!response.ok || !payload.ok || !payload.data?.risk) throw new Error(payload.error || "Unable to evaluate risk.");

      const timelineResponse = await fetch(`/api/allocations/${allocation.id}/risk/timeline?limit=20`);
      const timelinePayload = (await timelineResponse.json()) as { ok: boolean; data?: { events: RiskTimelineEvent[] }; error?: string };
      if (!timelineResponse.ok || !timelinePayload.ok || !timelinePayload.data?.events) throw new Error(timelinePayload.error || "Unable to refresh risk timeline.");

      setAllocation((current) => ({ ...current, risk: payload.data?.risk ?? current.risk }));
      setCurrentRiskTimeline(timelinePayload.data.events);
      setNotice(payload.data.audit?.summary ? `Risk evaluated. ${payload.data.audit.summary}` : "Risk evaluated and timeline refreshed.");
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to evaluate risk."); }
    finally { setIsEvaluatingRisk(false); }
  }

  function clearLedgerFilters() {
    setLedgerFilters(createDefaultLedgerFilterDraft());
    setLedgerFilterView(null);
    setAuditTrailState(null);
    setNotice("Ledger filters cleared.");
    setError(null);
  }

  async function runAllocationAction(payload: Record<string, unknown>, message: string) {
    setIsSaving(true); setNotice(null); setError(null);
    try {
      const response = await fetch(`/api/allocations/${allocation.id}`, { method: "PATCH", headers: getAdminMutationHeaders(), body: JSON.stringify(payload) });
      const responsePayload = (await response.json()) as { ok: boolean; data?: AllocationDetail; error?: string };
      if (!response.ok || !responsePayload.ok || !responsePayload.data) throw new Error(responsePayload.error || "Unable to update allocation.");
      setAllocation((current) => ({ ...current, ...responsePayload.data, proofs: current.proofs, investor: current.investor }));
      setDraft((current) => ({
        ...current,
        status: responsePayload.data?.status ?? current.status,
        riskLevel: responsePayload.data?.riskLevel ?? current.riskLevel,
        actualProfit: responsePayload.data?.actualProfit ?? current.actualProfit
      }));
      setNotice(message);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to update allocation."); }
    finally { setIsSaving(false); }
  }

  async function updateProof(proof: Proof, payload: Partial<Proof>) {
    setUpdatingProofId(proof.id); setNotice(null); setError(null);
    try {
      const response = await fetch(`/api/allocation-proofs/${proof.id}`, { method: "PATCH", headers: getAdminMutationHeaders(), body: JSON.stringify(payload) });
      const responsePayload = (await response.json()) as { ok: boolean; data?: Proof; error?: string };
      if (!response.ok || !responsePayload.ok || !responsePayload.data) throw new Error(responsePayload.error || "Unable to update proof.");
      setAllocation((current) => ({ ...current, proofs: current.proofs.map((item) => item.id === responsePayload.data?.id ? responsePayload.data : item) }));
      setNotice("Proof updated.");
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to update proof."); }
    finally { setUpdatingProofId(null); }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground micro-noise">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(212,175,95,0.14),transparent_34rem),radial-gradient(circle_at_86%_10%,rgba(255,255,255,0.07),transparent_28rem)]" />
      <div className="macro-grid absolute inset-0 opacity-45" />
      <section className="relative z-10 py-8 sm:py-10"><div className="container">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link href={`/${locale}/admin/investors/${allocation.investorId}`} className="inline-flex items-center gap-3 text-sm text-muted-foreground transition-colors hover:text-foreground"><ArrowLeft className="size-4" />Back to investor</Link>
          <div className="flex gap-2"><Badge>{allocation.status}</Badge><Badge variant="secondary">{allocation.payoutStatus}</Badge><Badge variant="secondary">{allocation.reinvestDecision}</Badge></div>
        </div>
        <Card className="mb-6 rounded-[2rem] bg-graphite-900/[0.78]"><CardContent className="grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-100">Allocation detail</p><h1 className="mt-3 font-display text-4xl tracking-[-0.04em] text-foreground md:text-5xl">{allocation.supplyCode}</h1><p className="mt-3 text-sm leading-7 text-muted-foreground">{allocation.productName} · {allocation.investor.fullName}</p></div><div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Amount</p><p className="mt-2 text-2xl font-semibold text-foreground">{formatMoney(allocation.allocationAmount)}</p></div></CardContent></Card>
        {notice ? <AdminNotice tone="success" message={notice} /> : null}{error ? <AdminNotice tone="error" message={error} /> : null}
        <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
          <div className="grid gap-6">
            <Card className="rounded-[2rem] bg-graphite-900/[0.72]"><CardHeader><CardTitle>Allocation overview</CardTitle><CardDescription>Operational state and manager-controlled payout/reinvest metadata.</CardDescription></CardHeader><CardContent className="grid gap-4"><Metric label="Investor" value={`${allocation.investor.fullName} · ${allocation.investor.email}`} /><Metric label="Marketplace" value={allocation.marketplace || "Not set"} /><Metric label="Expected cycle" value={allocation.expectedCycleDays ? `${allocation.expectedCycleDays} days` : "Not set"} /><Metric label="Expected payout" value={formatDate(allocation.expectedPayoutAt)} /><Metric label="Risk level" value={allocation.riskLevel} /><Metric label="Estimated result" value={allocation.estimatedResult || "Not set"} /><Metric label="Actual profit" value={allocation.actualProfit ? formatMoney(allocation.actualProfit) : "Not booked"} /><Metric label="Started / completed" value={`${formatDate(allocation.startedAt)} / ${formatDate(allocation.completedAt)}`} /></CardContent></Card>
            <Card id="proofs" className="rounded-[2rem] bg-graphite-900/[0.72]">
              <CardHeader><CardTitle>Proof completeness</CardTitle><CardDescription>Evidence score from investor-visible proofs, policy requirements, and report linkage.</CardDescription></CardHeader>
              <CardContent className="grid gap-4">
                {allocation.proofCompleteness ? <>
                  <Metric label="Score" value={`${allocation.proofCompleteness.score}% / ${allocation.proofCompleteness.policyThreshold}% threshold`} />
                  <Metric label="State" value={allocation.proofCompleteness.state} />
                  <Metric label="Present categories" value={allocation.proofCompleteness.presentCategories.join(", ") || "None"} />
                  <Metric label="Missing required" value={allocation.proofCompleteness.missingRequiredCategories.join(", ") || "None"} />
                  <Metric label="Missing recommended" value={allocation.proofCompleteness.missingRecommendedCategories.slice(0, 6).join(", ") || "None"} />
                  <Metric label="Hidden / rejected / unreviewed" value={`${allocation.proofCompleteness.hiddenProofCount} / ${allocation.proofCompleteness.rejectedProofCount} / ${allocation.proofCompleteness.unreviewedProofCount}`} />
                  {missingRequirementGuideItems.length ? <div className="rounded-2xl border border-gold-200/20 bg-gold-200/10 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-100">How to satisfy this requirement</p>
                    <div className="mt-3 grid gap-3">
                      {missingRequirementGuideItems.slice(0, 3).map((item) => <div key={item.componentKey} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                        <div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold text-foreground">{item.displayName}</p><Badge variant="secondary">{item.policyStatus}</Badge></div>
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">Accepted proof types: {formatAcceptedProofTypes(item.acceptedProofTypes)}</p>
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">Expected metadata: {item.acceptableMetadataExamples.slice(0, 4).join(", ")}</p>
                        <p className="mt-2 text-xs leading-5 text-gold-100">Investor visibility: {item.investorVisibleExplanation}</p>
                      </div>)}
                    </div>
                  </div> : null}
                  {allocation.proofCompleteness.adminWarnings.length ? <div className="rounded-2xl border border-gold-200/20 bg-gold-200/10 p-4 text-xs leading-5 text-gold-100">{allocation.proofCompleteness.adminWarnings.slice(0, 4).join(" ")}</div> : null}
                </> : <Metric label="State" value="Not evaluated" />}
              </CardContent>
            </Card>
            <Card id="risk" className="rounded-[2rem] bg-graphite-900/[0.72]">
              <CardHeader><CardTitle>Proof requirements guide</CardTitle><CardDescription>Operator guide for V2 proof score components. Missing evidence is shown first.</CardDescription></CardHeader>
              <CardContent className="grid gap-3">
                {sortedProofRequirementsGuide.map((item) => {
                  const isMissing = isGuideItemMissing(item, missingEvidence);
                  return <div key={item.componentKey} className={`rounded-[1.5rem] border p-4 ${isMissing ? "border-gold-200/30 bg-gold-200/10" : "border-white/10 bg-black/20"}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div><p className="text-sm font-semibold text-foreground">{item.displayName}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">Accepted proof types: {formatAcceptedProofTypes(item.acceptedProofTypes)}</p></div>
                      <div className="flex flex-wrap gap-2"><Badge variant={item.policyStatus === "Optional" ? "secondary" : undefined}>{item.policyStatus}</Badge>{isMissing ? <Badge variant="secondary">Missing</Badge> : null}</div>
                    </div>
                    <p className="mt-3 text-xs leading-5 text-muted-foreground">{item.adminInstruction}</p>
                    <div className="mt-3 grid gap-2 rounded-2xl border border-white/10 bg-black/20 p-3 text-xs leading-5 text-muted-foreground">
                      <p><span className="text-foreground">Metadata:</span> {item.acceptableMetadataExamples.slice(0, 4).join(", ")}</p>
                      <p><span className="text-foreground">Common mistakes:</span> {item.commonMistakes.slice(0, 3).join(", ")}</p>
                    </div>
                  </div>;
                })}
              </CardContent>
            </Card>
            <Card id="reconciliation" className="rounded-[2rem] bg-graphite-900/[0.72]">
              <CardHeader><CardTitle>Risk engine</CardTitle><CardDescription>Operational risk layer across inventory, cash, proof, payout, reconciliation, and concentration controls.</CardDescription></CardHeader>
              <CardContent className="grid gap-4">
                {allocation.risk ? <>
                  <div className="flex flex-wrap items-center gap-2"><Badge>{allocation.risk.level}</Badge><Badge variant="secondary">{allocation.risk.score}/100 risk score</Badge><Badge variant="secondary">{allocation.risk.riskFactors.length} factor(s)</Badge></div>
                  <Metric label="Admin summary" value={allocation.risk.adminSummary} />
                  <Metric label="Investor-safe summary" value={allocation.risk.investorSafeSummary.summary} />
                  <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs leading-5 text-muted-foreground">Records a new risk evaluation event using current ledger, proof, payout, and reconciliation data.</p>
                      <Button type="button" size="sm" onClick={evaluateRiskNow} disabled={isEvaluatingRisk}>{isEvaluatingRisk ? "Evaluating..." : "Evaluate risk now"}</Button>
                    </div>
                  </div>
                  <RiskFactorList title="Blocking risk issues" items={allocation.risk.blockingIssues} emptyText="No critical allocation risk issues." />
                  <RiskFactorList title="Risk warnings" items={allocation.risk.warnings} emptyText="No operational risk warnings." />
                  <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Recommended actions</p>
                    <div className="mt-3 grid gap-2">{allocation.risk.recommendedActions.slice(0, 5).map((action) => <p key={action} className="rounded-2xl border border-white/10 bg-black/20 p-3 text-xs leading-5 text-muted-foreground">{action}</p>)}</div>
                  </div>
                </> : <Metric label="State" value="Risk engine unavailable" />}
              </CardContent>
            </Card>
            <RiskTimelineCard title="Risk timeline" description="Risk evaluation events recorded from report snapshots or explicit admin evaluation." events={currentRiskTimeline} endpoint={`/api/allocations/${allocation.id}/risk/timeline`} emptyText="No risk evaluation events recorded for this allocation yet." />
            <Card className="rounded-[2rem] bg-graphite-900/[0.72]">
              <CardHeader><CardTitle>Reconciliation</CardTitle><CardDescription>Three-ledger control view for inventory, cash, and investor liability.</CardDescription></CardHeader>
              <CardContent className="grid gap-4">
                {allocation.reconciliation ? <>
                  <div className="flex flex-wrap items-center gap-2"><Badge>{allocation.reconciliation.status}</Badge><Badge variant="secondary">{allocation.reconciliation.score}% score</Badge><Badge variant="secondary">{allocation.reconciliation.metrics.entryCount} ledger entries</Badge></div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Metric label="Inventory" value={`${allocation.reconciliation.ledgerSummary.inventory.purchased} purchased · ${allocation.reconciliation.ledgerSummary.inventory.received} received · ${allocation.reconciliation.ledgerSummary.inventory.sold} sold · ${allocation.reconciliation.ledgerSummary.inventory.remaining} remaining`} />
                    <Metric label="Cash net position" value={formatMoney(allocation.reconciliation.ledgerSummary.cash.netCashPosition)} />
                    <Metric label="Investor liability outstanding" value={formatMoney(allocation.reconciliation.ledgerSummary.investorLiability.liabilityOutstanding)} />
                    <Metric label="Latest ledger entry" value={formatDate(allocation.reconciliation.metrics.latestEntryAt)} />
                  </div>
                  <ReconciliationIssueList title="Blocking issues" items={allocation.reconciliation.blockingIssues} emptyText="No blocking reconciliation issues." />
                  <ReconciliationIssueList title="Warnings" items={allocation.reconciliation.warnings} emptyText="No reconciliation warnings." />
                  <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Ledger filters</p>
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">Manager search over ledger entries. Exports use the current filter fields. Reconciliation totals remain based on the full ledger. CSV exports are audit logged.</p>
                      </div>
                      {ledgerFilterView ? <Badge variant="secondary">{ledgerFilterView.entries.length} filtered entries</Badge> : <Badge variant="secondary">Showing latest entries</Badge>}
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <SelectField label="Ledger type" value={ledgerFilters.ledgerType} options={["ALL", ...LEDGER_TYPES]} onChange={(value) => setLedgerFilters((current) => {
                        const entryOptions = getLedgerFilterEntryOptions(value);
                        return { ...current, ledgerType: value as LedgerFilterDraft["ledgerType"], entryType: current.entryType === "ALL" || entryOptions.includes(current.entryType as never) ? current.entryType : "ALL" };
                      })} />
                      <SelectField label="Entry type" value={ledgerFilters.entryType} options={["ALL", ...getLedgerFilterEntryOptions(ledgerFilters.ledgerType)]} onChange={(value) => setLedgerFilters((current) => ({ ...current, entryType: value }))} />
                      <SelectField label="Source type" value={ledgerFilters.sourceType} options={["ALL", ...LEDGER_SOURCE_TYPES]} onChange={(value) => setLedgerFilters((current) => ({ ...current, sourceType: value }))} />
                      <SelectField label="Reversal status" value={ledgerFilters.reversalStatus} options={LEDGER_REVERSAL_STATUS_OPTIONS} onChange={(value) => setLedgerFilters((current) => ({ ...current, reversalStatus: value as LedgerReversalStatus }))} />
                      <TextField label="Date from" type="date" value={ledgerFilters.dateFrom} onChange={(value) => setLedgerFilters((current) => ({ ...current, dateFrom: value }))} />
                      <TextField label="Date to" type="date" value={ledgerFilters.dateTo} onChange={(value) => setLedgerFilters((current) => ({ ...current, dateTo: value }))} />
                      <TextField label="Min amount" value={ledgerFilters.minAmount} onChange={(value) => setLedgerFilters((current) => ({ ...current, minAmount: value }))} />
                      <TextField label="Max amount" value={ledgerFilters.maxAmount} onChange={(value) => setLedgerFilters((current) => ({ ...current, maxAmount: value }))} />
                      <TextField label="Limit" value={ledgerFilters.limit} onChange={(value) => setLedgerFilters((current) => ({ ...current, limit: value }))} />
                      <div className="md:col-span-3"><TextField label="Search description/source ID" value={ledgerFilters.query} onChange={(value) => setLedgerFilters((current) => ({ ...current, query: value }))} /></div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button type="button" size="sm" onClick={applyLedgerFilters} disabled={isFilteringLedgerEntries}>{isFilteringLedgerEntries ? "Filtering..." : "Apply filters"}</Button>
                      <Button type="button" size="sm" variant="outline" onClick={clearLedgerFilters} disabled={isFilteringLedgerEntries}>Clear filters</Button>
                      <a href={ledgerExportHref} className="inline-flex h-9 items-center justify-center rounded-full border border-white/10 bg-black/20 px-4 text-sm font-medium text-foreground transition-colors hover:bg-white/10">Export CSV</a>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{ledgerFilterView ? "Filtered ledger entries" : "Latest ledger entries"}</p>
                    {visibleLedgerEntries.length === 0 ? <p className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-muted-foreground">{ledgerFilterView ? "No ledger entries match the current filters." : "No ledger entries recorded yet."}</p> : visibleLedgerEntries.slice(0, 50).map((entry) => {
                      const isSelectedForReversal = reversalDraft?.entryId === entry.id;
                      const canReverse = !entry.isReversal && !entry.voidedAt;
                      return <div key={entry.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-foreground">{entry.entryType}</p>
                              {entry.isReversal ? <Badge variant="secondary">Reversal</Badge> : null}
                              {entry.voidedAt ? <Badge variant="secondary">Reversed</Badge> : null}
                              {entry.correctedByLedgerEntryId ? <Badge variant="secondary">Corrected</Badge> : null}
                            </div>
                            <p className="mt-2 text-xs leading-5 text-muted-foreground">{entry.ledgerType} · {entry.description}</p>
                            {entry.isReversal && entry.reversesLedgerEntryId ? <p className="mt-2 text-xs leading-5 text-gold-100">Reverses entry {entry.reversesLedgerEntryId}</p> : null}
                            {entry.voidedAt && !entry.isReversal ? <p className="mt-2 text-xs leading-5 text-gold-100">Voided {formatDate(entry.voidedAt)} by {entry.voidedBy || "admin"}.</p> : null}
                            {entry.correctedByLedgerEntryId ? <p className="mt-2 text-xs leading-5 text-gold-100">Corrected by entry {entry.correctedByLedgerEntryId}</p> : null}
                          </div>
                          <div className="text-right text-xs text-muted-foreground"><p>{formatMoney(entry.amount)}</p><p>{entry.quantity ?? "-"} units</p></div>
                        </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <Button type="button" size="sm" variant="outline" onClick={() => toggleLedgerAuditTrail(entry.id)}>{auditTrailState?.entryId === entry.id ? "Hide audit trail" : "Audit trail"}</Button>
                            {canReverse && !isSelectedForReversal ? <Button type="button" size="sm" variant="outline" onClick={() => setReversalDraft({ entryId: entry.id, reason: "" })}>Reverse entry</Button> : null}
                          </div>
                          {auditTrailState?.entryId === entry.id ? <LedgerAuditTrailPanel state={auditTrailState} /> : null}
                          {canReverse && isSelectedForReversal ? <div className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-black/20 p-3">
                            <p className="text-xs leading-5 text-muted-foreground">This does not edit history. It creates an offsetting reversal entry.</p>
                            <textarea value={reversalDraft.reason} onChange={(event) => setReversalDraft({ entryId: entry.id, reason: event.target.value })} className="min-h-20 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-foreground outline-none" placeholder="Reason for reversal" />
                            <div className="flex flex-wrap gap-2">
                              <Button type="button" size="sm" onClick={() => reverseLedgerEntry(entry.id)} disabled={isReversingLedgerEntry}>{isReversingLedgerEntry ? "Reversing..." : "Confirm reversal"}</Button>
                              <Button type="button" size="sm" variant="outline" onClick={() => setReversalDraft(null)} disabled={isReversingLedgerEntry}>Cancel</Button>
                            </div>
                          </div> : null}
                      </div>;
                    })}
                  </div>
                </> : <Metric label="State" value="Reconciliation not evaluated" />}
              </CardContent>
            </Card>
            <Card className="rounded-[2rem] bg-graphite-900/[0.72]"><CardHeader><CardTitle>Status timeline</CardTitle><CardDescription>Calm operational lifecycle for this supply allocation.</CardDescription></CardHeader><CardContent><div className="grid gap-3">{["DRAFT", "PURCHASING", "SHIPPING", "RECEIVED", "SELLING", "COMPLETED"].map((step) => <div key={step} className={`rounded-2xl border p-3 text-sm ${step === allocation.status ? "border-gold-200/35 bg-gold-200/10 text-gold-100" : "border-white/10 bg-black/20 text-muted-foreground"}`}>{step}</div>)}</div></CardContent></Card>
            <Card className="rounded-[2rem] bg-graphite-900/[0.72]"><CardHeader><CardTitle>Audit and notifications</CardTitle><CardDescription>Recent internal control events.</CardDescription></CardHeader><CardContent className="grid gap-3"><Metric label="Audit events" value={String(auditLogs.length)} /><Metric label="Notification events" value={String(notificationEvents.length)} />{auditLogs.slice(0, 4).map((log) => <Metric key={log.id} label={log.action} value={`${formatDate(log.createdAt)} · ${log.actor}`} />)}</CardContent></Card>
          </div>
          <div className="grid gap-6">
            <Card className="rounded-[2rem] bg-graphite-900/[0.72]"><CardHeader><CardTitle>Edit allocation</CardTitle><CardDescription>No automatic profit calculation or payment movement happens here.</CardDescription></CardHeader><CardContent className="grid gap-4 md:grid-cols-2"><SelectField label="Status" value={draft.status} options={ALLOCATION_STATUSES} onChange={(value) => setDraft((current) => ({ ...current, status: value }))} /><SelectField label="Risk level" value={draft.riskLevel} options={RISK_LEVELS} onChange={(value) => setDraft((current) => ({ ...current, riskLevel: value }))} /><SelectField label="Payout status" value={draft.payoutStatus} options={PAYOUT_STATUSES} onChange={(value) => setDraft((current) => ({ ...current, payoutStatus: value }))} /><SelectField label="Reinvest decision" value={draft.reinvestDecision} options={REINVEST_DECISIONS} onChange={(value) => setDraft((current) => ({ ...current, reinvestDecision: value }))} /><TextField label="Marketplace" value={draft.marketplace} onChange={(value) => setDraft((current) => ({ ...current, marketplace: value }))} /><TextField label="Amount" value={draft.allocationAmount} onChange={(value) => setDraft((current) => ({ ...current, allocationAmount: value }))} /><TextField label="Expected days" value={draft.expectedCycleDays} onChange={(value) => setDraft((current) => ({ ...current, expectedCycleDays: value }))} /><TextField label="Expected payout" type="date" value={draft.expectedPayoutAt} onChange={(value) => setDraft((current) => ({ ...current, expectedPayoutAt: value }))} /><TextField label="Estimated result" value={draft.estimatedResult} onChange={(value) => setDraft((current) => ({ ...current, estimatedResult: value }))} /><TextField label="Actual profit" value={draft.actualProfit} onChange={(value) => setDraft((current) => ({ ...current, actualProfit: value }))} /><label className="grid gap-2 md:col-span-2"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Notes</span><textarea value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} className="min-h-24 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-foreground outline-none" /></label><div className="flex flex-wrap gap-2 md:col-span-2"><Button type="button" onClick={saveAllocation} disabled={isSaving}><Save data-icon="inline-start" />{isSaving ? "Saving..." : "Save allocation"}</Button><Button type="button" variant="outline" disabled={isSaving} onClick={() => runAllocationAction({ action: "mark-completed", actualProfit: draft.actualProfit || null }, "Allocation marked completed.")}>Mark completed</Button><Button type="button" variant="outline" disabled={isSaving} onClick={() => runAllocationAction({ action: "mark-loss", notes: draft.notes || "Marked as loss by admin." }, "Allocation marked loss.")}>Mark loss</Button></div></CardContent></Card>
            <Card className="rounded-[2rem] bg-graphite-900/[0.72]"><CardHeader><CardTitle>Investor-visible preview</CardTitle><CardDescription>Admin notes, hidden proof counts, raw risk factors, and audit history are not exposed to investors.</CardDescription></CardHeader><CardContent className="grid gap-3 md:grid-cols-2"><Metric label="Product" value={allocation.productName} /><Metric label="Stage" value={allocation.status} /><Metric label="Risk" value={allocation.risk?.investorSafeSummary.level || allocation.riskLevel} /><Metric label="Expected payout" value={formatDate(allocation.expectedPayoutAt)} /><Metric label="Proof health" value={allocation.proofCompleteness ? `${allocation.proofCompleteness.state} · ${allocation.proofCompleteness.score}%` : "Under manager review"} /><Metric label="Investor summary" value={allocation.proofCompleteness?.investorSafeSummary || "Evidence coverage is under manager review."} /><Metric label="Risk summary" value={allocation.risk?.investorSafeSummary.summary || "Operational risk is under manager review."} /></CardContent></Card>
            <Card className="rounded-[2rem] bg-graphite-900/[0.72]">
              <CardHeader><CardTitle>Add ledger entry</CardTitle><CardDescription>Ledger entries update three-ledger reconciliation. This records metadata only; no banking, marketplace, or payout execution happens here.</CardDescription></CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <SelectField label="Ledger type" value={ledgerDraft.ledgerType} options={LEDGER_TYPES} onChange={(value) => setLedgerDraft((current) => { const ledgerType = value as LedgerType; return { ...current, ledgerType, entryType: getLedgerEntryOptions(ledgerType)[0] ?? "" }; })} />
                <SelectField label="Entry type" value={ledgerDraft.entryType} options={getLedgerEntryOptions(ledgerDraft.ledgerType)} onChange={(value) => setLedgerDraft((current) => ({ ...current, entryType: value }))} />
                <TextField label="Amount" value={ledgerDraft.amount} onChange={(value) => setLedgerDraft((current) => ({ ...current, amount: value }))} />
                <TextField label="Currency" value={ledgerDraft.currency} onChange={(value) => setLedgerDraft((current) => ({ ...current, currency: value.toUpperCase() }))} />
                <TextField label="Quantity" value={ledgerDraft.quantity} onChange={(value) => setLedgerDraft((current) => ({ ...current, quantity: value }))} />
                <TextField label="Unit cost" value={ledgerDraft.unitCost} onChange={(value) => setLedgerDraft((current) => ({ ...current, unitCost: value }))} />
                <TextField label="Occurred at" type="datetime-local" value={ledgerDraft.occurredAt} onChange={(value) => setLedgerDraft((current) => ({ ...current, occurredAt: value }))} />
                <SelectField label="Source type" value={ledgerDraft.sourceType} options={LEDGER_SOURCE_TYPES} onChange={(value) => setLedgerDraft((current) => ({ ...current, sourceType: value }))} />
                <TextField label="Source ID" value={ledgerDraft.sourceId} onChange={(value) => setLedgerDraft((current) => ({ ...current, sourceId: value }))} />
                <label className="grid gap-2 md:col-span-2"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Description</span><textarea value={ledgerDraft.description} onChange={(event) => setLedgerDraft((current) => ({ ...current, description: event.target.value }))} className="min-h-20 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-foreground outline-none" placeholder="Operational source note for this ledger entry." /></label>
                <label className="grid gap-2 md:col-span-2"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Metadata JSON</span><textarea value={ledgerDraft.metadataJson} onChange={(event) => setLedgerDraft((current) => ({ ...current, metadataJson: event.target.value }))} className="min-h-20 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 font-mono text-xs leading-6 text-foreground outline-none" placeholder='{\"reference\":\"masked-source-id\"}' /></label>
                <div className="md:col-span-2"><Button type="button" onClick={createLedgerEntry} disabled={isCreatingLedgerEntry}>{isCreatingLedgerEntry ? "Creating..." : "Create ledger entry"}</Button></div>
              </CardContent>
            </Card>
            <Card className="rounded-[2rem] bg-graphite-900/[0.72]"><CardHeader><CardTitle>Create proof placeholder</CardTitle><CardDescription>Metadata only. No file upload or external storage.</CardDescription></CardHeader><CardContent className="grid gap-4 md:grid-cols-2"><SelectField label="Type" value={proofDraft.type} options={PROOF_TYPES} onChange={(value) => setProofDraft((current) => ({ ...current, type: value }))} /><SelectField label="Status" value={proofDraft.status} options={PROOF_STATUSES} onChange={(value) => setProofDraft((current) => ({ ...current, status: value }))} /><TextField label="Title" value={proofDraft.title} onChange={(value) => setProofDraft((current) => ({ ...current, title: value }))} /><TextField label="Proof URL" value={proofDraft.proofUrl} onChange={(value) => setProofDraft((current) => ({ ...current, proofUrl: value }))} /><label className="grid gap-2 md:col-span-2"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Description</span><textarea value={proofDraft.description} onChange={(event) => setProofDraft((current) => ({ ...current, description: event.target.value }))} className="min-h-20 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-foreground outline-none" /></label><div className="md:col-span-2"><Button type="button" onClick={createProof} disabled={isCreatingProof}><FileText data-icon="inline-start" />{isCreatingProof ? "Creating..." : "Create proof"}</Button></div></CardContent></Card>
            <Card className="rounded-[2rem] bg-graphite-900/[0.72]"><CardHeader><CardTitle>Proof list</CardTitle><CardDescription>Shipment, warehouse, marketplace, invoice, payout, and serial verification placeholders.</CardDescription></CardHeader><CardContent className="grid gap-3">{allocation.proofs.length === 0 ? <EmptyState /> : allocation.proofs.map((proof) => <div key={proof.id} className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{proof.type}</p><p className="mt-2 font-semibold text-foreground">{proof.title}</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{proof.description || "No description."}</p>{proof.proofUrl ? <p className="mt-2 break-words text-xs text-gold-100">{proof.proofUrl}</p> : null}</div><Badge>{proof.status}</Badge></div><Separator className="my-4" /><div className="flex flex-wrap gap-2">{PROOF_STATUSES.map((status) => <Button key={status} type="button" variant="outline" size="sm" disabled={updatingProofId === proof.id || proof.status === status} onClick={() => updateProof(proof, { status })}>{status}</Button>)}</div></div>)}</CardContent></Card>
          </div>
        </div>
      </div></section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p><p className="mt-2 text-sm leading-6 text-foreground">{value}</p></div>; }
function TextField({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { return <label className="grid gap-2"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="h-12 rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-foreground outline-none" /></label>; }
function SelectField({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void }) { return <label className="grid gap-2"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="h-12 rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-foreground outline-none">{options.map((option) => <option key={option} value={option} className="bg-graphite-900">{option}</option>)}</select></label>; }
function EmptyState() { return <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-6 text-center"><PackageCheck className="mx-auto size-8 text-gold-100" /><p className="mt-4 font-semibold text-foreground">No proof placeholders yet</p><p className="mt-2 text-sm leading-6 text-muted-foreground">Create metadata placeholders as documentation becomes available.</p></div>; }
function AdminNotice({ tone, message }: { tone: "success" | "error"; message: string }) { return <div className={`mb-6 rounded-[1.5rem] border p-4 text-sm ${tone === "success" ? "border-gold-200/25 bg-gold-200/10 text-gold-100" : "border-white/10 bg-black/30 text-foreground"}`}>{message}</div>; }
function ReconciliationIssueList({ title, items, emptyText }: { title: string; items: ReconciliationException[]; emptyText: string }) { return <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{title}</p>{items.length === 0 ? <p className="mt-3 text-sm leading-6 text-muted-foreground">{emptyText}</p> : <div className="mt-3 grid gap-2">{items.map((item) => <div key={item.id} className="rounded-2xl border border-gold-200/20 bg-gold-200/10 p-3 text-xs leading-5 text-gold-100">{item.message}</div>)}</div>}</div>; }
function RiskFactorList({ title, items, emptyText }: { title: string; items: RiskFactor[]; emptyText: string }) { return <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{title}</p>{items.length === 0 ? <p className="mt-3 text-sm leading-6 text-muted-foreground">{emptyText}</p> : <div className="mt-3 grid gap-2">{items.slice(0, 6).map((item) => <div key={item.id} className="rounded-2xl border border-gold-200/20 bg-gold-200/10 p-3 text-xs leading-5 text-gold-100"><span className="font-semibold text-foreground">{item.severity} · {item.category}</span><br />{item.label}: {item.description}</div>)}</div>}</div>; }
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
      const params = new URLSearchParams();
      params.set("source", nextFilters.source);
      params.set("limit", nextFilters.limit);
      const response = await fetch(`${endpoint}?${params.toString()}`);
      const payload = (await response.json()) as { ok: boolean; data?: { events: RiskTimelineEvent[] }; error?: string };
      if (!response.ok || !payload.ok || !payload.data?.events) throw new Error(payload.error || "Unable to load risk timeline.");
      setEvents(payload.data.events);
    } catch (requestError) {
      setFilterError(requestError instanceof Error ? requestError.message : "Unable to load risk timeline.");
    } finally {
      setIsLoading(false);
    }
  }

  return <Card className="rounded-[2rem] bg-graphite-900/[0.72]">
    <CardHeader><CardTitle>{title}</CardTitle><CardDescription>{description}</CardDescription></CardHeader>
    <CardContent className="grid gap-3">
      <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-end">
          <RiskTimelineSelectField label="Source" value={filters.source} options={RISK_TIMELINE_SOURCE_FILTERS} onChange={(value) => void reloadTimeline({ ...filters, source: value as RiskTimelineSourceFilter })} />
          <RiskTimelineSelectField label="Limit" value={filters.limit} options={RISK_TIMELINE_LIMIT_OPTIONS} onChange={(value) => void reloadTimeline({ ...filters, limit: value })} />
          <Badge variant="secondary">{isLoading ? "Loading..." : `${events.length} event(s)`}</Badge>
        </div>
        {filterError ? <p className="mt-3 text-xs leading-5 text-gold-100">{filterError}</p> : null}
      </div>
      {events.length === 0 ? <p className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4 text-sm text-muted-foreground">{emptyText}</p> : events.map((event) => <div key={event.id} className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
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
            <span className="text-xs text-muted-foreground">{formatDate(event.createdAt)}</span>
          </div>
        </div>
        {expandedEventId === event.id ? <RiskTimelineEventDetailsPanel event={event} /> : null}
      </div>)}
    </CardContent>
  </Card>;
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
  return <div className="rounded-2xl border border-white/10 bg-black/20 p-3"><p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p><p className="mt-2 text-xs leading-5 text-foreground">{value}</p></div>;
}

function formatRiskDetailValue(value: string | number | null) {
  return value === null || value === "" ? "-" : String(value);
}

function RiskTimelineFactors({ title, items }: { title: string; items: RiskTimelineFactor[] }) {
  return <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{title}</p>
    {items.length === 0 ? <p className="mt-2 text-xs leading-5 text-muted-foreground">None</p> : <div className="mt-2 flex flex-wrap gap-2">{items.slice(0, 4).map((item) => <Badge key={`${item.id}-${item.label}`} variant="secondary">{item.severity} · {item.label}</Badge>)}</div>}
  </div>;
}
function LedgerAuditTrailPanel({ state }: { state: { isLoading: boolean; data: LedgerEntryAuditTrail | null; error: string | null } }) {
  if (state.isLoading) return <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-muted-foreground">Loading audit trail...</div>;
  if (state.error) return <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-foreground">{state.error}</div>;
  if (!state.data) return null;

  const chain = [state.data.originalEntry, ...state.data.reversalEntries, ...(state.data.correctionEntry ? [state.data.correctionEntry] : [])];
  return <div className="mt-4 grid gap-4 rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Ledger audit trail</p>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">Immutable chain for original, reversal, and correction records.</p>
    </div>
    <div className="grid gap-3">
      {chain.map((entry) => <div key={entry.id} className="rounded-2xl border border-white/10 bg-black/20 p-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-foreground">{entry.entryType}</p>
              {entry.statusFlags.isOriginal ? <Badge>Original</Badge> : null}
              {entry.statusFlags.isReversal ? <Badge variant="secondary">Reversal</Badge> : null}
              {entry.statusFlags.isReversed ? <Badge variant="secondary">Reversed</Badge> : null}
              {entry.statusFlags.isCorrected ? <Badge variant="secondary">Corrected</Badge> : null}
            </div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">{entry.ledgerType} · {formatDate(entry.occurredAt)} · created by {entry.createdBy}</p>
            {entry.reversalReason ? <p className="mt-2 text-xs leading-5 text-gold-100">Reason: {entry.reversalReason}</p> : null}
            {entry.reversesLedgerEntryId ? <p className="mt-2 text-xs leading-5 text-muted-foreground">Reverses {entry.reversesLedgerEntryId}</p> : null}
            {entry.correctedByLedgerEntryId ? <p className="mt-2 text-xs leading-5 text-muted-foreground">Corrected by {entry.correctedByLedgerEntryId}</p> : null}
            {entry.metadataPreview ? <p className="mt-2 break-words rounded-xl border border-white/10 bg-black/20 p-2 font-mono text-[0.68rem] leading-5 text-muted-foreground">Metadata preview: {entry.metadataPreview}</p> : null}
          </div>
          <div className="text-right text-xs text-muted-foreground"><p>{formatMoney(entry.amount)}</p><p>{entry.quantity ?? "-"} units</p></div>
        </div>
      </div>)}
    </div>
    <div className="grid gap-2">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Audit events</p>
      {state.data.auditEvents.length === 0 ? <p className="rounded-2xl border border-white/10 bg-black/20 p-3 text-xs text-muted-foreground">No audit events recorded for this chain.</p> : state.data.auditEvents.map((event) => <div key={event.id} className="rounded-2xl border border-white/10 bg-black/20 p-3 text-xs leading-5 text-muted-foreground">
        <p className="font-semibold text-foreground">{event.action}</p>
        <p>{formatDate(event.createdAt)} · {event.actor}</p>
        {event.afterPreview ? <p className="mt-2 break-words font-mono text-[0.68rem]">{event.afterPreview}</p> : null}
      </div>)}
    </div>
  </div>;
}

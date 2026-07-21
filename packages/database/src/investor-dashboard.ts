import { prisma } from "./client";
import { calculateAllocationProofCompletenessFromInput, getInvestorSafeProofHealth, type ProofCompletenessBreakdown, type InvestorSafeProofHealth } from "./proof-completeness";
import { getActiveReadinessPolicy } from "./readiness-policies";
import { calculateAllocationRiskFromInput, type InvestorSafeRiskSummary } from "./risk-engine";

export type InvestorDashboardStage = "funding" | "purchasing" | "shipping" | "warehouse" | "selling" | "completed" | "paid_out" | "loss";
export type InvestorDashboardRiskLevel = "standard" | "monitored" | "elevated";

export type InvestorDashboardInvestor = {
  id: string;
  reinvestEnabled: boolean;
  lastReportAt: Date | null;
};

export type InvestorDashboardAllocationRecord = {
  id: string;
  investorId: string;
  supplyCode: string;
  productName: string;
  marketplace: string | null;
  allocationAmount: unknown;
  currency: string;
  status: string;
  expectedCycleDays: number | null;
  expectedPayoutAt?: Date | null;
  riskLevel?: string | null;
  estimatedResult: unknown;
  actualProfit: unknown;
  startedAt: Date | null;
  completedAt: Date | null;
  payoutStatus: string;
  reinvestDecision: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  proofs?: Array<{
    id: string;
    type: string;
    title: string;
    status: string;
    updatedAt: Date;
    createdAt: Date;
  }>;
  monthlyReports?: Array<{ id: string }>;
  proofCompleteness?: ProofCompletenessBreakdown | null;
  riskHealth?: InvestorSafeRiskSummary | null;
  ledgerEntries?: Array<{
    ledgerType: string;
    allocationId?: string | null;
    investorId?: string | null;
    monthlyReportId?: string | null;
    entryType: string;
    amount: string;
    currency?: string;
    quantity?: number | null;
    unitCost?: string | null;
    occurredAt?: Date | string;
    sourceType: string;
    sourceId?: string | null;
    description: string;
    metadataJson?: string | null;
    createdBy?: string;
    isReversal?: boolean;
    correctedByLedgerEntryId?: string | null;
    voidedAt?: Date | string | null;
  }>;
};

export type InvestorDashboardMonthlyReportRecord = {
  id: string;
  investorId: string;
  month: string;
  title: string;
  summary: string;
  status: string;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type InvestorDashboardWithdrawalRequestRecord = {
  id: string;
  investorId: string;
  amount: unknown;
  status: string;
  scheduledFor: Date | null;
  paidAt: Date | null;
};

export type InvestorDashboardReportReference = {
  id: string;
  month: string;
  title: string;
  summary: string;
  publishedAt: string;
};

export type InvestorDashboardAllocation = {
  id: string;
  allocationId: string;
  supplyId: string;
  product: string;
  batchProductName: string;
  investedAmount: number;
  amount: number;
  expectedReturn: number | null;
  expectedReturnNote: string;
  currentStage: InvestorDashboardStage;
  status: string;
  currency: string;
  comparisonResult: number | null;
  resultIsEstimated: boolean;
  roiPercent: number | null;
  durationDays: number;
  payoutStatus: string;
  completedAt: string | null;
  progressPercent: number;
  riskLevel: InvestorDashboardRiskLevel;
  startedAt: string | null;
  expectedPayoutAt: string | null;
  expectedCycle: string;
  estimatedResult: string;
  updatedAt: string;
  latestProofReference: {
    id: string;
    type: string;
    title: string;
    status: string;
  } | null;
  latestReportReference: InvestorDashboardReportReference | null;
  proofHealth: InvestorSafeProofHealth | null;
  riskHealth: InvestorSafeRiskSummary | null;
};

export type InvestorDashboardSummary = {
  activeCapital: number;
  totalInvested: number;
  realizedProfit: number;
  expectedProfit: number;
  totalPayouts: number;
  pendingPayouts: number;
  activeAllocationsCount: number;
  completedAllocationsCount: number;
  // True once the investor has any allocations or withdrawal activity. When
  // false, the UI renders zero money-metrics as "—" instead of "$0".
  hasHistory: boolean;
  currentAverageRoi: number | null;
  nextExpectedPayoutDate: string | null;
  latestPublishedMonthlyReport: InvestorDashboardReportReference | null;
  reinvestEnabled: boolean;
  lastReportDate: string | null;
};

export type InvestorDashboardData = {
  investorId: string;
  summary: InvestorDashboardSummary;
  activeAllocations: InvestorDashboardAllocation[];
  allocations: InvestorDashboardAllocation[];
  latestPublishedMonthlyReport: InvestorDashboardReportReference | null;
};

const ACTIVE_ALLOCATION_STATUSES = new Set(["DRAFT", "PURCHASING", "SHIPPING", "RECEIVED", "SELLING"]);
const COMPLETED_ALLOCATION_STATUSES = new Set(["COMPLETED"]);
const CLOSED_ALLOCATION_STATUSES = new Set(["COMPLETED", "CANCELED", "LOSS"]);
const INVESTOR_VISIBLE_ALLOCATION_STATUSES = new Set(["DRAFT", "PURCHASING", "SHIPPING", "RECEIVED", "SELLING", "LOSS"]);
const PAID_OUT_STATUSES = new Set(["PAID", "REINVESTED"]);

function toNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return 0;
  const numeric = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
}

function toOptionalNumber(value: unknown) {
  const numeric = toNumber(value);
  return numeric > 0 ? numeric : null;
}

function toIsoDate(value: Date | null) {
  return value ? value.toISOString() : null;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getAllocationStage(allocation: InvestorDashboardAllocationRecord): InvestorDashboardStage {
  if (allocation.status === "LOSS" || allocation.status === "CANCELED") return "loss";
  if (allocation.status === "COMPLETED" && PAID_OUT_STATUSES.has(allocation.payoutStatus)) return "paid_out";
  if (allocation.status === "COMPLETED") return "completed";
  if (allocation.status === "DRAFT") return "funding";
  if (allocation.status === "PURCHASING") return "purchasing";
  if (allocation.status === "SHIPPING") return "shipping";
  if (allocation.status === "RECEIVED") return "warehouse";
  if (allocation.status === "SELLING") return "selling";
  return "funding";
}

function getProgressPercent(stage: InvestorDashboardStage) {
  const progress: Record<InvestorDashboardStage, number> = {
    funding: 10,
    purchasing: 28,
    shipping: 46,
    warehouse: 64,
    selling: 82,
    completed: 95,
    paid_out: 100,
    loss: 100
  };

  return progress[stage];
}

function getExpectedPayoutDate(allocation: InvestorDashboardAllocationRecord) {
  if (allocation.expectedPayoutAt) return allocation.expectedPayoutAt;
  if (!allocation.expectedCycleDays) return null;
  const anchor = allocation.startedAt ?? allocation.createdAt;
  return addDays(anchor, allocation.expectedCycleDays);
}

function getRiskLevel(allocation: InvestorDashboardAllocationRecord, expectedPayoutAt: Date | null, now: Date): InvestorDashboardRiskLevel {
  if (allocation.riskLevel === "ELEVATED") return "elevated";
  if (allocation.riskLevel === "MONITORED") return "monitored";
  if (allocation.riskLevel === "STANDARD") return "standard";
  const stage = getAllocationStage(allocation);
  if (stage === "loss") return "elevated";
  if (expectedPayoutAt && expectedPayoutAt.getTime() < now.getTime() && !["completed", "paid_out"].includes(stage)) return "monitored";
  if (["shipping", "warehouse", "selling"].includes(stage)) return "monitored";
  return "standard";
}

function getLatestPublishedReport(reports: InvestorDashboardMonthlyReportRecord[]) {
  const latest = reports
    .filter((report) => report.status === "PUBLISHED" && report.publishedAt)
    .sort((left, right) => (right.publishedAt?.getTime() ?? 0) - (left.publishedAt?.getTime() ?? 0))[0];

  if (!latest || !latest.publishedAt) return null;

  return {
    id: latest.id,
    month: latest.month,
    title: latest.title,
    summary: latest.summary,
    publishedAt: latest.publishedAt.toISOString()
  };
}

function serializeDashboardAllocation(
  allocation: InvestorDashboardAllocationRecord,
  latestPublishedMonthlyReport: InvestorDashboardReportReference | null,
  now: Date
): InvestorDashboardAllocation {
  const investedAmount = toNumber(allocation.allocationAmount);
  const expectedReturn = toOptionalNumber(allocation.estimatedResult);
  const expectedPayoutAt = getExpectedPayoutDate(allocation);
  const stage = getAllocationStage(allocation);
  const actualProfit = toNumber(allocation.actualProfit);
  const resultIsEstimated = !CLOSED_ALLOCATION_STATUSES.has(allocation.status);
  const comparisonResult = resultIsEstimated ? expectedReturn : actualProfit;
  const startedAt = allocation.startedAt ?? allocation.createdAt;
  const endedAt = allocation.completedAt ?? now;
  const latestProof = allocation.proofs?.filter((proof) => proof.status === "AVAILABLE" || proof.status === "VERIFIED")[0] ?? null;

  return {
    id: allocation.id,
    allocationId: allocation.id,
    supplyId: allocation.supplyCode,
    product: allocation.productName,
    batchProductName: allocation.productName,
    investedAmount,
    amount: investedAmount,
    expectedReturn,
    expectedReturnNote: expectedReturn ? `${allocation.currency} ${expectedReturn.toLocaleString("en-US")}` : allocation.estimatedResult ? String(allocation.estimatedResult) : "Not estimated",
    currentStage: stage,
    status: allocation.status,
    currency: allocation.currency,
    comparisonResult,
    resultIsEstimated,
    roiPercent: investedAmount > 0 && comparisonResult !== null ? (comparisonResult / investedAmount) * 100 : null,
    durationDays: Math.max(1, Math.ceil((endedAt.getTime() - startedAt.getTime()) / (24 * 60 * 60 * 1000))),
    payoutStatus: allocation.payoutStatus,
    completedAt: toIsoDate(allocation.completedAt),
    progressPercent: getProgressPercent(stage),
    riskLevel: allocation.riskHealth?.level === "HIGH" || allocation.riskHealth?.level === "CRITICAL" || allocation.riskHealth?.level === "ELEVATED" ? "elevated" : getRiskLevel(allocation, expectedPayoutAt, now),
    startedAt: toIsoDate(allocation.startedAt),
    expectedPayoutAt: toIsoDate(expectedPayoutAt),
    expectedCycle: allocation.expectedCycleDays ? `${allocation.expectedCycleDays} days` : allocation.completedAt ? "Completed" : "Cycle not set",
    estimatedResult: expectedReturn ? `${allocation.currency} ${expectedReturn.toLocaleString("en-US")}` : allocation.estimatedResult ? String(allocation.estimatedResult) : "Not estimated",
    updatedAt: allocation.updatedAt.toISOString(),
    latestProofReference: latestProof ? { id: latestProof.id, type: latestProof.type, title: latestProof.title, status: latestProof.status } : null,
    latestReportReference: latestPublishedMonthlyReport,
    proofHealth: allocation.proofCompleteness ? getInvestorSafeProofHealth(allocation.proofCompleteness) : null,
    riskHealth: allocation.riskHealth ?? null
  };
}

export function buildInvestorDashboardData(input: {
  investor: InvestorDashboardInvestor;
  allocations: InvestorDashboardAllocationRecord[];
  monthlyReports: InvestorDashboardMonthlyReportRecord[];
  withdrawalRequests?: InvestorDashboardWithdrawalRequestRecord[];
  now?: Date;
}): InvestorDashboardData {
  const now = input.now ?? new Date();
  const allocations = input.allocations.filter((allocation) => allocation.investorId === input.investor.id);
  const monthlyReports = input.monthlyReports.filter((report) => report.investorId === input.investor.id);
  const withdrawalRequests = (input.withdrawalRequests ?? []).filter((request) => request.investorId === input.investor.id);
  const latestPublishedMonthlyReport = getLatestPublishedReport(monthlyReports);
  const activeAllocationRecords = allocations.filter((allocation) => ACTIVE_ALLOCATION_STATUSES.has(allocation.status));
  const investorVisibleAllocationRecords = allocations.filter((allocation) => INVESTOR_VISIBLE_ALLOCATION_STATUSES.has(allocation.status));
  const completedAllocationRecords = allocations.filter((allocation) => COMPLETED_ALLOCATION_STATUSES.has(allocation.status));
  const activeAllocations = investorVisibleAllocationRecords.map((allocation) => serializeDashboardAllocation(allocation, latestPublishedMonthlyReport, now));
  const allInvestorAllocations = allocations.filter((allocation) => allocation.status !== "CANCELED").map((allocation) => serializeDashboardAllocation(allocation, latestPublishedMonthlyReport, now));
  const completedCapital = completedAllocationRecords.reduce((sum, allocation) => sum + toNumber(allocation.allocationAmount), 0);
  const realizedProfit = completedAllocationRecords.reduce((sum, allocation) => sum + toNumber(allocation.actualProfit), 0);
  const payoutCandidates = allocations
    .filter((allocation) => !["CANCELED", "LOSS"].includes(allocation.status) && !PAID_OUT_STATUSES.has(allocation.payoutStatus))
    .map(getExpectedPayoutDate)
    .filter((date): date is Date => Boolean(date))
    .sort((left, right) => left.getTime() - right.getTime());
  const scheduledWithdrawalDates = withdrawalRequests
    .filter((request) => ["APPROVED", "SCHEDULED"].includes(request.status) && request.scheduledFor)
    .map((request) => request.scheduledFor as Date)
    .sort((left, right) => left.getTime() - right.getTime());
  const futurePayoutDate =
    scheduledWithdrawalDates.find((date) => date.getTime() >= now.getTime()) ??
    scheduledWithdrawalDates[0] ??
    payoutCandidates.find((date) => date.getTime() >= now.getTime()) ??
    payoutCandidates[0] ??
    null;
  const paidWithdrawals = withdrawalRequests.filter((request) => request.status === "PAID");
  const pendingWithdrawals = withdrawalRequests.filter((request) => ["REQUESTED", "APPROVED", "SCHEDULED"].includes(request.status));

  return {
    investorId: input.investor.id,
    summary: {
      activeCapital: activeAllocationRecords.reduce((sum, allocation) => sum + toNumber(allocation.allocationAmount), 0),
      totalInvested: allocations.filter((allocation) => allocation.status !== "CANCELED").reduce((sum, allocation) => sum + toNumber(allocation.allocationAmount), 0),
      realizedProfit,
      expectedProfit: activeAllocationRecords.reduce((sum, allocation) => sum + (toOptionalNumber(allocation.estimatedResult) ?? 0), 0),
      totalPayouts: withdrawalRequests.length > 0 ? paidWithdrawals.reduce((sum, request) => sum + toNumber(request.amount), 0) : allocations.filter((allocation) => PAID_OUT_STATUSES.has(allocation.payoutStatus)).reduce((sum, allocation) => sum + toNumber(allocation.actualProfit), 0),
      pendingPayouts: pendingWithdrawals.reduce((sum, request) => sum + toNumber(request.amount), 0),
      activeAllocationsCount: activeAllocationRecords.length,
      completedAllocationsCount: completedAllocationRecords.length,
      hasHistory: allocations.length > 0 || withdrawalRequests.length > 0,
      currentAverageRoi: completedCapital > 0 ? (realizedProfit / completedCapital) * 100 : null,
      nextExpectedPayoutDate: toIsoDate(futurePayoutDate),
      latestPublishedMonthlyReport,
      reinvestEnabled: input.investor.reinvestEnabled,
      lastReportDate: latestPublishedMonthlyReport?.publishedAt ?? input.investor.lastReportAt?.toISOString() ?? null
    },
    activeAllocations,
    allocations: allInvestorAllocations,
    latestPublishedMonthlyReport
  };
}

export async function getInvestorDashboardDataForInvestor(investorId: string) {
  const investor = await prisma.investor.findUnique({
    where: { id: investorId },
    select: { id: true, reinvestEnabled: true, lastReportAt: true }
  });

  if (!investor) return null;

  const [allocations, monthlyReports, withdrawalRequests, policy] = await Promise.all([
    prisma.allocation.findMany({
      where: { investorId },
      include: {
        proofs: {
          orderBy: [{ updatedAt: "desc" }]
        },
        ledgerEntries: true,
        monthlyReports: { select: { id: true } }
      },
      orderBy: [{ updatedAt: "desc" }]
    }),
    prisma.monthlyReport.findMany({
      where: { investorId },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }]
    }),
    prisma.withdrawalRequest.findMany({
      where: { investorId },
      orderBy: [{ scheduledFor: "asc" }, { createdAt: "desc" }]
    }),
    getActiveReadinessPolicy()
  ]);

  const allocationsWithProofCompleteness = allocations.map((allocation) => {
    const proofCompleteness = calculateAllocationProofCompletenessFromInput({
      allocationId: allocation.id,
      investorId: allocation.investorId,
      proofs: allocation.proofs,
      monthlyReportLinkCount: allocation.monthlyReports.length,
      policy
    });
    const risk = calculateAllocationRiskFromInput({
      allocation: {
        ...allocation,
        proofs: allocation.proofs,
        ledgerEntries: allocation.ledgerEntries,
        monthlyReportLinkCount: allocation.monthlyReports.length
      },
      policy
    });

    return {
      ...allocation,
      proofCompleteness,
      riskHealth: risk.investorSafeSummary
    };
  });

  return buildInvestorDashboardData({ investor, allocations: allocationsWithProofCompleteness, monthlyReports, withdrawalRequests });
}

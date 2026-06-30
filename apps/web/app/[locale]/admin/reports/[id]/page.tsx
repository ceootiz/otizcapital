import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildRiskSnapshot, calculateMonthlyReportReconciliation, evaluateMonthlyReportReadiness, getEligibleAllocationsForReport, getMonthlyReportDetailRecord, getReportAllocations, getReportRiskTimeline, listAuditLogs, serializeAuditLog, serializeMonthlyReportAllocation, serializeMonthlyReportDetail } from "@otiz/database";
import { isLocale, type Locale } from "@otiz/lib";
import { AdminReportDetailPage } from "@/components/admin/admin-report-detail-page";
import { requireAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Report Detail | OTIZ CAPITAL",
  description: "Protected monthly report detail and proof snapshot review."
};

export default async function AdminReportDetailRoute({ params }: { params: { locale: Locale; id: string } }) {
  if (!isLocale(params.locale)) notFound();
  requireAdminSession(params.locale);

  const report = await getMonthlyReportDetailRecord(params.id);
  if (!report) notFound();

  const [auditLogs, linkedAllocations, eligibleResult, readiness, reconciliation, risk, riskTimeline] = await Promise.all([
    listAuditLogs({ entityType: "MonthlyReport", entityId: report.id, limit: 16 }),
    getReportAllocations(report.id),
    getEligibleAllocationsForReport(report.id),
    evaluateMonthlyReportReadiness(report.id),
    calculateMonthlyReportReconciliation(report.id),
    buildRiskSnapshot(report.id),
    getReportRiskTimeline(report.id, { limit: 16 })
  ]);

  return (
    <AdminReportDetailPage
      locale={params.locale}
      report={serializeMonthlyReportDetail(report)}
      auditLogs={auditLogs.map(serializeAuditLog)}
      linkedAllocations={linkedAllocations.map(serializeMonthlyReportAllocation)}
      readiness={readiness}
      reconciliation={reconciliation}
      risk={risk}
      riskTimeline={riskTimeline.events}
      eligibleAllocations={eligibleResult.ok ? eligibleResult.allocations.map((allocation) => ({
        id: allocation.id,
        investorId: allocation.investorId,
        supplyCode: allocation.supplyCode,
        productName: allocation.productName,
        marketplace: allocation.marketplace,
        allocationAmount: allocation.allocationAmount,
        currency: allocation.currency,
        status: allocation.status,
        expectedCycleDays: allocation.expectedCycleDays,
        expectedPayoutAt: allocation.expectedPayoutAt?.toISOString() ?? null,
        riskLevel: allocation.riskLevel,
        estimatedResult: allocation.estimatedResult,
        actualProfit: allocation.actualProfit,
        payoutStatus: allocation.payoutStatus,
        reinvestDecision: allocation.reinvestDecision,
        updatedAt: allocation.updatedAt.toISOString(),
        proofCount: allocation.proofs.length,
        investorVisibleProofCount: allocation.proofs.filter((proof) => proof.status === "AVAILABLE" || proof.status === "VERIFIED").length
      })) : []}
    />
  );
}

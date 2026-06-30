import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { calculateAllocationProofCompleteness, calculateAllocationReconciliation, calculateAllocationRisk, getActiveReadinessPolicy, getAllocationDetailRecord, getAllocationRiskTimeline, getProofRequirementsGuide, listAuditLogs, listNotificationEventRecords, serializeAllocationDetail, serializeAuditLog, serializeNotificationEvent } from "@otiz/database";
import { isLocale, type Locale } from "@otiz/lib";
import { AdminAllocationDetailPage } from "@/components/admin/admin-allocation-detail-page";
import { requireAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Allocation Detail | OTIZ CAPITAL",
  description: "Protected allocation proof and activity view."
};

export default async function AdminAllocationDetailRoute({ params }: { params: { locale: Locale; id: string } }) {
  if (!isLocale(params.locale)) notFound();
  requireAdminSession(params.locale);
  const allocation = await getAllocationDetailRecord(params.id);
  if (!allocation) notFound();
  const [auditLogs, notificationEvents, readinessPolicy, riskTimeline] = await Promise.all([
    listAuditLogs({ entityType: "Allocation", entityId: allocation.id, limit: 12 }),
    listNotificationEventRecords({ entityType: "Allocation", entityId: allocation.id, limit: 12 }),
    getActiveReadinessPolicy(),
    getAllocationRiskTimeline(allocation.id, { limit: 12 })
  ]);
  const [proofCompleteness, reconciliation, risk] = await Promise.all([
    calculateAllocationProofCompleteness(allocation.id, { policy: readinessPolicy }),
    calculateAllocationReconciliation(allocation.id),
    calculateAllocationRisk(allocation.id, { policy: readinessPolicy })
  ]);
  return <AdminAllocationDetailPage locale={params.locale} allocation={{ ...serializeAllocationDetail(allocation), proofCompleteness, proofRequirementsGuide: getProofRequirementsGuide(readinessPolicy), reconciliation, risk }} auditLogs={auditLogs.map(serializeAuditLog)} notificationEvents={notificationEvents.map(serializeNotificationEvent)} riskTimeline={riskTimeline.events} />;
}

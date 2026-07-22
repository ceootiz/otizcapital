import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { calculateAllocationProofCompleteness, calculateAllocationReconciliation, calculateAllocationRisk, getActiveReadinessPolicy, getAllocationDetailRecord, getAllocationRiskTimeline, getProofRequirementsGuide, listAuditLogs, listNotificationEventRecords, serializeAllocationDetail, serializeAuditLog, serializeNotificationEvent } from "@otiz/database";
import { isLocale, type Locale } from "@otiz/lib";
import { AdminAllocationDetailPage } from "@/components/admin/admin-allocation-detail-page";
import { requireAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

const META = {
  en: {
    title: "Admin Allocation Detail | OTIZ CAPITAL",
    description: "Protected allocation proof and activity view."
  },
  ru: {
    title: "Детали аллокации (админ) | OTIZ CAPITAL",
    description: "Защищённый просмотр подтверждений и активности аллокации."
  }
} as const;

export async function generateMetadata(props: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const params = await props.params;
  const meta = (META as unknown as Record<string, (typeof META)["en"]>)[params.locale] ?? META.en;
  return { title: meta.title, description: meta.description };
}

export default async function AdminAllocationDetailRoute(props: { params: Promise<{ locale: Locale; id: string }> }) {
  const params = await props.params;
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

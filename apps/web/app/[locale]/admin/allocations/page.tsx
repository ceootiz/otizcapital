import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { calculateAllocationProofCompleteness, getAdminAllocations, listInvestorRecords, serializeAllocationDetail, serializeInvestor } from "@otiz/database";
import { isLocale, type Locale } from "@otiz/lib";
import { AdminAllocationsPage } from "@/components/admin/admin-allocations-page";
import { requireAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Allocations | OTIZ CAPITAL",
  description: "Protected admin allocation manager."
};

export default async function AdminAllocationsRoute({ params }: { params: { locale: Locale } }) {
  if (!isLocale(params.locale)) notFound();
  requireAdminSession(params.locale);
  const [allocations, investors] = await Promise.all([getAdminAllocations(), listInvestorRecords()]);
  const proofCompleteness = await Promise.all(allocations.map((allocation) => calculateAllocationProofCompleteness(allocation.id)));
  return <AdminAllocationsPage locale={params.locale} allocations={allocations.map((allocation, index) => ({ ...serializeAllocationDetail(allocation), proofCompleteness: proofCompleteness[index] }))} investors={investors.map(serializeInvestor)} />;
}

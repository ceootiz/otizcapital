import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { calculateAllocationProofCompleteness, getAdminAllocations, listInvestorRecords, serializeAllocationDetail, serializeInvestor } from "@otiz/database";
import { isLocale, type Locale } from "@otiz/lib";
import { AdminAllocationsPage } from "@/components/admin/admin-allocations-page";
import { requireAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

const META: Partial<Record<Locale, { title: string; description: string }>> = {
  en: { title: "Admin Allocations | OTIZ CAPITAL", description: "Protected admin allocation manager." },
  ru: { title: "Аллокации администратора | OTIZ CAPITAL", description: "Защищённый менеджер аллокаций администратора." }
};

export async function generateMetadata(props: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const params = await props.params;
  const meta = META[params.locale] ?? META.en!;
  return { title: meta.title, description: meta.description };
}

export default async function AdminAllocationsRoute(props: { params: Promise<{ locale: Locale }> }) {
  const params = await props.params;
  if (!isLocale(params.locale)) notFound();
  requireAdminSession(params.locale);
  const [allocations, investors] = await Promise.all([getAdminAllocations(), listInvestorRecords()]);
  const proofCompleteness = await Promise.all(allocations.map((allocation) => calculateAllocationProofCompleteness(allocation.id)));
  return <AdminAllocationsPage locale={params.locale} allocations={allocations.map((allocation, index) => ({ ...serializeAllocationDetail(allocation), proofCompleteness: proofCompleteness[index] }))} investors={investors.map(serializeInvestor)} />;
}

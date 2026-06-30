import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getInvestorDetailRecord, serializeInvestorDetail } from "@otiz/database";
import { isLocale, type Locale } from "@otiz/lib";
import { AdminInvestorDetailPage } from "@/components/admin/admin-investor-detail-page";
import { requireAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Investor Detail | OTIZ CAPITAL",
  description: "Protected MVP admin investor profile and allocation management."
};

export default async function AdminInvestorDetailRoute({ params }: { params: { locale: Locale; id: string } }) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  requireAdminSession(params.locale);

  const investor = await getInvestorDetailRecord(params.id);

  if (!investor) {
    notFound();
  }

  return <AdminInvestorDetailPage locale={params.locale} investor={serializeInvestorDetail(investor)} />;
}

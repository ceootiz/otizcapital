import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@otiz/lib";
import { listInvestorRecords, serializeInvestor } from "@otiz/database";
import { AdminInvestorsPage } from "@/components/admin/admin-investors-page";
import { requireAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Investors | OTIZ CAPITAL",
  description: "Protected MVP admin view for active investor profiles."
};

export default async function InvestorsAdminRoute({ params }: { params: { locale: Locale } }) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  requireAdminSession(params.locale);

  const investors = await listInvestorRecords();

  return <AdminInvestorsPage locale={params.locale} investors={investors.map(serializeInvestor)} />;
}

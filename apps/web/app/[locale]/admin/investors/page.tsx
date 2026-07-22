import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@otiz/lib";
import { listInvestorRecords, serializeInvestor } from "@otiz/database";
import { AdminInvestorsPage } from "@/components/admin/admin-investors-page";
import { requireAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

const META = {
  en: {
    title: "Admin Investors | OTIZ CAPITAL",
    description: "Protected MVP admin view for active investor profiles."
  },
  ru: {
    title: "Инвесторы — админ | OTIZ CAPITAL",
    description: "Защищённый MVP-раздел администратора для активных профилей инвесторов."
  }
} as const;

export async function generateMetadata(props: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const params = await props.params;
  return params.locale === "ru" ? META.ru : META.en;
}

export default async function InvestorsAdminRoute(props: { params: Promise<{ locale: Locale }> }) {
  const params = await props.params;
  if (!isLocale(params.locale)) {
    notFound();
  }

  requireAdminSession(params.locale);

  const investors = await listInvestorRecords();

  return <AdminInvestorsPage locale={params.locale} investors={investors.map(serializeInvestor)} />;
}

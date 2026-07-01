import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@otiz/lib";
import { InvestorDashboardHome, InvestorShell, getInvestorStrings } from "@/components/investor/investor-pages";
import { getInvestorDashboardData } from "@/lib/investor-dashboard-data";
import { requireInvestorSession } from "@/lib/investor-session";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { locale: Locale } }): Metadata {
  if (!isLocale(params.locale)) return {};
  const page = getInvestorStrings(params.locale).pages.dashboard;
  return { title: `${page.title} | OTIZ CAPITAL`, description: page.description };
}

export default async function InvestorDashboardRoute({ params }: { params: { locale: Locale } }) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  const investor = await requireInvestorSession(params.locale);
  const data = await getInvestorDashboardData(investor);
  const page = getInvestorStrings(params.locale).pages.dashboard;

  return (
    <InvestorShell locale={params.locale} investor={investor} active="dashboard" eyebrow={page.eyebrow} title={page.title} description={page.description}>
      <InvestorDashboardHome locale={params.locale} data={data} />
    </InvestorShell>
  );
}

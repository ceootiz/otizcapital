import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@otiz/lib";
import { isProductFeatureEnabled } from "@otiz/database";
import { InvestorReinvestPage, InvestorShell, getInvestorStrings } from "@/components/investor/investor-pages";
import { getInvestorDashboardData } from "@/lib/investor-dashboard-data";
import { requireInvestorSession } from "@/lib/investor-session";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const params = await props.params;
  if (!isLocale(params.locale)) return {};
  const page = getInvestorStrings(params.locale).pages.reinvest;
  return { title: `${page.title} | OTIZ CAPITAL`, description: page.description };
}

export default async function InvestorReinvestRoute(props: { params: Promise<{ locale: Locale }> }) {
  const params = await props.params;
  if (!isLocale(params.locale)) {
    notFound();
  }

  const investor = await requireInvestorSession(params.locale);
  const [data, persistenceEnabled] = await Promise.all([
    getInvestorDashboardData(investor),
    isProductFeatureEnabled("reinvest-preference")
  ]);
  const page = getInvestorStrings(params.locale).pages.reinvest;

  return (
    <InvestorShell locale={params.locale} investor={investor} active="reinvest" eyebrow={page.eyebrow} title={page.title} description={page.description}>
      <InvestorReinvestPage locale={params.locale} enabled={data.summary.reinvestEnabled} persistenceEnabled={persistenceEnabled} />
    </InvestorShell>
  );
}

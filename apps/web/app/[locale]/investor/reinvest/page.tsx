import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@otiz/lib";
import { InvestorReinvestPage, InvestorShell, getInvestorStrings } from "@/components/investor/investor-pages";
import { getInvestorDashboardData } from "@/lib/investor-dashboard-data";
import { requireInvestorSession } from "@/lib/investor-session";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { locale: Locale } }): Metadata {
  if (!isLocale(params.locale)) return {};
  const page = getInvestorStrings(params.locale).pages.reinvest;
  return { title: `${page.title} | OTIZ CAPITAL`, description: page.description };
}

export default async function InvestorReinvestRoute({ params }: { params: { locale: Locale } }) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  const investor = await requireInvestorSession(params.locale);
  const data = await getInvestorDashboardData(investor);
  const page = getInvestorStrings(params.locale).pages.reinvest;

  return (
    <InvestorShell locale={params.locale} investor={investor} active="reinvest" eyebrow={page.eyebrow} title={page.title} description={page.description}>
      <InvestorReinvestPage locale={params.locale} enabled={data.summary.reinvestEnabled} />
    </InvestorShell>
  );
}

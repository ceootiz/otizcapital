import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@otiz/lib";
import { isProductFeatureEnabled } from "@otiz/database";
import { InvestorAllocationsPage, InvestorShell, getInvestorStrings } from "@/components/investor/investor-pages";
import { InvestorDealComparison } from "@/components/investor/investor-deal-comparison";
import { getInvestorDashboardData } from "@/lib/investor-dashboard-data";
import { requireInvestorSession } from "@/lib/investor-session";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { locale: Locale } }): Metadata {
  if (!isLocale(params.locale)) return {};
  const page = getInvestorStrings(params.locale).pages.allocations;
  return { title: `${page.title} | OTIZ CAPITAL`, description: page.description };
}

export default async function InvestorAllocationsRoute({ params }: { params: { locale: Locale } }) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  const investor = await requireInvestorSession(params.locale);
  const [data, comparisonEnabled] = await Promise.all([
    getInvestorDashboardData(investor),
    isProductFeatureEnabled("deal-comparison")
  ]);
  const page = getInvestorStrings(params.locale).pages.allocations;

  return (
    <InvestorShell locale={params.locale} investor={investor} active="allocations" eyebrow={page.eyebrow} title={page.title} description={page.description}>
      {comparisonEnabled ? <div className="mb-6"><InvestorDealComparison locale={params.locale} allocations={data.allocations} /></div> : null}
      <InvestorAllocationsPage locale={params.locale} data={data} />
    </InvestorShell>
  );
}

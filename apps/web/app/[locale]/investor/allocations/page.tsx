import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@otiz/lib";
import { InvestorAllocationsPage, InvestorShell } from "@/components/investor/investor-pages";
import { getInvestorDashboardData } from "@/lib/investor-dashboard-data";
import { requireInvestorSession } from "@/lib/investor-session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Investor Allocations | OTIZ CAPITAL",
  description: "Investor allocation cycles for electronics commerce operations."
};

export default async function InvestorAllocationsRoute({ params }: { params: { locale: Locale } }) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  const investor = await requireInvestorSession(params.locale);
  const data = await getInvestorDashboardData(investor);

  return (
    <InvestorShell locale={params.locale} investor={investor} active="allocations" eyebrow="Supply cycle visibility" title="Allocations" description="Allocation cards show commerce supply IDs, product focus, cycle status, and latest operational update.">
      <InvestorAllocationsPage locale={params.locale} data={data} />
    </InvestorShell>
  );
}

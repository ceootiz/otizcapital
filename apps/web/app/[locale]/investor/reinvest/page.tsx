import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@otiz/lib";
import { InvestorReinvestPage, InvestorShell } from "@/components/investor/investor-pages";
import { getInvestorDashboardData } from "@/lib/investor-dashboard-data";
import { requireInvestorSession } from "@/lib/investor-session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Investor Reinvest | OTIZ CAPITAL",
  description: "Reinvest preference foundation for OTIZ CAPITAL investors."
};

export default async function InvestorReinvestRoute({ params }: { params: { locale: Locale } }) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  const investor = await requireInvestorSession(params.locale);
  const data = await getInvestorDashboardData(investor);

  return (
    <InvestorShell locale={params.locale} investor={investor} active="reinvest" eyebrow="Instruction preference" title="Reinvest" description="A simple preference interface for reinvest instructions, intentionally separated from real money movement.">
      <InvestorReinvestPage enabled={data.summary.reinvestEnabled} />
    </InvestorShell>
  );
}

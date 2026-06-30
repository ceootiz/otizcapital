import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@otiz/lib";
import { InvestorDashboardHome, InvestorShell } from "@/components/investor/investor-pages";
import { getInvestorDashboardData } from "@/lib/investor-dashboard-data";
import { requireInvestorSession } from "@/lib/investor-session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Investor Dashboard | OTIZ CAPITAL",
  description: "Operational commerce capital dashboard for OTIZ CAPITAL investors."
};

export default async function InvestorDashboardRoute({ params }: { params: { locale: Locale } }) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  const investor = await requireInvestorSession(params.locale);
  const data = await getInvestorDashboardData(investor);

  return (
    <InvestorShell locale={params.locale} investor={investor} active="dashboard" eyebrow="Operational commerce capital" title="Investor dashboard" description="A calm view of active capital, commerce cycles, reporting posture, and pending payout instructions.">
      <InvestorDashboardHome locale={params.locale} data={data} />
    </InvestorShell>
  );
}

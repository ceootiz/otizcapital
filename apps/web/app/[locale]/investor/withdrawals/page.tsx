import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@otiz/lib";
import { InvestorShell, InvestorWithdrawalsPage } from "@/components/investor/investor-pages";
import { getInvestorDashboardData } from "@/lib/investor-dashboard-data";
import { requireInvestorSession } from "@/lib/investor-session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Investor Withdrawals | OTIZ CAPITAL",
  description: "Withdrawal request foundation for OTIZ CAPITAL investors."
};

export default async function InvestorWithdrawalsRoute({ params }: { params: { locale: Locale } }) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  const investor = await requireInvestorSession(params.locale);
  const data = await getInvestorDashboardData(investor);

  return (
    <InvestorShell locale={params.locale} investor={investor} active="withdrawals" eyebrow="Manager-reviewed requests" title="Withdrawals" description="Request review and cooldown visibility without real payment processing or money movement.">
      <InvestorWithdrawalsPage withdrawals={data.withdrawals} summary={data.summary} />
    </InvestorShell>
  );
}

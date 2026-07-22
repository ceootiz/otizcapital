import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getInvestorWithdrawalLockStatus } from "@otiz/database";
import { isLocale, type Locale } from "@otiz/lib";
import { InvestorShell, InvestorWithdrawalsPage, getInvestorStrings } from "@/components/investor/investor-pages";
import { getInvestorDashboardData } from "@/lib/investor-dashboard-data";
import { requireInvestorSession } from "@/lib/investor-session";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const params = await props.params;
  if (!isLocale(params.locale)) return {};
  const page = getInvestorStrings(params.locale).pages.withdrawals;
  return { title: `${page.title} | OTIZ CAPITAL`, description: page.description };
}

export default async function InvestorWithdrawalsRoute(props: { params: Promise<{ locale: Locale }> }) {
  const params = await props.params;
  if (!isLocale(params.locale)) {
    notFound();
  }

  const investor = await requireInvestorSession(params.locale);
  const [data, withdrawalAccess] = await Promise.all([
    getInvestorDashboardData(investor),
    getInvestorWithdrawalLockStatus(investor.id)
  ]);
  const page = getInvestorStrings(params.locale).pages.withdrawals;

  return (
    <InvestorShell locale={params.locale} investor={investor} active="withdrawals" eyebrow={page.eyebrow} title={page.title} description={page.description}>
      <InvestorWithdrawalsPage locale={params.locale} withdrawals={data.withdrawals} summary={data.summary} withdrawalAccess={withdrawalAccess} />
    </InvestorShell>
  );
}

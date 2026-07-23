import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@otiz/lib";
import { getInvestorOnboardingStatus, isProductFeatureEnabled, listActiveDepositAddresses, serializeDepositAddress } from "@otiz/database";
import { InvestorDashboardHome, InvestorShell, getInvestorStrings } from "@/components/investor/investor-pages";
import { InvestorAutoRefresh } from "@/components/investor/investor-auto-refresh";
import { InvestorOfflineSnapshot } from "@/components/investor/investor-offline-snapshot";
import { InvestorOnboardingStatusCard } from "@/components/investor/investor-onboarding-status";
import { getInvestorDashboardData } from "@/lib/investor-dashboard-data";
import { requireInvestorSession } from "@/lib/investor-session";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const params = await props.params;
  if (!isLocale(params.locale)) return {};
  const page = getInvestorStrings(params.locale).pages.dashboard;
  return { title: `${page.title} | OTIZ CAPITAL`, description: page.description };
}

export default async function InvestorDashboardRoute(props: { params: Promise<{ locale: Locale }> }) {
  const params = await props.params;
  if (!isLocale(params.locale)) {
    notFound();
  }

  const investor = await requireInvestorSession(params.locale);
  const [data, onboardingEnabled, liveRefreshEnabled] = await Promise.all([
    getInvestorDashboardData(investor),
    isProductFeatureEnabled("onboarding-status"),
    isProductFeatureEnabled("investor-live-refresh")
  ]);
  const onboardingStatus = onboardingEnabled ? await getInvestorOnboardingStatus(investor.id) : null;
  const page = getInvestorStrings(params.locale).pages.dashboard;

  // Deposit addresses power the zero-allocation welcome view.
  const hasNoAllocations = data.summary.activeAllocationsCount === 0 && data.summary.completedAllocationsCount === 0;
  const depositAddresses = hasNoAllocations ? (await listActiveDepositAddresses()).map(serializeDepositAddress) : [];

  return (
    <InvestorShell locale={params.locale} investor={investor} active="dashboard" eyebrow={page.eyebrow} title={page.title} description={page.description}>
      <div className="space-y-8">
        {liveRefreshEnabled ? <InvestorAutoRefresh locale={params.locale} /> : null}
        <InvestorOfflineSnapshot
          locale={params.locale}
          summary={{
            availableBalance: data.summary.availableBalance,
            workingCapital: data.summary.workingCapital,
            pendingPayouts: data.summary.pendingPayouts,
            totalBalance: data.summary.totalBalance
          }}
        />
        {onboardingStatus ? <InvestorOnboardingStatusCard locale={params.locale} status={onboardingStatus} /> : null}
        <InvestorDashboardHome
          locale={params.locale}
          data={data}
          investorName={investor.fullName}
          depositAddresses={depositAddresses}
        />
      </div>
    </InvestorShell>
  );
}

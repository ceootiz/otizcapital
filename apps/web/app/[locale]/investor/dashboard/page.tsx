import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@otiz/lib";
import { getInvestorOnboardingStatus, getYieldSettings, isProductFeatureEnabled, listActiveDepositAddresses, serializeDepositAddress } from "@otiz/database";
import { InvestorDashboardHome, InvestorShell, getInvestorStrings } from "@/components/investor/investor-pages";
import { InvestorOnboardingStatusCard } from "@/components/investor/investor-onboarding-status";
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
  const [data, onboardingEnabled] = await Promise.all([
    getInvestorDashboardData(investor),
    isProductFeatureEnabled("onboarding-status")
  ]);
  const onboardingStatus = onboardingEnabled ? await getInvestorOnboardingStatus(investor.id) : null;
  const page = getInvestorStrings(params.locale).pages.dashboard;

  // Deposit addresses power the zero-allocation welcome view.
  const hasNoAllocations = data.summary.activeAllocationsCount === 0 && data.summary.completedAllocationsCount === 0;
  const depositAddresses = hasNoAllocations ? (await listActiveDepositAddresses()).map(serializeDepositAddress) : [];

  // Effective annual yield rate: the investor's promo-code override if set,
  // otherwise the global YieldSettings rate.
  const yieldSettings = await getYieldSettings();
  const hasCustomRate = investor.yieldRateOverride != null;
  const annualRatePercent = hasCustomRate ? Number(investor.yieldRateOverride) : yieldSettings.annualRatePercent;

  return (
    <InvestorShell locale={params.locale} investor={investor} active="dashboard" eyebrow={page.eyebrow} title={page.title} description={page.description}>
      <div className="space-y-8">
        {onboardingStatus ? <InvestorOnboardingStatusCard locale={params.locale} status={onboardingStatus} /> : null}
        <InvestorDashboardHome
          locale={params.locale}
          data={data}
          investorName={investor.fullName}
          depositAddresses={depositAddresses}
          annualRatePercent={annualRatePercent}
          hasCustomRate={hasCustomRate}
        />
      </div>
    </InvestorShell>
  );
}

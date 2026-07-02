import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@otiz/lib";
import { InvestorShell, getInvestorStrings } from "@/components/investor/investor-pages";
import { InvestorSettingsPage } from "@/components/investor/investor-settings-page";
import { requireInvestorSession } from "@/lib/investor-session";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { locale: Locale } }): Metadata {
  if (!isLocale(params.locale)) return {};
  const page = getInvestorStrings(params.locale).pages.settings;
  return { title: `${page.title} | OTIZ CAPITAL`, description: page.description };
}

export default async function InvestorSettingsRoute({ params }: { params: { locale: Locale } }) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  const investor = await requireInvestorSession(params.locale);
  const page = getInvestorStrings(params.locale).pages.settings;

  return (
    <InvestorShell locale={params.locale} investor={investor} active="settings" eyebrow={page.eyebrow} title={page.title} description={page.description}>
      <InvestorSettingsPage
        locale={params.locale}
        hasPassword={Boolean(investor.passwordHash)}
        emailNotificationsEnabled={investor.emailNotificationsEnabled}
      />
    </InvestorShell>
  );
}

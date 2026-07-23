import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@otiz/lib";
import { isProductFeatureEnabled, listActiveDepositAddresses, serializeDepositAddress } from "@otiz/database";
import { InvestorShell, InvestorDepositPage, getInvestorStrings } from "@/components/investor/investor-pages";
import { requireInvestorSession } from "@/lib/investor-session";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const params = await props.params;
  if (!isLocale(params.locale)) return {};
  const page = getInvestorStrings(params.locale).pages.deposit;
  return { title: `${page.title} | OTIZ CAPITAL`, description: page.description };
}

export default async function InvestorDepositRoute(props: { params: Promise<{ locale: Locale }> }) {
  const params = await props.params;
  if (!isLocale(params.locale)) {
    notFound();
  }

  const investor = await requireInvestorSession(params.locale);
  const [addressRows, trackerEnabled] = await Promise.all([
    listActiveDepositAddresses(),
    isProductFeatureEnabled("investor-deposit-tracker")
  ]);
  const addresses = addressRows.map(serializeDepositAddress);
  const page = getInvestorStrings(params.locale).pages.deposit;

  return (
    <InvestorShell locale={params.locale} investor={investor} active="deposit" eyebrow={page.eyebrow} title={page.title} description={page.description}>
      <InvestorDepositPage locale={params.locale} addresses={addresses} trackerEnabled={trackerEnabled} />
    </InvestorShell>
  );
}

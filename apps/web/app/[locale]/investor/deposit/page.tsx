import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@otiz/lib";
import { listActiveDepositAddresses, serializeDepositAddress } from "@otiz/database";
import { InvestorShell, InvestorDepositPage, getInvestorStrings } from "@/components/investor/investor-pages";
import { requireInvestorSession } from "@/lib/investor-session";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { locale: Locale } }): Metadata {
  if (!isLocale(params.locale)) return {};
  const page = getInvestorStrings(params.locale).pages.deposit;
  return { title: `${page.title} | OTIZ CAPITAL`, description: page.description };
}

export default async function InvestorDepositRoute({ params }: { params: { locale: Locale } }) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  const investor = await requireInvestorSession(params.locale);
  const addresses = (await listActiveDepositAddresses()).map(serializeDepositAddress);
  const page = getInvestorStrings(params.locale).pages.deposit;

  return (
    <InvestorShell locale={params.locale} investor={investor} active="deposit" eyebrow={page.eyebrow} title={page.title} description={page.description}>
      <InvestorDepositPage locale={params.locale} addresses={addresses} />
    </InvestorShell>
  );
}

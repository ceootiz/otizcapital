import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@otiz/lib";
import { getInvestorPaymentTotals, listInvestorPayments, serializeInvestorPayment } from "@otiz/database";
import { InvestorHistoryPage, InvestorShell, getInvestorStrings } from "@/components/investor/investor-pages";
import { requireInvestorSession } from "@/lib/investor-session";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { locale: Locale } }): Metadata {
  if (!isLocale(params.locale)) return {};
  const page = getInvestorStrings(params.locale).pages.history;
  return { title: `${page.title} | OTIZ CAPITAL`, description: page.description };
}

export default async function InvestorHistoryRoute({ params }: { params: { locale: Locale } }) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  const investor = await requireInvestorSession(params.locale);
  const [payments, totals] = await Promise.all([
    listInvestorPayments(investor.id),
    getInvestorPaymentTotals(investor.id)
  ]);
  const page = getInvestorStrings(params.locale).pages.history;

  return (
    <InvestorShell locale={params.locale} investor={investor} active="history" eyebrow={page.eyebrow} title={page.title} description={page.description}>
      <InvestorHistoryPage locale={params.locale} payments={payments.map(serializeInvestorPayment)} totals={totals} />
    </InvestorShell>
  );
}

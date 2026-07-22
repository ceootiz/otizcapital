import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@otiz/lib";
import { getInvestorLedger, getInvestorPaymentTotals, isProductFeatureEnabled, listInvestorPayments, serializeInvestorPayment } from "@otiz/database";
import { InvestorHistoryPage, InvestorShell, getInvestorStrings } from "@/components/investor/investor-pages";
import { InvestorMoneyMovementPage } from "@/components/investor/investor-money-movement-page";
import { requireInvestorSession } from "@/lib/investor-session";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const params = await props.params;
  if (!isLocale(params.locale)) return {};
  const page = getInvestorStrings(params.locale).pages.history;
  return { title: `${page.title} | OTIZ CAPITAL`, description: page.description };
}

function first(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

export default async function InvestorHistoryRoute(
  props: { params: Promise<{ locale: Locale }>; searchParams: Promise<Record<string, string | string[] | undefined>> }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  if (!isLocale(params.locale)) {
    notFound();
  }

  const investor = await requireInvestorSession(params.locale);
  const [enabled, statementsEnabled, performanceEnabled] = await Promise.all([
    isProductFeatureEnabled("money-movement"),
    isProductFeatureEnabled("account-statements"),
    isProductFeatureEnabled("performance-charts")
  ]);
  const [payments, totals] = await Promise.all([
    listInvestorPayments(investor.id),
    getInvestorPaymentTotals(investor.id)
  ]);
  const page = getInvestorStrings(params.locale).pages.history;

  if (enabled) {
    const type = first(searchParams.type);
    const from = first(searchParams.from);
    const to = first(searchParams.to);
    const [ledger, performanceLedger] = await Promise.all([
      getInvestorLedger(investor.id, {
        type,
        from,
        to: to ? `${to}T23:59:59.999Z` : null,
        page: first(searchParams.page)
      }),
      performanceEnabled ? getInvestorLedger(investor.id, { pageSize: 10000 }) : Promise.resolve(null)
    ]);

    return <InvestorShell locale={params.locale} investor={investor} active="history" eyebrow={page.eyebrow} title={page.title} description={page.description}>
      <InvestorMoneyMovementPage locale={params.locale} ledger={ledger} totals={totals} filters={{ type, from, to }} statementsEnabled={statementsEnabled} performanceEnabled={performanceEnabled} performanceEntries={performanceLedger?.entries ?? []} />
    </InvestorShell>;
  }

  return (
    <InvestorShell locale={params.locale} investor={investor} active="history" eyebrow={page.eyebrow} title={page.title} description={page.description}>
      <InvestorHistoryPage locale={params.locale} payments={payments.map(serializeInvestorPayment)} totals={totals} />
    </InvestorShell>
  );
}

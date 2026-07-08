import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@otiz/lib";
import { getInvestorLedger, getInvestorPaymentTotals } from "@otiz/database";
import { InvestorHistoryPage, InvestorShell, getInvestorStrings } from "@/components/investor/investor-pages";
import { requireInvestorSession } from "@/lib/investor-session";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { locale: Locale } }): Metadata {
  if (!isLocale(params.locale)) return {};
  const page = getInvestorStrings(params.locale).ledger;
  return { title: `${page.title} | OTIZ CAPITAL`, description: page.description };
}

function firstParam(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

export default async function InvestorHistoryRoute({
  params,
  searchParams
}: {
  params: { locale: Locale };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  const investor = await requireInvestorSession(params.locale);

  const type = firstParam(searchParams.type);
  const from = firstParam(searchParams.from);
  const to = firstParam(searchParams.to);
  const pageParam = firstParam(searchParams.page);

  const [ledger, totals] = await Promise.all([
    getInvestorLedger(investor.id, {
      type: type || null,
      from: from || null,
      // A date-only "to" is expanded to end-of-day so the range stays inclusive.
      to: to ? `${to}T23:59:59.999Z` : null,
      page: pageParam || null
    }),
    getInvestorPaymentTotals(investor.id)
  ]);

  const page = getInvestorStrings(params.locale).ledger;

  return (
    <InvestorShell locale={params.locale} investor={investor} active="history" eyebrow={page.eyebrow} title={page.title} description={page.description}>
      <InvestorHistoryPage locale={params.locale} ledger={ledger} totals={totals} filters={{ type, from, to }} />
    </InvestorShell>
  );
}

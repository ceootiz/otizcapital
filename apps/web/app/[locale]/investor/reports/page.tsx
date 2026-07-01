import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@otiz/lib";
import { InvestorReportsPage, InvestorShell, getInvestorStrings } from "@/components/investor/investor-pages";
import { listPublishedMonthlyReportsForInvestor, serializeMonthlyReport } from "@otiz/database";
import { requireInvestorSession } from "@/lib/investor-session";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { locale: Locale } }): Metadata {
  if (!isLocale(params.locale)) return {};
  const page = getInvestorStrings(params.locale).pages.reports;
  return { title: `${page.title} | OTIZ CAPITAL`, description: page.description };
}

export default async function InvestorReportsRoute({ params }: { params: { locale: Locale } }) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  const investor = await requireInvestorSession(params.locale);
  const reports = await listPublishedMonthlyReportsForInvestor(investor.id);
  const page = getInvestorStrings(params.locale).pages.reports;

  return (
    <InvestorShell locale={params.locale} investor={investor} active="reports" eyebrow={page.eyebrow} title={page.title} description={page.description}>
      <InvestorReportsPage locale={params.locale} reports={reports.map(serializeMonthlyReport)} />
    </InvestorShell>
  );
}

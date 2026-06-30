import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@otiz/lib";
import { InvestorReportsPage, InvestorShell } from "@/components/investor/investor-pages";
import { listPublishedMonthlyReportsForInvestor, serializeMonthlyReport } from "@otiz/database";
import { requireInvestorSession } from "@/lib/investor-session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Investor Reports | OTIZ CAPITAL",
  description: "Monthly operational reports for OTIZ CAPITAL investors."
};

export default async function InvestorReportsRoute({ params }: { params: { locale: Locale } }) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  const investor = await requireInvestorSession(params.locale);
  const reports = await listPublishedMonthlyReportsForInvestor(investor.id);

  return (
    <InvestorShell locale={params.locale} investor={investor} active="reports" eyebrow="Monthly reporting" title="Reports" description="Monthly summaries keep the focus on allocations, performance, payouts, and operational notes.">
      <InvestorReportsPage locale={params.locale} reports={reports.map(serializeMonthlyReport)} />
    </InvestorShell>
  );
}

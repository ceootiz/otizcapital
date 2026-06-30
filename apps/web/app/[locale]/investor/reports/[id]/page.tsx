import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getInvestorMonthlyReportDetailRecord, serializeMonthlyReportDetail } from "@otiz/database";
import { isLocale, type Locale } from "@otiz/lib";
import { InvestorReportDetailPage } from "@/components/investor/investor-report-detail-page";
import { requireInvestorSession } from "@/lib/investor-session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Investor Report Detail | OTIZ CAPITAL",
  description: "Published monthly report detail for OTIZ CAPITAL investors."
};

export default async function InvestorReportDetailRoute({ params }: { params: { locale: Locale; id: string } }) {
  if (!isLocale(params.locale)) notFound();
  const investor = await requireInvestorSession(params.locale);
  const report = await getInvestorMonthlyReportDetailRecord({ id: params.id, investorId: investor.id });
  if (!report) notFound();
  return <InvestorReportDetailPage locale={params.locale} investor={investor} report={serializeMonthlyReportDetail(report)} />;
}

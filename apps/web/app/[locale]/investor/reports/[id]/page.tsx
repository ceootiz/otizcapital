import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getInvestorMonthlyReportDetailRecord, serializeMonthlyReportDetail } from "@otiz/database";
import { isLocale, type Locale } from "@otiz/lib";
import { InvestorReportDetailPage } from "@/components/investor/investor-report-detail-page";
import { requireInvestorSession } from "@/lib/investor-session";

export const dynamic = "force-dynamic";

const META = {
  en: {
    title: "Investor Report Detail | OTIZ CAPITAL",
    description: "Published monthly report detail for OTIZ CAPITAL investors."
  },
  ru: {
    title: "Детали отчёта инвестора | OTIZ CAPITAL",
    description: "Детали опубликованного ежемесячного отчёта для инвесторов OTIZ CAPITAL."
  }
} as const;

export async function generateMetadata(props: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const params = await props.params;
  const meta = (META as unknown as Record<string, (typeof META)["en"]>)[params.locale] ?? META.en;
  return {
    title: meta.title,
    description: meta.description
  };
}

export default async function InvestorReportDetailRoute(props: { params: Promise<{ locale: Locale; id: string }> }) {
  const params = await props.params;
  if (!isLocale(params.locale)) notFound();
  const investor = await requireInvestorSession(params.locale);
  const report = await getInvestorMonthlyReportDetailRecord({ id: params.id, investorId: investor.id });
  if (!report) notFound();
  return <InvestorReportDetailPage locale={params.locale} investor={investor} report={serializeMonthlyReportDetail(report)} />;
}

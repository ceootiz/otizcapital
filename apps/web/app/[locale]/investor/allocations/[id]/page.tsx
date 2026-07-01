import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { calculateAllocationProofCompleteness, calculateAllocationRisk, getInvestorAllocationDetailRecord, getInvestorSafeProofHealth, serializeAllocationDetail } from "@otiz/database";
import { isLocale, type Locale } from "@otiz/lib";
import { InvestorAllocationDetailPage } from "@/components/investor/investor-allocation-detail-page";
import { requireInvestorSession } from "@/lib/investor-session";

export const dynamic = "force-dynamic";

const META = {
  en: { title: "Investor Allocation Detail | OTIZ CAPITAL", description: "Investor allocation proof and status detail." },
  ru: { title: "Детали аллокации инвестора | OTIZ CAPITAL", description: "Подтверждения и статус аллокации инвестора." }
} as const;

export function generateMetadata({ params }: { params: { locale: Locale } }): Metadata {
  const meta = (META as unknown as Record<string, (typeof META)["en"]>)[params.locale] ?? META.en;
  return { title: meta.title, description: meta.description };
}

export default async function InvestorAllocationDetailRoute({ params }: { params: { locale: Locale; id: string } }) {
  if (!isLocale(params.locale)) notFound();
  const investor = await requireInvestorSession(params.locale);
  const allocation = await getInvestorAllocationDetailRecord({ id: params.id, investorId: investor.id });
  if (!allocation) notFound();
  const [proofCompleteness, risk] = await Promise.all([
    calculateAllocationProofCompleteness(allocation.id),
    calculateAllocationRisk(allocation.id)
  ]);
  return <InvestorAllocationDetailPage locale={params.locale} investor={investor} allocation={{ ...serializeAllocationDetail(allocation), proofHealth: proofCompleteness ? getInvestorSafeProofHealth(proofCompleteness) : null, riskHealth: risk?.investorSafeSummary ?? null }} />;
}

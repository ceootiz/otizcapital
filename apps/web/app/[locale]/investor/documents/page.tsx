import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@otiz/lib";
import { listInvestorDocuments, serializeInvestorDocument } from "@otiz/database";
import { InvestorShell, getInvestorStrings } from "@/components/investor/investor-pages";
import { InvestorDocumentsPage } from "@/components/investor/investor-documents-page";
import { requireInvestorSession } from "@/lib/investor-session";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const params = await props.params;
  if (!isLocale(params.locale)) return {};
  const page = getInvestorStrings(params.locale).pages.documents;
  return { title: `${page.title} | OTIZ CAPITAL`, description: page.description };
}

export default async function InvestorDocumentsRoute(props: { params: Promise<{ locale: Locale }> }) {
  const params = await props.params;
  if (!isLocale(params.locale)) {
    notFound();
  }

  const investor = await requireInvestorSession(params.locale);
  const documents = await listInvestorDocuments(investor.id);
  const page = getInvestorStrings(params.locale).pages.documents;

  return (
    <InvestorShell locale={params.locale} investor={investor} active="documents" eyebrow={page.eyebrow} title={page.title} description={page.description}>
      <InvestorDocumentsPage locale={params.locale} documents={documents.map(serializeInvestorDocument)} />
    </InvestorShell>
  );
}

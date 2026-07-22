import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isLocale, type Locale } from "@otiz/lib";
import { InvestorLoginPage } from "@/components/investor/investor-login-page";
import { getValidatedInvestorSession } from "@/lib/investor-session";

export const dynamic = "force-dynamic";

const META = {
  en: { title: "Investor Login | OTIZ CAPITAL", description: "Investor access for OTIZ CAPITAL commerce capital reporting." },
  ru: { title: "Вход для инвестора | OTIZ CAPITAL", description: "Доступ инвестора к отчётности OTIZ CAPITAL по коммерческому капиталу." }
} as const;

export async function generateMetadata(props: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const params = await props.params;
  const meta = (META as unknown as Record<string, (typeof META)["en"]>)[params.locale] ?? META.en;
  return { title: meta.title, description: meta.description };
}

export default async function InvestorLoginRoute(props: { params: Promise<{ locale: Locale }> }) {
  const params = await props.params;
  if (!isLocale(params.locale)) {
    redirect("/en/investor/login");
  }

  // DB-validated so a terminated-but-present cookie doesn't loop back to the
  // cabinet (which would then bounce here again).
  if (await getValidatedInvestorSession()) {
    redirect(`/${params.locale}/investor/dashboard`);
  }

  return <InvestorLoginPage locale={params.locale} />;
}

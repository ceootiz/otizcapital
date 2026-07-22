import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@otiz/lib";
import { InvestorForgotPasswordPage } from "@/components/investor/investor-forgot-password-page";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const params = await props.params;
  if (!isLocale(params.locale)) return {};
  const title = params.locale === "ru" ? "Сброс пароля" : "Reset password";
  return { title: `${title} | OTIZ CAPITAL`, robots: { index: false, follow: false } };
}

export default async function InvestorForgotPasswordRoute(props: { params: Promise<{ locale: Locale }> }) {
  const params = await props.params;
  if (!isLocale(params.locale)) {
    notFound();
  }

  return <InvestorForgotPasswordPage locale={params.locale} />;
}

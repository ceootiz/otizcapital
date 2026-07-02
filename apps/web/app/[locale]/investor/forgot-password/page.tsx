import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@otiz/lib";
import { InvestorForgotPasswordPage } from "@/components/investor/investor-forgot-password-page";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { locale: Locale } }): Metadata {
  if (!isLocale(params.locale)) return {};
  const title = params.locale === "ru" ? "Сброс пароля" : "Reset password";
  return { title: `${title} | OTIZ CAPITAL`, robots: { index: false, follow: false } };
}

export default function InvestorForgotPasswordRoute({ params }: { params: { locale: Locale } }) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  return <InvestorForgotPasswordPage locale={params.locale} />;
}

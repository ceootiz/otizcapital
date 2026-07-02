import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@otiz/lib";
import { InvestorResetPasswordPage } from "@/components/investor/investor-reset-password-page";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { locale: Locale } }): Metadata {
  if (!isLocale(params.locale)) return {};
  const title = params.locale === "ru" ? "Новый пароль" : "New password";
  return { title: `${title} | OTIZ CAPITAL`, robots: { index: false, follow: false } };
}

export default function InvestorResetPasswordRoute({
  params,
  searchParams
}: {
  params: { locale: Locale };
  searchParams: { token?: string };
}) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  const token = typeof searchParams.token === "string" ? searchParams.token : "";
  return <InvestorResetPasswordPage locale={params.locale} token={token} />;
}

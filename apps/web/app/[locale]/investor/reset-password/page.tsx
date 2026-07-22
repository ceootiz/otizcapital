import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@otiz/lib";
import { InvestorResetPasswordPage } from "@/components/investor/investor-reset-password-page";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const params = await props.params;
  if (!isLocale(params.locale)) return {};
  const title = params.locale === "ru" ? "Новый пароль" : "New password";
  return { title: `${title} | OTIZ CAPITAL`, robots: { index: false, follow: false } };
}

export default async function InvestorResetPasswordRoute(
  props: {
    params: Promise<{ locale: Locale }>;
    searchParams: Promise<{ token?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  if (!isLocale(params.locale)) {
    notFound();
  }

  const token = typeof searchParams.token === "string" ? searchParams.token : "";
  return <InvestorResetPasswordPage locale={params.locale} token={token} />;
}

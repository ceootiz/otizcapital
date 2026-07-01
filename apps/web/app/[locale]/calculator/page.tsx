import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, locales, type Locale } from "@otiz/lib";
import { getYieldSettings } from "@otiz/database";
import { CalculatorPage } from "@/components/calculator/calculator-page";

// ISR: the annual rate rarely changes; revalidate periodically (admin edits are rare).
export const revalidate = 60;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const META: Partial<Record<Locale, { title: string; description: string }>> = {
  en: { title: "Yield Calculator | OTIZ CAPITAL", description: "Project your returns at OTIZ CAPITAL's current allocation rate." },
  ru: { title: "Калькулятор доходности | OTIZ CAPITAL", description: "Рассчитайте доход по текущей ставке аллокации OTIZ CAPITAL." }
};

export function generateMetadata({ params }: { params: { locale: Locale } }): Metadata {
  if (!isLocale(params.locale)) {
    return {};
  }

  const meta = META[params.locale] ?? META.en;
  if (!meta) {
    return {};
  }

  return {
    title: meta.title,
    description: meta.description,
    openGraph: {
      title: meta.title,
      description: meta.description,
      type: "website",
      url: `/${params.locale}/calculator`,
      images: ["/og.png"],
      siteName: "OTIZ CAPITAL",
      locale: params.locale
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      images: ["/og.png"]
    }
  };
}

export default async function CalculatorRoute({ params }: { params: { locale: Locale } }) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  const settings = await getYieldSettings();

  return <CalculatorPage locale={params.locale} annualRate={settings.annualRatePercent} />;
}

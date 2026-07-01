import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, locales, type Locale } from "@otiz/lib";
import { getYieldSettings } from "@otiz/database";
import { HomePage } from "@/components/home/home-page";
import { getHomeContent } from "@/lib/site-content";

// ISR: statically generated per locale, revalidated periodically and on demand
// (the admin content editor calls revalidatePath after a save).
export const revalidate = 60;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  if (!isLocale(params.locale)) {
    return {};
  }

  const dictionary = await getHomeContent(params.locale);

  return {
    title: dictionary.meta.title,
    description: dictionary.meta.description,
    alternates: {
      canonical: `/${params.locale}`,
      languages: Object.fromEntries(locales.map((locale) => [locale, `/${locale}`]))
    }
  };
}

export default async function LocaleHomePage({ params }: { params: { locale: Locale } }) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  const [dictionary, settings] = await Promise.all([getHomeContent(params.locale), getYieldSettings()]);

  return <HomePage dictionary={dictionary} locale={params.locale} annualRate={settings.annualRatePercent} />;
}

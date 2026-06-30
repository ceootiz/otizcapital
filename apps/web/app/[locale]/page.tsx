import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getHomeDictionary, isLocale, locales, type Locale } from "@otiz/lib";
import { HomePage } from "@/components/home/home-page";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  if (!isLocale(params.locale)) {
    return {};
  }

  const dictionary = getHomeDictionary(params.locale);

  return {
    title: dictionary.meta.title,
    description: dictionary.meta.description,
    alternates: {
      canonical: `/${params.locale}`,
      languages: Object.fromEntries(locales.map((locale) => [locale, `/${locale}`]))
    }
  };
}

export default function LocaleHomePage({ params }: { params: { locale: Locale } }) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  return <HomePage dictionary={getHomeDictionary(params.locale)} locale={params.locale} />;
}

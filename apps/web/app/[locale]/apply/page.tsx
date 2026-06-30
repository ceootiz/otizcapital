import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getApplyDictionary, isLocale, locales, type Locale } from "@otiz/lib";
import { ApplicationPage } from "@/components/apply/application-page";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  if (!isLocale(params.locale)) {
    return {};
  }

  const dictionary = getApplyDictionary(params.locale);

  return {
    title: dictionary.meta.title,
    description: dictionary.meta.description,
    alternates: {
      canonical: `/${params.locale}/apply`,
      languages: Object.fromEntries(locales.map((locale) => [locale, `/${locale}/apply`]))
    }
  };
}

export default function ApplyPage({ params }: { params: { locale: Locale } }) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  return <ApplicationPage dictionary={getApplyDictionary(params.locale)} locale={params.locale} />;
}

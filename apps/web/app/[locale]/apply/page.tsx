import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCountryOptions, isLocale, locales, type Locale } from "@otiz/lib";
import { ApplicationPage } from "@/components/apply/application-page";
import { getApplyContent } from "@/lib/site-content";

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

  const dictionary = await getApplyContent(params.locale);

  return {
    title: dictionary.meta.title,
    description: dictionary.meta.description,
    alternates: {
      canonical: `/${params.locale}/apply`,
      languages: Object.fromEntries(locales.map((locale) => [locale, `/${locale}/apply`]))
    }
  };
}

export default async function ApplyPage({ params }: { params: { locale: Locale } }) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  const countryOptions = getCountryOptions(params.locale);

  return (
    <ApplicationPage
      dictionary={await getApplyContent(params.locale)}
      locale={params.locale}
      countryOptions={countryOptions}
    />
  );
}

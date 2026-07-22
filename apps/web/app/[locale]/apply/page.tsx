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

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
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
    },
    openGraph: {
      title: dictionary.meta.title,
      description: dictionary.meta.description,
      type: "website",
      url: `/${params.locale}/apply`,
      images: ["/og.png"],
      siteName: "OTIZ CAPITAL",
      locale: params.locale
    },
    twitter: {
      card: "summary_large_image",
      title: dictionary.meta.title,
      description: dictionary.meta.description,
      images: ["/og.png"]
    }
  };
}

export default async function ApplyPage(props: { params: Promise<{ locale: Locale }> }) {
  const params = await props.params;
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

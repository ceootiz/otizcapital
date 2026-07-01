import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, locales, type Locale } from "@otiz/lib";
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
    },
    openGraph: {
      title: dictionary.meta.title,
      description: dictionary.meta.description,
      type: "website",
      url: `/${params.locale}`,
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

export default async function LocaleHomePage({ params }: { params: { locale: Locale } }) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  const dictionary = await getHomeContent(params.locale);

  return <HomePage dictionary={dictionary} locale={params.locale} />;
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@otiz/lib";
import { AdminContentPage } from "@/components/admin/admin-content-page";
import { requireAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

const META: Partial<Record<Locale, { title: string; description: string }>> = {
  en: {
    title: "Content Management | OTIZ CAPITAL",
    description: "Protected admin editor for public homepage and application-page content."
  },
  ru: {
    title: "Управление контентом | OTIZ CAPITAL",
    description: "Защищённый редактор контента главной страницы и страницы заявки."
  }
};

export async function generateMetadata(props: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const params = await props.params;
  if (!isLocale(params.locale)) {
    return {};
  }
  return META[params.locale] ?? META.en ?? {};
}

export default async function ContentAdminRoute(props: { params: Promise<{ locale: Locale }> }) {
  const params = await props.params;
  if (!isLocale(params.locale)) {
    notFound();
  }

  requireAdminSession(params.locale);

  return <AdminContentPage locale={params.locale} />;
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@otiz/lib";
import { AdminApplicationsPage } from "@/components/admin/admin-applications-page";
import { requireAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

const META = {
  en: {
    title: "Admin Applications | OTIZ CAPITAL",
    description: "Protected MVP admin view for investor application leads."
  },
  ru: {
    title: "Заявки — Админ | OTIZ CAPITAL",
    description: "Защищённый админ-раздел для лидов из заявок инвесторов."
  }
} as const;

export function generateMetadata({ params }: { params: { locale: Locale } }): Metadata {
  const meta = (META as unknown as Record<string, (typeof META)["en"]>)[params.locale] ?? META.en;

  return {
    title: meta.title,
    description: meta.description
  };
}

export default function ApplicationsAdminRoute({ params }: { params: { locale: Locale } }) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  requireAdminSession(params.locale);

  return <AdminApplicationsPage locale={params.locale} />;
}

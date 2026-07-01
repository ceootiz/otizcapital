import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getOperationalIncidents, serializeOperationalIncident } from "@otiz/database";
import { isLocale, type Locale } from "@otiz/lib";
import { AdminIncidentsPage } from "@/components/admin/admin-incidents-page";
import { requireAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

const META = {
  en: {
    title: "Admin Incidents | OTIZ CAPITAL",
    description: "Protected operational incident center for risk, reconciliation, readiness, proof, withdrawal, and manual alerts."
  },
  ru: {
    title: "Инциденты (админ) | OTIZ CAPITAL",
    description: "Защищённый центр операционных инцидентов по рискам, сверке, готовности, подтверждениям, выводам средств и ручным оповещениям."
  }
} as const;

export function generateMetadata({ params }: { params: { locale: Locale } }): Metadata {
  const meta = (META as unknown as Record<string, (typeof META)["en"]>)[params.locale] ?? META.en;
  return { title: meta.title, description: meta.description };
}

export default async function AdminIncidentsRoute({ params, searchParams }: { params: { locale: Locale }; searchParams: { severity?: string; status?: string; source?: string } }) {
  if (!isLocale(params.locale)) notFound();
  requireAdminSession(params.locale);
  const incidents = await getOperationalIncidents({ severity: searchParams.severity, status: searchParams.status, source: searchParams.source, limit: 200 });
  return <AdminIncidentsPage locale={params.locale} incidents={incidents.map(serializeOperationalIncident)} />;
}

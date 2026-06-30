import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getOperationalIncidents, serializeOperationalIncident } from "@otiz/database";
import { isLocale, type Locale } from "@otiz/lib";
import { AdminIncidentsPage } from "@/components/admin/admin-incidents-page";
import { requireAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Incidents | OTIZ CAPITAL",
  description: "Protected operational incident center for risk, reconciliation, readiness, proof, withdrawal, and manual alerts."
};

export default async function AdminIncidentsRoute({ params, searchParams }: { params: { locale: Locale }; searchParams: { severity?: string; status?: string; source?: string } }) {
  if (!isLocale(params.locale)) notFound();
  requireAdminSession(params.locale);
  const incidents = await getOperationalIncidents({ severity: searchParams.severity, status: searchParams.status, source: searchParams.source, limit: 200 });
  return <AdminIncidentsPage locale={params.locale} incidents={incidents.map(serializeOperationalIncident)} />;
}

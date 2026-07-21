import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isProductFeatureEnabled } from "@otiz/database";
import { isLocale, type Locale } from "@otiz/lib";
import { AdminAuditLogPage } from "@/components/admin/admin-audit-log-page";
import { requireAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

const META = {
  en: { title: "Audit log | OTIZ CAPITAL", description: "Protected history of important administrative actions." },
  ru: { title: "Журнал действий | OTIZ CAPITAL", description: "Защищённая история важных действий администратора." }
} as const;

export function generateMetadata({ params }: { params: { locale: Locale } }): Metadata {
  return (META as Record<string, Metadata>)[params.locale] ?? META.en;
}

export default async function AdminAuditLogRoute({ params }: { params: { locale: Locale } }) {
  if (!isLocale(params.locale)) notFound();
  requireAdminSession(params.locale);
  const enabled = await isProductFeatureEnabled("audit-log");
  return <AdminAuditLogPage locale={params.locale} enabled={enabled} />;
}

import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@otiz/lib";
import { AdminLegalPage } from "@/components/admin/admin-legal-page";
import { requireAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export default async function AdminLegalRoute(props: { params: Promise<{ locale: Locale }> }) {
  const params = await props.params;
  if (!isLocale(params.locale)) notFound();
  requireAdminSession(params.locale);
  return <AdminLegalPage locale={params.locale} />;
}

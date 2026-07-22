import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@otiz/lib";
import { getAdminDashboardData } from "@otiz/database";
import { AdminDashboardPage } from "@/components/admin/admin-dashboard-page";
import { requireAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export default async function AdminDashboardRoute(props: { params: Promise<{ locale: Locale }> }) {
  const params = await props.params;
  if (!isLocale(params.locale)) {
    notFound();
  }

  requireAdminSession(params.locale);
  const data = await getAdminDashboardData();

  return <AdminDashboardPage locale={params.locale} data={data} />;
}

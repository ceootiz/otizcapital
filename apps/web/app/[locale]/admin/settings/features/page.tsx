import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@otiz/lib";
import { getProductFeatureFlags } from "@otiz/database";
import { AdminFeatureFlagsPage } from "@/components/admin/admin-feature-flags-page";
import { requireAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export default async function AdminFeatureFlagsRoute(props: { params: Promise<{ locale: Locale }> }) {
  const params = await props.params;
  if (!isLocale(params.locale)) notFound();
  requireAdminSession(params.locale);
  return <AdminFeatureFlagsPage locale={params.locale} initialFlags={await getProductFeatureFlags()} />;
}

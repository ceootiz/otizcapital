import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@otiz/lib";
import { getSiteSettings } from "@otiz/database";
import { AdminContactSettingsPage } from "@/components/admin/admin-contact-settings-page";
import { requireAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export default async function AdminContactSettingsRoute(props: { params: Promise<{ locale: Locale }> }) {
  const params = await props.params;
  if (!isLocale(params.locale)) {
    notFound();
  }

  requireAdminSession(params.locale);
  const settings = await getSiteSettings();

  return <AdminContactSettingsPage locale={params.locale} initialTelegram={settings.contactTelegram} />;
}

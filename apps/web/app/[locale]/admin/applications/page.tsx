import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@otiz/lib";
import { AdminApplicationsPage } from "@/components/admin/admin-applications-page";
import { requireAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Applications | OTIZ CAPITAL",
  description: "Protected MVP admin view for investor application leads."
};

export default function ApplicationsAdminRoute({ params }: { params: { locale: Locale } }) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  requireAdminSession(params.locale);

  return <AdminApplicationsPage locale={params.locale} />;
}

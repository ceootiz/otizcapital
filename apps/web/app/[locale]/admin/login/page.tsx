import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isLocale, type Locale } from "@otiz/lib";
import { AdminLoginPage } from "@/components/admin/admin-login-page";
import { getAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Login | OTIZ CAPITAL",
  description: "Admin login for OTIZ CAPITAL investor applications."
};

export default function AdminLoginRoute({ params }: { params: { locale: Locale } }) {
  if (!isLocale(params.locale)) {
    redirect("/en/admin/login");
  }

  if (getAdminSession()) {
    redirect(`/${params.locale}/admin/applications`);
  }

  return <AdminLoginPage locale={params.locale} />;
}

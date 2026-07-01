import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isLocale, type Locale } from "@otiz/lib";
import { AdminLoginPage } from "@/components/admin/admin-login-page";
import { getAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

const METADATA_STRINGS: Record<string, { title: string; description: string }> = {
  en: {
    title: "Admin Login | OTIZ CAPITAL",
    description: "Admin login for OTIZ CAPITAL investor applications."
  },
  ru: {
    title: "Вход администратора | OTIZ CAPITAL",
    description: "Вход администратора для заявок инвесторов OTIZ CAPITAL."
  }
};

export function generateMetadata({ params }: { params: { locale: Locale } }): Metadata {
  const strings = METADATA_STRINGS[params.locale] ?? METADATA_STRINGS.en;
  return {
    title: strings.title,
    description: strings.description
  };
}

export default function AdminLoginRoute({ params }: { params: { locale: Locale } }) {
  if (!isLocale(params.locale)) {
    redirect("/en/admin/login");
  }

  if (getAdminSession()) {
    redirect(`/${params.locale}/admin/applications`);
  }

  return <AdminLoginPage locale={params.locale} />;
}

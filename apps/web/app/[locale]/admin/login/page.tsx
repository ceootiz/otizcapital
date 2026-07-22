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

export async function generateMetadata(props: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const params = await props.params;
  const strings = METADATA_STRINGS[params.locale] ?? METADATA_STRINGS.en;
  return {
    title: strings.title,
    description: strings.description
  };
}

export default async function AdminLoginRoute(props: { params: Promise<{ locale: Locale }> }) {
  const params = await props.params;
  if (!isLocale(params.locale)) {
    redirect("/en/admin/login");
  }

  if (getAdminSession()) {
    redirect(`/${params.locale}/admin/applications`);
  }

  return <AdminLoginPage locale={params.locale} />;
}

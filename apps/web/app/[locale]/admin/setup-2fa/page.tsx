import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@otiz/lib";
import { requireAdminSession } from "@/lib/admin-session";
import { generateAdminTotpSetup, isAdminTotpEnabled } from "@/lib/admin-totp";
import { AdminSetup2faPage } from "@/components/admin/admin-setup-2fa-page";

export const dynamic = "force-dynamic";

const META: Partial<Record<Locale, { title: string; description: string }>> = {
  en: { title: "Set up 2FA | OTIZ CAPITAL", description: "Configure two-factor authentication for admin access." },
  ru: { title: "Настройка 2FA | OTIZ CAPITAL", description: "Настройка двухфакторной аутентификации для доступа администратора." }
};

export function generateMetadata({ params }: { params: { locale: Locale } }): Metadata {
  if (!isLocale(params.locale)) return {};
  return META[params.locale] ?? META.en ?? {};
}

export default function AdminSetup2faRoute({ params }: { params: { locale: Locale } }) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  requireAdminSession(params.locale);

  const enabled = isAdminTotpEnabled();
  const setup = enabled ? null : generateAdminTotpSetup();

  return (
    <AdminSetup2faPage
      locale={params.locale}
      enabled={enabled}
      otpauthUrl={setup?.otpauthUrl ?? null}
      secret={setup?.secret ?? null}
    />
  );
}

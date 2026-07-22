import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listPromoCodes, serializePromoCode } from "@otiz/database";
import { isLocale, type Locale } from "@otiz/lib";
import { AdminPromoCodesPage } from "@/components/admin/admin-promo-codes-page";
import { requireAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

const META: Partial<Record<Locale, { title: string; description: string }>> = {
  en: {
    title: "Promo Codes | OTIZ CAPITAL",
    description: "Protected admin manager for promo codes granting custom investor yield rates."
  },
  ru: {
    title: "Промокоды | OTIZ CAPITAL",
    description: "Защищённое управление промокодами с индивидуальной доходностью для инвесторов."
  }
};

export async function generateMetadata(props: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const params = await props.params;
  if (!isLocale(params.locale)) {
    return {};
  }
  return META[params.locale] ?? META.en ?? {};
}

export default async function PromoCodesAdminRoute(props: { params: Promise<{ locale: Locale }> }) {
  const params = await props.params;
  if (!isLocale(params.locale)) {
    notFound();
  }

  requireAdminSession(params.locale);

  const rows = await listPromoCodes();
  const promoCodes = rows.map(serializePromoCode);

  return <AdminPromoCodesPage locale={params.locale} promoCodes={promoCodes} />;
}

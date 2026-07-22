import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listAllDepositAddresses, serializeDepositAddress } from "@otiz/database";
import { isLocale, type Locale } from "@otiz/lib";
import { AdminDepositAddressesPage } from "@/components/admin/admin-deposit-addresses-page";
import { requireAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

const META: Partial<Record<Locale, { title: string; description: string }>> = {
  en: {
    title: "Deposit Addresses | OTIZ CAPITAL",
    description: "Protected admin manager for crypto deposit addresses shown to investors."
  },
  ru: {
    title: "Пополнение | OTIZ CAPITAL",
    description: "Защищённое управление крипто-адресами для пополнения, которые видят инвесторы."
  }
};

export async function generateMetadata(props: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const params = await props.params;
  if (!isLocale(params.locale)) {
    return {};
  }
  return META[params.locale] ?? META.en ?? {};
}

export default async function DepositAddressesAdminRoute(props: { params: Promise<{ locale: Locale }> }) {
  const params = await props.params;
  if (!isLocale(params.locale)) {
    notFound();
  }

  requireAdminSession(params.locale);

  const rows = await listAllDepositAddresses();
  const addresses = rows.map(serializeDepositAddress);

  return <AdminDepositAddressesPage locale={params.locale} addresses={addresses} />;
}

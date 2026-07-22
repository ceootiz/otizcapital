import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listDepositNotificationsForAdmin, serializeAdminDepositNotification } from "@otiz/database";
import { isLocale, type Locale } from "@otiz/lib";
import { AdminDepositsPage } from "@/components/admin/admin-deposits-page";
import { requireAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

const META: Partial<Record<Locale, { title: string; description: string }>> = {
  en: { title: "Deposit confirmations | OTIZ CAPITAL", description: "Review and confirm investor deposits received by OTIZ." },
  ru: { title: "Подтверждение пополнений | OTIZ CAPITAL", description: "Проверка и подтверждение поступивших пополнений инвесторов." }
};

export function generateMetadata({ params }: { params: { locale: Locale } }): Metadata {
  const meta = META[params.locale] ?? META.en!;
  return { title: meta.title, description: meta.description };
}

export default async function AdminDepositsRoute({ params }: { params: { locale: Locale } }) {
  if (!isLocale(params.locale)) notFound();
  requireAdminSession(params.locale);
  const deposits = await listDepositNotificationsForAdmin();
  return <AdminDepositsPage locale={params.locale} initialDeposits={deposits.map(serializeAdminDepositNotification)} />;
}

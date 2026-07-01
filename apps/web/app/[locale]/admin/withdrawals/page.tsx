import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdminWithdrawalRequests, isWithdrawalRequestStatus, serializeAdminWithdrawalRequest, type WithdrawalRequestStatus } from "@otiz/database";
import { isLocale, type Locale } from "@otiz/lib";
import { AdminWithdrawalsPage } from "@/components/admin/admin-withdrawals-page";
import { requireAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

const META: Partial<Record<Locale, { title: string; description: string }>> = {
  en: { title: "Admin Withdrawals | OTIZ CAPITAL", description: "Protected admin payout schedule and withdrawal request management." },
  ru: { title: "Выводы средств администратора | OTIZ CAPITAL", description: "Защищённое управление графиком выплат и запросами на вывод средств." }
};

export function generateMetadata({ params }: { params: { locale: Locale } }): Metadata {
  const meta = META[params.locale] ?? META.en!;
  return { title: meta.title, description: meta.description };
}

export default async function AdminWithdrawalsRoute({ params, searchParams }: { params: { locale: Locale }; searchParams: { status?: string } }) {
  if (!isLocale(params.locale)) notFound();
  requireAdminSession(params.locale);
  const status = searchParams.status && isWithdrawalRequestStatus(searchParams.status) ? (searchParams.status as WithdrawalRequestStatus) : undefined;
  const withdrawals = await getAdminWithdrawalRequests({ status });
  return <AdminWithdrawalsPage locale={params.locale} withdrawals={withdrawals.map(serializeAdminWithdrawalRequest)} initialStatus={status || "ALL"} />;
}

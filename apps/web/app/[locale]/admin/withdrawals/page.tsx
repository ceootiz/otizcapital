import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdminWithdrawalRequests, isWithdrawalRequestStatus, serializeAdminWithdrawalRequest, type WithdrawalRequestStatus } from "@otiz/database";
import { isLocale, type Locale } from "@otiz/lib";
import { AdminWithdrawalsPage } from "@/components/admin/admin-withdrawals-page";
import { requireAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Withdrawals | OTIZ CAPITAL",
  description: "Protected admin payout schedule and withdrawal request management."
};

export default async function AdminWithdrawalsRoute({ params, searchParams }: { params: { locale: Locale }; searchParams: { status?: string } }) {
  if (!isLocale(params.locale)) notFound();
  requireAdminSession(params.locale);
  const status = searchParams.status && isWithdrawalRequestStatus(searchParams.status) ? (searchParams.status as WithdrawalRequestStatus) : undefined;
  const withdrawals = await getAdminWithdrawalRequests({ status });
  return <AdminWithdrawalsPage locale={params.locale} withdrawals={withdrawals.map(serializeAdminWithdrawalRequest)} initialStatus={status || "ALL"} />;
}

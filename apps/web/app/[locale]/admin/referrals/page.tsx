import { notFound } from "next/navigation";
import {
  getReferralProgram,
  listArbitrageursForAdmin,
  listReferralCommissionsForAdmin,
  serializeReferralProgram
} from "@otiz/database";
import { isLocale, type Locale } from "@otiz/lib";
import { requireAdminSession } from "@/lib/admin-session";
import { AdminReferralsPage } from "@/components/admin/admin-referrals-page";

export const dynamic = "force-dynamic";

export default async function AdminReferralsRoute(props: { params: Promise<{ locale: Locale }> }) {
  const params = await props.params;
  if (!isLocale(params.locale)) notFound();
  requireAdminSession(params.locale);

  const [arbitrageurs, commissions, program] = await Promise.all([
    listArbitrageursForAdmin(),
    listReferralCommissionsForAdmin(),
    getReferralProgram()
  ]);

  return (
    <AdminReferralsPage
      locale={params.locale}
      arbitrageurs={arbitrageurs}
      commissions={commissions}
      program={serializeReferralProgram(program)}
    />
  );
}

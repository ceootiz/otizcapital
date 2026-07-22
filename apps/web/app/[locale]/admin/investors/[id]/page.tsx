import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getInvestorDetailRecord, getInvestorReferralSource, getInvestorWithdrawalLockStatus, serializeInvestorDetail } from "@otiz/database";
import { isLocale, type Locale } from "@otiz/lib";
import { AdminInvestorDetailPage } from "@/components/admin/admin-investor-detail-page";
import { requireAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

const META = {
  en: {
    title: "Admin Investor Detail | OTIZ CAPITAL",
    description: "Protected MVP admin investor profile and allocation management."
  },
  ru: {
    title: "Профиль инвестора — админ | OTIZ CAPITAL",
    description: "Защищённый MVP-раздел администратора: профиль инвестора и управление аллокациями."
  }
} as const;

export async function generateMetadata(props: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const params = await props.params;
  return params.locale === "ru" ? META.ru : META.en;
}

export default async function AdminInvestorDetailRoute(props: { params: Promise<{ locale: Locale; id: string }> }) {
  const params = await props.params;
  if (!isLocale(params.locale)) {
    notFound();
  }

  requireAdminSession(params.locale);

  const investor = await getInvestorDetailRecord(params.id);

  if (!investor) {
    notFound();
  }

  const [referralSource, withdrawalAccess] = await Promise.all([
    getInvestorReferralSource({
      referredByArbitrageId: investor.referredByArbitrageId,
      referredByInvestorId: investor.referredByInvestorId
    }),
    getInvestorWithdrawalLockStatus(investor.id)
  ]);

  return (
    <AdminInvestorDetailPage
      locale={params.locale}
      investor={serializeInvestorDetail(investor)}
      referralSource={referralSource}
      withdrawalAccess={withdrawalAccess}
    />
  );
}

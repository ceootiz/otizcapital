import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getActiveReadinessPolicy, listReadinessPolicies, READINESS_PROOF_CATEGORIES } from "@otiz/database";
import { isLocale, type Locale } from "@otiz/lib";
import { AdminReadinessPolicyPage } from "@/components/admin/admin-readiness-policy-page";
import { requireAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Readiness Policy | OTIZ CAPITAL",
  description: "Protected admin settings for monthly report readiness policy."
};

export default async function AdminReadinessPolicyRoute({ params }: { params: { locale: Locale } }) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  requireAdminSession(params.locale);

  const [activePolicy, policies] = await Promise.all([getActiveReadinessPolicy(), listReadinessPolicies()]);

  return (
    <AdminReadinessPolicyPage
      locale={params.locale}
      activePolicy={activePolicy}
      policies={policies}
      proofCategories={[...READINESS_PROOF_CATEGORIES]}
    />
  );
}

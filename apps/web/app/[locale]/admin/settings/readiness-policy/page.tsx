import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getActiveReadinessPolicy, listReadinessPolicies, READINESS_PROOF_CATEGORIES } from "@otiz/database";
import { isLocale, type Locale } from "@otiz/lib";
import { AdminReadinessPolicyPage } from "@/components/admin/admin-readiness-policy-page";
import { requireAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

const META = {
  en: {
    title: "Readiness Policy | OTIZ CAPITAL",
    description: "Protected admin settings for monthly report readiness policy."
  },
  ru: {
    title: "Политика готовности | OTIZ CAPITAL",
    description: "Защищённые настройки администратора для политики готовности ежемесячного отчёта."
  }
} as const;

export async function generateMetadata(props: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const params = await props.params;
  const meta = (META as unknown as Record<string, (typeof META)["en"]>)[params.locale] ?? META.en;
  return {
    title: meta.title,
    description: meta.description
  };
}

export default async function AdminReadinessPolicyRoute(props: { params: Promise<{ locale: Locale }> }) {
  const params = await props.params;
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

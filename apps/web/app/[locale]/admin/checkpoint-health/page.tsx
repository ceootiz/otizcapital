import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdminCheckpointHealthSummary } from "@otiz/database";
import { isLocale, type Locale } from "@otiz/lib";
import { AdminCheckpointHealthPage } from "@/components/admin/admin-checkpoint-health-page";
import { requireAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

const META = {
  en: {
    title: "Checkpoint Health | OTIZ CAPITAL",
    description:
      "Protected internal operations checkpoint for readiness, reconciliation, risk, withdrawals, proofs, notifications, and report snapshots."
  },
  ru: {
    title: "Состояние контрольных точек | OTIZ CAPITAL",
    description:
      "Защищённая внутренняя контрольная точка операций: готовность, сверка, риск, выводы, подтверждения, уведомления и снимки отчётов."
  }
} as const;

export async function generateMetadata(props: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const params = await props.params;
  if (!isLocale(params.locale)) {
    return {};
  }

  const meta = (META as unknown as Record<string, (typeof META)["en"]>)[params.locale] ?? META.en;

  return {
    title: meta.title,
    description: meta.description
  };
}

export default async function AdminCheckpointHealthRoute(props: { params: Promise<{ locale: Locale }> }) {
  const params = await props.params;
  if (!isLocale(params.locale)) notFound();
  requireAdminSession(params.locale);
  const snapshot = await getAdminCheckpointHealthSummary();
  return <AdminCheckpointHealthPage locale={params.locale} snapshot={snapshot} />;
}

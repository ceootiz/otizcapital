import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdminCheckpointHealthSummary } from "@otiz/database";
import { isLocale, type Locale } from "@otiz/lib";
import { AdminCheckpointHealthPage } from "@/components/admin/admin-checkpoint-health-page";
import { requireAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Checkpoint Health | OTIZ CAPITAL",
  description: "Protected internal operations checkpoint for readiness, reconciliation, risk, withdrawals, proofs, notifications, and report snapshots."
};

export default async function AdminCheckpointHealthRoute({ params }: { params: { locale: Locale } }) {
  if (!isLocale(params.locale)) notFound();
  requireAdminSession(params.locale);
  const snapshot = await getAdminCheckpointHealthSummary();
  return <AdminCheckpointHealthPage locale={params.locale} snapshot={snapshot} />;
}

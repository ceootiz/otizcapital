import { notFound } from "next/navigation";
import { getArbitrageurDashboard } from "@otiz/database";
import { isLocale, type Locale } from "@otiz/lib";
import { requireArbitrageurPage } from "@/lib/arbitrageur-api-auth";
import { ArbitrageDashboard } from "@/components/arbitrage/arbitrage-dashboard";
import { ArbitrageShell } from "@/components/arbitrage/arbitrage-shell";

export const dynamic = "force-dynamic";

export default async function ArbitrageDashboardRoute(props: { params: Promise<{ locale: Locale }> }) {
  const params = await props.params;
  if (!isLocale(params.locale)) notFound();
  const arbitrageur = await requireArbitrageurPage(params.locale);
  const dashboard = await getArbitrageurDashboard(arbitrageur.id);
  if (!dashboard) notFound();

  return (
    <ArbitrageShell locale={params.locale} maxWidth="max-w-6xl">
      <ArbitrageDashboard locale={params.locale} dashboard={dashboard} />
    </ArbitrageShell>
  );
}

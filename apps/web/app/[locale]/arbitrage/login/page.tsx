import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@otiz/lib";
import { ArbitrageLoginForm } from "@/components/arbitrage/arbitrage-login-form";
import { ArbitrageShell } from "@/components/arbitrage/arbitrage-shell";

export const dynamic = "force-dynamic";

export default async function ArbitrageLoginRoute(props: { params: Promise<{ locale: Locale }> }) {
  const params = await props.params;
  if (!isLocale(params.locale)) notFound();
  return (
    <ArbitrageShell locale={params.locale}>
      <ArbitrageLoginForm locale={params.locale} />
    </ArbitrageShell>
  );
}

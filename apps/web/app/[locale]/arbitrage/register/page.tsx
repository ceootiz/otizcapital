import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@otiz/lib";
import { ArbitrageRegisterForm } from "@/components/arbitrage/arbitrage-register-form";
import { ArbitrageShell } from "@/components/arbitrage/arbitrage-shell";

export const dynamic = "force-dynamic";

export default function ArbitrageRegisterRoute({ params }: { params: { locale: Locale } }) {
  if (!isLocale(params.locale)) notFound();
  return (
    <ArbitrageShell locale={params.locale}>
      <ArbitrageRegisterForm locale={params.locale} />
    </ArbitrageShell>
  );
}

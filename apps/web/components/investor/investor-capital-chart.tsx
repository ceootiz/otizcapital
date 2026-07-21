"use client";

import { useMemo, useState } from "react";
import type { InvestorLedgerEntry } from "@otiz/database";
import type { Locale } from "@otiz/lib";
import { Card, CardContent } from "@otiz/ui";
import { buildInvestorPerformanceSeries, listInvestorPerformanceCurrencies, type InvestorPerformancePeriod } from "@/lib/investor-performance";

const COPY = {
  en: { title: "Capital and profit", description: "Recorded account movement in the original currency.", capital: "Capital", profit: "Profit", currency: "Currency", empty: "The chart will appear after the first account operation.", periods: { "30d": "30 days", "90d": "90 days", "1y": "1 year", all: "All time" } },
  ru: { title: "Капитал и прибыль", description: "Движение по счёту в исходной валюте.", capital: "Капитал", profit: "Прибыль", currency: "Валюта", empty: "График появится после первой операции по счёту.", periods: { "30d": "30 дней", "90d": "90 дней", "1y": "1 год", all: "Всё время" } },
  de: { title: "Kapital und Gewinn", description: "Erfasste Kontobewegung in der ursprünglichen Währung.", capital: "Kapital", profit: "Gewinn", currency: "Währung", empty: "Das Diagramm erscheint nach der ersten Kontobewegung.", periods: { "30d": "30 Tage", "90d": "90 Tage", "1y": "1 Jahr", all: "Gesamt" } },
  es: { title: "Capital y beneficio", description: "Movimiento registrado de la cuenta en la moneda original.", capital: "Capital", profit: "Beneficio", currency: "Moneda", empty: "El gráfico aparecerá después de la primera operación de la cuenta.", periods: { "30d": "30 días", "90d": "90 días", "1y": "1 año", all: "Todo" } },
  zh: { title: "本金与利润", description: "按原始币种显示账户记录的变动。", capital: "本金", profit: "利润", currency: "币种", empty: "首次账户操作后将显示图表。", periods: { "30d": "30天", "90d": "90天", "1y": "1年", all: "全部" } }
} satisfies Record<Locale, { title: string; description: string; capital: string; profit: string; currency: string; empty: string; periods: Record<InvestorPerformancePeriod, string> }>;

const PERIODS: InvestorPerformancePeriod[] = ["30d", "90d", "1y", "all"];

function money(value: number, currency: string, locale: Locale) {
  if (currency === "USDT") return `${new Intl.NumberFormat(locale === "zh" ? "zh-CN" : locale, { maximumFractionDigits: 2 }).format(value)} USDT`;
  return new Intl.NumberFormat(locale === "zh" ? "zh-CN" : locale, { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
}

function path(points: number[], width: number, height: number, min: number, max: number) {
  const range = Math.max(1, max - min);
  return points.map((value, index) => `${index === 0 ? "M" : "L"} ${(index / Math.max(1, points.length - 1)) * width} ${height - ((value - min) / range) * height}`).join(" ");
}

export function InvestorCapitalChart({ locale, entries }: { locale: Locale; entries: InvestorLedgerEntry[] }) {
  const t = COPY[locale];
  const currencies = useMemo(() => listInvestorPerformanceCurrencies(entries), [entries]);
  const [period, setPeriod] = useState<InvestorPerformancePeriod>("90d");
  const [currency, setCurrency] = useState(currencies[0] ?? "USD");
  const points = useMemo(() => buildInvestorPerformanceSeries({ entries, currency, period }), [currency, entries, period]);
  const values = points.flatMap((point) => [point.capital, point.profit]);
  const min = Math.min(0, ...values);
  const max = Math.max(1, ...values);
  const latest = points.at(-1);

  return <Card><CardContent className="space-y-5 p-5 sm:p-6">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div><h2 className="text-xl font-semibold text-foreground">{t.title}</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">{t.description}</p></div>
      <div className="flex flex-col gap-3 sm:flex-row">
        {currencies.length > 1 ? <label className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{t.currency}<select value={currency} onChange={(event) => setCurrency(event.target.value)} className="mt-1 block rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground dark:border-white/10">{currencies.map((item) => <option key={item}>{item}</option>)}</select></label> : null}
        <div className="flex flex-wrap gap-1 rounded-xl bg-muted/40 p-1 dark:bg-black/20">{PERIODS.map((item) => <button type="button" key={item} onClick={() => setPeriod(item)} className={`rounded-lg px-3 py-2 text-xs font-semibold ${period === item ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>{t.periods[item]}</button>)}</div>
      </div>
    </div>
    {points.length === 0 ? <p className="rounded-2xl bg-muted/30 p-8 text-center text-sm text-muted-foreground dark:bg-black/20">{t.empty}</p> : <>
      <div className="grid gap-3 sm:grid-cols-2"><div className="rounded-2xl bg-muted/30 p-4 dark:bg-black/20"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{t.capital}</p><p className="mt-2 text-xl font-semibold text-foreground">{money(latest?.capital ?? 0, currency, locale)}</p></div><div className="rounded-2xl bg-muted/30 p-4 dark:bg-black/20"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{t.profit}</p><p className="mt-2 text-xl font-semibold text-emerald-600 dark:text-emerald-400">{money(latest?.profit ?? 0, currency, locale)}</p></div></div>
      <div className="overflow-hidden rounded-2xl border border-border bg-background p-4 dark:border-white/10"><svg role="img" aria-label={t.title} viewBox="0 0 800 260" className="h-56 w-full" preserveAspectRatio="none"><path d="M 0 65 H 800 M 0 130 H 800 M 0 195 H 800" fill="none" stroke="currentColor" className="text-border" strokeWidth="1"/><path d={path(points.map((point) => point.capital), 800, 240, min, max)} fill="none" stroke="currentColor" className="text-foreground" strokeWidth="4" vectorEffect="non-scaling-stroke"/><path d={path(points.map((point) => point.profit), 800, 240, min, max)} fill="none" stroke="#16a34a" strokeWidth="3" vectorEffect="non-scaling-stroke"/></svg><div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground"><span className="inline-flex items-center gap-2"><i className="h-0.5 w-5 bg-foreground" />{t.capital}</span><span className="inline-flex items-center gap-2"><i className="h-0.5 w-5 bg-emerald-600" />{t.profit}</span></div></div>
    </>}
  </CardContent></Card>;
}

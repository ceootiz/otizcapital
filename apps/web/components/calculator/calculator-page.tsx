"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { animate, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import type { TooltipProps } from "recharts";
import { createAdminFormatters, type Locale } from "@otiz/lib";
import { ThemeToggle } from "@/components/home/theme-toggle";

const GOLD = "#c8b97a";

const STRINGS = {
  en: {
    back: "Back to home",
    heading: "Yield calculator",
    subtitle: "Project your returns at OTIZ CAPITAL's current allocation rate.",
    rateBadge: "{rate} annual rate",
    amountLabel: "Investment amount",
    durationLabel: "Duration",
    monthUnit: "mo",
    totalProfitLabel: "Total profit",
    totalReturnLabel: "Total return",
    finalBalanceLabel: "Final balance"
  },
  ru: {
    back: "На главную",
    heading: "Калькулятор доходности",
    subtitle: "Рассчитайте доход по текущей ставке аллокации OTIZ CAPITAL.",
    rateBadge: "Ставка {rate} годовых",
    amountLabel: "Сумма инвестиций",
    durationLabel: "Срок",
    monthUnit: "мес",
    totalProfitLabel: "Итоговая прибыль",
    totalReturnLabel: "Итоговая доходность",
    finalBalanceLabel: "Итоговый баланс"
  }
} as const;

type Strings = typeof STRINGS.en;
const getStrings = (locale: Locale): Strings => (STRINGS as unknown as Record<string, Strings>)[locale] ?? STRINGS.en;

// Smoothly tweens a number toward `target` whenever it changes (RAF via framer-motion).
function useAnimatedNumber(target: number, reduceMotion: boolean) {
  const [display, setDisplay] = useState(target);
  const current = useRef(target);

  useEffect(() => {
    if (reduceMotion) {
      current.current = target;
      setDisplay(target);
      return;
    }
    const controls = animate(current.current, target, {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (value) => {
        current.current = value;
        setDisplay(value);
      }
    });
    return () => controls.stop();
  }, [target, reduceMotion]);

  return display;
}

export function CalculatorPage({ locale, annualRate }: { locale: Locale; annualRate: number }) {
  const t = getStrings(locale);
  const reduceMotion = useReducedMotion() ?? false;
  const fmt = useMemo(() => createAdminFormatters(locale), [locale]);
  const [amount, setAmount] = useState(10000);
  const [months, setMonths] = useState(12);

  const { chartData, totalProfit, totalReturnPct, finalBalance } = useMemo(() => {
    const principal = Number.isFinite(amount) && amount > 0 ? amount : 0;
    const monthlyRate = annualRate / 100 / 12;
    // Month 0 is the starting point; principal === balance there.
    const data: { month: number; principal: number; balance: number }[] = [{ month: 0, principal, balance: principal }];
    let balance = principal;
    for (let month = 1; month <= months; month += 1) {
      balance = balance + balance * monthlyRate;
      data.push({ month, principal, balance });
    }
    const totalP = balance - principal;
    return {
      chartData: data,
      totalProfit: totalP,
      totalReturnPct: principal > 0 ? (totalP / principal) * 100 : 0,
      finalBalance: balance
    };
  }, [amount, months, annualRate]);

  const animatedProfit = useAnimatedNumber(totalProfit, reduceMotion);
  const animatedReturn = useAnimatedNumber(totalReturnPct, reduceMotion);
  const animatedBalance = useAnimatedNumber(finalBalance, reduceMotion);

  const rateLabel = `${fmt.number(annualRate)}%`;

  const renderTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (!active || !payload || payload.length === 0) return null;
    const balance = payload.find((p) => p.dataKey === "balance")?.value;
    return (
      <div className="rounded-lg border border-white/10 bg-[#0b0b0d]/95 px-3.5 py-2.5 shadow-xl backdrop-blur-sm">
        <p className="text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground">
          {label} {t.monthUnit}
        </p>
        <p className="mt-1 text-sm font-medium tabular-nums" style={{ color: GOLD }}>
          {typeof balance === "number" ? fmt.currency(Math.round(balance)) : ""}
        </p>
      </div>
    );
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground micro-noise">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_12%,rgba(212,175,95,0.16),transparent_36rem),radial-gradient(circle_at_8%_8%,rgba(255,255,255,0.05),transparent_30rem)]" />
      <div className="macro-grid absolute inset-0 opacity-50" />

      <div className="relative z-10">
        {/* Slim header */}
        <header className="container flex h-20 items-center justify-between gap-4">
          <Link href={`/${locale}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="size-4" />
            {t.back}
          </Link>
          <div className="flex items-center gap-3">
            <Link href={`/${locale}`} className="flex items-center gap-2" aria-label="OTIZ CAPITAL home">
              <span className="flex size-9 items-center justify-center rounded-full border border-gold-200/25 bg-gold-200/10 text-sm font-semibold text-gold-100 shadow-gold">O</span>
              <span className="hidden text-sm font-semibold tracking-[0.24em] text-foreground sm:inline">OTIZ CAPITAL</span>
            </Link>
            <ThemeToggle />
          </div>
        </header>

        {/* Full-viewport hero */}
        <section className="container flex min-h-[calc(100vh-5rem)] flex-col justify-center py-12">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 28 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto w-full max-w-4xl"
          >
            {/* Heading + rate badge */}
            <div className="flex flex-col items-center text-center">
              <span className="inline-flex rounded-full border border-gold-200/25 bg-gold-200/10 px-4 py-1.5 text-xs font-semibold tracking-[0.08em] text-gold-100">
                {t.rateBadge.replace("{rate}", rateLabel)}
              </span>
              <h1 className="mt-6 font-display text-4xl font-medium tracking-[-0.05em] text-foreground sm:text-5xl">{t.heading}</h1>
              <p className="mt-4 max-w-md text-sm leading-7 text-muted-foreground">{t.subtitle}</p>
            </div>

            {/* Inputs — top */}
            <div className="mt-12 grid gap-10 sm:grid-cols-2 sm:gap-14">
              {/* Amount — clean, minimal, underline only */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">{t.amountLabel}</label>
                <div className="mt-3 flex items-baseline gap-2 border-b border-white/15 pb-2 transition-colors focus-within:border-gold-200/60">
                  <span className="font-display text-3xl text-muted-foreground sm:text-4xl">$</span>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={amount}
                    onChange={(event) => setAmount(event.target.value === "" ? 0 : Math.max(0, Number(event.target.value)))}
                    aria-label={t.amountLabel}
                    className="w-full bg-transparent font-display text-3xl font-medium tracking-[-0.03em] text-foreground outline-none placeholder:text-muted-foreground/50 sm:text-4xl [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                </div>
              </div>

              {/* Duration — elegant slider */}
              <div>
                <div className="flex items-end justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">{t.durationLabel}</label>
                  <span className="font-display text-3xl font-medium tracking-[-0.03em] text-gold-100 sm:text-4xl">
                    {months} <span className="text-lg text-muted-foreground sm:text-xl">{t.monthUnit}</span>
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={24}
                  step={1}
                  value={months}
                  onChange={(event) => setMonths(Number(event.target.value))}
                  aria-label={t.durationLabel}
                  className="mt-4 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-gold-200 [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gold-200 [&::-webkit-slider-thumb]:shadow-gold [&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-gold-200"
                />
                <div className="mt-2 flex justify-between text-[0.7rem] text-muted-foreground">
                  <span>1 {t.monthUnit}</span>
                  <span>24 {t.monthUnit}</span>
                </div>
              </div>
            </div>

            {/* Chart — the hero visual */}
            <div className="mt-14 h-[320px] w-full">
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                  <defs>
                    <linearGradient id="calcBalanceFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={GOLD} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="calcPrincipalFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity={0.04} />
                      <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="month"
                    stroke="rgba(255,255,255,0.28)"
                    tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
                    tickMargin={10}
                    minTickGap={16}
                  />
                  <Tooltip
                    content={renderTooltip}
                    cursor={{ stroke: "rgba(200,185,122,0.35)", strokeWidth: 1, strokeDasharray: "4 4" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="principal"
                    stroke="rgba(255,255,255,0.18)"
                    strokeWidth={1}
                    fill="url(#calcPrincipalFill)"
                    fillOpacity={1}
                    dot={false}
                    activeDot={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="balance"
                    stroke={GOLD}
                    strokeWidth={2}
                    fill="url(#calcBalanceFill)"
                    fillOpacity={1}
                    dot={false}
                    activeDot={{ r: 4, fill: GOLD, stroke: "#0b0b0d", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Big animated profit number — below the chart */}
            <div className="mt-12 flex flex-col items-center text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-muted-foreground">{t.totalProfitLabel}</p>
              <p
                className="mt-3 font-display font-medium uppercase leading-[0.95] tracking-[-0.04em] tabular-nums"
                style={{ color: GOLD, fontSize: "clamp(3.5rem, 11vw, 6.25rem)" }}
              >
                {fmt.currency(Math.round(animatedProfit))}
              </p>
            </div>

            {/* Two stats side by side */}
            <div className="mx-auto mt-12 grid max-w-xl grid-cols-2 gap-6">
              <div className="flex flex-col items-center border-r border-white/10 text-center">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{t.totalReturnLabel}</p>
                <p className="mt-2 font-display text-3xl font-medium tabular-nums text-gold-100 sm:text-4xl">
                  {fmt.percent(animatedReturn / 100, 1)}
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{t.finalBalanceLabel}</p>
                <p className="mt-2 font-display text-3xl font-medium tabular-nums text-foreground sm:text-4xl">
                  {fmt.currency(Math.round(animatedBalance))}
                </p>
              </div>
            </div>
          </motion.div>
        </section>
      </div>
    </main>
  );
}

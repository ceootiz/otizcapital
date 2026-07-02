"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { animate, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, FileCheck, Lock, Shield, UserCheck } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import type { TooltipProps } from "recharts";
import { createAdminFormatters, type Locale } from "@otiz/lib";
import { ThemeToggle } from "@/components/home/theme-toggle";

// Theme-aware accent colors. Recharts sets SVG presentation attributes (which do
// NOT resolve CSS var()), so we detect the active theme at runtime and use darker
// shades in light mode for contrast. Defaults to dark to match SSR / app default.
function useIsDark() {
  const [isDark, setIsDark] = useState(true);
  useEffect(() => {
    const root = document.documentElement;
    const update = () => setIsDark(root.classList.contains("dark"));
    update();
    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return isDark;
}

const STRINGS = {
  en: {
    back: "Back to home",
    heading: "Yield calculator",
    subtitle: "Project your returns at OTIZ CAPITAL's current allocation rate.",
    rateBadge: "{rate} annual rate",
    amountLabel: "Investment amount",
    durationLabel: "Duration",
    monthUnit: "mo",
    simpleLabel: "Without reinvestment",
    compoundLabel: "With reinvestment",
    totalSimpleLabel: "Total without reinvestment",
    totalCompoundLabel: "Total with reinvestment",
    reinvestGainLabel: "Reinvestment gain",
    securityHeading: "Why this is secure",
    secRealTitle: "Real goods",
    secRealDesc: "Capital is tied to physical devices, not speculation.",
    secReportTitle: "Operational reporting",
    secReportDesc: "Monthly reports with proof of goods movement.",
    secReviewTitle: "Manual review",
    secReviewDesc: "Every investor goes through manual review.",
    secWithdrawTitle: "Controlled withdrawal",
    secWithdrawDesc: "Withdrawals only after a 90-day holding period."
  },
  ru: {
    back: "На главную",
    heading: "Калькулятор доходности",
    subtitle: "Рассчитайте доход по текущей ставке аллокации OTIZ CAPITAL.",
    rateBadge: "Ставка {rate} годовых",
    amountLabel: "Сумма инвестиций",
    durationLabel: "Срок",
    monthUnit: "мес",
    simpleLabel: "Без реинвеста",
    compoundLabel: "С реинвестом",
    totalSimpleLabel: "Итого без реинвеста",
    totalCompoundLabel: "Итого с реинвестом",
    reinvestGainLabel: "Выгода от реинвеста",
    securityHeading: "Почему это надёжно",
    secRealTitle: "Реальный товар",
    secRealDesc: "Капитал привязан к физическим устройствам, а не к спекуляциям.",
    secReportTitle: "Операционная отчётность",
    secReportDesc: "Ежемесячные отчёты с подтверждением движения товара.",
    secReviewTitle: "Ручная проверка",
    secReviewDesc: "Каждый инвестор проходит ручную проверку.",
    secWithdrawTitle: "Контролируемый вывод",
    secWithdrawDesc: "Вывод только после 90-дневного периода удержания."
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
  const isDark = useIsDark();
  const GOLD = isDark ? "#c8b97a" : "#92691a";
  const MUTED = isDark ? "#8a8a8f" : "#52525b";
  const [amount, setAmount] = useState(10000);
  const [months, setMonths] = useState(12);

  const { chartData, simpleFinal, compoundFinal, reinvestGain, reinvestGainPct } = useMemo(() => {
    const principal = Number.isFinite(amount) && amount > 0 ? amount : 0;
    const monthlyRate = annualRate / 100 / 12;
    // Month 0 is the starting point; principal === balance for both series there.
    const data: { month: number; simple: number; compound: number }[] = [];
    for (let month = 0; month <= months; month += 1) {
      const simple = principal + principal * monthlyRate * month; // linear, no compounding
      const compound = principal * Math.pow(1 + monthlyRate, month); // exponential
      data.push({ month, simple, compound });
    }
    const sFinal = principal + principal * monthlyRate * months;
    const cFinal = principal * Math.pow(1 + monthlyRate, months);
    const gain = cFinal - sFinal;
    return {
      chartData: data,
      simpleFinal: sFinal,
      compoundFinal: cFinal,
      reinvestGain: gain,
      reinvestGainPct: sFinal > 0 ? (gain / sFinal) * 100 : 0
    };
  }, [amount, months, annualRate]);

  const animatedSimple = useAnimatedNumber(simpleFinal, reduceMotion);
  const animatedCompound = useAnimatedNumber(compoundFinal, reduceMotion);
  const animatedGain = useAnimatedNumber(reinvestGain, reduceMotion);
  const animatedGainPct = useAnimatedNumber(reinvestGainPct, reduceMotion);

  const rateLabel = `${fmt.number(annualRate)}%`;

  const renderTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (!active || !payload || payload.length === 0) return null;
    const simple = payload.find((p) => p.dataKey === "simple")?.value;
    const compound = payload.find((p) => p.dataKey === "compound")?.value;
    return (
      <div className="rounded-lg border border-border bg-popover px-3.5 py-2.5 text-popover-foreground shadow-xl">
        <p className="text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground">
          {label} {t.monthUnit}
        </p>
        <p className="mt-2 flex items-center justify-between gap-6 text-sm tabular-nums text-muted-foreground">
          <span>{t.simpleLabel}</span>
          <span className="font-medium">{typeof simple === "number" ? fmt.currency(Math.round(simple)) : ""}</span>
        </p>
        <p className="mt-1 flex items-center justify-between gap-6 text-sm font-medium tabular-nums" style={{ color: GOLD }}>
          <span>{t.compoundLabel}</span>
          <span>{typeof compound === "number" ? fmt.currency(Math.round(compound)) : ""}</span>
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
              <span className="flex size-9 items-center justify-center rounded-full border border-gold-200/25 bg-gold-300/20 text-sm font-semibold text-amber-700 shadow-gold dark:bg-gold-200/10 dark:text-gold-100">O</span>
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
              <span className="inline-flex rounded-full border border-gold-200/25 bg-gold-300/20 px-4 py-1.5 text-xs font-semibold tracking-[0.08em] text-amber-700 dark:bg-gold-200/10 dark:text-gold-100">
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
                <div className="mt-3 flex items-baseline gap-2 border-b border-border pb-2 transition-colors focus-within:border-gold-200/60 dark:border-white/15">
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
                  <span className="font-display text-3xl font-medium tracking-[-0.03em] sm:text-4xl" style={{ color: GOLD }}>
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
                  className="mt-4 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-foreground/15 accent-gold-200 dark:bg-white/10 [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gold-200 [&::-webkit-slider-thumb]:shadow-gold [&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-gold-200"
                />
                <div className="mt-2 flex justify-between text-[0.7rem] text-muted-foreground">
                  <span>1 {t.monthUnit}</span>
                  <span>24 {t.monthUnit}</span>
                </div>
              </div>
            </div>

            {/* Chart — two reinvestment modes on one visual */}
            <div className="mt-14 h-[320px] w-full">
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
                  <defs>
                    <linearGradient id="calcCompoundFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={GOLD} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="month"
                    stroke={MUTED}
                    tick={{ fill: MUTED, fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: MUTED, strokeOpacity: 0.3 }}
                    tickMargin={10}
                    minTickGap={16}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip
                    content={renderTooltip}
                    cursor={{ stroke: "rgba(200,185,122,0.35)", strokeWidth: 1, strokeDasharray: "4 4" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="simple"
                    stroke={MUTED}
                    strokeWidth={1.5}
                    strokeDasharray="5 5"
                    fill="none"
                    fillOpacity={0}
                    dot={false}
                    activeDot={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="compound"
                    stroke={GOLD}
                    strokeWidth={2}
                    fill="url(#calcCompoundFill)"
                    fillOpacity={1}
                    dot={false}
                    activeDot={{ r: 4, fill: GOLD, stroke: "currentColor", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Summary — the three key numbers */}
            <div className="mt-12 flex flex-col items-center text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-muted-foreground">{t.totalCompoundLabel}</p>
              <p
                className="mt-3 font-display font-medium leading-[0.95] tracking-[-0.04em] tabular-nums"
                style={{ color: GOLD, fontSize: "clamp(3rem, 10vw, 5.5rem)" }}
              >
                {fmt.currency(Math.round(animatedCompound))}
              </p>
              <p className="mt-4 text-xl tabular-nums text-muted-foreground">
                {t.totalSimpleLabel}: {fmt.currency(Math.round(animatedSimple))}
              </p>
              <p className="mt-3 text-lg font-semibold tabular-nums sm:text-xl" style={{ color: GOLD }}>
                {t.reinvestGainLabel}: +{fmt.currency(Math.round(animatedGain))} (+{fmt.number(Math.round(animatedGainPct * 10) / 10)}%)
              </p>
            </div>

            {/* Security section */}
            <div className="mt-16">
              <h2 className="text-center font-display text-2xl font-medium tracking-[-0.03em] text-foreground sm:text-3xl">
                {t.securityHeading}
              </h2>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {[
                  { Icon: Shield, title: t.secRealTitle, desc: t.secRealDesc },
                  { Icon: FileCheck, title: t.secReportTitle, desc: t.secReportDesc },
                  { Icon: UserCheck, title: t.secReviewTitle, desc: t.secReviewDesc },
                  { Icon: Lock, title: t.secWithdrawTitle, desc: t.secWithdrawDesc }
                ].map(({ Icon, title, desc }) => (
                  <div key={title} className="rounded-[1.35rem] border border-border bg-card p-6">
                    <Icon className="size-6" style={{ color: GOLD }} />
                    <h3 className="mt-4 font-semibold text-foreground">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </section>
      </div>
    </main>
  );
}

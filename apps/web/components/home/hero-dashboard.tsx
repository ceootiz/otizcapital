"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, PackageCheck, ShieldCheck } from "lucide-react";
import { type HomeDictionary } from "@otiz/lib";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Separator } from "@otiz/ui";
import { CommerceChart } from "./commerce-chart";

export function HeroDashboard({ dictionary }: { dictionary: HomeDictionary }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 34, scale: 0.98 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 1.05, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto w-full max-w-xl lg:mx-0"
    >
      <div className="absolute -inset-8 rounded-[2.5rem] bg-gold-300/10 blur-3xl" />
      <Card className="relative overflow-hidden rounded-[2rem] border-white/[0.12] bg-graphite-900/80">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-200/70 to-transparent" />
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <CardTitle className="text-xl">{dictionary.hero.dashboardTitle}</CardTitle>
              <CardDescription>{dictionary.hero.dashboardSubtitle}</CardDescription>
            </div>
            <Badge>{dictionary.dashboard.liveOps}</Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-3">
            <MetricBlock icon={<ShieldCheck />} label={dictionary.hero.activeAllocations} value="$12.8M" />
            <MetricBlock icon={<PackageCheck />} label={dictionary.hero.commerceVolume} value="$16.2M" />
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
            <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>{dictionary.dashboard.trendLabel}</span>
              <span className="text-gold-100">{dictionary.dashboard.trendRange}</span>
            </div>
            <CommerceChart
              compact
              months={dictionary.commerce.chartMonths}
              capitalLabel={dictionary.dashboard.chartCapital}
              volumeLabel={dictionary.dashboard.chartVolume}
            />
          </div>
          <div className="flex flex-col gap-3">
            {dictionary.commerce.allocations.map((row) => (
              <div key={row.id} className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{row.cycle}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{row.id} · {row.marketplace}</p>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-semibold text-gold-100">
                    {row.capital}
                    <ArrowUpRight className="size-3.5" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.08]">
                    <motion.div
                      initial={reduceMotion ? false : { width: 0 }}
                      whileInView={{ width: `${row.progress}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full rounded-full bg-gradient-to-r from-gold-500 to-gold-200"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{row.status}</span>
                </div>
              </div>
            ))}
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <p className="font-semibold text-foreground">48.6K</p>
              <p>{dictionary.hero.deliveredDevices}</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">{dictionary.dashboard.monthlyValue}</p>
              <p>{dictionary.hero.monthlyReporting}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function MetricBlock({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
      <div className="mb-5 flex items-center justify-between text-gold-100">
        <div className="flex size-9 items-center justify-center rounded-full bg-gold-200/10 [&_svg]:size-4">{icon}</div>
        <span className="size-2 rounded-full bg-gold-200 shadow-[0_0_20px_rgba(212,175,95,0.55)]" />
      </div>
      <p className="text-2xl font-semibold tracking-[-0.04em] text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

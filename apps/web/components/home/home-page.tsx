"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CircleDollarSign,
  Factory,
  FileCheck2,
  Globe2,
  Languages,
  Menu,
  PackageCheck,
  ShieldCheck,
  Truck,
  X
} from "lucide-react";
import {
  localeNames,
  localeShortNames,
  locales,
  type HomeDictionary,
  type Locale
} from "@otiz/lib";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Separator
} from "@otiz/ui";
import { HeroDashboard } from "./hero-dashboard";
import { Reveal, SectionShell } from "./section-shell";
import { ThemeToggle } from "./theme-toggle";

const flowIcons = [CircleDollarSign, BarChart3, Factory, Globe2, FileCheck2];
const proofIcons = [Truck, Factory, BarChart3, ShieldCheck, CheckCircle2, PackageCheck];

export function HomePage({ dictionary, locale }: { dictionary: HomeDictionary; locale: Locale }) {
  return (
    <main className="relative overflow-hidden micro-noise">
      <Header dictionary={dictionary} activeLocale={locale} />
      <Hero dictionary={dictionary} locale={locale} />
      <TrustMetrics dictionary={dictionary} />
      <HowItWorks dictionary={dictionary} />
      <Transparency dictionary={dictionary} />
      <LiveOperations dictionary={dictionary} />
      <WhyRealCommerce dictionary={dictionary} />
      <InvestorProcess dictionary={dictionary} />
      <Testimonials dictionary={dictionary} />
      <FAQ dictionary={dictionary} />
      <FinalCTA dictionary={dictionary} locale={locale} />
      <Footer dictionary={dictionary} activeLocale={locale} />
    </main>
  );
}

function Header({ dictionary, activeLocale }: { dictionary: HomeDictionary; activeLocale: Locale }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const nav = [
    { label: dictionary.nav.operations, href: "#operations" },
    { label: dictionary.nav.transparency, href: "#transparency" },
    { label: dictionary.nav.process, href: "#process" },
    { label: dictionary.nav.faq, href: "#faq" },
    { label: dictionary.nav.calculator, href: `/${activeLocale}/calculator` }
  ];

  return (
    <>
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/80 backdrop-blur-2xl">
      <div className="container flex h-20 items-center justify-between gap-6">
        <Link href={`/${activeLocale}`} className="flex items-center gap-3" aria-label="OTIZ CAPITAL home">
          <span className="flex size-10 items-center justify-center rounded-full border border-gold-200/25 bg-gold-200/10 text-sm font-semibold text-gold-100 shadow-gold">
            O
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-sm font-semibold tracking-[0.24em] text-foreground">OTIZ</span>
            <span className="mt-1 text-[0.62rem] font-medium tracking-[0.34em] text-muted-foreground">CAPITAL</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-muted-foreground lg:flex" aria-label="Primary navigation">
          {nav.map((item) => (
            <a key={item.href} href={item.href} className="transition-colors hover:text-foreground">
              {item.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1 rounded-full border border-border bg-muted/30 p-1 sm:flex" aria-label={dictionary.footer.language}>
            {locales.map((nextLocale) => (
              <Link
                key={nextLocale}
                href={`/${nextLocale}`}
                title={localeNames[nextLocale]}
                className={`rounded-full px-3 py-1.5 text-[0.68rem] font-semibold transition-colors ${
                  activeLocale === nextLocale ? "bg-gold-200 text-graphite-950" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {localeShortNames[nextLocale]}
              </Link>
            ))}
          </div>
          <ThemeToggle />
          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
            <a href={`/${activeLocale}/investor/login`}>Кабинет инвестора</a>
          </Button>
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <a href={`/${activeLocale}/apply`}>{dictionary.nav.cta}</a>
          </Button>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            className="flex size-9 items-center justify-center rounded-full border border-border bg-muted/30 text-foreground transition-colors hover:bg-muted/50 lg:hidden [&_svg]:size-5"
          >
            <Menu />
          </button>
        </div>
      </div>
    </header>
      {menuOpen ? (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 h-full w-full bg-graphite-950/80 backdrop-blur"
          />
          <div className="absolute inset-y-0 right-0 flex w-[86%] max-w-sm flex-col gap-6 overflow-y-auto rounded-l-[1.35rem] border-l border-border bg-card p-6 shadow-premium backdrop-blur-2xl">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold tracking-[0.24em] text-foreground">OTIZ CAPITAL</span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="flex size-9 items-center justify-center rounded-full border border-border bg-muted/30 text-foreground transition-colors hover:bg-muted/50 [&_svg]:size-5"
              >
                <X />
              </button>
            </div>
            <nav className="mt-2 flex flex-col gap-1 text-foreground" aria-label="Mobile navigation">
              {nav.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-2xl px-4 py-2.5 text-2xl font-medium tracking-[-0.01em] text-foreground transition-colors hover:bg-muted/50 hover:text-gold-100"
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="mt-auto flex flex-col gap-4 border-t border-border pt-6">
              <div className="flex items-center gap-1 rounded-full border border-border bg-muted/30 p-1" aria-label={dictionary.footer.language}>
                {locales.map((nextLocale) => (
                  <Link
                    key={nextLocale}
                    href={`/${nextLocale}`}
                    title={localeNames[nextLocale]}
                    onClick={() => setMenuOpen(false)}
                    className={`flex-1 rounded-full px-3 py-1.5 text-center text-[0.68rem] font-semibold transition-colors ${
                      activeLocale === nextLocale ? "bg-gold-200 text-graphite-950" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {localeShortNames[nextLocale]}
                  </Link>
                ))}
              </div>
              <div className="flex flex-col gap-3">
                <Button asChild variant="outline" size="lg" className="w-full">
                  <a href={`/${activeLocale}/investor/login`} onClick={() => setMenuOpen(false)}>Кабинет инвестора</a>
                </Button>
                <Button asChild size="lg" className="w-full">
                  <a href={`/${activeLocale}/apply`} onClick={() => setMenuOpen(false)}>Стать инвестором</a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Hero({ dictionary, locale }: { dictionary: HomeDictionary; locale: Locale }) {
  const reduceMotion = useReducedMotion();
  const metrics = [
    { label: dictionary.hero.activeAllocations, value: "$12.8M" },
    { label: dictionary.hero.commerceVolume, value: "$16.2M" },
    { label: dictionary.hero.deliveredDevices, value: "48.6K" },
    { label: dictionary.hero.monthlyReporting, value: dictionary.dashboard.monthlyValue }
  ];

  return (
    <section className="relative flex min-h-screen items-center overflow-hidden pb-20 pt-32 lg:pt-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(212,175,95,0.16),transparent_30rem)] dark:bg-[radial-gradient(circle_at_72%_18%,rgba(212,175,95,0.22),transparent_30rem),linear-gradient(180deg,rgba(5,6,7,0.45),rgba(5,6,7,0.96))]" />
      <div className="macro-grid absolute inset-0 opacity-70" />
      <motion.div
        aria-hidden="true"
        initial={reduceMotion ? false : { opacity: 0, scale: 0.95 }}
        animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        className="absolute right-[-12rem] top-16 hidden h-[42rem] w-[42rem] rounded-full border border-border bg-[conic-gradient(from_120deg,rgba(212,175,95,0.22),rgba(255,255,255,0.08),rgba(12,15,20,0.1),rgba(212,175,95,0.2))] opacity-[0.65] blur-[1px] lg:block"
      />
      <div className="container relative z-10 grid items-center gap-14 lg:grid-cols-[1fr_0.9fr]">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 34 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl"
        >
          <h1 className="font-display text-6xl font-medium leading-[0.92] tracking-[-0.065em] text-balance text-foreground sm:text-7xl lg:text-8xl">
            {dictionary.hero.headline}
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl sm:leading-9">
            {dictionary.hero.subheadline}
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <a href={`/${locale}/apply`}>
                {dictionary.hero.cta}
                <ArrowRight data-icon="inline-end" />
              </a>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="#transparency">{dictionary.hero.secondary}</a>
            </Button>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-4">
            {metrics.map((metric, index) => (
              <motion.div
                key={metric.label}
                initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.28 + index * 0.08 }}
                className="glass-panel rounded-2xl p-4"
              >
                <p className="text-xl font-semibold tracking-[-0.04em] text-foreground">{metric.value}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{metric.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
        <HeroDashboard dictionary={dictionary} />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-background" />
    </section>
  );
}

function TrustMetrics({ dictionary }: { dictionary: HomeDictionary }) {
  return (
    <SectionShell title={dictionary.trust.title} subtitle={dictionary.trust.subtitle}>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {dictionary.trust.items.map((item, index) => (
          <Reveal key={item.label} delay={index * 0.05}>
            <Card className="h-full overflow-hidden bg-muted/30">
              <CardContent className="p-6">
                <div className="mb-8 h-px w-full bg-gradient-to-r from-gold-300/70 to-transparent" />
                <p className="font-display text-4xl font-medium tracking-[-0.05em] text-foreground">{item.value}</p>
                <p className="mt-4 text-sm font-semibold text-foreground">{item.label}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.detail}</p>
              </CardContent>
            </Card>
          </Reveal>
        ))}
      </div>
    </SectionShell>
  );
}

function HowItWorks({ dictionary }: { dictionary: HomeDictionary }) {
  return (
    <SectionShell id="process" title={dictionary.how.title} subtitle={dictionary.how.subtitle} className="bg-muted/30">
      <div className="relative grid gap-4 lg:grid-cols-5">
        <div className="gold-line absolute left-[10%] right-[10%] top-11 hidden h-px origin-left animate-line-draw lg:block" />
        {dictionary.how.steps.map((step, index) => {
          const Icon = flowIcons[index] ?? CheckCircle2;
          return (
            <Reveal key={step.title} delay={index * 0.06}>
              <div className="relative flex h-full flex-col gap-5 rounded-[1.35rem] border border-border bg-card p-6 shadow-premium">
                <div className="flex size-12 items-center justify-center rounded-full border border-gold-200/25 bg-gold-200/10 text-gold-100 [&_svg]:size-5">
                  <Icon />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-100">0{index + 1}</p>
                  <h3 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-foreground">{step.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{step.body}</p>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </SectionShell>
  );
}

function Transparency({ dictionary }: { dictionary: HomeDictionary }) {
  return (
    <SectionShell id="transparency" title={dictionary.transparency.title} subtitle={dictionary.transparency.subtitle}>
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Reveal>
          <Card className="sticky top-28 overflow-hidden rounded-[1.35rem] bg-card">
            <CardHeader>
              <CardTitle>{dictionary.transparency.request}</CardTitle>
              <CardDescription>{dictionary.transparency.subtitle}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="rounded-[1.35rem] border border-border bg-muted/50 p-5">
                <div className="mb-5 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{dictionary.transparency.proofChain}</span>
                  <Badge variant="secondary">{dictionary.transparency.operational}</Badge>
                </div>
                <div className="flex flex-col gap-4">
                  {dictionary.commerce.proofSignals.map((signal, index) => (
                    <div key={signal} className="flex items-center gap-3">
                      <span className="flex size-7 items-center justify-center rounded-full bg-gold-200/10 text-[0.68rem] font-semibold text-gold-100">
                        {index + 1}
                      </span>
                      <span className="text-sm text-foreground">{signal}</span>
                      <span className="ml-auto h-px flex-1 bg-white/10" />
                      <CheckCircle2 className="size-4 text-gold-100" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl border border-border bg-muted/30 p-4">
                  <p className="font-semibold text-foreground">{dictionary.transparency.qcMedia}</p>
                  <p className="mt-2 text-muted-foreground">{dictionary.transparency.qcMediaDetail}</p>
                </div>
                <div className="rounded-2xl border border-border bg-muted/30 p-4">
                  <p className="font-semibold text-foreground">{dictionary.transparency.settlement}</p>
                  <p className="mt-2 text-muted-foreground">{dictionary.transparency.settlementDetail}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2">
          {dictionary.transparency.items.map((item, index) => {
            const Icon = proofIcons[index] ?? ShieldCheck;
            return (
              <Reveal key={item.title} delay={index * 0.04}>
                <Card className="h-full bg-muted/30">
                  <CardContent className="p-6">
                    <div className="mb-7 flex size-11 items-center justify-center rounded-full border border-border bg-muted/30 text-gold-100 [&_svg]:size-5">
                      <Icon />
                    </div>
                    <h3 className="text-lg font-semibold tracking-[-0.025em] text-foreground">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.body}</p>
                  </CardContent>
                </Card>
              </Reveal>
            );
          })}
        </div>
      </div>
    </SectionShell>
  );
}

function LiveOperations({ dictionary }: { dictionary: HomeDictionary }) {
  return (
    <SectionShell id="operations" title={dictionary.live.title} subtitle={dictionary.live.subtitle} className="bg-[radial-gradient(circle_at_50%_0%,rgba(212,175,95,0.09),transparent_34rem)]">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Reveal>
          <Card className="overflow-hidden rounded-[1.35rem]">
            <CardHeader className="flex-row items-start justify-between gap-6">
              <div>
                <CardTitle>{dictionary.live.currentAllocations}</CardTitle>
                <CardDescription>{dictionary.live.allocationsSubtitle}</CardDescription>
              </div>
              <Badge>{dictionary.live.activeCount}</Badge>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-[1.35rem] border border-border">
                {dictionary.commerce.allocations.map((row) => (
                  <div key={row.id} className="grid gap-4 border-b border-border bg-muted/30 p-5 last:border-b-0 md:grid-cols-[1fr_0.75fr_0.5fr] md:items-center">
                    <div>
                      <p className="font-semibold text-foreground">{row.cycle}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{row.id} · {row.marketplace}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="size-2 rounded-full bg-gold-200 animate-soft-pulse" />
                      <span className="text-sm text-muted-foreground">{row.status}</span>
                    </div>
                    <div className="text-left md:text-right">
                      <p className="font-semibold text-foreground">{row.capital}</p>
                      <p className="text-sm text-muted-foreground">{row.progress}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </Reveal>
        <Reveal delay={0.08}>
          <Card className="h-full rounded-[1.35rem]">
            <CardHeader>
              <CardTitle>{dictionary.live.recentOperations}</CardTitle>
              <CardDescription>{dictionary.live.eventsSubtitle}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              {dictionary.commerce.operations.map((event) => (
                <div key={event.title} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span className="flex size-10 items-center justify-center rounded-full border border-gold-200/25 bg-gold-200/10 text-xs font-semibold text-gold-100">
                      {event.time}
                    </span>
                    <span className="mt-3 h-full w-px bg-white/10" />
                  </div>
                  <div className="pb-6">
                    <Badge variant="secondary">{event.state}</Badge>
                    <h3 className="mt-3 font-semibold tracking-[-0.02em] text-foreground">{event.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{event.detail}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </Reveal>
      </div>
    </SectionShell>
  );
}

function WhyRealCommerce({ dictionary }: { dictionary: HomeDictionary }) {
  return (
    <SectionShell title={dictionary.realCommerce.title} subtitle={dictionary.realCommerce.subtitle}>
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Reveal>
          <div className="relative min-h-[34rem] overflow-hidden rounded-[1.35rem] border border-border bg-[linear-gradient(145deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-8 shadow-premium">
            <div className="absolute inset-8 rounded-[1.35rem] border border-gold-200/10" />
            <div className="absolute -right-20 top-12 size-72 rounded-full bg-gold-300/15 blur-3xl" />
            <div className="relative z-10 flex h-full flex-col justify-between gap-12">
              <div>
                <p className="font-display text-5xl font-medium tracking-[-0.055em] text-foreground">{dictionary.realCommerce.infrastructureTitle}</p>
                <p className="mt-5 max-w-md text-sm leading-7 text-muted-foreground">{dictionary.realCommerce.infrastructureBody}</p>
              </div>
              <div className="grid gap-3">
                {dictionary.commerce.proofSignals.slice(0, 4).map((signal) => (
                  <div key={signal} className="flex items-center justify-between rounded-2xl border border-border bg-muted/50 p-4">
                    <span className="text-sm text-foreground">{signal}</span>
                    <CheckCircle2 className="size-4 text-gold-100" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2">
          {dictionary.realCommerce.points.map((point, index) => (
            <Reveal key={point.title} delay={index * 0.05}>
              <Card className="h-full bg-muted/30">
                <CardContent className="p-7">
                  <p className="mb-8 text-xs font-semibold uppercase tracking-[0.24em] text-gold-100">0{index + 1}</p>
                  <h3 className="text-xl font-semibold tracking-[-0.03em] text-foreground">{point.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-muted-foreground">{point.body}</p>
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}

function InvestorProcess({ dictionary }: { dictionary: HomeDictionary }) {
  return (
    <SectionShell title={dictionary.investor.title} subtitle={dictionary.investor.subtitle} className="bg-muted/30">
      <div className="mx-auto max-w-6xl rounded-[1.35rem] border border-border bg-card p-4 shadow-premium sm:p-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {dictionary.investor.steps.map((step, index) => (
            <Reveal key={step} delay={index * 0.035}>
              <div className="group min-h-36 rounded-[1.35rem] border border-border bg-muted/30 p-5 transition-colors hover:bg-muted/50">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-100">{String(index + 1).padStart(2, "0")}</span>
                  <span className="h-px flex-1 bg-white/10 transition-colors group-hover:bg-gold-200/30" />
                </div>
                <p className="mt-9 text-lg font-semibold tracking-[-0.025em] text-foreground">{step}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}

function Testimonials({ dictionary }: { dictionary: HomeDictionary }) {
  return (
    <SectionShell title={dictionary.testimonials.title} subtitle={dictionary.testimonials.subtitle}>
      <div className="grid gap-5 lg:grid-cols-3">
        {dictionary.testimonials.items.map((item, index) => (
          <Reveal key={item.name} delay={index * 0.06}>
            <Card className="h-full bg-muted/30">
              <CardContent className="flex h-full flex-col justify-between gap-10 p-7">
                <p className="text-lg leading-8 text-foreground">“{item.quote}”</p>
                <div>
                  <Separator className="mb-5" />
                  <p className="font-semibold text-foreground">{item.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.role}</p>
                </div>
              </CardContent>
            </Card>
          </Reveal>
        ))}
      </div>
    </SectionShell>
  );
}

function FAQ({ dictionary }: { dictionary: HomeDictionary }) {
  return (
    <SectionShell id="faq" title={dictionary.faq.title} subtitle={dictionary.faq.subtitle} className="bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.06),transparent_34rem)]">
      <Reveal>
        <Card className="mx-auto max-w-4xl rounded-[1.35rem] bg-card">
          <CardContent className="p-4 sm:p-8">
            <Accordion type="single" collapsible className="w-full">
              {dictionary.faq.items.map((item, index) => (
                <AccordionItem key={item.question} value={`faq-${index}`}>
                  <AccordionTrigger>{item.question}</AccordionTrigger>
                  <AccordionContent>{item.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </Reveal>
    </SectionShell>
  );
}

function FinalCTA({ dictionary, locale }: { dictionary: HomeDictionary; locale: Locale }) {
  return (
    <section id="apply" className="relative px-4 py-24 sm:py-32">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-200/60 to-transparent" />
      <Reveal>
        <div className="container relative overflow-hidden rounded-[1.35rem] border border-gold-200/[0.18] bg-[linear-gradient(145deg,rgba(212,175,95,0.2),rgba(212,175,95,0.04))] p-8 text-center shadow-premium dark:bg-[linear-gradient(145deg,rgba(212,175,95,0.18),rgba(255,255,255,0.045)_36%,rgba(5,6,7,0.9))] sm:p-14 lg:p-20">
          <div className="absolute left-1/2 top-0 size-[30rem] -translate-x-1/2 rounded-full bg-gold-300/[0.14] blur-3xl" />
          <div className="relative z-10 mx-auto max-w-3xl">
            <h2 className="font-display text-5xl font-medium leading-tight tracking-[-0.055em] text-balance text-foreground sm:text-6xl">
              {dictionary.finalCta.title}
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">{dictionary.finalCta.subtitle}</p>
            <div className="mt-10 flex justify-center">
              <Button asChild size="lg">
                <a href={`/${locale}/apply`}>
                  {dictionary.finalCta.cta}
                  <ArrowRight data-icon="inline-end" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function Footer({ dictionary, activeLocale }: { dictionary: HomeDictionary; activeLocale: Locale }) {
  const columns: { label: string; href: string; internal?: boolean }[][] = [
    [
      { label: dictionary.footer.legal, href: `/${activeLocale}/legal`, internal: true },
      { label: dictionary.footer.about, href: `/${activeLocale}/about`, internal: true },
      { label: dictionary.footer.reports, href: "#" },
      { label: dictionary.footer.transparency, href: "#transparency" }
    ],
    [
      { label: dictionary.footer.contact, href: `/${activeLocale}/contact`, internal: true },
      { label: dictionary.footer.creators, href: "#" },
      { label: dictionary.footer.social, href: "#" }
    ]
  ];

  return (
    <footer className="border-t border-border py-12">
      <div className="container grid gap-10 lg:grid-cols-[1fr_0.9fr]">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full border border-gold-200/25 bg-gold-200/10 text-sm font-semibold text-gold-100">O</span>
            <span className="text-sm font-semibold tracking-[0.24em] text-foreground">OTIZ CAPITAL</span>
          </div>
          <p className="mt-6 max-w-xl text-sm leading-7 text-muted-foreground">{dictionary.footer.description}</p>
          <p className="mt-6 max-w-2xl text-xs leading-6 text-muted-foreground">{dictionary.footer.disclaimer}</p>
        </div>
        <div className="grid gap-8 sm:grid-cols-3">
          {columns.map((column, index) => (
            <div key={index} className="flex flex-col gap-3">
              {column.map((item) =>
                item.internal ? (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <a
                    key={item.label}
                    href={item.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </a>
                )
              )}
            </div>
          ))}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Languages className="size-4 text-gold-100" />
              {dictionary.footer.language}
            </div>
            <div className="flex flex-wrap gap-2">
              {locales.map((nextLocale) => (
                <Link
                  key={nextLocale}
                  href={`/${nextLocale}`}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                    activeLocale === nextLocale
                      ? "border-gold-200 bg-gold-200 text-graphite-950"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {localeShortNames[nextLocale]}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

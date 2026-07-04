import Link from "next/link";
import type { Locale } from "@otiz/lib";

// Premium dark background wrapper for the arbitrageur (referral partner) area —
// mirrors the investor cabinet's gradient + micro-noise treatment.
export function ArbitrageShell({
  locale,
  children,
  maxWidth = "max-w-xl"
}: {
  locale: Locale;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground micro-noise">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(212,175,95,0.13),transparent_34rem),radial-gradient(circle_at_88%_6%,rgba(255,255,255,0.07),transparent_30rem)]" />
      <div className="macro-grid absolute inset-0 opacity-45" />
      <div className="relative mx-auto flex min-h-screen w-full flex-col px-5 py-10 sm:px-8">
        <header className="mx-auto flex w-full max-w-6xl items-center justify-between">
          <Link href={`/${locale}`} className="text-sm font-semibold tracking-[0.24em] text-foreground">
            OTIZ CAPITAL
          </Link>
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700 dark:text-gold-100">
            {locale === "ru" ? "Партнёрам" : "Partners"}
          </span>
        </header>
        <div className={`mx-auto flex w-full ${maxWidth} flex-1 flex-col justify-center py-10`}>{children}</div>
      </div>
    </main>
  );
}

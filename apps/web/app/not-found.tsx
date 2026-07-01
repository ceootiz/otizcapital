import Link from "next/link";
import { Button } from "@otiz/ui";

export default function NotFound() {
  return (
    <main className="micro-noise relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 text-center text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(212,175,95,0.16),transparent_32rem),linear-gradient(180deg,rgba(5,6,7,0.45),rgba(5,6,7,0.96))]" />

      <div className="relative flex flex-col items-center gap-6">
        <span className="flex size-14 items-center justify-center rounded-full border border-gold-200/25 bg-gold-200/10 font-semibold text-gold-100">
          O
        </span>

        <h1 className="font-display text-7xl font-semibold leading-none sm:text-8xl">404</h1>

        <p className="max-w-sm text-balance text-sm text-foreground/70 sm:text-base">
          <span className="block">Страница не найдена</span>
          <span className="block">Page not found</span>
        </p>

        <Button asChild size="lg">
          <Link href="/">На главную / Home</Link>
        </Button>
      </div>
    </main>
  );
}

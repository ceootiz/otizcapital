"use client";

import Link from "next/link";
import { Button } from "@otiz/ui";

// Branded error boundary. No technical details are exposed to the user.
export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 text-foreground micro-noise">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(212,175,95,0.12),transparent_34rem)]" />
      <div className="relative z-10 mx-auto max-w-md text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full border border-gold-200/25 bg-gold-200/10 text-lg font-semibold text-gold-100 shadow-gold">
          O
        </span>
        <h1 className="mt-8 font-display text-4xl font-medium tracking-[-0.04em] text-foreground sm:text-5xl">Something went wrong</h1>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">
          An unexpected error occurred. Please try again.
          <br />
          Произошла непредвиденная ошибка. Пожалуйста, попробуйте снова.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button type="button" onClick={() => reset()}>
            Try again / Повторить
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Home / На главную</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

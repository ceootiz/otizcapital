"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, KeyRound } from "lucide-react";
import type { Locale } from "@otiz/lib";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@otiz/ui";

export function InvestorLoginPage({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [email, setEmail] = React.useState("investor@otiz.capital");
  const [fullName, setFullName] = React.useState("Demo Investor");
  const [accessCode, setAccessCode] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/investor/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, fullName, accessCode })
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Unable to open investor dashboard.");
      }

      router.push(`/${locale}/investor/dashboard`);
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to open investor dashboard.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center overflow-hidden bg-background px-4 py-10 text-foreground micro-noise">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_48%_0%,rgba(212,175,95,0.16),transparent_34rem),radial-gradient(circle_at_12%_12%,rgba(255,255,255,0.08),transparent_26rem)]" />
      <div className="macro-grid absolute inset-0 opacity-45" />
      <div className="container relative z-10 max-w-xl">
        <Link href={`/${locale}`} className="mb-8 inline-flex items-center gap-3 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="size-4" />
          Back to homepage
        </Link>
        <Card className="overflow-hidden rounded-[2rem] bg-graphite-900/[0.78]">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-gold-200/70 to-transparent" />
          <CardHeader>
            <div className="mb-4 flex size-12 items-center justify-center rounded-full border border-gold-200/25 bg-gold-200/10 text-gold-100">
              <KeyRound className="size-5" />
            </div>
            <CardTitle className="text-2xl">Investor access</CardTitle>
            <CardDescription>Use your investor email and temporary access code to view operational commerce reporting.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-5" onSubmit={onSubmit}>
              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Full name</span>
                <input value={fullName} onChange={(event) => setFullName(event.target.value)} className="h-[3.25rem] rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-gold-200/45 focus:ring-2 focus:ring-gold-200/15" />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Email</span>
                <input aria-label="Investor email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="h-[3.25rem] rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-gold-200/45 focus:ring-2 focus:ring-gold-200/15" />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Access code</span>
                <input aria-label="Access code" type="password" value={accessCode} onChange={(event) => setAccessCode(event.target.value)} placeholder="Configured temporary code" className="h-[3.25rem] rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold-200/45 focus:ring-2 focus:ring-gold-200/15" />
              </label>
              <p className="text-xs leading-5 text-muted-foreground">Development fallback code: <span className="text-gold-100">otiz-demo</span>. Replace with `INVESTOR_ACCESS_CODE` before deployment.</p>
              {error ? <p className="rounded-2xl border border-gold-200/20 bg-gold-200/10 p-4 text-sm text-gold-100">{error}</p> : null}
              <Button type="submit" size="lg" disabled={isSubmitting}>
                {isSubmitting ? "Opening dashboard..." : "Open investor dashboard"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

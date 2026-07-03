"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { type Locale } from "@otiz/lib";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@otiz/ui";

const STRINGS = {
  en: {
    heading: "Admin access",
    description: "Enter the configured admin password to view investor applications.",
    backToHomepage: "Back to homepage",
    password: "Password",
    signIn: "Sign in",
    signingIn: "Signing in...",
    unableToLogIn: "Unable to log in.",
    twoFactor: "2FA code",
    twoFactorHint: "Enter the 6-digit code from your authenticator app."
  },
  ru: {
    heading: "Доступ администратора",
    description: "Введите заданный пароль администратора для просмотра заявок инвесторов.",
    backToHomepage: "На главную",
    password: "Пароль",
    signIn: "Войти",
    signingIn: "Вход...",
    unableToLogIn: "Не удалось войти.",
    twoFactor: "Код 2FA",
    twoFactorHint: "Введите 6-значный код из приложения-аутентификатора."
  }
};

type Strings = typeof STRINGS.en;

const getStrings = (locale: Locale): Strings => (STRINGS as unknown as Record<string, Strings>)[locale] ?? STRINGS.en;

export function AdminLoginPage({ locale }: { locale: Locale }) {
  const t = getStrings(locale);
  const router = useRouter();
  const [password, setPassword] = React.useState("");
  const [totpCode, setTotpCode] = React.useState("");
  const [totpRequired, setTotpRequired] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(totpRequired ? { password, totpCode } : { password })
      });
      const payload = (await response.json()) as { ok: boolean; error?: string; totpRequired?: boolean };

      if (payload.totpRequired) {
        // Password accepted; a second factor is required.
        setTotpRequired(true);
        setError(totpCode ? payload.error || t.unableToLogIn : null);
        return;
      }

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || t.unableToLogIn);
      }

      router.push(`/${locale}/admin/applications`);
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t.unableToLogIn);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center overflow-hidden bg-background px-4 py-10 text-foreground micro-noise">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(212,175,95,0.18),transparent_34rem)]" />
      <div className="macro-grid absolute inset-0 opacity-45" />
      <div className="container relative z-10 max-w-xl">
        <Link href={`/${locale}`} className="mb-8 inline-flex items-center gap-3 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="size-4" />
          {t.backToHomepage}
        </Link>
        <Card className="overflow-hidden rounded-[1.35rem] bg-card dark:bg-graphite-900/[0.78]">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-gold-200/70 to-transparent" />
          <CardHeader>
            <div className="mb-4 flex size-12 items-center justify-center rounded-full border border-gold-200/25 bg-gold-300/20 dark:bg-gold-200/10 text-amber-700 dark:text-gold-100">
              <LockKeyhole className="size-5" />
            </div>
            <CardTitle className="text-2xl">{t.heading}</CardTitle>
            <CardDescription>{t.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-5" onSubmit={onSubmit}>
              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t.password}</span>
                <input
                  aria-label={t.password}
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-[3.25rem] rounded-2xl border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-gold-200/45 focus:ring-2 focus:ring-gold-200/15"
                />
              </label>
              {totpRequired ? (
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t.twoFactor}</span>
                  <input
                    aria-label={t.twoFactor}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={totpCode}
                    onChange={(event) => setTotpCode(event.target.value.replace(/[^0-9]/g, ""))}
                    autoFocus
                    className="h-[3.25rem] rounded-2xl border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 px-4 py-3 text-center text-lg tracking-[0.5em] text-foreground outline-none transition-colors focus:border-gold-200/45 focus:ring-2 focus:ring-gold-200/15"
                  />
                  <span className="text-xs text-muted-foreground">{t.twoFactorHint}</span>
                </label>
              ) : null}
              {error ? <p className="rounded-2xl border border-gold-200/20 bg-gold-300/20 dark:bg-gold-200/10 p-4 text-sm text-amber-700 dark:text-gold-100">{error}</p> : null}
              <Button type="submit" size="lg" disabled={isSubmitting}>
                {isSubmitting ? t.signingIn : t.signIn}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

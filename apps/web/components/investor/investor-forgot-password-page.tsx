"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, MailCheck, KeyRound } from "lucide-react";
import type { Locale } from "@otiz/lib";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@otiz/ui";

const STRINGS = {
  en: {
    backToLogin: "Back to sign in",
    title: "Reset your password",
    description: "Enter your investor email and we'll send you a link to set a new password.",
    email: "Email",
    emailAria: "Investor email",
    emailPlaceholder: "you@example.com",
    submit: "Send instructions",
    sending: "Sending...",
    successTitle: "Check your email",
    successBody: "If an account exists for this email, a reset link has been sent. Check your inbox.",
    emailRequired: "Enter a valid investor email.",
    errorFallback: "Something went wrong. Please try again."
  },
  ru: {
    backToLogin: "Назад ко входу",
    title: "Сброс пароля",
    description: "Введите email инвестора — мы отправим ссылку для установки нового пароля.",
    email: "Email",
    emailAria: "Email инвестора",
    emailPlaceholder: "you@example.com",
    submit: "Отправить инструкции",
    sending: "Отправляем...",
    successTitle: "Проверьте почту",
    successBody: "Если аккаунт существует, письмо отправлено. Проверьте почту.",
    emailRequired: "Введите корректный email инвестора.",
    errorFallback: "Что-то пошло не так. Попробуйте ещё раз."
  }
} as const;
type Strings = typeof STRINGS.en;
const getStrings = (locale: Locale): Strings => (STRINGS as unknown as Record<string, Strings>)[locale] ?? STRINGS.en;

const inputClass =
  "h-[3.25rem] rounded-2xl border border-border bg-muted/30 dark:border-white/10 dark:bg-black/20 px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold-200/45 focus:ring-2 focus:ring-gold-200/15";
const labelClass = "text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground";

function isValidEmail(value: string) {
  return /^\S+@\S+\.\S+$/.test(value.trim());
}

export function InvestorForgotPasswordPage({ locale }: { locale: Locale }) {
  const t = getStrings(locale);
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!isValidEmail(email)) {
      setError(t.emailRequired);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/investor/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), locale })
      });
      // The endpoint always returns 200 with a generic message; any non-ok
      // status is a genuine failure worth surfacing.
      if (!response.ok) {
        throw new Error(t.errorFallback);
      }
      setSubmitted(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t.errorFallback);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center overflow-hidden bg-background px-4 py-10 text-foreground micro-noise">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_48%_0%,rgba(212,175,95,0.16),transparent_34rem),radial-gradient(circle_at_12%_12%,rgba(255,255,255,0.08),transparent_26rem)]" />
      <div className="macro-grid absolute inset-0 opacity-45" />
      <div className="container relative z-10 max-w-xl">
        <Link href={`/${locale}/investor/login`} className="mb-8 inline-flex items-center gap-3 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="size-4" />
          {t.backToLogin}
        </Link>
        <Card className="overflow-hidden rounded-[1.35rem] bg-card dark:bg-graphite-900/[0.78]">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-gold-400/60 to-transparent dark:via-gold-200/70" />
          <CardHeader>
            <div className="mb-4 flex size-12 items-center justify-center rounded-full border border-gold-200/25 bg-gold-300/20 dark:bg-gold-200/10 text-amber-700 dark:text-gold-100">
              {submitted ? <MailCheck className="size-5" /> : <KeyRound className="size-5" />}
            </div>
            <CardTitle className="text-2xl">{submitted ? t.successTitle : t.title}</CardTitle>
            <CardDescription>{submitted ? t.successBody : t.description}</CardDescription>
          </CardHeader>
          <CardContent>
            {submitted ? (
              <Link
                href={`/${locale}/investor/login`}
                className="inline-flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-gold-100 hover:underline"
              >
                <ArrowLeft className="size-4" />
                {t.backToLogin}
              </Link>
            ) : (
              <form className="flex flex-col gap-5" onSubmit={onSubmit}>
                <label className="flex flex-col gap-2">
                  <span className={labelClass}>{t.email}</span>
                  <input
                    aria-label={t.emailAria}
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder={t.emailPlaceholder}
                    className={inputClass}
                  />
                </label>
                {error ? (
                  <p className="rounded-2xl border border-gold-200/20 bg-gold-300/20 dark:bg-gold-200/10 p-4 text-sm text-amber-700 dark:text-gold-100">{error}</p>
                ) : null}
                <Button type="submit" size="lg" disabled={isSubmitting}>
                  {isSubmitting ? t.sending : t.submit}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

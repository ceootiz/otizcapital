"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Locale } from "@otiz/lib";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@otiz/ui";

const STRINGS = {
  en: {
    title: "Partner login",
    desc: "Access your referral dashboard.",
    email: "Email",
    password: "Password",
    submit: "Log in",
    submitting: "Signing in...",
    noAccount: "Don't have an account?",
    register: "Register",
    errInvalid: "Incorrect email or password.",
    errPending: "Your account is pending approval. Please wait for an administrator.",
    errSuspended: "This account is suspended. Contact your manager.",
    errFallback: "Could not sign in. Please try again."
  },
  ru: {
    title: "Вход для партнёров",
    desc: "Доступ к реферальному кабинету.",
    email: "Email",
    password: "Пароль",
    submit: "Войти",
    submitting: "Входим...",
    noAccount: "Нет аккаунта?",
    register: "Регистрация",
    errInvalid: "Неверный email или пароль.",
    errPending: "Аккаунт ожидает одобрения. Дождитесь подтверждения администратора.",
    errSuspended: "Аккаунт заблокирован. Свяжитесь с менеджером.",
    errFallback: "Не удалось войти. Попробуйте ещё раз."
  }
} as const;
type Strings = typeof STRINGS.en;
const getStrings = (locale: Locale): Strings => (STRINGS as unknown as Record<string, Strings>)[locale] ?? STRINGS.en;

const inputClass =
  "h-12 w-full rounded-2xl border border-border bg-muted/30 dark:border-white/10 dark:bg-black/20 px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold-200/45";
const labelClass = "text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground";

export function ArbitrageLoginForm({ locale }: { locale: Locale }) {
  const t = getStrings(locale);
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  function messageFor(code: string | undefined) {
    if (code === "ACCOUNT_PENDING") return t.errPending;
    if (code === "ACCOUNT_SUSPENDED") return t.errSuspended;
    if (code === "INVALID_CREDENTIALS") return t.errInvalid;
    return t.errFallback;
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/arbitrage/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password })
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        setError(messageFor(payload.error));
        return;
      }
      router.replace(`/${locale}/arbitrage/dashboard`);
      router.refresh();
    } catch {
      setError(t.errFallback);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="rounded-[1.35rem] bg-card dark:bg-graphite-900/[0.72]">
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>{t.desc}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={onSubmit}>
          <label className="flex flex-col gap-2">
            <span className={labelClass}>{t.email}</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} required />
          </label>
          <label className="flex flex-col gap-2">
            <span className={labelClass}>{t.password}</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass} required />
          </label>
          {error ? (
            <p className="rounded-2xl border border-gold-200/20 bg-gold-300/20 dark:bg-gold-200/10 p-4 text-sm text-amber-700 dark:text-gold-100">{error}</p>
          ) : null}
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? t.submitting : t.submit}</Button>
          <p className="text-center text-sm text-muted-foreground">
            {t.noAccount}{" "}
            <Link href={`/${locale}/arbitrage/register`} className="font-semibold text-amber-700 dark:text-gold-100">
              {t.register}
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

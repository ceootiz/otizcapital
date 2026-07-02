"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, KeyRound, Lock } from "lucide-react";
import type { Locale } from "@otiz/lib";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@otiz/ui";

const STRINGS = {
  en: {
    backToHomepage: "Back to homepage",
    investorAccess: "Investor access",
    cardDescription: "Enter your investor email to continue. We'll ask for your password or access code next.",
    cardDescriptionPassword: "Welcome back. Enter your password to open the investor dashboard.",
    cardDescriptionCode: "Enter your temporary access code to open the investor dashboard.",
    email: "Email",
    investorEmailAria: "Investor email",
    emailPlaceholder: "you@example.com",
    continue: "Continue",
    checking: "Checking...",
    changeEmail: "Change email",
    password: "Password",
    passwordPlaceholder: "Your password",
    signInWithPassword: "Sign in with password",
    useAccessCode: "Use access code instead",
    accessCode: "Access code",
    accessCodePlaceholder: "Configured temporary code",
    devHintPrefix: "Development fallback code:",
    devHintSuffix: ". Replace with `INVESTOR_ACCESS_CODE` before deployment.",
    errorFallback: "Unable to open investor dashboard.",
    emailRequired: "Enter a valid investor email.",
    openDashboard: "Open investor dashboard",
    openingDashboard: "Opening dashboard..."
  },
  ru: {
    backToHomepage: "Назад на главную",
    investorAccess: "Доступ для инвестора",
    cardDescription: "Введите email инвестора, чтобы продолжить. Далее мы запросим пароль или код доступа.",
    cardDescriptionPassword: "С возвращением. Введите пароль, чтобы открыть кабинет инвестора.",
    cardDescriptionCode: "Введите временный код доступа, чтобы открыть кабинет инвестора.",
    email: "Email",
    investorEmailAria: "Email инвестора",
    emailPlaceholder: "you@example.com",
    continue: "Продолжить",
    checking: "Проверяем...",
    changeEmail: "Изменить email",
    password: "Пароль",
    passwordPlaceholder: "Ваш пароль",
    signInWithPassword: "Войти с паролем",
    useAccessCode: "Использовать код доступа",
    accessCode: "Код доступа",
    accessCodePlaceholder: "Настроенный временный код",
    devHintPrefix: "Резервный код для разработки:",
    devHintSuffix: ". Замените на `INVESTOR_ACCESS_CODE` перед развёртыванием.",
    errorFallback: "Не удалось открыть кабинет инвестора.",
    emailRequired: "Введите корректный email инвестора.",
    openDashboard: "Открыть кабинет инвестора",
    openingDashboard: "Открываем кабинет..."
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

type Step = "email" | "auth";
type AuthMode = "password" | "code";

export function InvestorLoginPage({ locale }: { locale: Locale }) {
  const t = getStrings(locale);
  const router = useRouter();
  const [step, setStep] = React.useState<Step>("email");
  const [mode, setMode] = React.useState<AuthMode>("code");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [accessCode, setAccessCode] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isChecking, setIsChecking] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const passwordRef = React.useRef<HTMLInputElement>(null);
  const accessCodeRef = React.useRef<HTMLInputElement>(null);

  // Focus the credential field when advancing to step two.
  React.useEffect(() => {
    if (step !== "auth") {
      return;
    }
    const target = mode === "password" ? passwordRef.current : accessCodeRef.current;
    target?.focus();
  }, [step, mode]);

  async function onContinue(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!isValidEmail(email)) {
      setError(t.emailRequired);
      return;
    }

    setIsChecking(true);
    try {
      const response = await fetch(`/api/investor/auth-method?email=${encodeURIComponent(email.trim())}`);
      const payload = (await response.json().catch(() => null)) as { hasPassword?: boolean } | null;
      // On 429 or any failure we fall back to access-code mode so the user is never blocked.
      setMode(payload?.hasPassword ? "password" : "code");
    } catch {
      setMode("code");
    } finally {
      setIsChecking(false);
      setStep("auth");
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const body = mode === "password" ? { email, password } : { email, accessCode };
      const response = await fetch("/api/investor/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || t.errorFallback);
      }

      router.push(`/${locale}/investor/dashboard`);
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t.errorFallback);
    } finally {
      setIsSubmitting(false);
    }
  }

  function backToEmail() {
    setError(null);
    setPassword("");
    setAccessCode("");
    setStep("email");
  }

  const description =
    step === "email"
      ? t.cardDescription
      : mode === "password"
        ? t.cardDescriptionPassword
        : t.cardDescriptionCode;

  return (
    <main className="relative flex min-h-screen items-center overflow-hidden bg-background px-4 py-10 text-foreground micro-noise">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_48%_0%,rgba(212,175,95,0.16),transparent_34rem),radial-gradient(circle_at_12%_12%,rgba(255,255,255,0.08),transparent_26rem)]" />
      <div className="macro-grid absolute inset-0 opacity-45" />
      <div className="container relative z-10 max-w-xl">
        <Link href={`/${locale}`} className="mb-8 inline-flex items-center gap-3 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="size-4" />
          {t.backToHomepage}
        </Link>
        <Card className="overflow-hidden rounded-[1.35rem] bg-card dark:bg-graphite-900/[0.78]">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-gold-400/60 to-transparent dark:via-gold-200/70" />
          <CardHeader>
            <div className="mb-4 flex size-12 items-center justify-center rounded-full border border-gold-200/25 bg-gold-300/20 dark:bg-gold-200/10 text-amber-700 dark:text-gold-100">
              {step === "auth" && mode === "password" ? <Lock className="size-5" /> : <KeyRound className="size-5" />}
            </div>
            <CardTitle className="text-2xl">{t.investorAccess}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Step one — email */}
            <form
              className={`flex-col gap-5 transition-all duration-300 ${step === "email" ? "flex opacity-100" : "hidden opacity-0"}`}
              onSubmit={onContinue}
            >
              <label className="flex flex-col gap-2">
                <span className={labelClass}>{t.email}</span>
                <input
                  aria-label={t.investorEmailAria}
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={t.emailPlaceholder}
                  className={inputClass}
                />
              </label>
              {step === "email" && error ? (
                <p className="rounded-2xl border border-gold-200/20 bg-gold-300/20 dark:bg-gold-200/10 p-4 text-sm text-amber-700 dark:text-gold-100">{error}</p>
              ) : null}
              <Button type="submit" size="lg" disabled={isChecking} className="gap-2">
                {isChecking ? t.checking : t.continue}
                {!isChecking ? <ArrowRight className="size-4" /> : null}
              </Button>
            </form>

            {/* Step two — credential */}
            <form
              className={`flex-col gap-5 transition-all duration-300 ${step === "auth" ? "flex opacity-100" : "hidden opacity-0"}`}
              onSubmit={onSubmit}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className={labelClass}>{t.email}</span>
                  <p className="mt-1 truncate text-sm text-foreground">{email}</p>
                </div>
                <button
                  type="button"
                  onClick={backToEmail}
                  className="shrink-0 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t.changeEmail}
                </button>
              </div>

              {mode === "password" ? (
                <label className="flex flex-col gap-2">
                  <span className={labelClass}>{t.password}</span>
                  <input
                    ref={passwordRef}
                    aria-label={t.password}
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={t.passwordPlaceholder}
                    className={inputClass}
                  />
                </label>
              ) : (
                <label className="flex flex-col gap-2">
                  <span className={labelClass}>{t.accessCode}</span>
                  <input
                    ref={accessCodeRef}
                    aria-label={t.accessCode}
                    type="password"
                    autoComplete="one-time-code"
                    value={accessCode}
                    onChange={(event) => setAccessCode(event.target.value)}
                    placeholder={t.accessCodePlaceholder}
                    className={inputClass}
                  />
                </label>
              )}

              {step === "auth" && error ? (
                <p className="rounded-2xl border border-gold-200/20 bg-gold-300/20 dark:bg-gold-200/10 p-4 text-sm text-amber-700 dark:text-gold-100">{error}</p>
              ) : null}

              <Button type="submit" size="lg" disabled={isSubmitting}>
                {isSubmitting ? t.openingDashboard : mode === "password" ? t.signInWithPassword : t.openDashboard}
              </Button>

              {mode === "password" ? (
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setMode("code");
                  }}
                  className="text-center text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t.useAccessCode}
                </button>
              ) : null}
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

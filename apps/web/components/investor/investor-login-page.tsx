"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Lock } from "lucide-react";
import type { Locale } from "@otiz/lib";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@otiz/ui";

const STRINGS = {
  en: {
    backToHomepage: "Back to homepage",
    investorAccess: "Investor access",
    cardDescription: "Enter your investor email and password. For your first sign-in, use the temporary password from your approval email.",
    email: "Email",
    investorEmailAria: "Investor email",
    emailPlaceholder: "you@example.com",
    password: "Password",
    passwordPlaceholder: "Your password",
    showPassword: "Show password",
    hidePassword: "Hide password",
    forgotPassword: "Forgot password?",
    errorFallback: "Unable to open investor dashboard.",
    emailRequired: "Enter a valid investor email.",
    passwordRequired: "Enter your password.",
    invalidCredentials: "The email or password is incorrect.",
    inactiveAccount: "Investor access is not active. Contact your manager.",
    tooManyAttempts: "Too many sign-in attempts. Please try again later.",
    openDashboard: "Sign in",
    openingDashboard: "Opening dashboard..."
  },
  ru: {
    backToHomepage: "Назад на главную",
    investorAccess: "Доступ для инвестора",
    cardDescription: "Введите email и пароль. Для первого входа используйте временный пароль из письма об одобрении.",
    email: "Email",
    investorEmailAria: "Email инвестора",
    emailPlaceholder: "you@example.com",
    password: "Пароль",
    passwordPlaceholder: "Ваш пароль",
    showPassword: "Показать пароль",
    hidePassword: "Скрыть пароль",
    forgotPassword: "Забыли пароль?",
    errorFallback: "Не удалось открыть кабинет инвестора.",
    emailRequired: "Введите корректный email инвестора.",
    passwordRequired: "Введите пароль.",
    invalidCredentials: "Неверный email или пароль.",
    inactiveAccount: "Доступ инвестора не активен. Свяжитесь с менеджером.",
    tooManyAttempts: "Слишком много попыток входа. Попробуйте позже.",
    openDashboard: "Войти",
    openingDashboard: "Открываем кабинет..."
  },
  es: {
    backToHomepage: "Volver al inicio",
    investorAccess: "Acceso para inversores",
    cardDescription: "Introduzca su correo y contraseña. Para el primer acceso, use la contraseña temporal del correo de aprobación.",
    email: "Correo electrónico",
    investorEmailAria: "Correo del inversor",
    emailPlaceholder: "you@example.com",
    password: "Contraseña",
    passwordPlaceholder: "Su contraseña",
    showPassword: "Mostrar contraseña",
    hidePassword: "Ocultar contraseña",
    forgotPassword: "¿Olvidó su contraseña?",
    errorFallback: "No se pudo abrir el panel del inversor.",
    emailRequired: "Introduzca un correo de inversor válido.",
    passwordRequired: "Introduzca su contraseña.",
    invalidCredentials: "El correo o la contraseña son incorrectos.",
    inactiveAccount: "El acceso del inversor no está activo. Contacte con su gestor.",
    tooManyAttempts: "Demasiados intentos de acceso. Inténtelo más tarde.",
    openDashboard: "Iniciar sesión",
    openingDashboard: "Abriendo el panel..."
  },
  de: {
    backToHomepage: "Zurück zur Startseite",
    investorAccess: "Investor-Zugang",
    cardDescription: "Geben Sie Ihre E-Mail und Ihr Passwort ein. Verwenden Sie bei der ersten Anmeldung das temporäre Passwort aus der Bestätigungs-E-Mail.",
    email: "E-Mail",
    investorEmailAria: "Investor-E-Mail",
    emailPlaceholder: "you@example.com",
    password: "Passwort",
    passwordPlaceholder: "Ihr Passwort",
    showPassword: "Passwort anzeigen",
    hidePassword: "Passwort ausblenden",
    forgotPassword: "Passwort vergessen?",
    errorFallback: "Das Investor-Dashboard konnte nicht geöffnet werden.",
    emailRequired: "Geben Sie eine gültige Investor-E-Mail ein.",
    passwordRequired: "Geben Sie Ihr Passwort ein.",
    invalidCredentials: "E-Mail oder Passwort ist falsch.",
    inactiveAccount: "Der Investor-Zugang ist nicht aktiv. Kontaktieren Sie Ihren Manager.",
    tooManyAttempts: "Zu viele Anmeldeversuche. Bitte versuchen Sie es später erneut.",
    openDashboard: "Anmelden",
    openingDashboard: "Dashboard wird geöffnet..."
  },
  zh: {
    backToHomepage: "返回首页",
    investorAccess: "投资者访问",
    cardDescription: "请输入邮箱和密码。首次登录时，请使用批准邮件中的临时密码。",
    email: "邮箱",
    investorEmailAria: "投资者邮箱",
    emailPlaceholder: "you@example.com",
    password: "密码",
    passwordPlaceholder: "您的密码",
    showPassword: "显示密码",
    hidePassword: "隐藏密码",
    forgotPassword: "忘记密码？",
    errorFallback: "无法打开投资者仪表板。",
    emailRequired: "请输入有效的投资者邮箱。",
    passwordRequired: "请输入密码。",
    invalidCredentials: "邮箱或密码不正确。",
    inactiveAccount: "投资者访问尚未启用，请联系您的客户经理。",
    tooManyAttempts: "登录尝试次数过多，请稍后重试。",
    openDashboard: "登录",
    openingDashboard: "正在打开仪表板……"
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

export function InvestorLoginPage({ locale }: { locale: Locale }) {
  const t = getStrings(locale);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!isValidEmail(email)) {
      setError(t.emailRequired);
      return;
    }
    if (!password) {
      setError(t.passwordRequired);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/investor/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password })
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };

      if (!response.ok || !payload.ok) {
        if (response.status === 401 || response.status === 404) throw new Error(t.invalidCredentials);
        if (response.status === 403) throw new Error(t.inactiveAccount);
        if (response.status === 429) throw new Error(t.tooManyAttempts);
        throw new Error(t.errorFallback);
      }

      window.location.replace(`/${locale}/investor/dashboard`);
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
        <Link href={`/${locale}`} className="mb-8 inline-flex items-center gap-3 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="size-4" />
          {t.backToHomepage}
        </Link>
        <Card className="overflow-hidden rounded-[1.35rem] bg-card dark:bg-graphite-900/[0.78]">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-gold-400/60 to-transparent dark:via-gold-200/70" />
          <CardHeader>
            <div className="mb-4 flex size-12 items-center justify-center rounded-full border border-gold-200/25 bg-gold-300/20 dark:bg-gold-200/10 text-amber-700 dark:text-gold-100">
              <Lock className="size-5" />
            </div>
            <CardTitle className="text-2xl">{t.investorAccess}</CardTitle>
            <CardDescription>{t.cardDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-5" onSubmit={onSubmit}>
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
              <div className="flex flex-col gap-2">
                <label className="flex flex-col gap-2">
                  <span className={labelClass}>{t.password}</span>
                  <span className="relative">
                    <input
                      aria-label={t.password}
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder={t.passwordPlaceholder}
                      className={`${inputClass} w-full pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label={showPassword ? t.hidePassword : t.showPassword}
                      className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground dark:hover:bg-white/[0.08]"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </span>
                </label>
                <Link
                  href={`/${locale}/investor/forgot-password`}
                  className="self-start text-sm font-semibold text-amber-700 transition-colors hover:underline dark:text-gold-100"
                >
                  {t.forgotPassword}
                </Link>
              </div>

              {error ? (
                <p className="rounded-2xl border border-gold-200/20 bg-gold-300/20 dark:bg-gold-200/10 p-4 text-sm text-amber-700 dark:text-gold-100">{error}</p>
              ) : null}

              <Button type="submit" size="lg" disabled={isSubmitting}>
                {isSubmitting ? t.openingDashboard : t.openDashboard}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

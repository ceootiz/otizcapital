"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import type { Locale } from "@otiz/lib";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@otiz/ui";

const STRINGS = {
  en: {
    title: "Become a referral partner",
    desc: "Register to receive your unique referral link and earn commission on confirmed investor deposits.",
    name: "Name",
    email: "Email",
    telegram: "Telegram handle (optional)",
    password: "Password",
    passwordHint: "At least 8 characters",
    submit: "Create account",
    submitting: "Creating...",
    haveAccount: "Already have an account?",
    login: "Log in",
    successTitle: "Account created",
    successBody: "Your account is pending approval. You'll be able to log in once an administrator approves it.",
    yourLink: "Your referral link",
    errName: "Enter your name.",
    errEmail: "Enter a valid email.",
    errPassword: "Password must be at least 8 characters.",
    errTaken: "An account with this email already exists.",
    errFallback: "Could not create the account. Please try again."
  },
  ru: {
    title: "Стать партнёром",
    desc: "Зарегистрируйтесь, чтобы получить уникальную реферальную ссылку и зарабатывать комиссию с подтверждённых депозитов инвесторов.",
    name: "Имя",
    email: "Email",
    telegram: "Telegram (необязательно)",
    password: "Пароль",
    passwordHint: "Минимум 8 символов",
    submit: "Создать аккаунт",
    submitting: "Создаём...",
    haveAccount: "Уже есть аккаунт?",
    login: "Войти",
    successTitle: "Аккаунт создан",
    successBody: "Аккаунт ожидает одобрения. Вы сможете войти после того, как администратор его одобрит.",
    yourLink: "Ваша реферальная ссылка",
    errName: "Введите имя.",
    errEmail: "Введите корректный email.",
    errPassword: "Пароль должен содержать минимум 8 символов.",
    errTaken: "Аккаунт с таким email уже существует.",
    errFallback: "Не удалось создать аккаунт. Попробуйте ещё раз."
  },
  es: {
    title: "Conviértase en socio de referidos",
    desc: "Regístrese para recibir su enlace de referido único y ganar comisión sobre los depósitos confirmados de inversores.",
    name: "Nombre",
    email: "Correo electrónico",
    telegram: "Usuario de Telegram (opcional)",
    password: "Contraseña",
    passwordHint: "Al menos 8 caracteres",
    submit: "Crear cuenta",
    submitting: "Creando...",
    haveAccount: "¿Ya tiene una cuenta?",
    login: "Iniciar sesión",
    successTitle: "Cuenta creada",
    successBody: "Su cuenta está pendiente de aprobación. Podrá iniciar sesión una vez que un administrador la apruebe.",
    yourLink: "Su enlace de referido",
    errName: "Introduzca su nombre.",
    errEmail: "Introduzca un correo electrónico válido.",
    errPassword: "La contraseña debe tener al menos 8 caracteres.",
    errTaken: "Ya existe una cuenta con este correo electrónico.",
    errFallback: "No se pudo crear la cuenta. Inténtelo de nuevo."
  },
  de: {
    title: "Werden Sie Empfehlungspartner",
    desc: "Registrieren Sie sich, um Ihren einzigartigen Empfehlungslink zu erhalten und Provision auf bestätigte Investoreneinzahlungen zu verdienen.",
    name: "Name",
    email: "E-Mail",
    telegram: "Telegram-Name (optional)",
    password: "Passwort",
    passwordHint: "Mindestens 8 Zeichen",
    submit: "Konto erstellen",
    submitting: "Wird erstellt...",
    haveAccount: "Sie haben bereits ein Konto?",
    login: "Anmelden",
    successTitle: "Konto erstellt",
    successBody: "Ihr Konto wartet auf Freigabe. Sie können sich anmelden, sobald ein Administrator es freigegeben hat.",
    yourLink: "Ihr Empfehlungslink",
    errName: "Bitte geben Sie Ihren Namen ein.",
    errEmail: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
    errPassword: "Das Passwort muss mindestens 8 Zeichen enthalten.",
    errTaken: "Ein Konto mit dieser E-Mail-Adresse existiert bereits.",
    errFallback: "Konto konnte nicht erstellt werden. Bitte versuchen Sie es erneut."
  },
  zh: {
    title: "成为推荐合作伙伴",
    desc: "注册以获取您的专属推荐链接，并在投资者存款确认后赚取佣金。",
    name: "姓名",
    email: "电子邮箱",
    telegram: "Telegram 账号（可选）",
    password: "密码",
    passwordHint: "至少 8 个字符",
    submit: "创建账户",
    submitting: "正在创建...",
    haveAccount: "已有账户？",
    login: "登录",
    successTitle: "账户已创建",
    successBody: "您的账户正在等待审批。管理员审批通过后，您即可登录。",
    yourLink: "您的推荐链接",
    errName: "请输入您的姓名。",
    errEmail: "请输入有效的电子邮箱。",
    errPassword: "密码至少需 8 个字符。",
    errTaken: "该电子邮箱已被注册。",
    errFallback: "无法创建账户。请重试。"
  }
} as const;
type Strings = typeof STRINGS.en;
const getStrings = (locale: Locale): Strings => (STRINGS as unknown as Record<string, Strings>)[locale] ?? STRINGS.en;

const inputClass =
  "h-12 w-full rounded-2xl border border-border bg-muted/30 dark:border-white/10 dark:bg-black/20 px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold-200/45";
const labelClass = "text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground";

export function ArbitrageRegisterForm({ locale }: { locale: Locale }) {
  const t = getStrings(locale);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [telegramHandle, setTelegramHandle] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [referralLink, setReferralLink] = React.useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!name.trim()) return setError(t.errName);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError(t.errEmail);
    if (password.length < 8) return setError(t.errPassword);

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/arbitrage/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), telegramHandle: telegramHandle.trim(), password })
      });
      const payload = (await response.json()) as { ok: boolean; error?: string; data?: { referralCode: string } };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error === "EMAIL_TAKEN" ? t.errTaken : t.errFallback);
      }
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      setReferralLink(`${origin}/${locale}?ref=${payload.data?.referralCode ?? ""}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t.errFallback);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (referralLink) {
    return (
      <Card className="rounded-[1.35rem] bg-card dark:bg-graphite-900/[0.72]">
        <CardContent className="p-8">
          <p className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <CheckCircle2 className="size-5 text-amber-700 dark:text-gold-100" />
            {t.successTitle}
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{t.successBody}</p>
          <div className="mt-5 rounded-2xl border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 p-4">
            <p className={labelClass}>{t.yourLink}</p>
            <p className="mt-2 break-all font-mono text-sm text-foreground">{referralLink}</p>
          </div>
          <Link
            href={`/${locale}/arbitrage/login`}
            className="mt-6 inline-flex text-sm font-semibold text-amber-700 dark:text-gold-100"
          >
            {t.login}
          </Link>
        </CardContent>
      </Card>
    );
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
            <span className={labelClass}>{t.name}</span>
            <input value={name} onChange={(event) => setName(event.target.value)} className={inputClass} required />
          </label>
          <label className="flex flex-col gap-2">
            <span className={labelClass}>{t.email}</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} required />
          </label>
          <label className="flex flex-col gap-2">
            <span className={labelClass}>{t.telegram}</span>
            <input value={telegramHandle} onChange={(event) => setTelegramHandle(event.target.value)} className={inputClass} placeholder="@handle" />
          </label>
          <label className="flex flex-col gap-2">
            <span className={labelClass}>{t.password}</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass} placeholder={t.passwordHint} required />
          </label>
          {error ? (
            <p className="rounded-2xl border border-gold-200/20 bg-gold-300/20 dark:bg-gold-200/10 p-4 text-sm text-amber-700 dark:text-gold-100">{error}</p>
          ) : null}
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? t.submitting : t.submit}</Button>
          <p className="text-center text-sm text-muted-foreground">
            {t.haveAccount}{" "}
            <Link href={`/${locale}/arbitrage/login`} className="font-semibold text-amber-700 dark:text-gold-100">
              {t.login}
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

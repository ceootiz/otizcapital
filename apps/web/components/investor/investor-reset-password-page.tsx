"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, KeyRound, ShieldAlert } from "lucide-react";
import type { Locale } from "@otiz/lib";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@otiz/ui";

const STRINGS = {
  en: {
    backToLogin: "Back to sign in",
    validating: "Checking your link...",
    title: "Set a new password",
    description: "Choose a new password for your investor account.",
    newPassword: "New password",
    confirmPassword: "Confirm password",
    passwordPlaceholder: "At least 8 characters",
    confirmPlaceholder: "Repeat your password",
    submit: "Save new password",
    saving: "Saving...",
    successTitle: "Password changed",
    successBody: "Your password has been changed successfully. You can now sign in.",
    goToLogin: "Go to sign in",
    invalidTitle: "This link is not valid",
    requestNew: "Request a new link",
    tooShort: "Password must be at least 8 characters.",
    mismatch: "Passwords do not match.",
    errorFallback: "Could not reset your password. Please try again.",
    errors: {
      invalid: "This reset link is invalid. Please request a new one.",
      expired: "This reset link has expired. Please request a new one.",
      used: "This reset link has already been used. Please request a new one.",
      PASSWORD_TOO_SHORT: "Password must be at least 8 characters.",
      PASSWORD_TOO_LONG: "Password is too long."
    }
  },
  ru: {
    backToLogin: "Назад ко входу",
    validating: "Проверяем ссылку...",
    title: "Новый пароль",
    description: "Задайте новый пароль для вашего кабинета инвестора.",
    newPassword: "Новый пароль",
    confirmPassword: "Подтверждение пароля",
    passwordPlaceholder: "Минимум 8 символов",
    confirmPlaceholder: "Повторите пароль",
    submit: "Сохранить новый пароль",
    saving: "Сохраняем...",
    successTitle: "Пароль изменён",
    successBody: "Пароль успешно изменён. Теперь вы можете войти.",
    goToLogin: "Перейти ко входу",
    invalidTitle: "Ссылка недействительна",
    requestNew: "Запросить новую ссылку",
    tooShort: "Пароль должен содержать минимум 8 символов.",
    mismatch: "Пароли не совпадают.",
    errorFallback: "Не удалось сбросить пароль. Попробуйте ещё раз.",
    errors: {
      invalid: "Ссылка для сброса недействительна. Запросите новую.",
      expired: "Срок действия ссылки истёк. Запросите новую.",
      used: "Эта ссылка уже была использована. Запросите новую.",
      PASSWORD_TOO_SHORT: "Пароль должен содержать минимум 8 символов.",
      PASSWORD_TOO_LONG: "Пароль слишком длинный."
    }
  },
  es: {
    backToLogin: "Volver al inicio de sesión",
    validating: "Comprobando su enlace...",
    title: "Establecer una nueva contraseña",
    description: "Elija una nueva contraseña para su cuenta de inversor.",
    newPassword: "Nueva contraseña",
    confirmPassword: "Confirmar contraseña",
    passwordPlaceholder: "Al menos 8 caracteres",
    confirmPlaceholder: "Repita su contraseña",
    submit: "Guardar nueva contraseña",
    saving: "Guardando...",
    successTitle: "Contraseña cambiada",
    successBody: "Su contraseña se ha cambiado correctamente. Ya puede iniciar sesión.",
    goToLogin: "Ir al inicio de sesión",
    invalidTitle: "Este enlace no es válido",
    requestNew: "Solicitar un nuevo enlace",
    tooShort: "La contraseña debe tener al menos 8 caracteres.",
    mismatch: "Las contraseñas no coinciden.",
    errorFallback: "No se pudo restablecer su contraseña. Vuelva a intentarlo.",
    errors: {
      invalid: "Este enlace de restablecimiento no es válido. Solicite uno nuevo.",
      expired: "Este enlace de restablecimiento ha caducado. Solicite uno nuevo.",
      used: "Este enlace de restablecimiento ya se ha utilizado. Solicite uno nuevo.",
      PASSWORD_TOO_SHORT: "La contraseña debe tener al menos 8 caracteres.",
      PASSWORD_TOO_LONG: "La contraseña es demasiado larga."
    }
  },
  de: {
    backToLogin: "Zurück zur Anmeldung",
    validating: "Ihr Link wird geprüft...",
    title: "Neues Passwort festlegen",
    description: "Wählen Sie ein neues Passwort für Ihr Investor-Konto.",
    newPassword: "Neues Passwort",
    confirmPassword: "Passwort bestätigen",
    passwordPlaceholder: "Mindestens 8 Zeichen",
    confirmPlaceholder: "Passwort wiederholen",
    submit: "Neues Passwort speichern",
    saving: "Wird gespeichert...",
    successTitle: "Passwort geändert",
    successBody: "Ihr Passwort wurde erfolgreich geändert. Sie können sich jetzt anmelden.",
    goToLogin: "Zur Anmeldung",
    invalidTitle: "Dieser Link ist ungültig",
    requestNew: "Neuen Link anfordern",
    tooShort: "Das Passwort muss mindestens 8 Zeichen lang sein.",
    mismatch: "Die Passwörter stimmen nicht überein.",
    errorFallback: "Ihr Passwort konnte nicht zurückgesetzt werden. Bitte versuchen Sie es erneut.",
    errors: {
      invalid: "Dieser Link zum Zurücksetzen ist ungültig. Bitte fordern Sie einen neuen an.",
      expired: "Dieser Link zum Zurücksetzen ist abgelaufen. Bitte fordern Sie einen neuen an.",
      used: "Dieser Link zum Zurücksetzen wurde bereits verwendet. Bitte fordern Sie einen neuen an.",
      PASSWORD_TOO_SHORT: "Das Passwort muss mindestens 8 Zeichen lang sein.",
      PASSWORD_TOO_LONG: "Das Passwort ist zu lang."
    }
  },
  zh: {
    backToLogin: "返回登录",
    validating: "正在检查您的链接……",
    title: "设置新密码",
    description: "请为您的投资者账户选择一个新密码。",
    newPassword: "新密码",
    confirmPassword: "确认密码",
    passwordPlaceholder: "至少 8 个字符",
    confirmPlaceholder: "重复输入您的密码",
    submit: "保存新密码",
    saving: "正在保存……",
    successTitle: "密码已更改",
    successBody: "您的密码已成功更改。现在您可以登录。",
    goToLogin: "前往登录",
    invalidTitle: "此链接无效",
    requestNew: "申请新链接",
    tooShort: "密码长度至少为 8 个字符。",
    mismatch: "两次输入的密码不一致。",
    errorFallback: "无法重置您的密码。请重试。",
    errors: {
      invalid: "此重置链接无效。请申请新的链接。",
      expired: "此重置链接已过期。请申请新的链接。",
      used: "此重置链接已被使用。请申请新的链接。",
      PASSWORD_TOO_SHORT: "密码长度至少为 8 个字符。",
      PASSWORD_TOO_LONG: "密码过长。"
    }
  }
} as const;
type Strings = typeof STRINGS.en;
const getStrings = (locale: Locale): Strings => (STRINGS as unknown as Record<string, Strings>)[locale] ?? STRINGS.en;

const inputClass =
  "h-[3.25rem] rounded-2xl border border-border bg-muted/30 dark:border-white/10 dark:bg-black/20 px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold-200/45 focus:ring-2 focus:ring-gold-200/15";
const labelClass = "text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground";
const errorBoxClass = "rounded-2xl border border-gold-200/20 bg-gold-300/20 dark:bg-gold-200/10 p-4 text-sm text-amber-700 dark:text-gold-100";

type Phase = "validating" | "valid" | "invalid" | "success";
type ValidateError = "invalid" | "expired" | "used";

export function InvestorResetPasswordPage({ locale, token }: { locale: Locale; token: string }) {
  const t = getStrings(locale);
  const [phase, setPhase] = React.useState<Phase>("validating");
  const [validateError, setValidateError] = React.useState<ValidateError>("invalid");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!token) {
      setValidateError("invalid");
      setPhase("invalid");
      return;
    }
    let active = true;
    fetch(`/api/investor/reset-password/validate?token=${encodeURIComponent(token)}`)
      .then((response) => response.json())
      .then((payload: { valid: boolean; error?: ValidateError }) => {
        if (!active) return;
        if (payload.valid) {
          setPhase("valid");
        } else {
          setValidateError(payload.error ?? "invalid");
          setPhase("invalid");
        }
      })
      .catch(() => {
        if (!active) return;
        setValidateError("invalid");
        setPhase("invalid");
      });
    return () => {
      active = false;
    };
  }, [token]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError(t.tooShort);
      return;
    }
    if (password !== confirm) {
      setError(t.mismatch);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/investor/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password })
      });
      const payload = (await response.json()) as { ok: boolean; error?: keyof Strings["errors"] };
      if (!response.ok || !payload.ok) {
        const key = payload.error;
        throw new Error((key && t.errors[key]) || t.errorFallback);
      }
      setPhase("success");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t.errorFallback);
    } finally {
      setIsSubmitting(false);
    }
  }

  const icon =
    phase === "success" ? <CheckCircle2 className="size-5" /> : phase === "invalid" ? <ShieldAlert className="size-5" /> : <KeyRound className="size-5" />;
  const cardTitle = phase === "success" ? t.successTitle : phase === "invalid" ? t.invalidTitle : t.title;
  const cardDescription = phase === "success" ? t.successBody : phase === "invalid" ? t.errors[validateError] : phase === "validating" ? t.validating : t.description;

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
              {icon}
            </div>
            <CardTitle className="text-2xl">{cardTitle}</CardTitle>
            <CardDescription>{cardDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            {phase === "valid" ? (
              <form className="flex flex-col gap-5" onSubmit={onSubmit}>
                <label className="flex flex-col gap-2">
                  <span className={labelClass}>{t.newPassword}</span>
                  <input
                    aria-label={t.newPassword}
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={t.passwordPlaceholder}
                    className={inputClass}
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className={labelClass}>{t.confirmPassword}</span>
                  <input
                    aria-label={t.confirmPassword}
                    type="password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(event) => setConfirm(event.target.value)}
                    placeholder={t.confirmPlaceholder}
                    className={inputClass}
                  />
                </label>
                {error ? <p className={errorBoxClass}>{error}</p> : null}
                <Button type="submit" size="lg" disabled={isSubmitting}>
                  {isSubmitting ? t.saving : t.submit}
                </Button>
              </form>
            ) : phase === "success" ? (
              <Link href={`/${locale}/investor/login`} className="inline-flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-gold-100 hover:underline">
                <ArrowLeft className="size-4" />
                {t.goToLogin}
              </Link>
            ) : phase === "invalid" ? (
              <Link href={`/${locale}/investor/forgot-password`} className="inline-flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-gold-100 hover:underline">
                {t.requestNew}
              </Link>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import type { Locale } from "@otiz/lib";

const STRINGS = {
  en: {
    back: "Back to admin",
    eyebrow: "Security",
    title: "Two-factor authentication",
    enabledTitle: "2FA is active",
    enabledBody: "Two-factor authentication is configured. Admin logins require a 6-digit code after the password.",
    scanTitle: "1. Scan this QR code",
    scanBody: "Scan with Google Authenticator (or any TOTP app).",
    secretTitle: "2. Or enter the key manually",
    copy: "Copy",
    copied: "Copied",
    activateTitle: "3. Activate",
    activateBody: "Set the environment variable ADMIN_TOTP_SECRET to this key and redeploy. After that, every admin login will require your 6-digit code.",
    warning: "Keep this key secret. Anyone with it can generate your login codes."
  },
  ru: {
    back: "Назад в админку",
    eyebrow: "Безопасность",
    title: "Двухфакторная аутентификация",
    enabledTitle: "2FA включена",
    enabledBody: "Двухфакторная аутентификация настроена. Вход администратора требует 6-значный код после пароля.",
    scanTitle: "1. Отсканируйте QR-код",
    scanBody: "Отсканируйте в Google Authenticator (или любом приложении TOTP).",
    secretTitle: "2. Или введите ключ вручную",
    copy: "Копировать",
    copied: "Скопировано",
    activateTitle: "3. Активация",
    activateBody: "Установите переменную окружения ADMIN_TOTP_SECRET равной этому ключу и передеплойте. После этого каждый вход администратора будет требовать 6-значный код.",
    warning: "Держите этот ключ в секрете. Любой, у кого он есть, сможет генерировать коды входа."
  }
} as const;

type Strings = typeof STRINGS.en;
const getStrings = (locale: Locale): Strings => (STRINGS as unknown as Record<string, Strings>)[locale] ?? STRINGS.en;

export function AdminSetup2faPage({
  locale,
  enabled,
  otpauthUrl,
  secret
}: {
  locale: Locale;
  enabled: boolean;
  otpauthUrl: string | null;
  secret: string | null;
}) {
  const t = getStrings(locale);
  const [copied, setCopied] = useState(false);

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <Link href={`/${locale}/admin/applications`} className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="size-4" />
        {t.back}
      </Link>

      <header className="mt-6 flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 dark:text-gold-200/70">{t.eyebrow}</span>
        <h1 className="text-2xl font-semibold text-foreground">{t.title}</h1>
      </header>

      {enabled ? (
        <div className="mt-8 flex items-start gap-3 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-5">
          <ShieldCheck className="mt-0.5 size-5 text-emerald-300" />
          <div>
            <p className="font-semibold text-emerald-200">{t.enabledTitle}</p>
            <p className="mt-1 text-sm leading-6 text-emerald-100/90">{t.enabledBody}</p>
          </div>
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-6">
          <section className="rounded-2xl border border-border dark:border-white/10 bg-muted/30 dark:bg-white/[0.03] p-5">
            <p className="text-sm font-semibold text-foreground">{t.scanTitle}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t.scanBody}</p>
            {otpauthUrl ? (
              <div className="mt-4 inline-flex rounded-2xl bg-white p-4">
                <QRCodeSVG value={otpauthUrl} size={180} level="M" />
              </div>
            ) : null}
          </section>

          <section className="rounded-2xl border border-border dark:border-white/10 bg-muted/30 dark:bg-white/[0.03] p-5">
            <p className="text-sm font-semibold text-foreground">{t.secretTitle}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <code className="break-all rounded-lg border border-border dark:border-white/10 bg-muted/30 dark:bg-black/30 px-3 py-2 font-mono text-sm text-amber-700 dark:text-gold-100">{secret}</code>
              <button
                type="button"
                onClick={() => {
                  if (secret) {
                    void navigator.clipboard.writeText(secret);
                    setCopied(true);
                    window.setTimeout(() => setCopied(false), 2000);
                  }
                }}
                className="rounded-full border border-border dark:border-white/10 px-4 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                {copied ? t.copied : t.copy}
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-gold-200/25 bg-gold-300/20 dark:bg-gold-200/10 p-5">
            <p className="text-sm font-semibold text-amber-700 dark:text-gold-100">{t.activateTitle}</p>
            <p className="mt-1 text-sm leading-6 text-amber-700 dark:text-gold-100/90">{t.activateBody}</p>
          </section>

          <p className="text-xs leading-5 text-muted-foreground">{t.warning}</p>
        </div>
      )}
    </main>
  );
}

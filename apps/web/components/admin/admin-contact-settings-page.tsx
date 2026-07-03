"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import type { Locale } from "@otiz/lib";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@otiz/ui";
import { AdminNavigation } from "./admin-navigation";

const ADMIN_CSRF_COOKIE = "admin_csrf_token";
const ADMIN_CSRF_HEADER = "x-csrf-token";

const STRINGS = {
  en: {
    backToHome: "Back to homepage",
    eyebrow: "Contact settings",
    title: "Contact",
    description: "The Telegram handle investors reach you through — shown as the \"Contact manager\" button and on the post-application status page.",
    label: "Telegram handle",
    hint: "Without the @ — e.g. otizceo",
    save: "Save",
    saving: "Saving...",
    saved: "Contact handle saved.",
    error: "Could not save. Please try again.",
    preview: "Investors will open:"
  },
  ru: {
    backToHome: "На главную",
    eyebrow: "Настройки контакта",
    title: "Контакты",
    description: "Telegram-хэндл, через который инвесторы связываются с вами — показывается как кнопка «Написать менеджеру» и на странице статуса заявки.",
    label: "Telegram-хэндл",
    hint: "Без @ — например, otizceo",
    save: "Сохранить",
    saving: "Сохраняем...",
    saved: "Хэндл сохранён.",
    error: "Не удалось сохранить. Попробуйте ещё раз.",
    preview: "Инвесторы откроют:"
  }
} as const;
type Strings = typeof STRINGS.en;
const getStrings = (locale: Locale): Strings => (STRINGS as unknown as Record<string, Strings>)[locale] ?? STRINGS.en;

function getCsrf() {
  if (typeof document === "undefined") return "";
  return document.cookie.split("; ").find((c) => c.startsWith(`${ADMIN_CSRF_COOKIE}=`))?.split("=").slice(1).join("=") || "";
}

export function AdminContactSettingsPage({ locale, initialTelegram }: { locale: Locale; initialTelegram: string }) {
  const t = getStrings(locale);
  const [telegram, setTelegram] = React.useState(initialTelegram);
  const [isSaving, setIsSaving] = React.useState(false);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const cleaned = telegram.replace(/^@+/, "").replace(/[^A-Za-z0-9_]/g, "");

  async function save() {
    setIsSaving(true);
    setNotice(null);
    setError(null);
    try {
      const response = await fetch("/api/admin/settings/contact", {
        method: "PUT",
        headers: { "Content-Type": "application/json", [ADMIN_CSRF_HEADER]: getCsrf() },
        body: JSON.stringify({ telegram: cleaned })
      });
      const payload = (await response.json()) as { ok: boolean; telegram?: string; error?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || t.error);
      }
      if (payload.telegram) setTelegram(payload.telegram);
      setNotice(t.saved);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t.error);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground micro-noise">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(212,175,95,0.14),transparent_34rem),radial-gradient(circle_at_86%_10%,rgba(255,255,255,0.07),transparent_28rem)]" />
      <div className="macro-grid absolute inset-0 opacity-45" />
      <section className="relative z-10 py-8 sm:py-10">
        <div className="container">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link href={`/${locale}`} className="inline-flex items-center gap-3 text-sm text-muted-foreground transition-colors hover:text-foreground">
              <ArrowLeft className="size-4" />
              {t.backToHome}
            </Link>
            <AdminNavigation locale={locale} activeSection="contact-settings" className="flex flex-wrap items-center gap-2" />
          </div>

          <Card className="max-w-2xl rounded-[1.35rem] bg-card dark:bg-graphite-900/[0.78]">
            <CardHeader>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700 dark:text-gold-100">{t.eyebrow}</p>
              <CardTitle className="mt-2 text-2xl">{t.title}</CardTitle>
              <CardDescription>{t.description}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5">
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t.label}</span>
                <div className="flex items-center gap-2 rounded-2xl border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 px-4">
                  <span className="text-sm text-muted-foreground">@</span>
                  <input
                    value={telegram}
                    onChange={(event) => setTelegram(event.target.value)}
                    placeholder="otizceo"
                    className="h-12 flex-1 bg-transparent text-sm text-foreground outline-none"
                  />
                </div>
                <span className="text-xs text-muted-foreground">{t.hint}</span>
              </label>

              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Send className="size-4 text-amber-700 dark:text-gold-100" />
                {t.preview} <span className="font-mono text-foreground">https://t.me/{cleaned || "otizceo"}</span>
              </p>

              {notice ? <p className="rounded-2xl border border-gold-200/25 bg-gold-300/20 dark:bg-gold-200/10 p-4 text-sm text-amber-700 dark:text-gold-100">{notice}</p> : null}
              {error ? <p className="rounded-2xl border border-red-300/20 bg-red-500/10 p-4 text-sm text-red-100">{error}</p> : null}

              <div>
                <Button type="button" disabled={isSaving || cleaned.length < 3} onClick={save}>{isSaving ? t.saving : t.save}</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}

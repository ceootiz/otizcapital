"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CONTENT_SCOPES, locales, localeNames, type ContentScope, type Locale } from "@otiz/lib";
import { AdminNavigation } from "./admin-navigation";

const ADMIN_CSRF_COOKIE = "admin_csrf_token";
const ADMIN_CSRF_HEADER = "x-csrf-token";

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

const UI: Record<"en" | "ru", {
  eyebrow: string;
  title: string;
  description: string;
  backHome: string;
  scope: string;
  scopeHome: string;
  scopeApply: string;
  language: string;
  fallbackNote: string;
  save: string;
  saving: string;
  reset: string;
  resetting: string;
  resetConfirm: string;
  reload: string;
  loading: string;
  usingOverride: string;
  usingDefaults: string;
  addItem: string;
  removeItem: string;
  item: string;
  saved: string;
  resetDone: string;
  loadError: string;
  saveError: string;
  yieldTitle: string;
  yieldLabel: string;
  yieldSaved: string;
  yieldError: string;
}> = {
  en: {
    eyebrow: "Content management",
    title: "Website content",
    description: "Edit all public homepage and application-page text and numbers. Changes publish to the live site after saving.",
    backHome: "Back to homepage",
    scope: "Page",
    scopeHome: "Homepage",
    scopeApply: "Application page",
    language: "Content language",
    fallbackNote: "Fields with no translation for this language show the English default until you edit them.",
    save: "Save changes",
    saving: "Saving...",
    reset: "Reset to defaults",
    resetting: "Resetting...",
    resetConfirm: "Reset this page and language to the built-in defaults? Saved overrides will be removed.",
    reload: "Reload",
    loading: "Loading content...",
    usingOverride: "Custom content saved",
    usingDefaults: "Using built-in defaults",
    addItem: "Add item",
    removeItem: "Remove",
    item: "Item",
    saved: "Content saved and published.",
    resetDone: "Content reset to defaults.",
    loadError: "Unable to load content.",
    saveError: "Unable to save content.",
    yieldTitle: "Yield calculator rate",
    yieldLabel: "Annual rate (%)",
    yieldSaved: "Yield rate saved.",
    yieldError: "Unable to save yield rate."
  },
  ru: {
    eyebrow: "Управление контентом",
    title: "Контент сайта",
    description: "Редактируйте весь публичный текст и числа главной страницы и страницы заявки. Изменения публикуются на сайт после сохранения.",
    backHome: "На главную",
    scope: "Страница",
    scopeHome: "Главная страница",
    scopeApply: "Страница заявки",
    language: "Язык контента",
    fallbackNote: "Поля без перевода на этот язык показывают английское значение по умолчанию, пока вы их не отредактируете.",
    save: "Сохранить изменения",
    saving: "Сохранение...",
    reset: "Сбросить к значениям по умолчанию",
    resetting: "Сброс...",
    resetConfirm: "Сбросить эту страницу и язык к встроенным значениям по умолчанию? Сохранённые изменения будут удалены.",
    reload: "Обновить",
    loading: "Загрузка контента...",
    usingOverride: "Сохранён пользовательский контент",
    usingDefaults: "Используются значения по умолчанию",
    addItem: "Добавить элемент",
    removeItem: "Удалить",
    item: "Элемент",
    saved: "Контент сохранён и опубликован.",
    resetDone: "Контент сброшен к значениям по умолчанию.",
    loadError: "Не удалось загрузить контент.",
    saveError: "Не удалось сохранить контент.",
    yieldTitle: "Ставка доходности калькулятора",
    yieldLabel: "Годовая ставка (%)",
    yieldSaved: "Ставка доходности сохранена.",
    yieldError: "Не удалось сохранить ставку доходности."
  }
};

const getUi = (locale: Locale) => UI[locale === "ru" ? "ru" : "en"];

function getCookieValue(name: string) {
  if (typeof document === "undefined") return "";
  return document.cookie.split("; ").find((cookie) => cookie.startsWith(`${name}=`))?.split("=").slice(1).join("=") || "";
}

function humanize(key: string) {
  const spaced = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim();
  if (!spaced) return key;
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function setAtPath(root: Json, path: (string | number)[], value: Json): Json {
  if (path.length === 0) return value;
  const next = Array.isArray(root) ? [...root] : { ...(root as Record<string, Json>) };
  const [head, ...rest] = path;
  const child = (next as Record<string | number, Json>)[head as never];
  (next as Record<string | number, Json>)[head as never] = setAtPath(child ?? (typeof rest[0] === "number" ? [] : {}), rest, value);
  return next as Json;
}

function blankLike(sample: Json): Json {
  if (typeof sample === "string") return "";
  if (typeof sample === "number") return 0;
  if (typeof sample === "boolean") return false;
  if (Array.isArray(sample)) return [];
  if (sample && typeof sample === "object") {
    const out: Record<string, Json> = {};
    for (const [k, v] of Object.entries(sample)) out[k] = blankLike(v);
    return out;
  }
  return "";
}

function YieldSettingsCard({ t }: { t: ReturnType<typeof getUi> }) {
  const [rate, setRate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; message: string } | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/admin/yield", { cache: "no-store" });
        const body = await res.json();
        if (!res.ok || !body.ok) throw new Error(body.error || t.yieldError);
        if (active) setRate(String(body.annualRatePercent));
      } catch (error) {
        if (active) setNotice({ tone: "error", message: error instanceof Error ? error.message : t.yieldError });
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [t.yieldError]);

  const save = useCallback(async () => {
    setSaving(true);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/yield", {
        method: "PUT",
        headers: { "Content-Type": "application/json", [ADMIN_CSRF_HEADER]: getCookieValue(ADMIN_CSRF_COOKIE) },
        body: JSON.stringify({ annualRatePercent: rate === "" ? 0 : Number(rate) })
      });
      const body = await res.json();
      if (!res.ok || !body.ok) throw new Error(body.error || t.yieldError);
      setRate(String(body.annualRatePercent));
      setNotice({ tone: "ok", message: t.yieldSaved });
    } catch (error) {
      setNotice({ tone: "error", message: error instanceof Error ? error.message : t.yieldError });
    } finally {
      setSaving(false);
    }
  }, [rate, t.yieldSaved, t.yieldError]);

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-gold-200/25 bg-gold-200/[0.06] p-4 sm:flex-row sm:items-end sm:justify-between">
      <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {t.yieldTitle}
        <span className="mt-1 flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={1000}
            step={1}
            value={rate}
            disabled={loading}
            onChange={(event) => setRate(event.target.value)}
            aria-label={t.yieldLabel}
            className="w-32 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-foreground disabled:opacity-40"
          />
          <span className="text-[0.7rem] normal-case text-muted-foreground">{t.yieldLabel}</span>
        </span>
      </label>

      <div className="flex items-center gap-3">
        {notice && (
          <span className={`text-xs ${notice.tone === "ok" ? "text-emerald-300" : "text-red-300"}`}>{notice.message}</span>
        )}
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving || loading}
          className="rounded-full border border-gold-200/35 bg-gold-200/10 px-5 py-2 text-xs font-semibold text-gold-100 transition-colors hover:bg-gold-200/20 disabled:opacity-40"
        >
          {saving ? t.saving : t.save}
        </button>
      </div>
    </section>
  );
}

export function AdminContentPage({ locale }: { locale: Locale }) {
  const t = getUi(locale);

  const [scope, setScope] = useState<ContentScope>("home");
  const [contentLocale, setContentLocale] = useState<Locale>(locale);
  const [data, setData] = useState<Json | null>(null);
  const [hasOverride, setHasOverride] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; message: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/content?scope=${scope}&locale=${contentLocale}`, { cache: "no-store" });
      const body = await res.json();
      if (!res.ok || !body.ok) throw new Error(body.error || t.loadError);
      setData(body.content as Json);
      setHasOverride(Boolean(body.hasOverride));
    } catch (error) {
      setData(null);
      setNotice({ tone: "error", message: error instanceof Error ? error.message : t.loadError });
    } finally {
      setLoading(false);
    }
  }, [scope, contentLocale, t.loadError]);

  useEffect(() => {
    void load();
  }, [load]);

  const update = useCallback((path: (string | number)[], value: Json) => {
    setData((current) => (current === null ? current : setAtPath(current, path, value)));
  }, []);

  const save = useCallback(async () => {
    if (data === null) return;
    setSaving(true);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json", [ADMIN_CSRF_HEADER]: getCookieValue(ADMIN_CSRF_COOKIE) },
        body: JSON.stringify({ scope, locale: contentLocale, data })
      });
      const body = await res.json();
      if (!res.ok || !body.ok) throw new Error(body.error || t.saveError);
      setHasOverride(true);
      setNotice({ tone: "ok", message: t.saved });
    } catch (error) {
      setNotice({ tone: "error", message: error instanceof Error ? error.message : t.saveError });
    } finally {
      setSaving(false);
    }
  }, [data, scope, contentLocale, t.saved, t.saveError]);

  const reset = useCallback(async () => {
    if (!window.confirm(t.resetConfirm)) return;
    setResetting(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/content?scope=${scope}&locale=${contentLocale}`, {
        method: "DELETE",
        headers: { [ADMIN_CSRF_HEADER]: getCookieValue(ADMIN_CSRF_COOKIE) }
      });
      const body = await res.json();
      if (!res.ok || !body.ok) throw new Error(body.error || t.saveError);
      setNotice({ tone: "ok", message: t.resetDone });
      await load();
    } catch (error) {
      setNotice({ tone: "error", message: error instanceof Error ? error.message : t.saveError });
    } finally {
      setResetting(false);
    }
  }, [scope, contentLocale, load, t.resetConfirm, t.resetDone, t.saveError]);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6">
        <Link href={`/${locale}`} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
          ← {t.backHome}
        </Link>

        <AdminNavigation locale={locale} className="flex flex-wrap items-center gap-2" />

        <header className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-200/70">{t.eyebrow}</span>
          <h1 className="text-2xl font-semibold text-foreground">{t.title}</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">{t.description}</p>
        </header>

        <YieldSettingsCard t={t} />

        {/* Controls */}
        <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {t.scope}
              <select
                value={scope}
                onChange={(event) => setScope(event.target.value as ContentScope)}
                className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-foreground"
              >
                {CONTENT_SCOPES.map((value) => (
                  <option key={value} value={value}>
                    {value === "home" ? t.scopeHome : t.scopeApply}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {t.language}
              <select
                value={contentLocale}
                onChange={(event) => setContentLocale(event.target.value as Locale)}
                className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-foreground"
              >
                {locales.map((value) => (
                  <option key={value} value={value}>
                    {localeNames[value]}
                  </option>
                ))}
              </select>
            </label>

            <span className={`text-xs ${hasOverride ? "text-emerald-300" : "text-muted-foreground"}`}>
              {hasOverride ? t.usingOverride : t.usingDefaults}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void reset()}
              disabled={resetting || loading || !hasOverride}
              className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
            >
              {resetting ? t.resetting : t.reset}
            </button>
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving || loading || data === null}
              className="rounded-full border border-gold-200/35 bg-gold-200/10 px-5 py-2 text-xs font-semibold text-gold-100 transition-colors hover:bg-gold-200/20 disabled:opacity-40"
            >
              {saving ? t.saving : t.save}
            </button>
          </div>
        </div>

        {contentLocale !== "en" && <p className="text-xs text-muted-foreground">{t.fallbackNote}</p>}

        {notice && (
          <p className={`rounded-lg border px-4 py-2 text-sm ${notice.tone === "ok" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-red-400/30 bg-red-400/10 text-red-200"}`}>
            {notice.message}
          </p>
        )}

        {loading ? (
          <p className="text-sm text-muted-foreground">{t.loading}</p>
        ) : data && typeof data === "object" && !Array.isArray(data) ? (
          <div className="flex flex-col gap-6">
            {Object.entries(data).map(([key, value]) => (
              <ContentNode key={key} label={humanize(key)} value={value} path={[key]} onChange={update} t={t} depth={0} />
            ))}
          </div>
        ) : null}
      </div>
    </main>
  );
}

type NodeProps = {
  label: string;
  value: Json;
  path: (string | number)[];
  onChange: (path: (string | number)[], value: Json) => void;
  t: ReturnType<typeof getUi>;
  depth: number;
};

function ContentNode({ label, value, path, onChange, t, depth }: NodeProps) {
  if (typeof value === "string") {
    const multiline = value.length > 60 || value.includes("\n");
    return (
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</span>
        {multiline ? (
          <textarea
            value={value}
            rows={Math.min(6, Math.max(2, Math.ceil(value.length / 60)))}
            onChange={(event) => onChange(path, event.target.value)}
            className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-foreground"
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(event) => onChange(path, event.target.value)}
            className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-foreground"
          />
        )}
      </label>
    );
  }

  if (typeof value === "number") {
    return (
      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</span>
        <input
          type="number"
          value={value}
          onChange={(event) => onChange(path, event.target.value === "" ? 0 : Number(event.target.value))}
          className="w-40 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-foreground"
        />
      </label>
    );
  }

  if (typeof value === "boolean") {
    return (
      <label className="flex items-center gap-2 text-sm text-foreground">
        <input type="checkbox" checked={value} onChange={(event) => onChange(path, event.target.checked)} />
        {label}
      </label>
    );
  }

  if (Array.isArray(value)) {
    return (
      <fieldset className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <legend className="px-1 text-sm font-semibold text-foreground">{label}</legend>
        {value.map((item, index) => (
          <div key={index} className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/10 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-200/60">
                {t.item} {index + 1}
              </span>
              <button
                type="button"
                onClick={() => onChange(path, value.filter((_, i) => i !== index))}
                className="rounded-full border border-red-400/30 px-3 py-1 text-xs font-semibold text-red-200 transition-colors hover:bg-red-400/10"
              >
                {t.removeItem}
              </button>
            </div>
            <ContentNode label={`${label} ${index + 1}`} value={item} path={[...path, index]} onChange={onChange} t={t} depth={depth + 1} />
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange(path, [...value, blankLike(value[0] ?? "")])}
          className="self-start rounded-full border border-white/10 px-4 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          + {t.addItem}
        </button>
      </fieldset>
    );
  }

  if (value && typeof value === "object") {
    const Wrapper = depth === 0 ? "section" : "div";
    return (
      <Wrapper className={depth === 0 ? "flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5" : "flex flex-col gap-4 border-l border-white/10 pl-4"}>
        {depth === 0 ? (
          <h2 className="text-lg font-semibold text-foreground">{label}</h2>
        ) : (
          <h3 className="text-sm font-semibold text-foreground">{label}</h3>
        )}
        <div className="flex flex-col gap-4">
          {Object.entries(value).map(([key, child]) => (
            <ContentNode key={key} label={humanize(key)} value={child} path={[...path, key]} onChange={onChange} t={t} depth={depth + 1} />
          ))}
        </div>
      </Wrapper>
    );
  }

  return null;
}

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CONTENT_SCOPES, locales, localeNames, type ContentScope, type Locale } from "@otiz/lib";

const ADMIN_CSRF_COOKIE = "admin_csrf_token";
const ADMIN_CSRF_HEADER = "x-csrf-token";

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

const UI: Record<Locale, {
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
  draftSaved: string;
  publish: string;
  publishing: string;
  published: string;
  preview: string;
  edit: string;
  draftReady: string;
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
    draftSaved: "Draft saved. The public page has not changed.",
    publish: "Publish",
    publishing: "Publishing...",
    published: "Draft published.",
    preview: "Preview",
    edit: "Continue editing",
    draftReady: "Draft ready",
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
    draftSaved: "Черновик сохранён. Публичная страница не изменилась.",
    publish: "Опубликовать",
    publishing: "Публикация...",
    published: "Черновик опубликован.",
    preview: "Предпросмотр",
    edit: "Продолжить редактирование",
    draftReady: "Черновик готов",
    resetDone: "Контент сброшен к значениям по умолчанию.",
    loadError: "Не удалось загрузить контент.",
    saveError: "Не удалось сохранить контент.",
    yieldTitle: "Ставка доходности калькулятора",
    yieldLabel: "Годовая ставка (%)",
    yieldSaved: "Ставка доходности сохранена.",
    yieldError: "Не удалось сохранить ставку доходности."
  },
  de: {
    eyebrow: "Inhaltsverwaltung", title: "Website-Inhalte", description: "Bearbeiten Sie öffentliche Texte und Zahlen. Im Studio werden Änderungen zuerst als Entwurf gespeichert.", backHome: "Zur Startseite", scope: "Seite", scopeHome: "Startseite", scopeApply: "Antragsseite", language: "Inhaltssprache", fallbackNote: "Felder ohne Übersetzung zeigen den englischen Standard, bis Sie sie bearbeiten.", save: "Entwurf speichern", saving: "Wird gespeichert...", reset: "Auf Standard zurücksetzen", resetting: "Wird zurückgesetzt...", resetConfirm: "Diese Seite und Sprache auf die integrierten Standardwerte zurücksetzen?", reload: "Neu laden", loading: "Inhalte werden geladen...", usingOverride: "Eigene Inhalte veröffentlicht", usingDefaults: "Standardinhalte werden verwendet", addItem: "Element hinzufügen", removeItem: "Entfernen", item: "Element", saved: "Inhalte gespeichert und veröffentlicht.", draftSaved: "Entwurf gespeichert. Die öffentliche Seite wurde nicht geändert.", publish: "Veröffentlichen", publishing: "Wird veröffentlicht...", published: "Entwurf veröffentlicht.", preview: "Vorschau", edit: "Weiter bearbeiten", draftReady: "Entwurf bereit", resetDone: "Inhalte auf Standard zurückgesetzt.", loadError: "Inhalte konnten nicht geladen werden.", saveError: "Inhalte konnten nicht gespeichert werden.", yieldTitle: "Renditesatz im Rechner", yieldLabel: "Jahresrate (%)", yieldSaved: "Renditesatz gespeichert.", yieldError: "Renditesatz konnte nicht gespeichert werden."
  },
  es: {
    eyebrow: "Gestión de contenido", title: "Contenido del sitio", description: "Edite textos y cifras públicas. En el estudio, los cambios se guardan primero como borrador.", backHome: "Volver al inicio", scope: "Página", scopeHome: "Página principal", scopeApply: "Página de solicitud", language: "Idioma del contenido", fallbackNote: "Los campos sin traducción muestran el valor inglés hasta que los edite.", save: "Guardar borrador", saving: "Guardando...", reset: "Restablecer valores", resetting: "Restableciendo...", resetConfirm: "¿Restablecer esta página y este idioma a los valores incluidos?", reload: "Recargar", loading: "Cargando contenido...", usingOverride: "Contenido propio publicado", usingDefaults: "Usando contenido incluido", addItem: "Añadir elemento", removeItem: "Eliminar", item: "Elemento", saved: "Contenido guardado y publicado.", draftSaved: "Borrador guardado. La página pública no ha cambiado.", publish: "Publicar", publishing: "Publicando...", published: "Borrador publicado.", preview: "Vista previa", edit: "Seguir editando", draftReady: "Borrador listo", resetDone: "Contenido restablecido.", loadError: "No se pudo cargar el contenido.", saveError: "No se pudo guardar el contenido.", yieldTitle: "Tasa del calculador", yieldLabel: "Tasa anual (%)", yieldSaved: "Tasa guardada.", yieldError: "No se pudo guardar la tasa."
  },
  zh: {
    eyebrow: "内容管理", title: "网站内容", description: "编辑公开文本和数字。在内容工作室中，更改会先保存为草稿。", backHome: "返回首页", scope: "页面", scopeHome: "首页", scopeApply: "申请页面", language: "内容语言", fallbackNote: "尚未翻译的字段会显示英文默认值，直到您完成编辑。", save: "保存草稿", saving: "正在保存...", reset: "恢复默认内容", resetting: "正在恢复...", resetConfirm: "将此页面和语言恢复为内置默认内容？", reload: "重新加载", loading: "正在加载内容...", usingOverride: "已发布自定义内容", usingDefaults: "正在使用默认内容", addItem: "添加项目", removeItem: "删除", item: "项目", saved: "内容已保存并发布。", draftSaved: "草稿已保存。公开页面未发生变化。", publish: "发布", publishing: "正在发布...", published: "草稿已发布。", preview: "预览", edit: "继续编辑", draftReady: "草稿已准备", resetDone: "内容已恢复为默认值。", loadError: "无法加载内容。", saveError: "无法保存内容。", yieldTitle: "收益率计算器", yieldLabel: "年利率（%）", yieldSaved: "收益率已保存。", yieldError: "无法保存收益率。"
  }
};

const getUi = (locale: Locale) => UI[locale];

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
    <section className="flex flex-col gap-4 rounded-2xl border border-gold-200/25 bg-gold-300/20 dark:bg-gold-200/[0.06] p-4 sm:flex-row sm:items-end sm:justify-between">
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
            className="w-32 rounded-lg border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 px-3 py-2 text-sm text-foreground disabled:opacity-40"
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
          className="rounded-full border border-gold-200/35 bg-gold-300/20 dark:bg-gold-200/10 px-5 py-2 text-xs font-semibold text-amber-700 dark:text-gold-100 transition-colors hover:bg-gold-300/30 dark:hover:bg-gold-200/20 disabled:opacity-40"
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
  const [hasDraft, setHasDraft] = useState(false);
  const [studioEnabled, setStudioEnabled] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [publishing, setPublishing] = useState(false);
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
      setHasDraft(Boolean(body.hasDraft));
      setStudioEnabled(Boolean(body.studioEnabled));
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
      setHasDraft(studioEnabled);
      setNotice({ tone: "ok", message: studioEnabled ? t.draftSaved : t.saved });
    } catch (error) {
      setNotice({ tone: "error", message: error instanceof Error ? error.message : t.saveError });
    } finally {
      setSaving(false);
    }
  }, [data, scope, contentLocale, studioEnabled, t.draftSaved, t.saved, t.saveError]);

  const publish = useCallback(async () => {
    setPublishing(true);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json", [ADMIN_CSRF_HEADER]: getCookieValue(ADMIN_CSRF_COOKIE) },
        body: JSON.stringify({ scope, locale: contentLocale, action: "publish" })
      });
      const body = await res.json();
      if (!res.ok || !body.ok) throw new Error(body.error || t.saveError);
      setHasOverride(true);
      setHasDraft(false);
      setNotice({ tone: "ok", message: t.published });
    } catch (error) {
      setNotice({ tone: "error", message: error instanceof Error ? error.message : t.saveError });
    } finally {
      setPublishing(false);
    }
  }, [scope, contentLocale, t.published, t.saveError]);

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


        <header className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 dark:text-gold-200/70">{t.eyebrow}</span>
          <h1 className="text-2xl font-semibold text-foreground">{t.title}</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">{t.description}</p>
        </header>

        <YieldSettingsCard t={t} />

        {/* Controls */}
        <div className="flex flex-col gap-4 rounded-2xl border border-border dark:border-white/10 bg-muted/30 dark:bg-white/[0.03] p-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {t.scope}
              <select
                value={scope}
                onChange={(event) => setScope(event.target.value as ContentScope)}
                className="rounded-lg border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 px-3 py-2 text-sm text-foreground"
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
                className="rounded-lg border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 px-3 py-2 text-sm text-foreground"
              >
                {locales.map((value) => (
                  <option key={value} value={value}>
                    {localeNames[value]}
                  </option>
                ))}
              </select>
            </label>

            <span className={`text-xs ${hasDraft || hasOverride ? "text-emerald-700 dark:text-emerald-300" : "text-muted-foreground"}`}>
              {hasDraft ? t.draftReady : hasOverride ? t.usingOverride : t.usingDefaults}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {studioEnabled ? (
              <button type="button" onClick={() => setPreviewing((current) => !current)} disabled={loading || data === null} className="rounded-full border border-border dark:border-white/10 px-4 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40">
                {previewing ? t.edit : t.preview}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => void reset()}
              disabled={resetting || loading || !hasOverride}
              className="rounded-full border border-border dark:border-white/10 px-4 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
            >
              {resetting ? t.resetting : t.reset}
            </button>
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving || loading || data === null}
              className="rounded-full border border-gold-200/35 bg-gold-300/20 dark:bg-gold-200/10 px-5 py-2 text-xs font-semibold text-amber-700 dark:text-gold-100 transition-colors hover:bg-gold-300/30 dark:hover:bg-gold-200/20 disabled:opacity-40"
            >
              {saving ? t.saving : t.save}
            </button>
            {studioEnabled ? (
              <button type="button" onClick={() => void publish()} disabled={publishing || loading || !hasDraft} className="rounded-full bg-foreground px-5 py-2 text-xs font-semibold text-background transition-opacity hover:opacity-85 disabled:opacity-40">
                {publishing ? t.publishing : t.publish}
              </button>
            ) : null}
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
        ) : previewing && data ? (
          <ContentPreview value={data} />
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

function ContentPreview({ value }: { value: Json }) {
  if (typeof value === "string" || typeof value === "number") return <p className="text-sm leading-7 text-foreground">{String(value)}</p>;
  if (typeof value === "boolean" || value === null) return null;
  if (Array.isArray(value)) return <div className="grid gap-3 md:grid-cols-2">{value.map((item, index) => <div key={index} className="rounded-2xl border border-border bg-muted/20 p-4 dark:border-white/10 dark:bg-black/20"><ContentPreview value={item} /></div>)}</div>;
  return <section className="space-y-4 rounded-2xl border border-border bg-card p-5 dark:border-white/10">{Object.entries(value).map(([key, child]) => <div key={key} className="space-y-2"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{humanize(key)}</p><ContentPreview value={child} /></div>)}</section>;
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
            className="rounded-lg border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 px-3 py-2 text-sm text-foreground"
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(event) => onChange(path, event.target.value)}
            className="rounded-lg border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 px-3 py-2 text-sm text-foreground"
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
          className="w-40 rounded-lg border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 px-3 py-2 text-sm text-foreground"
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
      <fieldset className="flex flex-col gap-3 rounded-2xl border border-border dark:border-white/10 bg-muted/30 dark:bg-white/[0.02] p-4">
        <legend className="px-1 text-sm font-semibold text-foreground">{label}</legend>
        {value.map((item, index) => (
          <div key={index} className="flex flex-col gap-3 rounded-xl border border-border dark:border-white/10 bg-muted/30 dark:bg-black/10 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700 dark:text-gold-200/60">
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
          className="self-start rounded-full border border-border dark:border-white/10 px-4 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          + {t.addItem}
        </button>
      </fieldset>
    );
  }

  if (value && typeof value === "object") {
    const Wrapper = depth === 0 ? "section" : "div";
    return (
      <Wrapper className={depth === 0 ? "flex flex-col gap-4 rounded-2xl border border-border dark:border-white/10 bg-muted/30 dark:bg-white/[0.03] p-5" : "flex flex-col gap-4 border-l border-border dark:border-white/10 pl-4"}>
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

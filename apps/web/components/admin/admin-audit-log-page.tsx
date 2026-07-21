"use client";

import * as React from "react";
import type { Locale } from "@otiz/lib";

type AuditItem = { id: string; actor: string; action: string; entityType: string; entityId: string; beforeJson: string | null; afterJson: string | null; createdAt: string };
type Pagination = { page: number; pageSize: number; total: number; totalPages: number };

const COPY = {
  en: { eyebrow: "Company history", title: "Audit log", desc: "Review who changed what and when. Open an entry to compare its previous and new values.", disabled: "The global audit log is currently switched off. Enable it in Feature switches when the team is ready to review it.", search: "Search actor, action or object", actor: "Actor", action: "Action", entity: "Object type", from: "From", to: "To", export: "Export CSV", empty: "No actions match these filters.", loading: "Loading actions...", before: "Before", after: "After", noValue: "No recorded value", previous: "Previous", next: "Next", total: "actions", error: "Could not load the audit log." },
  ru: { eyebrow: "История компании", title: "Журнал действий", desc: "Проверяйте, кто, что и когда изменил. Откройте запись, чтобы сравнить прежние и новые значения.", disabled: "Общий журнал сейчас выключен. Включите его в разделе «Функции», когда команда будет готова к проверке.", search: "Поиск по исполнителю, действию или объекту", actor: "Исполнитель", action: "Действие", entity: "Тип объекта", from: "С", to: "По", export: "Скачать CSV", empty: "По этим фильтрам действий нет.", loading: "Загружаем действия...", before: "Было", after: "Стало", noValue: "Значение не записано", previous: "Назад", next: "Далее", total: "действий", error: "Не удалось загрузить журнал." },
  es: { eyebrow: "Historial de la empresa", title: "Registro de acciones", desc: "Revise quién cambió qué y cuándo. Abra una entrada para comparar los valores anteriores y nuevos.", disabled: "El registro global está desactivado. Actívelo en Funciones cuando el equipo esté listo.", search: "Buscar persona, acción u objeto", actor: "Responsable", action: "Acción", entity: "Tipo de objeto", from: "Desde", to: "Hasta", export: "Exportar CSV", empty: "Ninguna acción coincide con estos filtros.", loading: "Cargando acciones...", before: "Antes", after: "Después", noValue: "Sin valor registrado", previous: "Anterior", next: "Siguiente", total: "acciones", error: "No se pudo cargar el registro." },
  de: { eyebrow: "Unternehmensverlauf", title: "Aktionsprotokoll", desc: "Prüfen Sie, wer was wann geändert hat. Öffnen Sie einen Eintrag, um alte und neue Werte zu vergleichen.", disabled: "Das globale Protokoll ist ausgeschaltet. Aktivieren Sie es unter Funktionen, wenn das Team bereit ist.", search: "Person, Aktion oder Objekt suchen", actor: "Verantwortlich", action: "Aktion", entity: "Objekttyp", from: "Von", to: "Bis", export: "CSV exportieren", empty: "Keine Aktionen entsprechen diesen Filtern.", loading: "Aktionen werden geladen...", before: "Vorher", after: "Nachher", noValue: "Kein Wert erfasst", previous: "Zurück", next: "Weiter", total: "Aktionen", error: "Das Protokoll konnte nicht geladen werden." },
  zh: { eyebrow: "公司记录", title: "操作记录", desc: "查看谁在何时更改了什么。打开记录可比较更改前后的值。", disabled: "全局操作记录当前已关闭。团队准备好后可在“功能”中启用。", search: "搜索人员、操作或对象", actor: "负责人", action: "操作", entity: "对象类型", from: "开始日期", to: "结束日期", export: "导出 CSV", empty: "没有符合筛选条件的操作。", loading: "正在加载操作...", before: "更改前", after: "更改后", noValue: "没有记录值", previous: "上一页", next: "下一页", total: "项操作", error: "无法加载操作记录。" }
} as const;

function prettyJson(value: string | null, fallback: string) {
  if (!value) return fallback;
  try { return JSON.stringify(JSON.parse(value), null, 2); } catch { return value; }
}

export function AdminAuditLogPage({ locale, enabled }: { locale: Locale; enabled: boolean }) {
  const t = (COPY as unknown as Record<string, typeof COPY.en>)[locale] ?? COPY.en;
  const [items, setItems] = React.useState<AuditItem[]>([]);
  const [pagination, setPagination] = React.useState<Pagination>({ page: 1, pageSize: 30, total: 0, totalPages: 1 });
  const [filters, setFilters] = React.useState({ query: "", actor: "", action: "", entityType: "", dateFrom: "", dateTo: "" });
  const [loading, setLoading] = React.useState(enabled);
  const [error, setError] = React.useState<string | null>(null);

  const params = React.useMemo(() => {
    const value = new URLSearchParams({ scope: "global", page: String(pagination.page) });
    Object.entries(filters).forEach(([key, entry]) => { if (entry.trim()) value.set(key, entry.trim()); });
    return value;
  }, [filters, pagination.page]);

  React.useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true); setError(null);
      try {
        const response = await fetch(`/api/audit-logs?${params.toString()}`, { cache: "no-store", signal: controller.signal });
        const body = await response.json();
        if (!response.ok || !body.ok) throw new Error(body.error || t.error);
        setItems(body.data as AuditItem[]);
        setPagination((current) => ({ ...current, ...(body.pagination as Pagination) }));
      } catch (requestError) {
        if ((requestError as Error).name !== "AbortError") setError(t.error);
      } finally { setLoading(false); }
    }, 250);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [enabled, params, t.error]);

  function updateFilter(key: keyof typeof filters, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
    setPagination((current) => ({ ...current, page: 1 }));
  }

  function exportCsv() {
    const exportParams = new URLSearchParams(params); exportParams.delete("page"); exportParams.set("format", "csv");
    window.location.assign(`/api/audit-logs?${exportParams.toString()}`);
  }

  return <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-10">
    <div className="mx-auto max-w-7xl">
      <header className="max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 dark:text-gold-100">{t.eyebrow}</p><h1 className="mt-3 font-display text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">{t.title}</h1><p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">{t.desc}</p></header>
      {!enabled ? <div className="mt-8 rounded-[1.35rem] border border-border bg-card p-6 text-sm leading-6 text-muted-foreground dark:border-white/10 dark:bg-graphite-900/[0.72]">{t.disabled}</div> : <>
        <section className="mt-8 grid gap-3 rounded-[1.35rem] border border-border bg-card p-4 dark:border-white/10 dark:bg-graphite-900/[0.72] sm:grid-cols-2 lg:grid-cols-6">
          <input value={filters.query} onChange={(e) => updateFilter("query", e.target.value)} placeholder={t.search} className="min-h-11 rounded-xl border border-border bg-background px-3 text-sm lg:col-span-2 dark:border-white/10" />
          <input value={filters.actor} onChange={(e) => updateFilter("actor", e.target.value)} placeholder={t.actor} className="min-h-11 rounded-xl border border-border bg-background px-3 text-sm dark:border-white/10" />
          <input value={filters.action} onChange={(e) => updateFilter("action", e.target.value)} placeholder={t.action} className="min-h-11 rounded-xl border border-border bg-background px-3 text-sm dark:border-white/10" />
          <input value={filters.entityType} onChange={(e) => updateFilter("entityType", e.target.value)} placeholder={t.entity} className="min-h-11 rounded-xl border border-border bg-background px-3 text-sm dark:border-white/10" />
          <button type="button" onClick={exportCsv} className="min-h-11 rounded-xl bg-foreground px-4 text-sm font-semibold text-background">{t.export}</button>
          <label className="text-xs text-muted-foreground">{t.from}<input type="date" value={filters.dateFrom} onChange={(e) => updateFilter("dateFrom", e.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground dark:border-white/10" /></label>
          <label className="text-xs text-muted-foreground">{t.to}<input type="date" value={filters.dateTo} onChange={(e) => updateFilter("dateTo", e.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground dark:border-white/10" /></label>
        </section>
        {error ? <p role="alert" className="mt-4 text-sm text-red-500">{error}</p> : null}
        <div className="mt-5 space-y-3" aria-busy={loading}>{loading && items.length === 0 ? <p className="rounded-2xl border border-border p-6 text-sm text-muted-foreground dark:border-white/10">{t.loading}</p> : items.length === 0 ? <p className="rounded-2xl border border-border p-6 text-sm text-muted-foreground dark:border-white/10">{t.empty}</p> : items.map((item) => <details key={item.id} className="rounded-2xl border border-border bg-card p-4 dark:border-white/10 dark:bg-graphite-900/[0.72]"><summary className="cursor-pointer list-none"><div className="grid gap-2 sm:grid-cols-[10rem_minmax(0,1fr)_minmax(0,1fr)]"><span className="text-xs text-muted-foreground">{new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.createdAt))}</span><span className="break-words text-sm font-semibold">{item.action}</span><span className="break-all text-sm text-muted-foreground">{item.entityType} · {item.entityId}</span></div><p className="mt-2 text-xs text-muted-foreground">{item.actor}</p></summary><div className="mt-4 grid gap-3 lg:grid-cols-2"><div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t.before}</p><pre className="max-h-80 overflow-auto whitespace-pre-wrap break-all rounded-xl bg-muted/40 p-3 text-xs">{prettyJson(item.beforeJson, t.noValue)}</pre></div><div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t.after}</p><pre className="max-h-80 overflow-auto whitespace-pre-wrap break-all rounded-xl bg-muted/40 p-3 text-xs">{prettyJson(item.afterJson, t.noValue)}</pre></div></div></details>)}</div>
        <div className="mt-5 flex items-center justify-between gap-3"><button disabled={pagination.page <= 1} onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))} className="min-h-11 rounded-full border border-border px-4 text-sm font-semibold disabled:opacity-40 dark:border-white/10">{t.previous}</button><span className="text-xs text-muted-foreground">{pagination.total} {t.total} · {pagination.page}/{pagination.totalPages}</span><button disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))} className="min-h-11 rounded-full border border-border px-4 text-sm font-semibold disabled:opacity-40 dark:border-white/10">{t.next}</button></div>
      </>}
    </div>
  </main>;
}

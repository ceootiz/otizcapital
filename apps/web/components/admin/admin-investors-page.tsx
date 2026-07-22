"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, CheckSquare, ChevronsUpDown, FileText, Search, Trash2, Users, X } from "lucide-react";
import { createAdminFormatters, enumLabel, type Locale } from "@otiz/lib";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, ConfirmDialog } from "@otiz/ui";

const ADMIN_CSRF_COOKIE = "admin_csrf_token";
const ADMIN_CSRF_HEADER = "x-csrf-token";

function getAdminMutationHeaders() {
  const csrf = typeof document === "undefined"
    ? ""
    : document.cookie.split("; ").find((cookie) => cookie.startsWith(`${ADMIN_CSRF_COOKIE}=`))?.split("=").slice(1).join("=") || "";
  return { "Content-Type": "application/json", [ADMIN_CSRF_HEADER]: csrf };
}

export type AdminInvestor = {
  id: string;
  fullName: string;
  email: string;
  telegram: string | null;
  status: string;
  sourceApplicationId: string | null;
  totalCapital: string;
  reinvestEnabled: boolean;
  lastReportAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

const STRINGS = {
  en: {
    BACK_TO_HOMEPAGE: "Back to homepage",
    TITLE: "Investors",
    DESCRIPTION: "Protected MVP investor profiles created from approved applications.",
    TOTAL: "total",
    COL_NAME: "Name",
    COL_CONTACT: "Contact",
    COL_STATUS: "Status",
    COL_CAPITAL: "Capital",
    COL_REINVEST: "Reinvest",
    COL_SOURCE_APPLICATION: "Source application",
    COL_CREATED: "Created",
    EMPTY_TITLE: "No investors yet",
    EMPTY_DESCRIPTION: "Approved applications can be converted into investor profiles from the application detail card.",
    NO_TELEGRAM: "No Telegram",
    ENABLED: "Enabled",
    DISABLED: "Disabled",
    SEARCH_PLACEHOLDER: "Search by name, email, or status...",
    CLEAR_SEARCH: "Clear search",
    SORT: "Sort",
    SORT_ASCENDING: "Ascending",
    SORT_DESCENDING: "Descending",
    NO_RESULTS_TITLE: "No matching investors",
    NO_RESULTS_DESCRIPTION: "Try a different name, email, or status.",
    SELECT: "Select",
    CANCEL_SELECTION: "Cancel selection",
    SELECT_ALL: "Select all results",
    CLEAR_SELECTION: "Clear selection",
    SELECTED: "selected",
    DELETE_SELECTED: "Delete selected",
    DELETE_TITLE: "Delete selected investors?",
    DELETE_DESCRIPTION: (count: number, capital: string) => `${count} investor profiles and all related reports, deposits, documents, payments, and sessions will be deleted. Combined recorded capital: ${capital}. Source applications will be kept and unlinked. This cannot be undone.`,
    DELETE_CONFIRM: "Delete permanently",
    CANCEL: "Cancel",
    DELETING: "Deleting...",
    DELETE_SUCCESS: (count: number) => `${count} investor profile${count === 1 ? "" : "s"} deleted.`,
    DELETE_ERROR: "Unable to delete the selected investors.",
    SELECT_ROW: (name: string) => `Select ${name}`,
    SELECT_ALL_ARIA: "Select all visible investors"
  },
  ru: {
    BACK_TO_HOMEPAGE: "На главную",
    TITLE: "Инвесторы",
    DESCRIPTION: "Защищённые MVP-профили инвесторов, созданные из одобренных заявок.",
    TOTAL: "всего",
    COL_NAME: "Имя",
    COL_CONTACT: "Контакт",
    COL_STATUS: "Статус",
    COL_CAPITAL: "Капитал",
    COL_REINVEST: "Реинвест",
    COL_SOURCE_APPLICATION: "Исходная заявка",
    COL_CREATED: "Создан",
    EMPTY_TITLE: "Инвесторов пока нет",
    EMPTY_DESCRIPTION: "Одобренные заявки можно преобразовать в профили инвесторов из карточки заявки.",
    NO_TELEGRAM: "Нет Telegram",
    ENABLED: "Включён",
    DISABLED: "Отключён",
    SEARCH_PLACEHOLDER: "Поиск по имени, email или статусу...",
    CLEAR_SEARCH: "Очистить поиск",
    SORT: "Сортировка",
    SORT_ASCENDING: "По возрастанию",
    SORT_DESCENDING: "По убыванию",
    NO_RESULTS_TITLE: "Совпадений не найдено",
    NO_RESULTS_DESCRIPTION: "Попробуйте другое имя, email или статус.",
    SELECT: "Выбрать",
    CANCEL_SELECTION: "Отменить выбор",
    SELECT_ALL: "Выбрать всех найденных",
    CLEAR_SELECTION: "Снять выбор",
    SELECTED: "выбрано",
    DELETE_SELECTED: "Удалить выбранных",
    DELETE_TITLE: "Удалить выбранных инвесторов?",
    DELETE_DESCRIPTION: (count: number, capital: string) => `Будут безвозвратно удалены ${count} профилей и связанные с ними отчёты, пополнения, документы, выплаты и сессии. Общий указанный капитал: ${capital}. Исходные заявки сохранятся, но будут отвязаны.`,
    DELETE_CONFIRM: "Удалить навсегда",
    CANCEL: "Отмена",
    DELETING: "Удаляем...",
    DELETE_SUCCESS: (count: number) => `Удалено профилей: ${count}.`,
    DELETE_ERROR: "Не удалось удалить выбранных инвесторов.",
    SELECT_ROW: (name: string) => `Выбрать ${name}`,
    SELECT_ALL_ARIA: "Выбрать всех видимых инвесторов"
  }
} as const;

type Strings = typeof STRINGS.en;
const getStrings = (locale: Locale): Strings => (STRINGS as unknown as Record<string, Strings>)[locale] ?? STRINGS.en;
type InvestorSortField = "capital" | "createdAt";
type InvestorSortDirection = "asc" | "desc";

export function AdminInvestorsPage({ locale, investors }: { locale: Locale; investors: AdminInvestor[] }) {
  const t = getStrings(locale);
  const router = useRouter();
  const formatters = createAdminFormatters(locale);
  const [query, setQuery] = React.useState("");
  const [debouncedQuery, setDebouncedQuery] = React.useState("");
  const [sort, setSort] = React.useState<{ field: InvestorSortField; direction: InvestorSortDirection } | null>(null);
  const [selectionMode, setSelectionMode] = React.useState(false);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(() => new Set());
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [notice, setNotice] = React.useState<{ tone: "success" | "error"; message: string } | null>(null);

  // Debounce the search input by 300ms so filtering stays smooth while typing.
  React.useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(query.trim().toLowerCase()), 300);
    return () => clearTimeout(handle);
  }, [query]);

  const filteredInvestors = React.useMemo(() => {
    const matches = debouncedQuery ? investors.filter((investor) => {
      const statusLabel = enumLabel("investorStatus", investor.status, locale).toLowerCase();
      return [investor.fullName, investor.email, investor.status, statusLabel]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(debouncedQuery));
    }) : investors;

    if (!sort) return matches;

    return [...matches].sort((first, second) => {
      const comparison = sort.field === "capital"
        ? (Number(first.totalCapital) || 0) - (Number(second.totalCapital) || 0)
        : new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime();
      return sort.direction === "asc" ? comparison : -comparison;
    });
  }, [investors, debouncedQuery, locale, sort]);

  const selectedInvestors = React.useMemo(
    () => investors.filter((investor) => selectedIds.has(investor.id)),
    [investors, selectedIds]
  );
  const selectedCapital = React.useMemo(
    () => selectedInvestors.reduce((total, investor) => total + (Number(investor.totalCapital) || 0), 0),
    [selectedInvestors]
  );
  const allFilteredSelected = filteredInvestors.length > 0 && filteredInvestors.every((investor) => selectedIds.has(investor.id));

  function toggleSelectionMode() {
    setSelectionMode((current) => {
      if (current) setSelectedIds(new Set());
      return !current;
    });
    setNotice(null);
  }

  function toggleInvestor(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllFiltered() {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allFilteredSelected) filteredInvestors.forEach((investor) => next.delete(investor.id));
      else filteredInvestors.forEach((investor) => next.add(investor.id));
      return next;
    });
  }

  function toggleSort(field: InvestorSortField) {
    setSort((current) => current?.field === field
      ? { field, direction: current.direction === "asc" ? "desc" : "asc" }
      : { field, direction: "asc" });
  }

  function sortIcon(field: InvestorSortField) {
    if (sort?.field !== field) return <ChevronsUpDown className="size-3.5" aria-hidden="true" />;
    return sort.direction === "asc"
      ? <ArrowUp className="size-3.5" aria-hidden="true" />
      : <ArrowDown className="size-3.5" aria-hidden="true" />;
  }

  function sortDescription(field: InvestorSortField) {
    if (sort?.field !== field) return t.SORT;
    return sort.direction === "asc" ? t.SORT_ASCENDING : t.SORT_DESCENDING;
  }

  async function deleteSelected() {
    setIsDeleting(true);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/investors/bulk", {
        method: "DELETE",
        headers: getAdminMutationHeaders(),
        body: JSON.stringify({ ids: Array.from(selectedIds) })
      });
      const payload = (await response.json()) as { ok: boolean; deletedIds?: string[]; error?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.error || t.DELETE_ERROR);
      const deletedCount = payload.deletedIds?.length ?? selectedIds.size;
      setSelectedIds(new Set());
      setSelectionMode(false);
      setConfirmDelete(false);
      setNotice({ tone: "success", message: t.DELETE_SUCCESS(deletedCount) });
      router.refresh();
    } catch (error) {
      setNotice({ tone: "error", message: error instanceof Error ? error.message : t.DELETE_ERROR });
      setConfirmDelete(false);
    } finally {
      setIsDeleting(false);
    }
  }

  function formatMoney(value: string) {
    const amount = Number(value || 0);
    return formatters.currency(Number.isFinite(amount) ? amount : 0);
  }

  function formatDate(value: string | null) {
    return formatters.date(value);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground micro-noise">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(212,175,95,0.14),transparent_34rem),radial-gradient(circle_at_86%_10%,rgba(255,255,255,0.07),transparent_28rem)]" />
      <div className="macro-grid absolute inset-0 opacity-45" />
      <section className="relative z-10 py-8 sm:py-10">
        <div className="container">
          <Card className="rounded-[1.35rem] bg-card dark:bg-graphite-900/[0.78]">
            <CardHeader className="pb-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <CardTitle className="text-2xl">{t.TITLE}</CardTitle>
                  <CardDescription>{t.DESCRIPTION}</CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge>{debouncedQuery ? `${filteredInvestors.length} / ${investors.length}` : `${investors.length} ${t.TOTAL}`}</Badge>
                  <Button type="button" variant="outline" size="sm" onClick={toggleSelectionMode}>
                    <CheckSquare className="mr-2 size-4" aria-hidden="true" />
                    {selectionMode ? t.CANCEL_SELECTION : t.SELECT}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {notice ? (
                <div className={`mb-4 rounded-2xl border p-4 text-sm ${notice.tone === "success" ? "border-gold-300/30 bg-gold-300/10 text-foreground" : "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-200"}`}>
                  {notice.message}
                </div>
              ) : null}
              <div className="relative mb-4">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t.SEARCH_PLACEHOLDER}
                  className="h-12 w-full rounded-2xl border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 pl-11 pr-11 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold-200/45"
                />
                {query ? (
                  <button
                    type="button"
                    aria-label={t.CLEAR_SEARCH}
                    onClick={() => setQuery("")}
                    className="absolute right-3 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/50 dark:hover:bg-white/[0.08] hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                ) : null}
              </div>
              <div className="mb-4 flex flex-wrap items-center gap-2 lg:hidden">
                <span className="mr-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{t.SORT}</span>
                <Button type="button" variant="outline" size="sm" onClick={() => toggleSort("capital")} aria-label={`${t.COL_CAPITAL}: ${sortDescription("capital")}`}>
                  {t.COL_CAPITAL}
                  <span className="ml-2">{sortIcon("capital")}</span>
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => toggleSort("createdAt")} aria-label={`${t.COL_CREATED}: ${sortDescription("createdAt")}`}>
                  {t.COL_CREATED}
                  <span className="ml-2">{sortIcon("createdAt")}</span>
                </Button>
              </div>
              {selectionMode ? (
                <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-border bg-muted/30 p-4 dark:border-white/10 dark:bg-white/[0.035] sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-3">
                    <Button type="button" variant="outline" size="sm" onClick={toggleAllFiltered}>
                      {allFilteredSelected ? t.CLEAR_SELECTION : t.SELECT_ALL}
                    </Button>
                    <span className="text-sm font-semibold text-foreground">{selectedIds.size} {t.SELECTED}</span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    disabled={selectedIds.size === 0}
                    onClick={() => setConfirmDelete(true)}
                    className="bg-red-600 text-white shadow-none hover:bg-red-500"
                  >
                    <Trash2 className="mr-2 size-4" aria-hidden="true" />
                    {t.DELETE_SELECTED}
                  </Button>
                </div>
              ) : null}
              <div className="overflow-hidden rounded-[1.35rem] border border-border dark:border-white/10">
                <div className="hidden border-b border-border bg-muted/30 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground dark:border-white/10 dark:bg-white/[0.035] lg:flex">
                  {selectionMode ? (
                    <label className="flex w-12 shrink-0 items-center justify-center">
                      <input type="checkbox" checked={allFilteredSelected} onChange={toggleAllFiltered} aria-label={t.SELECT_ALL_ARIA} className="size-4 accent-amber-600" />
                    </label>
                  ) : null}
                  <div className="grid flex-1 grid-cols-[1.1fr_1.25fr_0.8fr_0.8fr_0.75fr_1fr_0.82fr] gap-3 px-4 py-3">
                    <span>{t.COL_NAME}</span>
                    <span>{t.COL_CONTACT}</span>
                    <span>{t.COL_STATUS}</span>
                    <button type="button" onClick={() => toggleSort("capital")} className="flex items-center gap-1.5 text-left transition-colors hover:text-foreground" aria-label={`${t.COL_CAPITAL}: ${sortDescription("capital")}`}>
                      {t.COL_CAPITAL}
                      {sortIcon("capital")}
                    </button>
                    <span>{t.COL_REINVEST}</span>
                    <span>{t.COL_SOURCE_APPLICATION}</span>
                    <button type="button" onClick={() => toggleSort("createdAt")} className="flex items-center gap-1.5 text-left transition-colors hover:text-foreground" aria-label={`${t.COL_CREATED}: ${sortDescription("createdAt")}`}>
                      {t.COL_CREATED}
                      {sortIcon("createdAt")}
                    </button>
                  </div>
                </div>
                {investors.length === 0 ? (
                  <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
                    <FileText className="size-9 text-amber-700 dark:text-gold-100" />
                    <p className="mt-4 font-semibold text-foreground">{t.EMPTY_TITLE}</p>
                    <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{t.EMPTY_DESCRIPTION}</p>
                  </div>
                ) : filteredInvestors.length === 0 ? (
                  <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
                    <Search className="size-9 text-amber-700 dark:text-gold-100" />
                    <p className="mt-4 font-semibold text-foreground">{t.NO_RESULTS_TITLE}</p>
                    <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{t.NO_RESULTS_DESCRIPTION}</p>
                  </div>
                ) : (
                  filteredInvestors.map((investor) => (
                    <div key={investor.id} className="flex border-b border-border transition-colors last:border-b-0 hover:bg-muted/50 dark:border-white/10 dark:hover:bg-white/[0.04]">
                      {selectionMode ? (
                        <label className="flex w-12 shrink-0 items-start justify-center pt-7 lg:items-center lg:pt-0">
                          <input type="checkbox" checked={selectedIds.has(investor.id)} onChange={() => toggleInvestor(investor.id)} aria-label={t.SELECT_ROW(investor.fullName)} className="size-4 accent-amber-600" />
                        </label>
                      ) : null}
                      <Link href={`/${locale}/admin/investors/${investor.id}`} className="grid min-w-0 flex-1 gap-3 p-4 lg:grid-cols-[1.1fr_1.25fr_0.8fr_0.8fr_0.75fr_1fr_0.82fr] lg:items-center">
                        <span className="flex items-center gap-3">
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-gold-200/20 bg-gold-300/20 dark:bg-gold-200/10 text-amber-700 dark:text-gold-100">
                            <Users className="size-4" />
                          </span>
                          <span>
                            <span className="block font-semibold text-foreground">{investor.fullName}</span>
                            <span className="mt-1 block text-xs text-muted-foreground">{investor.id}</span>
                          </span>
                        </span>
                        <span className="text-sm text-muted-foreground">
                          <span className="block text-foreground">{investor.email}</span>
                          <span className="mt-1 block">{investor.telegram || t.NO_TELEGRAM}</span>
                        </span>
                        <span><Badge variant={investor.status === "ACTIVE" ? "default" : "secondary"}>{enumLabel("investorStatus", investor.status, locale)}</Badge></span>
                        <span className="font-semibold text-foreground">{formatMoney(investor.totalCapital)}</span>
                        <span className="text-sm text-muted-foreground">{investor.reinvestEnabled ? t.ENABLED : t.DISABLED}</span>
                        <span className="break-words text-sm text-muted-foreground">{investor.sourceApplicationId || "-"}</span>
                        <span className="text-sm text-muted-foreground">{formatDate(investor.createdAt)}</span>
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
      <ConfirmDialog
        open={confirmDelete}
        title={t.DELETE_TITLE}
        description={t.DELETE_DESCRIPTION(selectedIds.size, formatters.currency(selectedCapital))}
        confirmLabel={isDeleting ? t.DELETING : t.DELETE_CONFIRM}
        cancelLabel={t.CANCEL}
        tone="destructive"
        loading={isDeleting}
        onConfirm={deleteSelected}
        onCancel={() => setConfirmDelete(false)}
      />
    </main>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { FileText, Search, Users, X } from "lucide-react";
import { createAdminFormatters, enumLabel, type Locale } from "@otiz/lib";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@otiz/ui";

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
    NO_RESULTS_TITLE: "No matching investors",
    NO_RESULTS_DESCRIPTION: "Try a different name, email, or status."
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
    NO_RESULTS_TITLE: "Совпадений не найдено",
    NO_RESULTS_DESCRIPTION: "Попробуйте другое имя, email или статус."
  }
} as const;

type Strings = typeof STRINGS.en;
const getStrings = (locale: Locale): Strings => (STRINGS as unknown as Record<string, Strings>)[locale] ?? STRINGS.en;

export function AdminInvestorsPage({ locale, investors }: { locale: Locale; investors: AdminInvestor[] }) {
  const t = getStrings(locale);
  const formatters = createAdminFormatters(locale);
  const [query, setQuery] = React.useState("");
  const [debouncedQuery, setDebouncedQuery] = React.useState("");

  // Debounce the search input by 300ms so filtering stays smooth while typing.
  React.useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(query.trim().toLowerCase()), 300);
    return () => clearTimeout(handle);
  }, [query]);

  const filteredInvestors = React.useMemo(() => {
    if (!debouncedQuery) return investors;
    return investors.filter((investor) => {
      const statusLabel = enumLabel("investorStatus", investor.status, locale).toLowerCase();
      return [investor.fullName, investor.email, investor.status, statusLabel]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(debouncedQuery));
    });
  }, [investors, debouncedQuery, locale]);

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
                <Badge>{debouncedQuery ? `${filteredInvestors.length} / ${investors.length}` : `${investors.length} ${t.TOTAL}`}</Badge>
              </div>
            </CardHeader>
            <CardContent>
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
              <div className="overflow-hidden rounded-[1.35rem] border border-border dark:border-white/10">
                <div className="hidden grid-cols-[1.1fr_1.25fr_0.8fr_0.8fr_0.75fr_1fr_0.82fr] gap-3 border-b border-border dark:border-white/10 bg-muted/30 dark:bg-white/[0.035] px-4 py-3 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground lg:grid">
                  <span>{t.COL_NAME}</span>
                  <span>{t.COL_CONTACT}</span>
                  <span>{t.COL_STATUS}</span>
                  <span>{t.COL_CAPITAL}</span>
                  <span>{t.COL_REINVEST}</span>
                  <span>{t.COL_SOURCE_APPLICATION}</span>
                  <span>{t.COL_CREATED}</span>
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
                    <Link key={investor.id} href={`/${locale}/admin/investors/${investor.id}`} className="grid gap-3 border-b border-border dark:border-white/10 p-4 transition-colors last:border-b-0 hover:bg-muted/50 dark:hover:bg-white/[0.04] lg:grid-cols-[1.1fr_1.25fr_0.8fr_0.8fr_0.75fr_1fr_0.82fr] lg:items-center">
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
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}

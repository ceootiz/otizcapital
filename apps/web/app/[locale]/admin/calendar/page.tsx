import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarClock, CircleAlert, CreditCard, FileClock } from "lucide-react";
import { isProductFeatureEnabled, listOperationsCalendarItems, type OperationsCalendarItemType, type OperationsCalendarRange } from "@otiz/database";
import { createAdminFormatters, isLocale, type Locale } from "@otiz/lib";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@otiz/ui";
import { requireAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

const COPY: Record<Locale, {
  title: string; description: string; disabled: string; empty: string; truth: string;
  ranges: Record<OperationsCalendarRange, string>;
  types: Record<OperationsCalendarItemType, string>;
}> = {
  en: { title: "Operations calendar", description: "Recorded follow-ups and scheduled money events in one view.", disabled: "The operations calendar is currently disabled.", empty: "No recorded dates in this period.", truth: "Only dates saved on an application, deal, or withdrawal are shown. OTIZ does not invent deadlines.", ranges: { today: "Today", week: "7 days", month: "30 days" }, types: { APPLICATION: "Application follow-up", DEAL_PAYOUT: "Expected deal payout", WITHDRAWAL: "Scheduled withdrawal" } },
  ru: { title: "Операционный календарь", description: "Записанные следующие действия и назначенные денежные события в одном месте.", disabled: "Операционный календарь сейчас выключен.", empty: "На этот период нет записанных дат.", truth: "Показываются только даты, сохранённые в заявке, сделке или выводе. OTIZ не придумывает сроки.", ranges: { today: "Сегодня", week: "7 дней", month: "30 дней" }, types: { APPLICATION: "Действие по заявке", DEAL_PAYOUT: "Ожидаемая выплата по сделке", WITHDRAWAL: "Назначенный вывод" } },
  de: { title: "Operationskalender", description: "Erfasste Folgeaktionen und geplante Geldereignisse in einer Ansicht.", disabled: "Der Operationskalender ist derzeit deaktiviert.", empty: "Für diesen Zeitraum sind keine Termine erfasst.", truth: "Es werden nur in Antrag, Geschäft oder Auszahlung gespeicherte Termine gezeigt. OTIZ erfindet keine Fristen.", ranges: { today: "Heute", week: "7 Tage", month: "30 Tage" }, types: { APPLICATION: "Antrag nachverfolgen", DEAL_PAYOUT: "Erwartete Geschäftsauszahlung", WITHDRAWAL: "Geplante Auszahlung" } },
  es: { title: "Calendario operativo", description: "Seguimientos registrados y eventos de dinero programados en una sola vista.", disabled: "El calendario operativo está desactivado.", empty: "No hay fechas registradas en este periodo.", truth: "Solo se muestran fechas guardadas en una solicitud, operación o retiro. OTIZ no inventa plazos.", ranges: { today: "Hoy", week: "7 días", month: "30 días" }, types: { APPLICATION: "Seguimiento de solicitud", DEAL_PAYOUT: "Pago esperado de operación", WITHDRAWAL: "Retiro programado" } },
  zh: { title: "运营日历", description: "在一个视图中查看已记录的跟进事项和计划资金事件。", disabled: "运营日历当前已关闭。", empty: "此期间没有已记录日期。", truth: "仅显示申请、交易或提现中实际保存的日期。OTIZ 不会编造期限。", ranges: { today: "今天", week: "7 天", month: "30 天" }, types: { APPLICATION: "申请跟进", DEAL_PAYOUT: "预计交易付款", WITHDRAWAL: "计划提现" } }
};

const ICONS = { APPLICATION: FileClock, DEAL_PAYOUT: CalendarClock, WITHDRAWAL: CreditCard } as const;

function parseRange(value: string | undefined): OperationsCalendarRange {
  return value === "today" || value === "month" ? value : "week";
}

export function generateMetadata({ params }: { params: { locale: Locale } }): Metadata {
  const t = COPY[params.locale] ?? COPY.en;
  return { title: `${t.title} | OTIZ CAPITAL`, description: t.description };
}

export default async function AdminCalendarPage({ params, searchParams }: { params: { locale: Locale }; searchParams: { range?: string } }) {
  if (!isLocale(params.locale)) notFound();
  requireAdminSession(params.locale);
  const t = COPY[params.locale];
  const enabled = await isProductFeatureEnabled("operations-calendar");
  const range = parseRange(searchParams.range);
  const items = enabled ? await listOperationsCalendarItems(range) : [];
  const format = createAdminFormatters(params.locale);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-6">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 dark:text-gold-200/70">OTIZ</p>
          <h1 className="mt-2 text-3xl font-semibold text-foreground">{t.title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{t.description}</p>
        </header>

        {!enabled ? <Card><CardContent className="p-6 text-sm text-muted-foreground">{t.disabled}</CardContent></Card> : (
          <>
            <div className="flex flex-wrap gap-2">
              {(["today", "week", "month"] as const).map((value) => <Link key={value} href={`/${params.locale}/admin/calendar?range=${value}`} className={`rounded-full border px-4 py-2 text-sm font-medium ${range === value ? "border-gold-200/35 bg-gold-300/20 text-amber-700 dark:bg-gold-200/10 dark:text-gold-100" : "border-border text-muted-foreground dark:border-white/10"}`}>{t.ranges[value]}</Link>)}
            </div>
            <div className="flex gap-3 rounded-2xl border border-border bg-muted/20 p-4 text-sm leading-6 text-muted-foreground dark:border-white/10 dark:bg-black/20">
              <CircleAlert className="mt-0.5 size-5 shrink-0" />
              <p>{t.truth}</p>
            </div>
            {items.length === 0 ? <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">{t.empty}</CardContent></Card> : (
              <div className="space-y-3">
                {items.map((item) => {
                  const Icon = ICONS[item.type];
                  return <Link key={item.id} href={`/${params.locale}${item.href}`} className="block"><Card className="transition-colors hover:border-gold-200/30"><CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="flex min-w-0 gap-3"><span className="rounded-xl bg-muted p-2 dark:bg-white/10"><Icon className="size-5" /></span><div className="min-w-0"><CardTitle className="break-words text-base">{item.title}</CardTitle><CardDescription className="mt-1 break-words">{item.detail}</CardDescription></div></div><div className="flex shrink-0 flex-wrap items-center gap-2"><Badge variant="secondary">{t.types[item.type]}</Badge><Badge>{format.dateTime(item.at)}</Badge></div></CardHeader></Card></Link>;
                })}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

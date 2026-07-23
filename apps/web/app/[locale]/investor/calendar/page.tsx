import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarClock, Download } from "lucide-react";
import { getInvestorCalendarItems, isProductFeatureEnabled } from "@otiz/database";
import { createAdminFormatters, isLocale, type Locale } from "@otiz/lib";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@otiz/ui";
import { InvestorShell } from "@/components/investor/investor-pages";
import { requireInvestorSession } from "@/lib/investor-session";

export const dynamic = "force-dynamic";

const COPY = {
  en: { eyebrow: "Your dates", title: "Calendar", description: "Expected deal dates, scheduled withdrawals and published reports.", disabled: "The investor calendar is not enabled yet.", upcoming: "Upcoming", past: "History", empty: "No source-backed dates in this section.", download: "Download .ics", google: "Add to Google Calendar", types: { DEAL_PAYOUT: "Expected deal payout", WITHDRAWAL: "Scheduled withdrawal", REPORT: "Published report" } },
  ru: { eyebrow: "Ваши даты", title: "Календарь", description: "Ожидаемые даты сделок, запланированные выводы и опубликованные отчёты.", disabled: "Календарь инвестора пока не включён.", upcoming: "Предстоящие", past: "История", empty: "В этом разделе пока нет дат с подтверждённым источником.", download: "Скачать .ics", google: "Добавить в Google Calendar", types: { DEAL_PAYOUT: "Ожидаемая выплата по сделке", WITHDRAWAL: "Запланированный вывод", REPORT: "Опубликованный отчёт" } },
  de: { eyebrow: "Ihre Termine", title: "Kalender", description: "Erwartete Geschäftstermine, geplante Auszahlungen und veröffentlichte Berichte.", disabled: "Der Investorenkalender ist noch nicht aktiviert.", upcoming: "Bevorstehend", past: "Verlauf", empty: "In diesem Bereich gibt es noch keine belegten Termine.", download: ".ics herunterladen", google: "Zu Google Calendar hinzufügen", types: { DEAL_PAYOUT: "Erwartete Geschäftsauszahlung", WITHDRAWAL: "Geplante Auszahlung", REPORT: "Veröffentlichter Bericht" } },
  es: { eyebrow: "Sus fechas", title: "Calendario", description: "Fechas previstas de operaciones, retiros programados e informes publicados.", disabled: "El calendario del inversor aún no está activado.", upcoming: "Próximos", past: "Historial", empty: "No hay fechas respaldadas por una fuente en esta sección.", download: "Descargar .ics", google: "Añadir a Google Calendar", types: { DEAL_PAYOUT: "Pago previsto de la operación", WITHDRAWAL: "Retiro programado", REPORT: "Informe publicado" } },
  zh: { eyebrow: "您的日期", title: "日历", description: "查看项目预计日期、计划提现和已发布报告。", disabled: "投资者日历尚未启用。", upcoming: "即将发生", past: "历史记录", empty: "此部分暂无有来源依据的日期。", download: "下载 .ics", google: "添加到 Google 日历", types: { DEAL_PAYOUT: "项目预计付款", WITHDRAWAL: "计划提现", REPORT: "已发布报告" } }
} as const;

export default async function InvestorCalendarPage(props: { params: Promise<{ locale: Locale }> }) {
  const params = await props.params;
  if (!isLocale(params.locale)) notFound();
  const investor = await requireInvestorSession(params.locale);
  const [enabled, items] = await Promise.all([isProductFeatureEnabled("investor-calendar"), getInvestorCalendarItems(investor.id)]);
  const copy = COPY[params.locale] ?? COPY.en;
  const format = createAdminFormatters(params.locale);
  const now = Date.now();
  const upcoming = items.filter((item) => new Date(item.date).getTime() >= now);
  const past = items.filter((item) => new Date(item.date).getTime() < now).reverse();

  const section = (title: string, rows: typeof items) => (
    <Card className="rounded-[1.35rem] bg-card dark:bg-graphite-900/[0.72]">
      <CardHeader><CardTitle>{title}</CardTitle><CardDescription>{rows.length || copy.empty}</CardDescription></CardHeader>
      <CardContent className="grid gap-3">
        {rows.length === 0 ? <p className="text-sm text-muted-foreground">{copy.empty}</p> : rows.map((item) => {
          const start = new Date(item.date);
          const end = new Date(start.getTime() + 60 * 60 * 1000);
          const google = new URL("https://calendar.google.com/calendar/render");
          google.searchParams.set("action", "TEMPLATE");
          google.searchParams.set("text", `${copy.types[item.type]}: ${item.title}`);
          google.searchParams.set("details", item.description);
          google.searchParams.set("dates", `${start.toISOString().replace(/[-:]/gu, "").replace(/\\.\\d{3}Z$/u, "Z")}/${end.toISOString().replace(/[-:]/gu, "").replace(/\\.\\d{3}Z$/u, "Z")}`);
          return (
            <div key={item.id} className="flex flex-col gap-3 rounded-[1.35rem] border border-border bg-muted/30 p-4 dark:border-white/10 dark:bg-black/20 sm:flex-row sm:items-center sm:justify-between">
              <Link href={`/${params.locale}${item.href}`} className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{copy.types[item.type]}</p>
                <p className="mt-2 font-semibold text-foreground">{item.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{format.dateTime(item.date)} · {item.description}</p>
              </Link>
              <a href={google.toString()} target="_blank" rel="noreferrer" className="text-sm font-semibold text-amber-700 hover:underline dark:text-gold-100">{copy.google}</a>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );

  return (
    <InvestorShell locale={params.locale} investor={investor} active="calendar" eyebrow={copy.eyebrow} title={copy.title} description={copy.description}>
      {!enabled ? <Card><CardContent className="p-6 text-sm text-muted-foreground">{copy.disabled}</CardContent></Card> : (
        <div className="grid gap-6">
          <a href={`/api/investor/calendar?format=ics&locale=${params.locale}`} className="inline-flex w-fit items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background"><Download className="size-4" />{copy.download}</a>
          {section(copy.upcoming, upcoming)}
          {section(copy.past, past)}
        </div>
      )}
    </InvestorShell>
  );
}

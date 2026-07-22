import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock3, LifeBuoy, Send } from "lucide-react";
import { isLocale, type Locale } from "@otiz/lib";
import { getSiteSettings, prisma } from "@otiz/database";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@otiz/ui";
import { InvestorShell } from "@/components/investor/investor-pages";
import { requireInvestorSession } from "@/lib/investor-session";

export const dynamic = "force-dynamic";

const COPY = {
  en: { eyebrow: "Help", title: "Support", description: "Send a question to the OTIZ team and track its status here.", formTitle: "New request", formDesc: "Describe one issue per request. Include the relevant deal, report or payment when possible.", category: "Topic", categories: ["Money", "Documents", "Reports", "Account", "Other"], subject: "Short subject", message: "What happened, and what help do you need?", submit: "Send request", sent: "Your request was sent. The team can now review it.", error: "Complete the topic, subject and message fields.", history: "Your requests", empty: "You have not sent any support requests yet.", telegram: "Open Telegram", reply: "Team reply", status: { OPEN: "Received", ACKNOWLEDGED: "In review", RESOLVED: "Resolved" } },
  ru: { eyebrow: "Помощь", title: "Поддержка", description: "Отправьте вопрос команде OTIZ и следите за его статусом здесь.", formTitle: "Новое обращение", formDesc: "Описывайте один вопрос в одном обращении. По возможности укажите сделку, отчёт или платёж.", category: "Тема", categories: ["Деньги", "Документы", "Отчёты", "Аккаунт", "Другое"], subject: "Кратко опишите вопрос", message: "Что произошло и какая помощь нужна?", submit: "Отправить обращение", sent: "Обращение отправлено. Команда может начать его проверку.", error: "Заполните тему, заголовок и описание обращения.", history: "Ваши обращения", empty: "У вас пока нет обращений в поддержку.", telegram: "Открыть Telegram", reply: "Ответ команды", status: { OPEN: "Получено", ACKNOWLEDGED: "На рассмотрении", RESOLVED: "Решено" } },
  es: { eyebrow: "Ayuda", title: "Soporte", description: "Envíe una consulta al equipo de OTIZ y siga su estado aquí.", formTitle: "Nueva solicitud", formDesc: "Describa un asunto por solicitud. Indique la operación, el informe o el pago relacionado cuando sea posible.", category: "Tema", categories: ["Dinero", "Documentos", "Informes", "Cuenta", "Otro"], subject: "Asunto breve", message: "¿Qué ocurrió y qué ayuda necesita?", submit: "Enviar solicitud", sent: "Su solicitud fue enviada. El equipo ya puede revisarla.", error: "Complete el tema, el asunto y el mensaje.", history: "Sus solicitudes", empty: "Aún no ha enviado solicitudes de soporte.", telegram: "Abrir Telegram", reply: "Respuesta del equipo", status: { OPEN: "Recibida", ACKNOWLEDGED: "En revisión", RESOLVED: "Resuelta" } },
  de: { eyebrow: "Hilfe", title: "Support", description: "Senden Sie dem OTIZ-Team eine Frage und verfolgen Sie hier den Status.", formTitle: "Neue Anfrage", formDesc: "Beschreiben Sie pro Anfrage ein Thema. Nennen Sie möglichst das zugehörige Geschäft, den Bericht oder die Zahlung.", category: "Thema", categories: ["Geld", "Dokumente", "Berichte", "Konto", "Sonstiges"], subject: "Kurzer Betreff", message: "Was ist passiert und welche Hilfe benötigen Sie?", submit: "Anfrage senden", sent: "Ihre Anfrage wurde gesendet und kann nun geprüft werden.", error: "Füllen Sie Thema, Betreff und Nachricht aus.", history: "Ihre Anfragen", empty: "Sie haben noch keine Support-Anfrage gesendet.", telegram: "Telegram öffnen", reply: "Antwort des Teams", status: { OPEN: "Eingegangen", ACKNOWLEDGED: "In Prüfung", RESOLVED: "Erledigt" } },
  zh: { eyebrow: "帮助", title: "支持", description: "向 OTIZ 团队提交问题，并在此查看处理状态。", formTitle: "新请求", formDesc: "每个请求只描述一个问题，并尽可能注明相关项目、报告或付款。", category: "主题", categories: ["资金", "文件", "报告", "账户", "其他"], subject: "简短标题", message: "发生了什么，您需要什么帮助？", submit: "提交请求", sent: "请求已提交，团队现在可以开始处理。", error: "请填写主题、标题和问题描述。", history: "您的请求", empty: "您还没有提交支持请求。", telegram: "打开 Telegram", reply: "团队回复", status: { OPEN: "已收到", ACKNOWLEDGED: "处理中", RESOLVED: "已解决" } }
} as const;

const CATEGORY_VALUES = ["MONEY", "DOCUMENTS", "REPORTS", "ACCOUNT", "OTHER"] as const;

function readSupportReply(value: string | null) {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as { message?: unknown };
    return typeof parsed.message === "string" ? parsed.message : null;
  } catch {
    return null;
  }
}

export async function generateMetadata(props: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await props.params;
  const copy = isLocale(locale) ? COPY[locale] : COPY.en;
  return { title: `${copy.title} | OTIZ CAPITAL`, description: copy.description };
}

export default async function InvestorSupportPage(props: { params: Promise<{ locale: Locale }>; searchParams: Promise<{ sent?: string; error?: string; context?: string }> }) {
  const { locale } = await props.params;
  if (!isLocale(locale)) notFound();
  const investor = await requireInvestorSession(locale);
  const query = await props.searchParams;
  const [requests, settings] = await Promise.all([
    prisma.operationalIncident.findMany({ where: { investorId: investor.id, incidentType: "SUPPORT_REQUEST" }, orderBy: { createdAt: "desc" }, take: 30 }),
    getSiteSettings()
  ]);
  const replyEvents = requests.length ? await prisma.auditLog.findMany({
    where: { entityType: "OperationalIncident", entityId: { in: requests.map((request) => request.id) }, action: "SUPPORT_REPLY" },
    orderBy: { createdAt: "desc" }
  }) : [];
  const latestReplyByRequest = new Map<string, string>();
  for (const event of replyEvents) {
    const reply = readSupportReply(event.afterJson);
    if (reply && !latestReplyByRequest.has(event.entityId)) latestReplyByRequest.set(event.entityId, reply);
  }
  const t = COPY[locale];
  const date = new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : locale, { dateStyle: "medium", timeStyle: "short" });

  return (
    <InvestorShell locale={locale} investor={investor} active="support" eyebrow={t.eyebrow} title={t.title} description={t.description}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)]">
        <Card className="rounded-[1.35rem]">
          <CardHeader><CardTitle>{t.formTitle}</CardTitle><CardDescription>{t.formDesc}</CardDescription></CardHeader>
          <CardContent>
            {query.sent === "1" ? <p className="mb-5 rounded-xl bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300">{t.sent}</p> : null}
            {query.error ? <p className="mb-5 rounded-xl bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">{t.error}</p> : null}
            <form action="/api/investor/support" method="post" className="grid gap-4">
              <input type="hidden" name="locale" value={locale} />
              <label className="grid gap-2 text-sm font-semibold"><span>{t.category}</span><select name="category" required defaultValue="" className="min-h-12 rounded-xl border border-border bg-background px-4 text-foreground dark:border-white/10"><option value="" disabled>{t.category}</option>{CATEGORY_VALUES.map((value, index) => <option key={value} value={value}>{t.categories[index]}</option>)}</select></label>
              <label className="grid gap-2 text-sm font-semibold"><span>{t.subject}</span><input name="subject" required minLength={4} maxLength={140} className="min-h-12 rounded-xl border border-border bg-background px-4 text-foreground outline-none focus:border-gold-300 dark:border-white/10" /></label>
              <label className="grid gap-2 text-sm font-semibold"><span>{t.message}</span><textarea name="message" required minLength={10} maxLength={1200} rows={6} defaultValue={query.context?.slice(0, 500) ?? ""} className="rounded-xl border border-border bg-background p-4 text-foreground outline-none focus:border-gold-300 dark:border-white/10" /></label>
              <div className="flex flex-wrap items-center gap-3"><button type="submit" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-semibold text-background"><Send className="size-4" />{t.submit}</button><Link href={`https://t.me/${settings.contactTelegram}`} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded-full border border-border px-5 text-sm font-semibold text-foreground dark:border-white/10">{t.telegram}</Link></div>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-[1.35rem]">
          <CardHeader><CardTitle className="flex items-center gap-2"><LifeBuoy className="size-5" />{t.history}</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            {requests.length === 0 ? <p className="rounded-xl bg-muted/30 p-5 text-sm text-muted-foreground dark:bg-black/20">{t.empty}</p> : requests.map((request) => { const reply = latestReplyByRequest.get(request.id); return <div key={request.id} className="rounded-xl border border-border p-4 dark:border-white/10"><div className="flex flex-wrap items-start justify-between gap-3"><p className="font-semibold text-foreground">{request.title.replace(/^Investor support: /u, "")}</p><Badge variant={request.status === "RESOLVED" ? "default" : "secondary"}>{t.status[request.status as keyof typeof t.status] ?? request.status}</Badge></div><p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{request.summary}</p>{reply ? <div className="mt-3 rounded-xl bg-gold-300/15 p-3 text-sm leading-6 text-foreground dark:bg-gold-200/10"><p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-amber-700 dark:text-gold-100">{t.reply}</p>{reply}</div> : null}<p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><Clock3 className="size-3.5" />{date.format(request.createdAt)}</p></div>; })}
          </CardContent>
        </Card>
      </div>
    </InvestorShell>
  );
}

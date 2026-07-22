import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Circle, Send } from "lucide-react";
import { isLocale, type Locale } from "@otiz/lib";
import { getInvestorApplicationStatusRecord, getSiteSettings } from "@otiz/database";
import { Card, CardContent } from "@otiz/ui";
import { ApplicationStatusAutoRefresh } from "../../../../components/apply/application-status-auto-refresh";

export const dynamic = "force-dynamic";

const STRINGS = {
  en: {
    metaTitle: "Application received",
    back: "Back to homepage",
    eyebrow: "Application status",
    heading: "Application received and under review",
    headingApproved: "Application approved",
    headingAccess: "Your investor access is ready",
    headingRejected: "Application not approved",
    sentTo: "Application registered for",
    statusNote: "This status updates automatically.",
    accessCta: "Go to investor login",
    rejectedNote: "Contact the OTIZ team if you would like clarification on this decision.",
    timelineTitle: "What happens next",
    steps: [
      "Application received",
      "Our team will contact you within 24–48 hours",
      "Suitability review",
      "Approval and cabinet access"
    ],
    contactNote: "Have questions? Message us on Telegram.",
    contactCta: "Message on Telegram",
    homeCta: "Back to homepage"
  },
  ru: {
    metaTitle: "Заявка получена",
    back: "На главную",
    eyebrow: "Статус заявки",
    heading: "Заявка получена и находится на рассмотрении",
    headingApproved: "Заявка одобрена",
    headingAccess: "Доступ к кабинету инвестора готов",
    headingRejected: "Заявка не одобрена",
    sentTo: "Заявка зарегистрирована для",
    statusNote: "Статус обновляется автоматически.",
    accessCta: "Перейти ко входу в кабинет",
    rejectedNote: "Если вам нужно уточнение по решению, свяжитесь с командой OTIZ.",
    timelineTitle: "Что дальше",
    steps: [
      "Заявка получена",
      "Команда свяжется с вами в течение 24-48 часов",
      "Проверка пригодности",
      "Одобрение и доступ к кабинету"
    ],
    contactNote: "Если у вас есть вопросы — напишите нам в Telegram.",
    contactCta: "Написать в Telegram",
    homeCta: "Вернуться на главную"
  },
  es: {
    metaTitle: "Solicitud recibida",
    back: "Volver al inicio",
    eyebrow: "Estado de la solicitud",
    heading: "Solicitud recibida y en revisión",
    headingApproved: "Solicitud aprobada",
    headingAccess: "Su acceso de inversor está listo",
    headingRejected: "Solicitud no aprobada",
    sentTo: "Solicitud registrada para",
    statusNote: "Este estado se actualiza automáticamente.",
    accessCta: "Ir al acceso de inversor",
    rejectedNote: "Contacte con el equipo de OTIZ si necesita aclaraciones sobre esta decisión.",
    timelineTitle: "Qué ocurre a continuación",
    steps: [
      "Solicitud recibida",
      "Nuestro equipo le contactará en un plazo de 24-48 horas",
      "Revisión de idoneidad",
      "Aprobación y acceso al gabinete"
    ],
    contactNote: "¿Tiene preguntas? Escríbanos por Telegram.",
    contactCta: "Escribir por Telegram",
    homeCta: "Volver al inicio"
  },
  de: {
    metaTitle: "Anfrage erhalten",
    back: "Zur Startseite",
    eyebrow: "Status der Anfrage",
    heading: "Anfrage erhalten und in Prüfung",
    headingApproved: "Anfrage genehmigt",
    headingAccess: "Ihr Investorenzugang ist bereit",
    headingRejected: "Anfrage nicht genehmigt",
    sentTo: "Anfrage registriert für",
    statusNote: "Dieser Status wird automatisch aktualisiert.",
    accessCta: "Zur Investoren-Anmeldung",
    rejectedNote: "Wenden Sie sich an das OTIZ-Team, wenn Sie eine Erläuterung zu dieser Entscheidung benötigen.",
    timelineTitle: "Wie es weitergeht",
    steps: [
      "Anfrage erhalten",
      "Unser Team kontaktiert Sie innerhalb von 24-48 Stunden",
      "Eignungsprüfung",
      "Freigabe und Zugang zum Kabinett"
    ],
    contactNote: "Haben Sie Fragen? Schreiben Sie uns auf Telegram.",
    contactCta: "Auf Telegram schreiben",
    homeCta: "Zur Startseite"
  },
  zh: {
    metaTitle: "申请已收到",
    back: "返回首页",
    eyebrow: "申请状态",
    heading: "申请已收到，正在审核中",
    headingApproved: "申请已批准",
    headingAccess: "您的投资者账户访问权限已准备就绪",
    headingRejected: "申请未获批准",
    sentTo: "申请登记邮箱",
    statusNote: "此状态会自动更新。",
    accessCta: "前往投资者登录",
    rejectedNote: "如需了解此决定，请联系 OTIZ 团队。",
    timelineTitle: "后续流程",
    steps: [
      "申请已收到",
      "我们的团队将在 24-48 小时内与您联系",
      "适格性审核",
      "批准并开通后台访问"
    ],
    contactNote: "有疑问？请通过 Telegram 联系我们。",
    contactCta: "通过 Telegram 联系",
    homeCta: "返回首页"
  }
} as const;
type Strings = typeof STRINGS.en;
const getStrings = (locale: Locale): Strings => (STRINGS as unknown as Record<string, Strings>)[locale] ?? STRINGS.en;

// b***@gmail.com — never renders the full local part.
function maskEmail(email: string): string | null {
  const trimmed = email.trim();
  const at = trimmed.indexOf("@");
  if (at < 1 || at === trimmed.length - 1) return null;
  const domain = trimmed.slice(at + 1);
  return `${trimmed.slice(0, 1)}***@${domain}`;
}

export async function generateMetadata(props: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const params = await props.params;
  if (!isLocale(params.locale)) return {};
  return { title: `${getStrings(params.locale).metaTitle} | OTIZ CAPITAL`, robots: { index: false, follow: false } };
}

export default async function ApplyStatusRoute(
  props: {
    params: Promise<{ locale: Locale }>;
    searchParams: Promise<{ applicationId?: string; email?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  if (!isLocale(params.locale)) {
    notFound();
  }

  const t = getStrings(params.locale);
  const applicationId = typeof searchParams.applicationId === "string" && /^[a-z0-9_-]+$/i.test(searchParams.applicationId)
    ? searchParams.applicationId
    : null;
  const application = applicationId ? await getInvestorApplicationStatusRecord(applicationId) : null;
  const maskedEmail = application?.email
    ? maskEmail(application.email)
    : typeof searchParams.email === "string"
      ? maskEmail(searchParams.email)
      : null;
  const isRejected = application?.status === "REJECTED";
  const isApproved = Boolean(application?.approvedAt) || application?.status === "APPROVED" || Boolean(application?.investor);
  const hasAccess = Boolean(application?.investor);
  const hasContact = Boolean(application?.contactedAt) || isApproved || isRejected;
  const completedSteps = [Boolean(application), hasContact, isApproved || isRejected, hasAccess];
  const heading = hasAccess ? t.headingAccess : isRejected ? t.headingRejected : isApproved ? t.headingApproved : t.heading;
  const { contactTelegram } = await getSiteSettings();

  return (
    <main className="relative flex min-h-screen items-center overflow-hidden bg-background px-4 py-10 text-foreground micro-noise">
      <ApplicationStatusAutoRefresh enabled={Boolean(application && !hasAccess && !isRejected)} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_48%_0%,rgba(212,175,95,0.16),transparent_34rem),radial-gradient(circle_at_12%_12%,rgba(255,255,255,0.08),transparent_26rem)]" />
      <div className="macro-grid absolute inset-0 opacity-45" />
      <div className="container relative z-10 max-w-2xl">
        <Link href={`/${params.locale}`} className="mb-8 inline-flex items-center gap-3 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="size-4" />
          {t.back}
        </Link>

        <Card className="overflow-hidden rounded-[1.35rem] bg-card dark:bg-graphite-900/[0.78]">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-gold-400/60 to-transparent dark:via-gold-200/70" />
          <CardContent className="p-8">
            <div className="mb-5 flex size-12 items-center justify-center rounded-full border border-gold-200/25 bg-gold-300/20 dark:bg-gold-200/10 text-amber-700 dark:text-gold-100">
              <CheckCircle2 className="size-6" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700 dark:text-gold-100">{t.eyebrow}</p>
            <h1 className="mt-3 font-display text-3xl tracking-[-0.03em] text-foreground md:text-4xl">{heading}</h1>
            {maskedEmail ? (
              <p className="mt-4 text-sm text-muted-foreground">
                {t.sentTo} <span className="font-medium text-foreground">{maskedEmail}</span>
              </p>
            ) : null}
            {application ? <p className="mt-2 text-xs text-muted-foreground">{t.statusNote}</p> : null}

            <div className="mt-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t.timelineTitle}</p>
              <ol className="mt-4 grid gap-4">
                {t.steps.map((step, index) => {
                  const done = completedSteps[index] ?? false;
                  return (
                    <li key={step} className="flex items-start gap-3">
                      {done ? (
                        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-amber-700 dark:text-gold-100" />
                      ) : (
                        <Circle className="mt-0.5 size-5 shrink-0 text-muted-foreground/50" />
                      )}
                      <span className={done ? "text-sm font-medium text-foreground" : "text-sm text-muted-foreground"}>{step}</span>
                    </li>
                  );
                })}
              </ol>
            </div>

            {hasAccess ? (
              <Link
                href={`/${params.locale}/investor/login`}
                className="mt-7 inline-flex items-center rounded-full bg-gold-300 px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-gold-200"
              >
                {t.accessCta}
              </Link>
            ) : isRejected ? (
              <p className="mt-7 rounded-[1.35rem] border border-border bg-muted/30 p-5 text-sm text-muted-foreground dark:border-white/10 dark:bg-black/20">
                {t.rejectedNote}
              </p>
            ) : null}

            <div className="mt-8 rounded-[1.35rem] border border-border dark:border-white/10 bg-muted/30 dark:bg-black/20 p-5">
              <p className="text-sm text-muted-foreground">{t.contactNote}</p>
              <a
                href={`https://t.me/${contactTelegram}`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-2 rounded-full border border-gold-200/40 bg-gold-300/20 dark:bg-gold-200/10 px-4 py-2 text-sm font-semibold text-amber-700 dark:text-gold-100 transition-colors hover:bg-gold-300/30"
              >
                <Send className="size-4" />
                {t.contactCta}
              </a>
            </div>

            <div className="mt-6">
              <Link href={`/${params.locale}`} className="inline-flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-gold-100 hover:underline">
                <ArrowLeft className="size-4" />
                {t.homeCta}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

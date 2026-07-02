import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Circle, Send } from "lucide-react";
import { isLocale, type Locale } from "@otiz/lib";
import { getSiteSettings } from "@otiz/database";
import { Card, CardContent } from "@otiz/ui";

export const dynamic = "force-dynamic";

const STRINGS = {
  en: {
    metaTitle: "Application received",
    back: "Back to homepage",
    eyebrow: "Application status",
    heading: "Application received and under review",
    sentTo: "Confirmation sent to",
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
    sentTo: "Подтверждение отправлено на",
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

export function generateMetadata({ params }: { params: { locale: Locale } }): Metadata {
  if (!isLocale(params.locale)) return {};
  return { title: `${getStrings(params.locale).metaTitle} | OTIZ CAPITAL`, robots: { index: false, follow: false } };
}

export default async function ApplyStatusRoute({
  params,
  searchParams
}: {
  params: { locale: Locale };
  searchParams: { email?: string };
}) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  const t = getStrings(params.locale);
  const maskedEmail = typeof searchParams.email === "string" ? maskEmail(searchParams.email) : null;
  const { contactTelegram } = await getSiteSettings();

  return (
    <main className="relative flex min-h-screen items-center overflow-hidden bg-background px-4 py-10 text-foreground micro-noise">
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
            <h1 className="mt-3 font-display text-3xl tracking-[-0.03em] text-foreground md:text-4xl">{t.heading}</h1>
            {maskedEmail ? (
              <p className="mt-4 text-sm text-muted-foreground">
                {t.sentTo} <span className="font-medium text-foreground">{maskedEmail}</span>
              </p>
            ) : null}

            <div className="mt-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t.timelineTitle}</p>
              <ol className="mt-4 grid gap-4">
                {t.steps.map((step, index) => {
                  const done = index === 0;
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

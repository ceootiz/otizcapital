import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Send } from "lucide-react";
import { isLocale, locales, type Locale } from "@otiz/lib";
import { ThemeToggle } from "@/components/home/theme-toggle";

// ISR: static contact copy, revalidated periodically.
export const revalidate = 3600;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

type ContactContent = {
  back: string;
  meta: { title: string; description: string };
  title: string;
  intro: string;
  telegramLabel: string;
  emailLabel: string;
  responseTitle: string;
  responseNote: string;
};

const CONTENT: Record<"en" | "ru", ContactContent> = {
  en: {
    back: "Back to home",
    meta: {
      title: "Contact | OTIZ CAPITAL",
      description: "Reach the OTIZ CAPITAL team by Telegram or email regarding private allocation access and reporting."
    },
    title: "Contact",
    intro:
      "For allocation access, documentation, or any question about the platform, reach us directly. We keep communication measured and respond personally.",
    telegramLabel: "Telegram",
    emailLabel: "Email",
    responseTitle: "Response time",
    responseNote: "We respond within 1–2 business days."
  },
  ru: {
    back: "На главную",
    meta: {
      title: "Контакты | OTIZ CAPITAL",
      description: "Свяжитесь с командой OTIZ CAPITAL в Telegram или по электронной почте по вопросам доступа и отчётности."
    },
    title: "Контакты",
    intro:
      "По вопросам доступа к аллокациям, документации или работы платформы свяжитесь с нами напрямую. Мы ведём коммуникацию взвешенно и отвечаем лично.",
    telegramLabel: "Telegram",
    emailLabel: "Электронная почта",
    responseTitle: "Время ответа",
    responseNote: "Мы отвечаем в течение 1–2 рабочих дней."
  }
};

const TELEGRAM_HANDLE = "@otizceo";
const TELEGRAM_URL = "https://t.me/otizceo";
const EMAIL = "invest@otizcapital.com";

function getContent(locale: Locale): ContactContent {
  return CONTENT[locale as "en" | "ru"] ?? CONTENT.en;
}

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  if (!isLocale(params.locale)) {
    return {};
  }
  const content = getContent(params.locale);
  return {
    title: content.meta.title,
    description: content.meta.description,
    openGraph: {
      title: content.meta.title,
      description: content.meta.description,
      images: ["/og.png"],
      type: "website"
    }
  };
}

export default function ContactRoute({ params }: { params: { locale: Locale } }) {
  if (!isLocale(params.locale)) {
    notFound();
  }
  const locale = params.locale;
  const content = getContent(locale);

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground micro-noise">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_12%,rgba(212,175,95,0.16),transparent_36rem),radial-gradient(circle_at_8%_8%,rgba(255,255,255,0.05),transparent_30rem)]" />
      <div className="macro-grid absolute inset-0 opacity-50" />

      <div className="relative z-10">
        <header className="container flex h-20 items-center justify-between gap-4">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            {content.back}
          </Link>
          <div className="flex items-center gap-3">
            <Link href={`/${locale}`} className="flex items-center gap-2" aria-label="OTIZ CAPITAL home">
              <span className="flex size-9 items-center justify-center rounded-full border border-gold-200/25 bg-gold-200/10 text-sm font-semibold text-gold-100 shadow-gold">
                O
              </span>
              <span className="hidden text-sm font-semibold tracking-[0.24em] text-foreground sm:inline">OTIZ CAPITAL</span>
            </Link>
            <ThemeToggle />
          </div>
        </header>

        <section className="container py-16 sm:py-24">
          <div className="mx-auto max-w-3xl">
            <h1 className="font-display text-5xl font-medium leading-tight tracking-[-0.05em] text-balance text-foreground sm:text-6xl">
              {content.title}
            </h1>
            <p className="mt-8 text-base leading-8 text-muted-foreground sm:text-lg">{content.intro}</p>

            <div className="mt-14 grid gap-4 sm:grid-cols-2">
              <a
                href={TELEGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-2xl border border-white/10 bg-white/[0.03] p-7 transition-colors hover:border-gold-200/25 hover:bg-white/[0.05]"
              >
                <div className="flex size-11 items-center justify-center rounded-full border border-gold-200/25 bg-gold-200/10 text-gold-100 [&_svg]:size-5">
                  <Send />
                </div>
                <p className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-gold-100">
                  {content.telegramLabel}
                </p>
                <p className="mt-3 text-lg font-semibold tracking-[-0.02em] text-foreground transition-colors group-hover:text-gold-100">
                  {TELEGRAM_HANDLE}
                </p>
              </a>

              <a
                href={`mailto:${EMAIL}`}
                className="group rounded-2xl border border-white/10 bg-white/[0.03] p-7 transition-colors hover:border-gold-200/25 hover:bg-white/[0.05]"
              >
                <div className="flex size-11 items-center justify-center rounded-full border border-gold-200/25 bg-gold-200/10 text-gold-100 [&_svg]:size-5">
                  <Mail />
                </div>
                <p className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-gold-100">
                  {content.emailLabel}
                </p>
                <p className="mt-3 text-lg font-semibold tracking-[-0.02em] text-foreground transition-colors group-hover:text-gold-100">
                  {EMAIL}
                </p>
              </a>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold-100">{content.responseTitle}</p>
              <p className="mt-3 text-base leading-8 text-muted-foreground">{content.responseNote}</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

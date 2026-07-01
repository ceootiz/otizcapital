import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { isLocale, locales, type Locale } from "@otiz/lib";
import { ThemeToggle } from "@/components/home/theme-toggle";

// ISR: static company copy, revalidated periodically.
export const revalidate = 3600;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

type Section = { heading: string; paragraphs: string[] };

type AboutContent = {
  back: string;
  meta: { title: string; description: string };
  title: string;
  intro: string;
  sections: Section[];
  team: { heading: string; label: string; mission: string; note: string };
};

const CONTENT: Record<"en" | "ru", AboutContent> = {
  en: {
    back: "Back to home",
    meta: {
      title: "About OTIZ CAPITAL",
      description:
        "OTIZ CAPITAL is a private commerce capital platform allocating into real electronics inventory, marketplace operations, and audited reporting."
    },
    title: "About OTIZ CAPITAL",
    intro:
      "OTIZ CAPITAL connects private capital to real electronics commerce. Instead of speculative exposure, we build allocations around tangible inventory, marketplace sales cycles, logistics, and disciplined operational reporting.",
    sections: [
      {
        heading: "Who we are",
        paragraphs: [
          "We are an operations-led commerce capital platform. Our work sits at the intersection of procurement, logistics, and marketplace execution, where capital is deployed into physical electronics inventory rather than financial instruments.",
          "The platform is intentionally private and reviewed. We work with a limited number of qualified participants who value documentation, clarity, and measured communication over marketing narratives and performance hype."
        ]
      },
      {
        heading: "Our approach",
        paragraphs: [
          "Every allocation follows a defined cycle: capital is assigned to a commerce mandate, inventory is sourced and verified, products move through established marketplace channels, and results are settled and reported.",
          "Transparency is designed into the operating model. Investors can follow shipment records, warehouse media, marketplace statements, and payout proofs rather than watching price screens. No return is guaranteed, and we communicate operational risk plainly."
        ]
      },
      {
        heading: "Why electronics commerce",
        paragraphs: [
          "Electronics commerce offers short, measurable cycles with real customer demand and clear settlement records. Products move, sales settle, and each step generates operational proof.",
          "This tangibility is the point. It keeps capital connected to genuine economic activity, shortens feedback loops, and makes performance easier to document and understand than in purely speculative strategies."
        ]
      }
    ],
    team: {
      heading: "Team",
      label: "Founding team",
      mission:
        "Our mission is to make real commerce a calm, documented, and accessible place for private capital, held to an operational standard rather than a promotional one.",
      note:
        "Leadership and team details are shared directly during the investor review process, alongside operating documentation and references."
    }
  },
  ru: {
    back: "На главную",
    meta: {
      title: "О OTIZ CAPITAL",
      description:
        "OTIZ CAPITAL — приватная платформа коммерческого капитала, направляющая средства в реальный товарный запас электроники, операции на маркетплейсах и проверяемую отчётность."
    },
    title: "О OTIZ CAPITAL",
    intro:
      "OTIZ CAPITAL соединяет частный капитал с реальной торговлей электроникой. Вместо спекулятивной экспозиции мы выстраиваем аллокации вокруг материального товарного запаса, циклов продаж на маркетплейсах, логистики и дисциплинированной операционной отчётности.",
    sections: [
      {
        heading: "Кто мы",
        paragraphs: [
          "Мы — платформа коммерческого капитала, ориентированная на операции. Наша работа находится на стыке закупок, логистики и исполнения на маркетплейсах, где капитал направляется в физический товарный запас электроники, а не в финансовые инструменты.",
          "Платформа намеренно приватна и работает после рассмотрения. Мы сотрудничаем с ограниченным числом квалифицированных участников, которые ценят документацию, ясность и взвешенную коммуникацию выше маркетинговых нарративов и хайпа о доходности."
        ]
      },
      {
        heading: "Наш подход",
        paragraphs: [
          "Каждая аллокация проходит определённый цикл: капитал назначается на коммерческий мандат, товар закупается и проверяется, продукция проходит через устоявшиеся каналы маркетплейсов, а результаты рассчитываются и отражаются в отчётности.",
          "Прозрачность встроена в операционную модель. Инвесторы могут отслеживать записи об отгрузках, складские материалы, выписки маркетплейсов и подтверждения выплат вместо наблюдения за ценовыми экранами. Доходность не гарантируется, и мы прямо говорим об операционных рисках."
        ]
      },
      {
        heading: "Почему торговля электроникой",
        paragraphs: [
          "Торговля электроникой предлагает короткие, измеримые циклы с реальным потребительским спросом и понятными записями о расчётах. Товар движется, продажи рассчитываются, и каждый шаг создаёт операционное подтверждение.",
          "Именно эта материальность и есть суть. Она удерживает капитал в связи с подлинной экономической активностью, сокращает циклы обратной связи и делает результаты проще для документирования и понимания, чем в чисто спекулятивных стратегиях."
        ]
      }
    ],
    team: {
      heading: "Команда",
      label: "Команда основателей",
      mission:
        "Наша миссия — сделать реальную торговлю спокойным, задокументированным и доступным пространством для частного капитала, соответствующим операционному, а не рекламному стандарту.",
      note:
        "Информация о руководстве и команде предоставляется напрямую в ходе процесса рассмотрения инвестора вместе с операционной документацией и рекомендациями."
    }
  }
};

function getContent(locale: Locale): AboutContent {
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

export default function AboutRoute({ params }: { params: { locale: Locale } }) {
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

            <div className="mt-16 flex flex-col gap-14">
              {content.sections.map((section) => (
                <article key={section.heading}>
                  <h2 className="font-display text-3xl font-medium tracking-[-0.035em] text-foreground sm:text-4xl">
                    {section.heading}
                  </h2>
                  <div className="mt-6 flex flex-col gap-5">
                    {section.paragraphs.map((paragraph, index) => (
                      <p key={index} className="text-base leading-8 text-muted-foreground">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-16">
              <h2 className="font-display text-3xl font-medium tracking-[-0.035em] text-foreground sm:text-4xl">
                {content.team.heading}
              </h2>
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold-100">{content.team.label}</p>
                <p className="mt-5 text-base leading-8 text-foreground">{content.team.mission}</p>
                <p className="mt-5 text-sm leading-7 text-muted-foreground">{content.team.note}</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

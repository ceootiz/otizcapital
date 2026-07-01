import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { isLocale, locales, type Locale } from "@otiz/lib";
import { ThemeToggle } from "@/components/home/theme-toggle";

// ISR: static legal copy, revalidated periodically.
export const revalidate = 3600;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

type Section = { heading: string; paragraphs: string[] };

type LegalContent = {
  back: string;
  meta: { title: string; description: string };
  title: string;
  intro: string;
  sections: Section[];
  updated: string;
};

const CONTENT: Record<"en" | "ru", LegalContent> = {
  en: {
    back: "Back to home",
    meta: {
      title: "Legal & Privacy | OTIZ CAPITAL",
      description:
        "Terms of Service, Privacy Policy, and Cookie Policy for the OTIZ CAPITAL private-offering commerce platform."
    },
    title: "Legal & Privacy",
    intro:
      "OTIZ CAPITAL operates a private-offering commerce platform. The materials below outline the terms under which the platform is made available, how personal data is handled, and how cookies are used. They are provided for general information and do not constitute an offer, solicitation, or investment advice.",
    sections: [
      {
        heading: "Terms of Service",
        paragraphs: [
          "Access to OTIZ CAPITAL is offered on a private, reviewed basis. Availability of any allocation is subject to eligibility, jurisdiction, applicable law, and the specific terms of a signed agreement. Nothing on this platform constitutes a public offer or a guarantee of participation.",
          "All allocations relate to real electronics commerce activity. Commerce carries operational and market risk, and no return is guaranteed. Past operational performance is not indicative of future results. Investors are responsible for assessing suitability and, where appropriate, seeking independent professional advice.",
          "By using the platform you agree to provide accurate information, to complete any required verification, and to use the service only for lawful purposes. We may update these terms from time to time; continued use of the platform after an update constitutes acceptance of the revised terms."
        ]
      },
      {
        heading: "Privacy Policy",
        paragraphs: [
          "We collect only the information needed to operate the platform, review applications, meet regulatory obligations, and communicate with investors. This may include contact details, verification documents, and records of your interactions with the service.",
          "Personal data is handled in accordance with this policy and applicable data-protection law. We apply appropriate technical and organizational safeguards, retain data only as long as necessary, and share it solely with service providers and authorities where required to deliver the service or comply with the law.",
          "You may request access to, correction of, or deletion of your personal data, subject to legal and contractual retention requirements. To exercise these rights, contact us using the details provided on the contact page."
        ]
      },
      {
        heading: "Cookie Policy",
        paragraphs: [
          "We use cookies and similar technologies to keep you signed in, secure your session, remember your preferences, and understand how the platform is used through aggregated analytics.",
          "Strictly necessary cookies are required for the platform to function and cannot be disabled. Analytics cookies help us improve the experience and are used in a privacy-respecting manner. You can control non-essential cookies through your browser settings; disabling them may affect certain features."
        ]
      }
    ],
    updated: "Last updated: July 2026"
  },
  ru: {
    back: "На главную",
    meta: {
      title: "Правовая информация | OTIZ CAPITAL",
      description:
        "Условия использования, Политика конфиденциальности и Политика cookie платформы частных предложений OTIZ CAPITAL."
    },
    title: "Правовая информация",
    intro:
      "OTIZ CAPITAL управляет платформой частных коммерческих предложений. Приведённые ниже материалы описывают условия предоставления платформы, порядок обработки персональных данных и использование cookie. Они носят информационный характер и не являются офертой, побуждением или инвестиционной рекомендацией.",
    sections: [
      {
        heading: "Условия использования",
        paragraphs: [
          "Доступ к OTIZ CAPITAL предоставляется на приватной основе после рассмотрения. Доступность любой аллокации зависит от пригодности, юрисдикции, применимого права и конкретных условий подписанного соглашения. Ничто на этой платформе не является публичной офертой или гарантией участия.",
          "Все аллокации связаны с реальной торговлей электроникой. Торговля сопряжена с операционными и рыночными рисками, и доходность не гарантируется. Прошлые операционные результаты не являются показателем будущих результатов. Инвестор самостоятельно оценивает пригодность и при необходимости обращается за независимой профессиональной консультацией.",
          "Используя платформу, вы соглашаетесь предоставлять достоверную информацию, проходить необходимую проверку и использовать сервис только в законных целях. Мы можем время от времени обновлять настоящие условия; продолжение использования платформы после обновления означает принятие изменённых условий."
        ]
      },
      {
        heading: "Политика конфиденциальности",
        paragraphs: [
          "Мы собираем только те данные, которые необходимы для работы платформы, рассмотрения заявок, выполнения нормативных обязательств и связи с инвесторами. Это может включать контактные данные, документы для проверки и записи о вашем взаимодействии с сервисом.",
          "Персональные данные обрабатываются в соответствии с настоящей политикой и применимым законодательством о защите данных. Мы применяем надлежащие технические и организационные меры, храним данные не дольше необходимого и передаём их только поставщикам услуг и органам власти, когда это требуется для предоставления сервиса или соблюдения закона.",
          "Вы можете запросить доступ к своим персональным данным, их исправление или удаление с учётом требований к юридическому и договорному хранению. Для реализации этих прав свяжитесь с нами по реквизитам, указанным на странице контактов."
        ]
      },
      {
        heading: "Политика cookie",
        paragraphs: [
          "Мы используем cookie и аналогичные технологии, чтобы сохранять вашу авторизацию, защищать сессию, запоминать предпочтения и понимать, как используется платформа, с помощью агрегированной аналитики.",
          "Строго необходимые cookie требуются для работы платформы и не могут быть отключены. Аналитические cookie помогают нам улучшать сервис и используются с уважением к конфиденциальности. Вы можете управлять необязательными cookie в настройках браузера; их отключение может повлиять на некоторые функции."
        ]
      }
    ],
    updated: "Обновлено: июль 2026"
  }
};

function getContent(locale: Locale): LegalContent {
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

export default function LegalRoute({ params }: { params: { locale: Locale } }) {
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

            <p className="mt-16 border-t border-white/10 pt-8 text-xs uppercase tracking-[0.24em] text-muted-foreground">
              {content.updated}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

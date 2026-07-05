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

const CONTENT: Record<"en" | "ru" | "es" | "de" | "zh", LegalContent> = {
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
  },
  es: {
    back: "Volver al inicio",
    meta: {
      title: "Aviso legal y privacidad | OTIZ CAPITAL",
      description:
        "Términos del servicio, Política de privacidad y Política de cookies de la plataforma de comercio de oferta privada de OTIZ CAPITAL."
    },
    title: "Aviso legal y privacidad",
    intro:
      "OTIZ CAPITAL opera una plataforma de comercio de oferta privada. Los materiales siguientes describen los términos en los que se pone la plataforma a disposición, cómo se tratan los datos personales y cómo se utilizan las cookies. Se facilitan a título informativo general y no constituyen una oferta, una solicitación ni asesoramiento de inversión.",
    sections: [
      {
        heading: "Términos del servicio",
        paragraphs: [
          "El acceso a OTIZ CAPITAL se ofrece de forma privada y sujeta a revisión. La disponibilidad de cualquier asignación está supeditada a la elegibilidad, la jurisdicción, la legislación aplicable y los términos específicos de un contrato firmado. Nada en esta plataforma constituye una oferta pública ni una garantía de participación.",
          "Todas las asignaciones se relacionan con actividad real de comercio de electrónica. El comercio conlleva riesgo operativo y de mercado, y no se garantiza rentabilidad alguna. El desempeño operativo pasado no es indicativo de resultados futuros. Los inversores son responsables de evaluar la idoneidad y, cuando proceda, de obtener asesoramiento profesional independiente.",
          "Al utilizar la plataforma, usted se compromete a proporcionar información veraz, a completar cualquier verificación requerida y a utilizar el servicio únicamente con fines lícitos. Podemos actualizar estos términos periódicamente; el uso continuado de la plataforma tras una actualización constituye la aceptación de los términos revisados."
        ]
      },
      {
        heading: "Política de privacidad",
        paragraphs: [
          "Recopilamos únicamente la información necesaria para operar la plataforma, revisar solicitudes, cumplir las obligaciones regulatorias y comunicarnos con los inversores. Esto puede incluir datos de contacto, documentos de verificación y registros de sus interacciones con el servicio.",
          "Los datos personales se tratan de conformidad con esta política y con la legislación aplicable en materia de protección de datos. Aplicamos medidas técnicas y organizativas apropiadas, conservamos los datos solo durante el tiempo necesario y los compartimos exclusivamente con proveedores de servicios y autoridades cuando sea necesario para prestar el servicio o cumplir la ley.",
          "Usted puede solicitar el acceso a sus datos personales, su rectificación o su supresión, con sujeción a los requisitos legales y contractuales de conservación. Para ejercer estos derechos, contáctenos utilizando los datos indicados en la página de contacto."
        ]
      },
      {
        heading: "Política de cookies",
        paragraphs: [
          "Utilizamos cookies y tecnologías similares para mantener su sesión iniciada, proteger su sesión, recordar sus preferencias y comprender cómo se utiliza la plataforma mediante analíticas agregadas.",
          "Las cookies estrictamente necesarias son imprescindibles para el funcionamiento de la plataforma y no pueden desactivarse. Las cookies analíticas nos ayudan a mejorar la experiencia y se utilizan de forma respetuosa con la privacidad. Usted puede controlar las cookies no esenciales mediante la configuración de su navegador; su desactivación puede afectar a determinadas funciones."
        ]
      }
    ],
    updated: "Última actualización: julio de 2026"
  },
  de: {
    back: "Zurück zur Startseite",
    meta: {
      title: "Rechtliches und Datenschutz | OTIZ CAPITAL",
      description:
        "Nutzungsbedingungen, Datenschutzerklärung und Cookie-Richtlinie der Privatplatzierungs-Handelsplattform von OTIZ CAPITAL."
    },
    title: "Rechtliches und Datenschutz",
    intro:
      "OTIZ CAPITAL betreibt eine Handelsplattform im Rahmen einer Privatplatzierung. Die nachstehenden Unterlagen beschreiben die Bedingungen, unter denen die Plattform bereitgestellt wird, wie personenbezogene Daten verarbeitet werden und wie Cookies verwendet werden. Sie dienen der allgemeinen Information und stellen kein Angebot, keine Aufforderung und keine Anlageberatung dar.",
    sections: [
      {
        heading: "Nutzungsbedingungen",
        paragraphs: [
          "Der Zugang zu OTIZ CAPITAL wird auf privater, geprüfter Basis gewährt. Die Verfügbarkeit einer Allokation setzt Eignung, Jurisdiktion, anwendbares Recht und die spezifischen Bedingungen einer unterzeichneten Vereinbarung voraus. Nichts auf dieser Plattform stellt ein öffentliches Angebot oder eine Garantie der Teilnahme dar.",
          "Alle Allokationen beziehen sich auf reale Aktivitäten im Elektronikhandel. Der Handel ist mit operativen und marktbezogenen Risiken verbunden, und es wird keine Rendite garantiert. Die frühere operative Wertentwicklung ist kein Hinweis auf künftige Ergebnisse. Investoren sind für die Beurteilung der Eignung verantwortlich und holen gegebenenfalls unabhängigen professionellen Rat ein.",
          "Mit der Nutzung der Plattform verpflichten Sie sich, zutreffende Angaben zu machen, jede erforderliche Verifizierung durchzuführen und den Dienst ausschließlich für rechtmäßige Zwecke zu nutzen. Wir können diese Bedingungen von Zeit zu Zeit aktualisieren; die fortgesetzte Nutzung der Plattform nach einer Aktualisierung gilt als Annahme der geänderten Bedingungen."
        ]
      },
      {
        heading: "Datenschutzerklärung",
        paragraphs: [
          "Wir erheben nur die Informationen, die zum Betrieb der Plattform, zur Prüfung von Anträgen, zur Erfüllung regulatorischer Pflichten und zur Kommunikation mit Investoren erforderlich sind. Dies kann Kontaktdaten, Verifizierungsdokumente und Aufzeichnungen über Ihre Interaktionen mit dem Dienst umfassen.",
          "Personenbezogene Daten werden gemäß dieser Erklärung und dem anwendbaren Datenschutzrecht verarbeitet. Wir wenden geeignete technische und organisatorische Schutzmaßnahmen an, bewahren Daten nur so lange wie nötig auf und geben sie ausschließlich an Dienstleister und Behörden weiter, soweit dies zur Erbringung des Dienstes oder zur Einhaltung des Rechts erforderlich ist.",
          "Sie können Auskunft über Ihre personenbezogenen Daten sowie deren Berichtigung oder Löschung verlangen, vorbehaltlich gesetzlicher und vertraglicher Aufbewahrungspflichten. Um diese Rechte auszuüben, kontaktieren Sie uns über die auf der Kontaktseite angegebenen Angaben."
        ]
      },
      {
        heading: "Cookie-Richtlinie",
        paragraphs: [
          "Wir verwenden Cookies und ähnliche Technologien, um Sie angemeldet zu halten, Ihre Sitzung abzusichern, Ihre Präferenzen zu speichern und mithilfe aggregierter Analysen nachzuvollziehen, wie die Plattform genutzt wird.",
          "Unbedingt erforderliche Cookies sind für den Betrieb der Plattform notwendig und können nicht deaktiviert werden. Analyse-Cookies helfen uns, das Erlebnis zu verbessern, und werden datenschutzfreundlich eingesetzt. Sie können nicht wesentliche Cookies über die Einstellungen Ihres Browsers steuern; ihre Deaktivierung kann bestimmte Funktionen beeinträchtigen."
        ]
      }
    ],
    updated: "Zuletzt aktualisiert: Juli 2026"
  },
  zh: {
    back: "返回首页",
    meta: {
      title: "法律与隐私 | OTIZ CAPITAL",
      description:
        "OTIZ CAPITAL 私募商贸平台的服务条款、隐私政策及 Cookie 政策。"
    },
    title: "法律与隐私",
    intro:
      "OTIZ CAPITAL 运营一个私募商贸平台。以下材料阐明本平台的提供条款、个人数据的处理方式以及 Cookie 的使用方式。上述内容仅供一般参考，不构成要约、招揽或投资建议。",
    sections: [
      {
        heading: "服务条款",
        paragraphs: [
          "OTIZ CAPITAL 的准入以私密且经审核的方式提供。任何资金配置的可获得性均取决于资格、司法管辖区、适用法律以及所签署协议的具体条款。本平台上的任何内容均不构成公开要约或参与保证。",
          "所有资金配置均与真实的电子产品商贸活动相关。商贸活动伴随运营与市场风险，且不保证任何收益。以往的运营业绩并不预示未来结果。投资者应自行评估适当性，并在适当情况下寻求独立的专业建议。",
          "使用本平台即表示您同意提供准确信息、完成任何必要的验证，并仅将本服务用于合法目的。我们可能不时更新本条款；更新后继续使用本平台即视为接受修订后的条款。"
        ]
      },
      {
        heading: "隐私政策",
        paragraphs: [
          "我们仅收集运营平台、审核申请、履行监管义务以及与投资者沟通所需的信息。这可能包括联系方式、验证文件以及您与本服务互动的记录。",
          "个人数据依据本政策及适用的数据保护法律予以处理。我们采取适当的技术与组织保障措施，仅在必要期限内保留数据，并仅在为提供服务或遵守法律所必需时，向服务提供商及主管机关共享数据。",
          "您可以请求访问、更正或删除您的个人数据，但须遵守法律及合同规定的保留要求。如需行使上述权利，请通过联系页面所提供的方式与我们联系。"
        ]
      },
      {
        heading: "Cookie 政策",
        paragraphs: [
          "我们使用 Cookie 及类似技术，以使您保持登录状态、保护您的会话、记住您的偏好，并通过汇总分析了解本平台的使用情况。",
          "严格必要的 Cookie 是平台运行所必需的，无法停用。分析类 Cookie 有助于我们改善体验，并以尊重隐私的方式使用。您可以通过浏览器设置管理非必要的 Cookie；停用这些 Cookie 可能影响某些功能。"
        ]
      }
    ],
    updated: "最后更新：2026 年 7 月"
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

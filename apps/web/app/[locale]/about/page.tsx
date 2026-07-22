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

const CONTENT: Record<"en" | "ru" | "es" | "de" | "zh", AboutContent> = {
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
  },
  es: {
    back: "Volver al inicio",
    meta: {
      title: "Acerca de OTIZ CAPITAL",
      description:
        "OTIZ CAPITAL es una plataforma privada de capital comercial que asigna recursos a inventario real de electrónica, operaciones en marketplaces e informes auditados."
    },
    title: "Acerca de OTIZ CAPITAL",
    intro:
      "OTIZ CAPITAL conecta el capital privado con el comercio real de electrónica. En lugar de una exposición especulativa, construimos asignaciones en torno a inventario tangible, ciclos de venta en marketplaces, logística y una disciplinada elaboración de informes operativos.",
    sections: [
      {
        heading: "Quiénes somos",
        paragraphs: [
          "Somos una plataforma de capital comercial orientada a las operaciones. Nuestra labor se sitúa en la intersección de las compras, la logística y la ejecución en marketplaces, donde el capital se destina a inventario físico de electrónica en lugar de a instrumentos financieros.",
          "La plataforma es deliberadamente privada y sujeta a revisión. Trabajamos con un número limitado de participantes cualificados que valoran la documentación, la claridad y una comunicación mesurada por encima de las narrativas de marketing y la exaltación de la rentabilidad."
        ]
      },
      {
        heading: "Nuestro enfoque",
        paragraphs: [
          "Cada asignación sigue un ciclo definido: el capital se destina a un mandato comercial, el inventario se adquiere y se verifica, los productos circulan a través de canales de marketplace establecidos y los resultados se liquidan y se informan.",
          "La transparencia está integrada en el modelo operativo. Los inversores pueden seguir los registros de envío, el material de almacén, los extractos de los marketplaces y los comprobantes de pago, en lugar de observar pantallas de cotización. No se garantiza rentabilidad alguna y comunicamos el riesgo operativo con claridad."
        ]
      },
      {
        heading: "Por qué el comercio de electrónica",
        paragraphs: [
          "El comercio de electrónica ofrece ciclos cortos y medibles, con una demanda real de los clientes y registros de liquidación claros. Los productos circulan, las ventas se liquidan y cada paso genera una prueba operativa.",
          "Esa tangibilidad es precisamente el objetivo. Mantiene el capital vinculado a una actividad económica genuina, acorta los ciclos de retroalimentación y hace que el desempeño sea más fácil de documentar y comprender que en estrategias puramente especulativas."
        ]
      }
    ],
    team: {
      heading: "Equipo",
      label: "Equipo fundador",
      mission:
        "Nuestra misión es hacer del comercio real un espacio sereno, documentado y accesible para el capital privado, sujeto a un estándar operativo y no promocional.",
      note:
        "Los detalles sobre la dirección y el equipo se comparten directamente durante el proceso de revisión del inversor, junto con la documentación operativa y las referencias."
    }
  },
  de: {
    back: "Zurück zur Startseite",
    meta: {
      title: "Über OTIZ CAPITAL",
      description:
        "OTIZ CAPITAL ist eine private Plattform für Handelskapital, die Mittel in reale Elektronikbestände, Marktplatzbetrieb und geprüfte Berichterstattung allokiert."
    },
    title: "Über OTIZ CAPITAL",
    intro:
      "OTIZ CAPITAL verbindet privates Kapital mit realem Elektronikhandel. Anstelle spekulativer Positionen strukturieren wir Allokationen rund um materielle Bestände, Verkaufszyklen auf Marktplätzen, Logistik und eine disziplinierte operative Berichterstattung.",
    sections: [
      {
        heading: "Wer wir sind",
        paragraphs: [
          "Wir sind eine operativ ausgerichtete Plattform für Handelskapital. Unsere Tätigkeit liegt an der Schnittstelle von Beschaffung, Logistik und Marktplatzausführung, wo Kapital in physische Elektronikbestände statt in Finanzinstrumente eingesetzt wird.",
          "Die Plattform ist bewusst privat und geprüft. Wir arbeiten mit einer begrenzten Zahl qualifizierter Teilnehmer zusammen, die Dokumentation, Klarheit und eine besonnene Kommunikation höher schätzen als Marketingerzählungen und Renditeversprechen."
        ]
      },
      {
        heading: "Unser Ansatz",
        paragraphs: [
          "Jede Allokation folgt einem definierten Zyklus: Kapital wird einem Handelsmandat zugewiesen, Bestände werden beschafft und verifiziert, Produkte durchlaufen etablierte Marktplatzkanäle, und die Ergebnisse werden abgerechnet und berichtet.",
          "Transparenz ist im Betriebsmodell angelegt. Investoren können Versandnachweise, Lagermedien, Marktplatzauszüge und Auszahlungsbelege verfolgen, anstatt Kursanzeigen zu beobachten. Es wird keine Rendite garantiert, und wir kommunizieren operative Risiken offen."
        ]
      },
      {
        heading: "Warum Elektronikhandel",
        paragraphs: [
          "Der Elektronikhandel bietet kurze, messbare Zyklen mit realer Kundennachfrage und klaren Abrechnungsnachweisen. Produkte bewegen sich, Verkäufe werden abgerechnet, und jeder Schritt erzeugt einen operativen Nachweis.",
          "Genau diese Greifbarkeit ist entscheidend. Sie hält das Kapital mit echter wirtschaftlicher Aktivität verbunden, verkürzt die Rückkopplungsschleifen und macht die Wertentwicklung leichter dokumentierbar und verständlicher als bei rein spekulativen Strategien."
        ]
      }
    ],
    team: {
      heading: "Team",
      label: "Gründungsteam",
      mission:
        "Unsere Mission ist es, realen Handel zu einem ruhigen, dokumentierten und zugänglichen Ort für privates Kapital zu machen, der einem operativen und nicht einem werblichen Maßstab verpflichtet ist.",
      note:
        "Angaben zur Führung und zum Team werden direkt im Rahmen des Investorenprüfungsprozesses gemeinsam mit der operativen Dokumentation und Referenzen mitgeteilt."
    }
  },
  zh: {
    back: "返回首页",
    meta: {
      title: "关于 OTIZ CAPITAL",
      description:
        "OTIZ CAPITAL 是一家私募商贸资本平台，将资金配置于真实的电子产品库存、电商平台运营及经审计的报告。"
    },
    title: "关于 OTIZ CAPITAL",
    intro:
      "OTIZ CAPITAL 将私人资本与真实的电子产品商贸相连接。我们不追求投机性敞口，而是围绕实物库存、电商平台销售周期、物流以及严谨的运营报告来构建资金配置。",
    sections: [
      {
        heading: "关于我们",
        paragraphs: [
          "我们是一家以运营为主导的商贸资本平台。业务处于采购、物流与电商平台执行的交汇点，资本投入实物电子产品库存，而非金融工具。",
          "本平台刻意保持私密并经审核。我们仅与数量有限的合格参与者合作，他们更看重文档、清晰度与稳健的沟通，而非营销叙事与收益炒作。"
        ]
      },
      {
        heading: "我们的方法",
        paragraphs: [
          "每一笔资金配置都遵循既定周期：资本分配至商贸授权，库存经采购并核实，产品通过成熟的电商平台渠道流通，结果随后结算并报告。",
          "透明度已融入运营模式。投资者可查阅发货记录、仓储影像、电商平台对账单及付款凭证，而无需盯着价格屏幕。我们不保证任何收益，并如实说明运营风险。"
        ]
      },
      {
        heading: "为何选择电子产品商贸",
        paragraphs: [
          "电子产品商贸提供周期短、可衡量的运作，具有真实的客户需求与清晰的结算记录。产品流通、销售结算，每一步都产生运营凭证。",
          "这种实物属性正是关键所在。它使资本与真实的经济活动相连，缩短反馈周期，并使业绩比纯投机策略更易于记录与理解。"
        ]
      }
    ],
    team: {
      heading: "团队",
      label: "创始团队",
      mission:
        "我们的使命是让真实商贸成为私人资本可依循的、有据可查且可及的稳健之地，恪守运营标准而非宣传标准。",
      note:
        "管理层与团队的详细信息将在投资者审核流程中，连同运营文档与推荐资料一并直接提供。"
    }
  }
};

function getContent(locale: Locale): AboutContent {
  return CONTENT[locale as "en" | "ru"] ?? CONTENT.en;
}

export async function generateMetadata(props: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const params = await props.params;
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

export default async function AboutRoute(props: { params: Promise<{ locale: Locale }> }) {
  const params = await props.params;
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

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
  closing: { heading: string; label: string; body: string; note: string };
};

const CONTENT: Record<"en" | "ru" | "es" | "de" | "zh", AboutContent> = {
  en: {
    back: "Back to home",
    meta: {
      title: "About OTIZ CAPITAL",
      description: "OTIZ CAPITAL uses private capital in electronics trading deals and shows investors how funds move from deposit to report and payout."
    },
    title: "About OTIZ CAPITAL",
    intro: "OTIZ CAPITAL uses investor capital to buy electronics, move goods through logistics, sell them through marketplaces, and report the result under agreed terms.",
    sections: [
      {
        heading: "What OTIZ does",
        paragraphs: [
          "We organize the purchase, logistics and sale of electronics. Investor capital is assigned to a specific deal, not placed into a public market instrument or shown as an unexplained account number."
        ]
      },
      {
        heading: "How money moves",
        paragraphs: [
          "After a deposit is confirmed, the funds remain available until they are assigned to a deal. The deal then moves through purchase, logistics, sale and reporting. The confirmed result can be paid out or left for reinvestment, depending on the investor's instruction."
        ]
      },
      {
        heading: "How the result is created",
        paragraphs: [
          "A trading result appears when goods are sold for more than their purchase price and the related costs. Purchase costs, logistics, marketplace fees, returns and other deal expenses affect the final result.",
          "OTIZ organizes the trading process and receives the remuneration agreed for the completed commercial result. The exact calculation, costs and distribution terms must be stated in the investor's agreement before funding."
        ]
      },
      {
        heading: "What the investor can verify",
        paragraphs: [
          "The investor account shows the status of the deposit, free and working capital, the related deal, published reports, available documents and payout history. When a source document is available, it is linked to the relevant deal or report."
        ]
      }
    ],
    closing: {
      heading: "Before investing",
      label: "Important",
      body: "Returns are not guaranteed. Sales, logistics, returns and marketplace settlements can change the timing and result of a deal.",
      note: "Before funding, review the agreement, how costs and results are calculated, withdrawal terms, and which documents will be available for your deal."
    }
  },
  ru: {
    back: "На главную",
    meta: {
      title: "Об OTIZ CAPITAL",
      description: "OTIZ CAPITAL использует частный капитал в торговых сделках с электроникой и показывает путь средств от пополнения до отчёта и выплаты."
    },
    title: "Об OTIZ CAPITAL",
    intro: "OTIZ CAPITAL использует капитал инвесторов для закупки электроники, организации логистики, продажи товаров через маркетплейсы и отражения результата на согласованных условиях.",
    sections: [
      {
        heading: "Что делает OTIZ",
        paragraphs: [
          "Мы организуем закупку, логистику и продажу электроники. Капитал инвестора связывается с конкретной сделкой, а не с публичным финансовым инструментом или необъяснимой цифрой в кабинете."
        ]
      },
      {
        heading: "Как движутся деньги",
        paragraphs: [
          "После подтверждения пополнения средства остаются свободными до назначения на сделку. Затем сделка проходит закупку, логистику, продажу и отчёт. Подтверждённый результат можно получить выплатой или оставить для реинвестирования."
        ]
      },
      {
        heading: "Откуда берётся результат",
        paragraphs: [
          "Торговый результат появляется, когда товар продан дороже стоимости его закупки и связанных расходов. На итог влияют закупочная цена, логистика, комиссии маркетплейсов, возвраты и другие расходы конкретной сделки.",
          "OTIZ организует торговый процесс и получает вознаграждение, согласованное для завершённого коммерческого результата. Точный расчёт, расходы и порядок распределения должны быть указаны в соглашении инвестора до пополнения."
        ]
      },
      {
        heading: "Что может проверить инвестор",
        paragraphs: [
          "В кабинете видны статус пополнения, свободный капитал и капитал в работе, связанная сделка, опубликованные отчёты, доступные документы и история выплат. Если подтверждающий документ доступен, он связывается с соответствующей сделкой или отчётом."
        ]
      }
    ],
    closing: {
      heading: "До инвестирования",
      label: "Важно",
      body: "Доходность не гарантируется. Продажи, логистика, возвраты и расчёты маркетплейсов могут изменить срок и результат сделки.",
      note: "До пополнения изучите соглашение, порядок расчёта расходов и результата, условия вывода и перечень документов по вашей сделке."
    }
  },
  es: {
    back: "Volver al inicio",
    meta: {
      title: "Acerca de OTIZ CAPITAL",
      description: "OTIZ CAPITAL utiliza capital privado en operaciones de electrónica y muestra el recorrido de los fondos desde el depósito hasta el informe y el pago."
    },
    title: "Acerca de OTIZ CAPITAL",
    intro: "OTIZ CAPITAL utiliza el capital de los inversores para comprar electrónica, organizar la logística, vender a través de marketplaces e informar del resultado según las condiciones acordadas.",
    sections: [
      {
        heading: "Qué hace OTIZ",
        paragraphs: [
          "Organizamos la compra, la logística y la venta de electrónica. El capital del inversor se vincula a una operación concreta, no a un instrumento financiero público ni a una cifra sin explicación."
        ]
      },
      {
        heading: "Cómo se mueve el dinero",
        paragraphs: [
          "Tras confirmar el depósito, los fondos permanecen disponibles hasta que se asignan a una operación. Después pasan por compra, logística, venta e informe. El resultado confirmado puede pagarse o conservarse para reinvertir."
        ]
      },
      {
        heading: "Cómo se crea el resultado",
        paragraphs: [
          "El resultado comercial aparece cuando los productos se venden por encima de su precio de compra y de los costes relacionados. El precio de compra, la logística, las comisiones de marketplaces, las devoluciones y otros gastos afectan al resultado final.",
          "OTIZ organiza el proceso y recibe la remuneración acordada para el resultado comercial completado. El cálculo, los costes y las condiciones de reparto deben constar en el acuerdo antes de la financiación."
        ]
      },
      {
        heading: "Qué puede verificar el inversor",
        paragraphs: [
          "La cuenta muestra el estado del depósito, el capital disponible y en operaciones, la operación relacionada, los informes publicados, los documentos disponibles y el historial de pagos."
        ]
      }
    ],
    closing: {
      heading: "Antes de invertir",
      label: "Importante",
      body: "La rentabilidad no está garantizada. Las ventas, la logística, las devoluciones y las liquidaciones pueden cambiar el plazo y el resultado.",
      note: "Revise el acuerdo, el cálculo de costes y resultados, las condiciones de retiro y los documentos disponibles antes de depositar."
    }
  },
  de: {
    back: "Zurück zur Startseite",
    meta: {
      title: "Über OTIZ CAPITAL",
      description: "OTIZ CAPITAL setzt privates Kapital in Elektronikgeschäften ein und zeigt den Weg der Mittel von der Einzahlung bis zum Bericht und zur Auszahlung."
    },
    title: "Über OTIZ CAPITAL",
    intro: "OTIZ CAPITAL nutzt Investorenkapital für den Einkauf von Elektronik, die Logistik, den Verkauf über Marktplätze und die Berichterstattung nach vereinbarten Bedingungen.",
    sections: [
      {
        heading: "Was OTIZ macht",
        paragraphs: [
          "Wir organisieren Einkauf, Logistik und Verkauf von Elektronik. Das Kapital des Investors wird einem konkreten Geschäft zugeordnet, nicht einem öffentlichen Finanzinstrument oder einer unerklärten Kontozahl."
        ]
      },
      {
        heading: "Wie sich das Geld bewegt",
        paragraphs: [
          "Nach Bestätigung der Einzahlung bleiben die Mittel verfügbar, bis sie einem Geschäft zugewiesen werden. Danach folgen Einkauf, Logistik, Verkauf und Bericht. Das bestätigte Ergebnis kann ausgezahlt oder reinvestiert werden."
        ]
      },
      {
        heading: "Wie das Ergebnis entsteht",
        paragraphs: [
          "Ein Handelsergebnis entsteht, wenn Waren über ihrem Einkaufspreis und den zugehörigen Kosten verkauft werden. Einkauf, Logistik, Marktplatzgebühren, Rückgaben und weitere Kosten beeinflussen das Ergebnis.",
          "OTIZ organisiert den Prozess und erhält die für das abgeschlossene Handelsergebnis vereinbarte Vergütung. Berechnung, Kosten und Verteilung müssen vor der Einzahlung im Vertrag stehen."
        ]
      },
      {
        heading: "Was der Investor prüfen kann",
        paragraphs: [
          "Das Konto zeigt Einzahlungsstatus, verfügbares und eingesetztes Kapital, das zugehörige Geschäft, veröffentlichte Berichte, verfügbare Dokumente und Auszahlungen."
        ]
      }
    ],
    closing: {
      heading: "Vor der Investition",
      label: "Wichtig",
      body: "Renditen sind nicht garantiert. Verkauf, Logistik, Rückgaben und Marktplatzabrechnungen können Zeitplan und Ergebnis verändern.",
      note: "Prüfen Sie vor der Einzahlung den Vertrag, die Kosten- und Ergebnisberechnung, Auszahlungsbedingungen und verfügbaren Dokumente."
    }
  },
  zh: {
    back: "返回首页",
    meta: {
      title: "关于 OTIZ CAPITAL",
      description: "OTIZ CAPITAL 将私人资金用于电子产品交易，并展示资金从入金到报告和付款的过程。"
    },
    title: "关于 OTIZ CAPITAL",
    intro: "OTIZ CAPITAL 使用投资者资金采购电子产品、安排物流、通过电商平台销售，并按约定条件报告结果。",
    sections: [
      {
        heading: "OTIZ 做什么",
        paragraphs: [
          "我们负责电子产品的采购、物流和销售。投资者资金会对应具体项目，而不是公共金融工具或无法解释的账户数字。"
        ]
      },
      {
        heading: "资金如何流动",
        paragraphs: [
          "入金确认后，资金保持可用，直到分配到具体项目。项目随后经过采购、物流、销售和报告。已确认结果可以付款，也可以按投资者选择用于再投资。"
        ]
      },
      {
        heading: "结果如何产生",
        paragraphs: [
          "当商品销售收入高于采购价格和相关成本时，项目产生交易结果。采购、物流、电商平台费用、退货及其他成本都会影响最终结果。",
          "OTIZ 负责组织交易流程，并按协议从已完成项目的商业结果中获得报酬。计算方式、成本和分配条款必须在入金前写入投资者协议。"
        ]
      },
      {
        heading: "投资者可以核实什么",
        paragraphs: [
          "账户会显示入金状态、可用资金和运作中资金、相关项目、已发布报告、可用文件和付款记录。"
        ]
      }
    ],
    closing: {
      heading: "投资前",
      label: "重要提示",
      body: "不保证收益。销售、物流、退货和电商平台结算可能改变项目时间和结果。",
      note: "入金前请查看协议、成本和结果的计算方式、提现条件以及项目可提供的文件。"
    }
  }
};

function getContent(locale: Locale): AboutContent {
  return CONTENT[locale] ?? CONTENT.en;
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
                {content.closing.heading}
              </h2>
              <div className="mt-6 rounded-2xl border border-border bg-muted/30 p-8 dark:border-white/10 dark:bg-white/[0.03]">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700 dark:text-gold-100">{content.closing.label}</p>
                <p className="mt-5 text-base leading-8 text-foreground">{content.closing.body}</p>
                <p className="mt-5 text-sm leading-7 text-muted-foreground">{content.closing.note}</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

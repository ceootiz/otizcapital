import { type Locale } from "./i18n";

export type MetricItem = {
  label: string;
  value: string;
  detail: string;
};

export type StepItem = {
  title: string;
  body: string;
};

export type ProofItem = {
  title: string;
  body: string;
};

export type TestimonialItem = {
  quote: string;
  name: string;
  role: string;
};

export type FAQItem = {
  question: string;
  answer: string;
};

export type HomeDictionary = {
  meta: {
    title: string;
    description: string;
  };
  nav: {
    operations: string;
    transparency: string;
    process: string;
    faq: string;
    reports: string;
    cta: string;
  };
  hero: {
    headline: string;
    subheadline: string;
    cta: string;
    secondary: string;
    dashboardTitle: string;
    dashboardSubtitle: string;
    activeAllocations: string;
    commerceVolume: string;
    deliveredDevices: string;
    monthlyReporting: string;
  };
  trust: {
    title: string;
    subtitle: string;
    items: MetricItem[];
  };
  how: {
    title: string;
    subtitle: string;
    steps: StepItem[];
  };
  transparency: {
    title: string;
    subtitle: string;
    items: ProofItem[];
    request: string;
  };
  live: {
    title: string;
    subtitle: string;
    currentAllocations: string;
    recentOperations: string;
  };
  realCommerce: {
    title: string;
    subtitle: string;
    points: ProofItem[];
  };
  investor: {
    title: string;
    subtitle: string;
    steps: string[];
  };
  testimonials: {
    title: string;
    subtitle: string;
    items: TestimonialItem[];
  };
  faq: {
    title: string;
    subtitle: string;
    items: FAQItem[];
  };
  finalCta: {
    title: string;
    subtitle: string;
    cta: string;
  };
  footer: {
    description: string;
    legal: string;
    reports: string;
    transparency: string;
    contact: string;
    creators: string;
    social: string;
    language: string;
    disclaimer: string;
  };
};

const english: HomeDictionary = {
  meta: {
    title: "Real Electronics Commerce Allocations",
    description: "Invest in real electronics commerce through transparent allocations, logistics, reporting, and marketplace operations."
  },
  nav: {
    operations: "Operations",
    transparency: "Transparency",
    process: "Process",
    faq: "FAQ",
    reports: "Reports",
    cta: "Become Investor"
  },
  hero: {
    headline: "Invest in Real Electronics Commerce",
    subheadline:
      "OTIZ CAPITAL allocates capital into tangible electronics inventory, marketplace sales cycles, logistics, and audited operational reporting.",
    cta: "Become Investor",
    secondary: "Review transparency model",
    dashboardTitle: "Commerce allocation desk",
    dashboardSubtitle: "Operational view, not market speculation.",
    activeAllocations: "Active Capital",
    commerceVolume: "Commerce Volume",
    deliveredDevices: "Delivered Devices",
    monthlyReporting: "Monthly Reporting"
  },
  trust: {
    title: "Institutional clarity across every commerce cycle.",
    subtitle: "Capital, products, sales, delivery, and reporting stay connected inside one operating model.",
    items: [
      { label: "Commerce volume", value: "$16.2M", detail: "Tracked marketplace sales" },
      { label: "Active capital", value: "$12.8M", detail: "Allocated to live cycles" },
      { label: "Completed deliveries", value: "48.6K", detail: "Serialized devices moved" },
      { label: "Active allocations", value: "36", detail: "Current supply cycles" },
      { label: "Reporting transparency", value: "Monthly", detail: "Cycle statements and proofs" }
    ]
  },
  how: {
    title: "How capital becomes operational commerce.",
    subtitle: "A disciplined flow from allocation to product movement, marketplace sale, and distribution.",
    steps: [
      { title: "Capital", body: "Approved investor capital enters a defined commerce mandate." },
      { title: "Allocation", body: "Funds are assigned to electronics categories with margin and velocity targets." },
      { title: "Procurement", body: "Inventory is sourced, verified, serialized, and routed through logistics partners." },
      { title: "Marketplace Sale", body: "Products move through established marketplace channels and settlement windows." },
      { title: "Profit Distribution", body: "Cycle results are reported, distributed, or reinvested by investor instruction." }
    ]
  },
  transparency: {
    title: "Proof is designed into the operating system.",
    subtitle: "Investors see evidence of product movement, sale events, reporting, and payouts without noisy trading dashboards.",
    items: [
      { title: "Shipment proof", body: "Carrier records, receiving logs, and batch movement summaries for each allocation cycle." },
      { title: "Warehouse media", body: "Inventory media, quality-control notes, and serialized device records when available." },
      { title: "Marketplace reporting", body: "Sales channel statements and settlement visibility for completed cycles." },
      { title: "Payout proof", body: "Distribution records aligned to cycle close, investor account, and reinvestment preference." },
      { title: "Investor stories", body: "Calm operational updates from allocation participants, never hype-led performance claims." },
      { title: "Serial verification", body: "Device-level verification may be requested for applicable inventory batches." }
    ],
    request: "Serial verification by request"
  },
  live: {
    title: "Live operations without trading noise.",
    subtitle: "A measured view of current allocations, supply cycles, delivery status, and commerce activity.",
    currentAllocations: "Current allocations",
    recentOperations: "Recent operations"
  },
  realCommerce: {
    title: "Real products instead of speculative assets.",
    subtitle: "Electronics commerce creates shorter cycles, measurable demand, logistics proof, and operational transparency.",
    points: [
      { title: "Liquidity through marketplaces", body: "Sales occur through commerce channels with existing customer demand and settlement records." },
      { title: "Tangible electronics", body: "Capital is connected to real devices, accessories, inventory batches, and fulfillment activity." },
      { title: "Short commerce cycles", body: "Allocations are structured around procurement, sale, settlement, reporting, and distribution windows." },
      { title: "Operational transparency", body: "Proof points are tied to product movement and reporting instead of speculative price screens." }
    ]
  },
  investor: {
    title: "A private, reviewed investor process.",
    subtitle: "The journey is intentionally measured: qualify, verify, agree, allocate, report, and decide the next cycle.",
    steps: ["Application", "Review", "Approval", "KYC", "Agreement", "Allocation", "Reporting", "Payout / Reinvest"]
  },
  testimonials: {
    title: "What serious participants value.",
    subtitle: "Mature feedback from people who care about clarity, documentation, and execution discipline.",
    items: [
      {
        quote: "The reporting cadence feels more like an operating partner than a financial dashboard. I can follow the actual movement of goods.",
        name: "M. Alvarez",
        role: "Private investor"
      },
      {
        quote: "The attraction is simple: documented commerce cycles, clear allocations, and a team that talks about operations before returns.",
        name: "Johann K.",
        role: "Family office advisor"
      },
      {
        quote: "I wanted exposure to real commerce infrastructure without speculative noise. OTIZ presents the process with appropriate restraint.",
        name: "Elena R.",
        role: "Marketplace operator"
      }
    ]
  },
  faq: {
    title: "Trust-oriented questions, answered directly.",
    subtitle: "A transparent foundation for allocation mechanics, verification, timelines, withdrawals, and reporting.",
    items: [
      { question: "What is an allocation?", answer: "An allocation is capital assigned to a defined electronics commerce cycle such as procurement, marketplace sale, settlement, and reporting." },
      { question: "How is reporting delivered?", answer: "Investors receive cycle-level summaries with operational status, marketplace activity, settlement notes, and available proof records." },
      { question: "When can withdrawals happen?", answer: "Withdrawals follow the agreement terms and cycle settlement windows. The platform is not designed around instant speculative liquidity." },
      { question: "Which marketplaces are used?", answer: "Operations may use established marketplace channels and commerce partners depending on category, inventory quality, and regional demand." },
      { question: "Can I verify inventory?", answer: "Applicable batches can include shipment, warehouse, marketplace, payout, or serial verification records by request." },
      { question: "Can proceeds be reinvested?", answer: "Yes. Investors can choose payout or reinvestment according to their agreement and eligible allocation availability." }
    ]
  },
  finalCta: {
    title: "Enter a calmer model of commerce capital.",
    subtitle: "Apply to review OTIZ CAPITAL allocation access, reporting standards, and operating documentation.",
    cta: "Become Investor"
  },
  footer: {
    description: "OTIZ CAPITAL is a premium commerce capital platform for electronics allocations, logistics, marketplace reporting, and distribution visibility.",
    legal: "Legal",
    reports: "Reports",
    transparency: "Transparency",
    contact: "Contact",
    creators: "Creator partnerships",
    social: "Social",
    language: "Language",
    disclaimer: "Private offerings may be subject to eligibility, jurisdiction, and agreement terms. No return is guaranteed."
  }
};

const spanish: HomeDictionary = {
  ...english,
  meta: {
    title: "Asignaciones de comercio real de electrónica",
    description: "Capital para comercio real de electrónica con asignaciones, logística, informes y transparencia operativa."
  },
  nav: { operations: "Operaciones", transparency: "Transparencia", process: "Proceso", faq: "FAQ", reports: "Informes", cta: "Ser inversor" },
  hero: {
    headline: "Invierte en comercio real de electrónica",
    subheadline: "OTIZ CAPITAL asigna capital a inventario tangible, ventas en marketplaces, logística e informes operativos claros.",
    cta: "Ser inversor",
    secondary: "Ver transparencia",
    dashboardTitle: "Mesa de asignación comercial",
    dashboardSubtitle: "Vista operativa, no especulación.",
    activeAllocations: "Capital activo",
    commerceVolume: "Volumen comercial",
    deliveredDevices: "Dispositivos entregados",
    monthlyReporting: "Informe mensual"
  },
  trust: {
    title: "Claridad institucional en cada ciclo comercial.",
    subtitle: "Capital, productos, ventas, entrega e informes conectados en un solo modelo operativo.",
    items: [
      { label: "Volumen comercial", value: "$16.2M", detail: "Ventas en marketplaces" },
      { label: "Capital activo", value: "$12.8M", detail: "Asignado a ciclos vivos" },
      { label: "Entregas completadas", value: "48.6K", detail: "Dispositivos serializados" },
      { label: "Asignaciones activas", value: "36", detail: "Ciclos de suministro" },
      { label: "Transparencia", value: "Mensual", detail: "Informes y pruebas" }
    ]
  },
  finalCta: { title: "Entra en un modelo más calmado de capital comercial.", subtitle: "Solicita acceso para revisar asignaciones, informes y documentación operativa.", cta: "Ser inversor" },
  footer: {
    description: "OTIZ CAPITAL es una plataforma premium para asignaciones de electrónica, logística, informes marketplace y visibilidad de distribución.",
    legal: "Legal", reports: "Informes", transparency: "Transparencia", contact: "Contacto", creators: "Creadores", social: "Social", language: "Idioma",
    disclaimer: "Las ofertas privadas pueden depender de elegibilidad, jurisdicción y términos. No se garantiza retorno."
  }
};

const german: HomeDictionary = {
  ...english,
  meta: { title: "Reale Elektronik-Commerce-Allokationen", description: "Kapital fuer realen Elektronikhandel mit Allokationen, Logistik, Reporting und operativer Transparenz." },
  nav: { operations: "Operationen", transparency: "Transparenz", process: "Prozess", faq: "FAQ", reports: "Reports", cta: "Investor werden" },
  hero: {
    headline: "Investieren in realen Elektronik-Commerce",
    subheadline: "OTIZ CAPITAL allokiert Kapital in greifbare Elektronikbestände, Marktplatzverkäufe, Logistik und klares operatives Reporting.",
    cta: "Investor werden", secondary: "Transparenzmodell ansehen", dashboardTitle: "Commerce Allocation Desk", dashboardSubtitle: "Operative Sicht, keine Spekulation.", activeAllocations: "Aktives Kapital", commerceVolume: "Handelsvolumen", deliveredDevices: "Gelieferte Geräte", monthlyReporting: "Monatliches Reporting"
  },
  trust: {
    title: "Institutionelle Klarheit in jedem Commerce-Zyklus.", subtitle: "Kapital, Produkte, Verkauf, Lieferung und Reporting in einem operativen Modell.",
    items: [
      { label: "Handelsvolumen", value: "$16.2M", detail: "Erfasste Marktplatzverkäufe" },
      { label: "Aktives Kapital", value: "$12.8M", detail: "Live-Zyklen zugeordnet" },
      { label: "Abgeschlossene Lieferungen", value: "48.6K", detail: "Serialisierte Geräte" },
      { label: "Aktive Allokationen", value: "36", detail: "Aktuelle Lieferzyklen" },
      { label: "Transparenz", value: "Monatlich", detail: "Statements und Nachweise" }
    ]
  },
  finalCta: { title: "Ein ruhigeres Modell fuer Commerce-Kapital.", subtitle: "Beantragen Sie Zugang zu Allokationen, Reporting-Standards und operativer Dokumentation.", cta: "Investor werden" },
  footer: { description: "OTIZ CAPITAL ist eine Premium-Plattform fuer Elektronik-Allokationen, Logistik, Marktplatzreporting und Ausschüttungstransparenz.", legal: "Legal", reports: "Reports", transparency: "Transparenz", contact: "Kontakt", creators: "Creator Partnerships", social: "Social", language: "Sprache", disclaimer: "Private Angebote koennen Eignung, Jurisdiktion und Vertragsbedingungen unterliegen. Keine Rendite ist garantiert." }
};

const russian: HomeDictionary = {
  ...english,
  meta: { title: "Реальные аллокации в электронной коммерции", description: "Капитал для реальной торговли электроникой: аллокации, логистика, отчётность и операционная прозрачность." },
  nav: { operations: "Операции", transparency: "Прозрачность", process: "Процесс", faq: "FAQ", reports: "Отчёты", cta: "Стать инвестором" },
  hero: { headline: "Инвестируйте в реальную торговлю электроникой", subheadline: "OTIZ CAPITAL направляет капитал в материальный товарный запас, продажи на маркетплейсах, логистику и понятную операционную отчётность.", cta: "Стать инвестором", secondary: "Модель прозрачности", dashboardTitle: "Панель коммерческих аллокаций", dashboardSubtitle: "Операционный обзор, не спекуляция.", activeAllocations: "Активный капитал", commerceVolume: "Объём торговли", deliveredDevices: "Доставленные устройства", monthlyReporting: "Ежемесячный отчёт" },
  trust: { title: "Институциональная ясность в каждом торговом цикле.", subtitle: "Капитал, товары, продажи, доставка и отчётность связаны в единой операционной модели.", items: [
    { label: "Объём торговли", value: "$16.2M", detail: "Продажи на маркетплейсах" }, { label: "Активный капитал", value: "$12.8M", detail: "В текущих циклах" }, { label: "Завершённые доставки", value: "48.6K", detail: "Сериализованные устройства" }, { label: "Активные аллокации", value: "36", detail: "Циклы поставок" }, { label: "Прозрачность", value: "Monthly", detail: "Отчёты и подтверждения" }
  ] },
  finalCta: { title: "Войдите в более спокойную модель коммерческого капитала.", subtitle: "Подайте заявку, чтобы изучить доступ, стандарты отчётности и операционную документацию OTIZ CAPITAL.", cta: "Стать инвестором" },
  footer: { description: "OTIZ CAPITAL - премиальная платформа для аллокаций в электронике, логистики, отчётов маркетплейсов и видимости распределений.", legal: "Правовая информация", reports: "Отчёты", transparency: "Прозрачность", contact: "Контакты", creators: "Партнёрства с авторами", social: "Соцсети", language: "Язык", disclaimer: "Частные предложения могут зависеть от пригодности, юрисдикции и условий соглашения. Доходность не гарантируется." }
};

const chinese: HomeDictionary = {
  ...english,
  meta: { title: "真实电子商务配置", description: "围绕真实电子产品、市场销售、物流、报告和配置透明度的资本平台。" },
  nav: { operations: "运营", transparency: "透明度", process: "流程", faq: "FAQ", reports: "报告", cta: "成为投资人" },
  hero: { headline: "投资真实电子商务", subheadline: "OTIZ CAPITAL 将资本配置到真实电子库存、市场销售周期、物流和清晰的运营报告。", cta: "成为投资人", secondary: "查看透明度模型", dashboardTitle: "商务配置台", dashboardSubtitle: "运营视图，而非市场投机。", activeAllocations: "活跃资本", commerceVolume: "商务规模", deliveredDevices: "已交付设备", monthlyReporting: "月度报告" },
  trust: { title: "每个商务周期都有机构级清晰度。", subtitle: "资本、产品、销售、交付和报告在同一运营模型中连接。", items: [
    { label: "商务规模", value: "$16.2M", detail: "已跟踪市场销售" }, { label: "活跃资本", value: "$12.8M", detail: "配置于实时周期" }, { label: "完成交付", value: "48.6K", detail: "序列化设备流转" }, { label: "活跃配置", value: "36", detail: "当前供应周期" }, { label: "报告透明度", value: "Monthly", detail: "周期报表与证明" }
  ] },
  finalCta: { title: "进入更平静的商务资本模型。", subtitle: "申请查看 OTIZ CAPITAL 配置访问、报告标准和运营文件。", cta: "成为投资人" },
  footer: { description: "OTIZ CAPITAL 是围绕电子产品配置、物流、市场报告和分配可见性的高端商务资本平台。", legal: "法律", reports: "报告", transparency: "透明度", contact: "联系", creators: "创作者合作", social: "社交", language: "语言", disclaimer: "私募机会可能受资格、司法辖区和协议条款限制。不保证收益。" }
};

export const dictionaries: Record<Locale, HomeDictionary> = {
  en: english,
  es: spanish,
  de: german,
  ru: russian,
  zh: chinese
};

export function getHomeDictionary(locale: Locale) {
  return dictionaries[locale];
}

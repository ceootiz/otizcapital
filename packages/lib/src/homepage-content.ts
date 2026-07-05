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

export type AllocationRow = {
  id: string;
  cycle: string;
  marketplace: string;
  capital: string;
  status: string;
  progress: number;
};

export type OperationEvent = {
  time: string;
  title: string;
  detail: string;
  state: string;
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
    calculator: string;
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
    proofChain: string;
    operational: string;
    qcMedia: string;
    qcMediaDetail: string;
    settlement: string;
    settlementDetail: string;
  };
  live: {
    title: string;
    subtitle: string;
    currentAllocations: string;
    recentOperations: string;
    allocationsSubtitle: string;
    activeCount: string;
    eventsSubtitle: string;
  };
  realCommerce: {
    title: string;
    subtitle: string;
    points: ProofItem[];
    infrastructureTitle: string;
    infrastructureBody: string;
  };
  dashboard: {
    liveOps: string;
    trendLabel: string;
    trendRange: string;
    chartCapital: string;
    chartVolume: string;
    monthlyValue: string;
  };
  commerce: {
    allocations: AllocationRow[];
    operations: OperationEvent[];
    proofSignals: string[];
    chartMonths: string[];
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
    about: string;
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
    cta: "Become Investor",
    calculator: "Calculator"
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
    request: "Serial verification by request",
    proofChain: "Proof chain",
    operational: "Operational",
    qcMedia: "QC media",
    qcMediaDetail: "Warehouse capture",
    settlement: "Settlement",
    settlementDetail: "Cycle matched"
  },
  live: {
    title: "Live operations without trading noise.",
    subtitle: "A measured view of current allocations, supply cycles, delivery status, and commerce activity.",
    currentAllocations: "Current allocations",
    recentOperations: "Recent operations",
    allocationsSubtitle: "Defined supply cycles with calm operational status.",
    activeCount: "36 active",
    eventsSubtitle: "Proof-oriented events from the current commerce day."
  },
  realCommerce: {
    title: "Real products instead of speculative assets.",
    subtitle: "Electronics commerce creates shorter cycles, measurable demand, logistics proof, and operational transparency.",
    points: [
      { title: "Liquidity through marketplaces", body: "Sales occur through commerce channels with existing customer demand and settlement records." },
      { title: "Tangible electronics", body: "Capital is connected to real devices, accessories, inventory batches, and fulfillment activity." },
      { title: "Short commerce cycles", body: "Allocations are structured around procurement, sale, settlement, reporting, and distribution windows." },
      { title: "Operational transparency", body: "Proof points are tied to product movement and reporting instead of speculative price screens." }
    ],
    infrastructureTitle: "Commerce infrastructure",
    infrastructureBody:
      "Real inventory creates visible proof: purchase orders, shipment events, marketplace settlements, payout records, and cycle reporting."
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
    about: "About",
    reports: "Reports",
    transparency: "Transparency",
    contact: "Contact",
    creators: "Creator partnerships",
    social: "Social",
    language: "Language",
    disclaimer: "Private offerings may be subject to eligibility, jurisdiction, and agreement terms. No return is guaranteed."
  },
  dashboard: {
    liveOps: "Live ops",
    trendLabel: "Capital / volume trend",
    trendRange: "8 mo.",
    chartCapital: "Active capital",
    chartVolume: "Commerce volume",
    monthlyValue: "Monthly"
  },
  commerce: {
    allocations: [
      { id: "OC-AL-1842", cycle: "Apple devices", marketplace: "Amazon / eBay", capital: "$420K", status: "Procurement", progress: 46 },
      { id: "OC-AL-1818", cycle: "Creator bundles", marketplace: "Walmart Marketplace", capital: "$310K", status: "In transit", progress: 68 },
      { id: "OC-AL-1796", cycle: "Refurb premium", marketplace: "Back Market", capital: "$265K", status: "Marketplace sale", progress: 82 }
    ],
    operations: [
      { time: "09:30", title: "Batch received at NJ warehouse", detail: "146 serialized tablets entered quality review", state: "Verified" },
      { time: "11:45", title: "Marketplace settlement posted", detail: "Cycle OC-AL-1772 moved to reporting close", state: "Settled" },
      { time: "14:20", title: "Outbound shipment cleared", detail: "Creator bundle inventory routed to fulfillment", state: "In transit" }
    ],
    proofSignals: ["Shipment media", "Warehouse scans", "Marketplace statements", "Payout records", "Serial checks"],
    chartMonths: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"]
  }
};

const spanish: HomeDictionary = {
  ...english,
  meta: {
    title: "Asignaciones de comercio real de electrónica",
    description: "Capital para comercio real de electrónica con asignaciones, logística, informes y transparencia operativa."
  },
  nav: { operations: "Operaciones", transparency: "Transparencia", process: "Proceso", faq: "FAQ", reports: "Informes", cta: "Ser inversor", calculator: "Calculadora" },
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
  how: {
    title: "Cómo el capital se convierte en comercio operativo.",
    subtitle: "Un flujo disciplinado desde la asignación hasta el movimiento de mercancía, la venta en marketplace y la distribución.",
    steps: [
      { title: "Capital", body: "El capital aprobado del inversor entra en un mandato comercial definido." },
      { title: "Asignación", body: "Los fondos se asignan a categorías de electrónica con objetivos de margen y rotación." },
      { title: "Aprovisionamiento", body: "La mercancía se abastece, verifica, serializa y encamina a través de socios logísticos." },
      { title: "Venta en marketplace", body: "Los productos circulan por canales de marketplace establecidos y ventanas de liquidación." },
      { title: "Distribución de beneficios", body: "Los resultados del ciclo se informan, distribuyen o reinvierten según la instrucción del inversor." }
    ]
  },
  transparency: {
    title: "La prueba está diseñada dentro del sistema operativo.",
    subtitle: "Los inversores ven evidencia del movimiento de mercancía, las ventas, los informes y los pagos, sin paneles de trading ruidosos.",
    items: [
      { title: "Prueba de envío", body: "Registros de transportistas, comprobantes de recepción y resúmenes de movimiento de lotes para cada ciclo de asignación." },
      { title: "Material de almacén", body: "Material de inventario, notas de control de calidad y registros de dispositivos serializados cuando estén disponibles." },
      { title: "Informes de marketplace", body: "Estados de cuenta de canales de venta y visibilidad de liquidación para los ciclos completados." },
      { title: "Prueba de pago", body: "Registros de distribución alineados con el cierre del ciclo, la cuenta del inversor y la preferencia de reinversión." },
      { title: "Historias de inversores", body: "Actualizaciones operativas serenas de participantes en asignaciones, nunca afirmaciones de desempeño sensacionalistas." },
      { title: "Verificación de serie", body: "La verificación a nivel de dispositivo puede solicitarse para los lotes de inventario aplicables." }
    ],
    request: "Verificación de serie por solicitud",
    proofChain: "Cadena de pruebas",
    operational: "Operativo",
    qcMedia: "Material de control de calidad",
    qcMediaDetail: "Captura en almacén",
    settlement: "Liquidación",
    settlementDetail: "Conciliada con el ciclo"
  },
  live: {
    title: "Operaciones en vivo sin ruido de trading.",
    subtitle: "Una vista mesurada de las asignaciones actuales, los ciclos de suministro, el estado de entrega y la actividad comercial.",
    currentAllocations: "Asignaciones actuales",
    recentOperations: "Operaciones recientes",
    allocationsSubtitle: "Ciclos de suministro definidos con un estado operativo sereno.",
    activeCount: "36 activas",
    eventsSubtitle: "Eventos orientados a la prueba de la jornada comercial actual."
  },
  realCommerce: {
    title: "Productos reales en lugar de activos especulativos.",
    subtitle: "El comercio de electrónica genera ciclos más cortos, demanda medible, prueba logística y transparencia operativa.",
    points: [
      { title: "Liquidez a través de marketplaces", body: "Las ventas ocurren por canales de comercio con demanda de clientes existente y registros de liquidación." },
      { title: "Electrónica tangible", body: "El capital se conecta con dispositivos reales, accesorios, lotes de inventario y actividad de fulfillment." },
      { title: "Ciclos comerciales cortos", body: "Las asignaciones se estructuran en torno a ventanas de aprovisionamiento, venta, liquidación, informe y distribución." },
      { title: "Transparencia operativa", body: "Los puntos de prueba se vinculan al movimiento de mercancía y a los informes, no a pantallas de precios especulativas." }
    ],
    infrastructureTitle: "Infraestructura comercial",
    infrastructureBody: "El inventario real genera pruebas visibles: órdenes de compra, eventos de envío, liquidaciones de marketplace, registros de pago e informes de ciclo."
  },
  investor: {
    title: "Un proceso de inversor privado y revisado.",
    subtitle: "El recorrido es intencionalmente mesurado: calificar, verificar, acordar, asignar, informar y decidir el siguiente ciclo.",
    steps: ["Solicitud", "Revisión", "Aprobación", "KYC", "Acuerdo", "Asignación", "Informes", "Pago / Reinversión"]
  },
  testimonials: {
    title: "Lo que valoran los participantes serios.",
    subtitle: "Comentarios maduros de personas que valoran la claridad, la documentación y la disciplina de ejecución.",
    items: [
      { quote: "El ritmo de los informes se siente más como un socio operativo que como un panel financiero. Puedo seguir el movimiento real de la mercancía.", name: "M. Alvarez", role: "Inversor privado" },
      { quote: "El atractivo es simple: ciclos comerciales documentados, asignaciones claras y un equipo que habla de operaciones antes que de rendimientos.", name: "Johann K.", role: "Asesor de family office" },
      { quote: "Quería exposición a infraestructura comercial real sin ruido especulativo. OTIZ presenta el proceso con la debida moderación.", name: "Elena R.", role: "Operadora de marketplace" }
    ]
  },
  faq: {
    title: "Preguntas orientadas a la confianza, respondidas con claridad.",
    subtitle: "Una base transparente sobre la mecánica de asignación, la verificación, los plazos, los retiros y los informes.",
    items: [
      { question: "¿Qué es una asignación?", answer: "Una asignación es capital destinado a un ciclo definido de comercio de electrónica, como aprovisionamiento, venta en marketplace, liquidación e informe." },
      { question: "¿Cómo se entregan los informes?", answer: "Los inversores reciben resúmenes a nivel de ciclo con estado operativo, actividad de marketplace, notas de liquidación y registros de prueba disponibles." },
      { question: "¿Cuándo pueden realizarse los retiros?", answer: "Los retiros siguen los términos del acuerdo y las ventanas de liquidación del ciclo. La plataforma no está diseñada en torno a la liquidez especulativa instantánea." },
      { question: "¿Qué marketplaces se utilizan?", answer: "Las operaciones pueden usar canales de marketplace establecidos y socios comerciales según la categoría, la calidad del inventario y la demanda regional." },
      { question: "¿Puedo verificar el inventario?", answer: "Los lotes aplicables pueden incluir registros de envío, almacén, marketplace, pago o verificación de serie por solicitud." },
      { question: "¿Pueden reinvertirse las ganancias?", answer: "Sí. Los inversores pueden elegir el pago o la reinversión según su acuerdo y la disponibilidad de asignaciones elegibles." }
    ]
  },
  finalCta: { title: "Entra en un modelo más calmado de capital comercial.", subtitle: "Solicita acceso para revisar asignaciones, informes y documentación operativa.", cta: "Ser inversor" },
  footer: {
    description: "OTIZ CAPITAL es una plataforma premium para asignaciones de electrónica, logística, informes marketplace y visibilidad de distribución.",
    legal: "Legal", about: "Sobre nosotros", reports: "Informes", transparency: "Transparencia", contact: "Contacto", creators: "Creadores", social: "Social", language: "Idioma",
    disclaimer: "Las ofertas privadas pueden depender de elegibilidad, jurisdicción y términos. No se garantiza retorno."
  },
  dashboard: {
    liveOps: "Operaciones en vivo",
    trendLabel: "Tendencia de capital / volumen",
    trendRange: "8 meses",
    chartCapital: "Capital activo",
    chartVolume: "Volumen comercial",
    monthlyValue: "Mensual"
  },
  commerce: {
    allocations: [
      { id: "OC-AL-1842", cycle: "Dispositivos Apple", marketplace: "Amazon / eBay", capital: "$420K", status: "Aprovisionamiento", progress: 46 },
      { id: "OC-AL-1818", cycle: "Paquetes para creadores", marketplace: "Walmart Marketplace", capital: "$310K", status: "En tránsito", progress: 68 },
      { id: "OC-AL-1796", cycle: "Reacondicionados premium", marketplace: "Back Market", capital: "$265K", status: "Venta en marketplace", progress: 82 }
    ],
    operations: [
      { time: "09:30", title: "Lote recibido en el almacén de NJ", detail: "146 tabletas serializadas ingresaron a control de calidad", state: "Verificado" },
      { time: "11:45", title: "Liquidación de marketplace registrada", detail: "El ciclo OC-AL-1772 pasó al cierre de informes", state: "Liquidado" },
      { time: "14:20", title: "Envío de salida despachado", detail: "Inventario de paquetes para creadores encaminado a fulfillment", state: "En tránsito" }
    ],
    proofSignals: ["Material de envío", "Escaneos de almacén", "Estados de marketplace", "Registros de pago", "Verificaciones de serie"],
    chartMonths: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago"]
  }
};

const german: HomeDictionary = {
  ...english,
  meta: { title: "Reale Elektronik-Commerce-Allokationen", description: "Kapital fuer realen Elektronikhandel mit Allokationen, Logistik, Reporting und operativer Transparenz." },
  nav: { operations: "Operationen", transparency: "Transparenz", process: "Prozess", faq: "FAQ", reports: "Reports", cta: "Investor werden", calculator: "Rechner" },
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
  how: {
    title: "Wie Kapital zu operativem Handel wird.",
    subtitle: "Ein disziplinierter Ablauf von der Allokation bis zur Warenbewegung, zum Marktplatzverkauf und zur Distribution.",
    steps: [
      { title: "Kapital", body: "Freigegebenes Investorenkapital fließt in ein definiertes Handelsmandat ein." },
      { title: "Allokation", body: "Die Mittel werden Elektronikkategorien mit Margen- und Umschlagszielen zugeordnet." },
      { title: "Beschaffung", body: "Waren werden beschafft, geprüft, serialisiert und über Logistikpartner geleitet." },
      { title: "Marktplatzverkauf", body: "Produkte durchlaufen etablierte Marktplatzkanäle und Abrechnungsfenster." },
      { title: "Gewinnverteilung", body: "Die Zyklusergebnisse werden berichtet, ausgeschüttet oder nach Weisung des Investors reinvestiert." }
    ]
  },
  transparency: {
    title: "Der Nachweis ist im Betriebssystem angelegt.",
    subtitle: "Investoren sehen Belege für Warenbewegung, Verkäufe, Reporting und Auszahlungen, ohne unruhige Trading-Dashboards.",
    items: [
      { title: "Versandnachweis", body: "Frachtführerbelege, Wareneingangsprotokolle und Zusammenfassungen der Chargenbewegung für jeden Allokationszyklus." },
      { title: "Lagermedien", body: "Bestandsmedien, Qualitätskontrollnotizen und Aufzeichnungen serialisierter Geräte, soweit verfügbar." },
      { title: "Marktplatz-Reporting", body: "Kontoauszüge der Verkaufskanäle und Abrechnungstransparenz für abgeschlossene Zyklen." },
      { title: "Auszahlungsnachweis", body: "Ausschüttungsbelege, abgestimmt auf Zyklusabschluss, Investorenkonto und Reinvestitionspräferenz." },
      { title: "Investorenstimmen", body: "Ruhige operative Updates von Allokationsteilnehmern, niemals reißerische Performance-Aussagen." },
      { title: "Seriennummernprüfung", body: "Eine Prüfung auf Geräteebene kann für zutreffende Bestandschargen angefordert werden." }
    ],
    request: "Seriennummernprüfung auf Anfrage",
    proofChain: "Nachweiskette",
    operational: "Operativ",
    qcMedia: "QK-Medien",
    qcMediaDetail: "Lageraufnahme",
    settlement: "Abrechnung",
    settlementDetail: "Zyklus abgeglichen"
  },
  live: {
    title: "Live-Betrieb ohne Trading-Lärm.",
    subtitle: "Eine maßvolle Sicht auf aktuelle Allokationen, Lieferzyklen, Lieferstatus und Handelsaktivität.",
    currentAllocations: "Aktuelle Allokationen",
    recentOperations: "Jüngste Operationen",
    allocationsSubtitle: "Definierte Lieferzyklen mit ruhigem operativem Status.",
    activeCount: "36 aktiv",
    eventsSubtitle: "Nachweisorientierte Ereignisse des aktuellen Handelstages."
  },
  realCommerce: {
    title: "Reale Produkte statt spekulativer Vermögenswerte.",
    subtitle: "Elektronikhandel schafft kürzere Zyklen, messbare Nachfrage, Logistiknachweise und operative Transparenz.",
    points: [
      { title: "Liquidität über Marktplätze", body: "Verkäufe erfolgen über Handelskanäle mit bestehender Kundennachfrage und Abrechnungsbelegen." },
      { title: "Greifbare Elektronik", body: "Kapital ist mit realen Geräten, Zubehör, Bestandschargen und Fulfillment-Aktivität verbunden." },
      { title: "Kurze Handelszyklen", body: "Allokationen sind um Fenster für Beschaffung, Verkauf, Abrechnung, Reporting und Distribution strukturiert." },
      { title: "Operative Transparenz", body: "Nachweispunkte sind an Warenbewegung und Reporting gebunden, nicht an spekulative Kursanzeigen." }
    ],
    infrastructureTitle: "Handelsinfrastruktur",
    infrastructureBody: "Realer Bestand schafft sichtbare Nachweise: Bestellungen, Versandereignisse, Marktplatzabrechnungen, Auszahlungsbelege und Zyklusberichte."
  },
  investor: {
    title: "Ein privater, geprüfter Investorenprozess.",
    subtitle: "Der Weg ist bewusst maßvoll: qualifizieren, verifizieren, vereinbaren, allokieren, berichten und über den nächsten Zyklus entscheiden.",
    steps: ["Antrag", "Prüfung", "Freigabe", "KYC", "Vereinbarung", "Allokation", "Reporting", "Auszahlung / Reinvestition"]
  },
  testimonials: {
    title: "Was ernsthafte Teilnehmer schätzen.",
    subtitle: "Reifes Feedback von Menschen, denen Klarheit, Dokumentation und Ausführungsdisziplin wichtig sind.",
    items: [
      { quote: "Der Reporting-Rhythmus wirkt eher wie ein operativer Partner als ein Finanz-Dashboard. Ich kann die tatsächliche Warenbewegung verfolgen.", name: "M. Alvarez", role: "Privatinvestor" },
      { quote: "Der Reiz ist einfach: dokumentierte Handelszyklen, klare Allokationen und ein Team, das über Operationen spricht, bevor es über Renditen spricht.", name: "Johann K.", role: "Family-Office-Berater" },
      { quote: "Ich wollte Zugang zu realer Handelsinfrastruktur ohne spekulativen Lärm. OTIZ präsentiert den Prozess mit angemessener Zurückhaltung.", name: "Elena R.", role: "Marktplatzbetreiberin" }
    ]
  },
  faq: {
    title: "Vertrauensorientierte Fragen, direkt beantwortet.",
    subtitle: "Eine transparente Grundlage für Allokationsmechanik, Verifizierung, Zeitpläne, Auszahlungen und Reporting.",
    items: [
      { question: "Was ist eine Allokation?", answer: "Eine Allokation ist Kapital, das einem definierten Elektronikhandelszyklus zugeordnet ist, etwa Beschaffung, Marktplatzverkauf, Abrechnung und Reporting." },
      { question: "Wie wird das Reporting bereitgestellt?", answer: "Investoren erhalten Zusammenfassungen auf Zyklusebene mit operativem Status, Marktplatzaktivität, Abrechnungsnotizen und verfügbaren Nachweisen." },
      { question: "Wann sind Auszahlungen möglich?", answer: "Auszahlungen folgen den Vertragsbedingungen und den Abrechnungsfenstern des Zyklus. Die Plattform ist nicht auf sofortige spekulative Liquidität ausgelegt." },
      { question: "Welche Marktplätze werden genutzt?", answer: "Die Operationen können etablierte Marktplatzkanäle und Handelspartner nutzen, abhängig von Kategorie, Bestandsqualität und regionaler Nachfrage." },
      { question: "Kann ich den Bestand verifizieren?", answer: "Zutreffende Chargen können auf Anfrage Nachweise zu Versand, Lager, Marktplatz, Auszahlung oder Seriennummern enthalten." },
      { question: "Können Erträge reinvestiert werden?", answer: "Ja. Investoren können gemäß ihrer Vereinbarung und der Verfügbarkeit geeigneter Allokationen zwischen Auszahlung und Reinvestition wählen." }
    ]
  },
  finalCta: { title: "Ein ruhigeres Modell fuer Commerce-Kapital.", subtitle: "Beantragen Sie Zugang zu Allokationen, Reporting-Standards und operativer Dokumentation.", cta: "Investor werden" },
  footer: { description: "OTIZ CAPITAL ist eine Premium-Plattform fuer Elektronik-Allokationen, Logistik, Marktplatzreporting und Ausschüttungstransparenz.", legal: "Legal", about: "Über uns", reports: "Reports", transparency: "Transparenz", contact: "Kontakt", creators: "Creator Partnerships", social: "Social", language: "Sprache", disclaimer: "Private Angebote koennen Eignung, Jurisdiktion und Vertragsbedingungen unterliegen. Keine Rendite ist garantiert." },
  dashboard: {
    liveOps: "Live-Betrieb",
    trendLabel: "Kapital- / Volumentrend",
    trendRange: "8 Mon.",
    chartCapital: "Aktives Kapital",
    chartVolume: "Handelsvolumen",
    monthlyValue: "Monatlich"
  },
  commerce: {
    allocations: [
      { id: "OC-AL-1842", cycle: "Apple-Geräte", marketplace: "Amazon / eBay", capital: "$420K", status: "Beschaffung", progress: 46 },
      { id: "OC-AL-1818", cycle: "Creator-Bundles", marketplace: "Walmart Marketplace", capital: "$310K", status: "Unterwegs", progress: 68 },
      { id: "OC-AL-1796", cycle: "Refurbished Premium", marketplace: "Back Market", capital: "$265K", status: "Marktplatzverkauf", progress: 82 }
    ],
    operations: [
      { time: "09:30", title: "Charge im Lager NJ eingegangen", detail: "146 serialisierte Tablets zur Qualitätsprüfung eingetroffen", state: "Geprüft" },
      { time: "11:45", title: "Marktplatzabrechnung gebucht", detail: "Zyklus OC-AL-1772 in den Reporting-Abschluss überführt", state: "Abgerechnet" },
      { time: "14:20", title: "Ausgehende Sendung freigegeben", detail: "Creator-Bundle-Bestand ins Fulfillment geleitet", state: "Unterwegs" }
    ],
    proofSignals: ["Versandmedien", "Lagerscans", "Marktplatz-Auszüge", "Auszahlungsbelege", "Seriennummernprüfungen"],
    chartMonths: ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug"]
  }
};

const russian: HomeDictionary = {
  ...english,
  meta: { title: "Реальные аллокации в электронной коммерции", description: "Капитал для реальной торговли электроникой: аллокации, логистика, отчётность и операционная прозрачность." },
  nav: { operations: "Операции", transparency: "Прозрачность", process: "Процесс", faq: "FAQ", reports: "Отчёты", cta: "Стать инвестором", calculator: "Калькулятор" },
  hero: { headline: "Инвестируйте в реальную торговлю электроникой", subheadline: "OTIZ CAPITAL направляет капитал в материальный товарный запас, продажи на маркетплейсах, логистику и понятную операционную отчётность.", cta: "Стать инвестором", secondary: "Модель прозрачности", dashboardTitle: "Панель коммерческих аллокаций", dashboardSubtitle: "Операционный обзор, не спекуляция.", activeAllocations: "Активный капитал", commerceVolume: "Объём торговли", deliveredDevices: "Доставленные устройства", monthlyReporting: "Ежемесячный отчёт" },
  trust: { title: "Институциональная ясность в каждом торговом цикле.", subtitle: "Капитал, товары, продажи, доставка и отчётность связаны в единой операционной модели.", items: [
    { label: "Объём торговли", value: "$16.2M", detail: "Продажи на маркетплейсах" }, { label: "Активный капитал", value: "$12.8M", detail: "В текущих циклах" }, { label: "Завершённые доставки", value: "48.6K", detail: "Сериализованные устройства" }, { label: "Активные аллокации", value: "36", detail: "Циклы поставок" }, { label: "Прозрачность", value: "Ежемесячно", detail: "Отчёты и подтверждения" }
  ] },
  how: {
    title: "Как капитал превращается в операционную торговлю.",
    subtitle: "Дисциплинированный путь от аллокации до движения товара, продажи на маркетплейсе и распределения.",
    steps: [
      { title: "Капитал", body: "Одобренный капитал инвестора поступает в определённый торговый мандат." },
      { title: "Аллокация", body: "Средства распределяются по категориям электроники с целями по марже и оборачиваемости." },
      { title: "Закупка", body: "Товар закупается, проверяется, сериализуется и направляется через логистических партнёров." },
      { title: "Продажа на маркетплейсе", body: "Товары проходят через устоявшиеся каналы маркетплейсов и окна расчётов." },
      { title: "Распределение прибыли", body: "Результаты цикла отражаются в отчётности, распределяются или реинвестируются по указанию инвестора." }
    ]
  },
  transparency: {
    title: "Доказательства встроены в операционную систему.",
    subtitle: "Инвесторы видят подтверждения движения товара, продаж, отчётности и выплат без шумных торговых дашбордов.",
    items: [
      { title: "Подтверждение отгрузки", body: "Записи перевозчиков, журналы приёмки и сводки по движению партий для каждого цикла аллокации." },
      { title: "Складские материалы", body: "Медиа по запасам, заметки контроля качества и записи сериализованных устройств при наличии." },
      { title: "Отчётность маркетплейсов", body: "Выписки каналов продаж и прозрачность расчётов по завершённым циклам." },
      { title: "Подтверждение выплат", body: "Записи о распределении, привязанные к закрытию цикла, счёту инвестора и предпочтению по реинвестированию." },
      { title: "Истории инвесторов", body: "Спокойные операционные обновления от участников аллокаций, без заявлений о доходности в духе хайпа." },
      { title: "Проверка серийных номеров", body: "Проверка на уровне устройств может быть запрошена для применимых партий товара." }
    ],
    request: "Проверка серийных номеров по запросу",
    proofChain: "Цепочка подтверждений",
    operational: "Операционный",
    qcMedia: "Материалы контроля качества",
    qcMediaDetail: "Съёмка на складе",
    settlement: "Расчёт",
    settlementDetail: "Сопоставлено с циклом"
  },
  live: {
    title: "Живые операции без торгового шума.",
    subtitle: "Взвешенный обзор текущих аллокаций, циклов поставок, статуса доставки и торговой активности.",
    currentAllocations: "Текущие аллокации",
    recentOperations: "Последние операции",
    allocationsSubtitle: "Определённые циклы поставок со спокойным операционным статусом.",
    activeCount: "36 активных",
    eventsSubtitle: "События с подтверждениями за текущий торговый день."
  },
  realCommerce: {
    title: "Реальные товары вместо спекулятивных активов.",
    subtitle: "Торговля электроникой создаёт более короткие циклы, измеримый спрос, логистические подтверждения и операционную прозрачность.",
    points: [
      { title: "Ликвидность через маркетплейсы", body: "Продажи идут через торговые каналы с существующим спросом и записями о расчётах." },
      { title: "Материальная электроника", body: "Капитал связан с реальными устройствами, аксессуарами, партиями товара и фулфилментом." },
      { title: "Короткие торговые циклы", body: "Аллокации выстроены вокруг окон закупки, продажи, расчёта, отчётности и распределения." },
      { title: "Операционная прозрачность", body: "Точки подтверждения привязаны к движению товара и отчётности, а не к спекулятивным ценовым экранам." }
    ],
    infrastructureTitle: "Торговая инфраструктура",
    infrastructureBody: "Реальный товар создаёт видимые доказательства: заказы на закупку, события отгрузки, расчёты маркетплейсов, записи выплат и отчётность по циклам."
  },
  investor: {
    title: "Приватный, проверяемый процесс для инвестора.",
    subtitle: "Путь намеренно взвешен: квалификация, проверка, соглашение, аллокация, отчётность и решение о следующем цикле.",
    steps: ["Заявка", "Рассмотрение", "Одобрение", "KYC", "Соглашение", "Аллокация", "Отчётность", "Выплата / Реинвест"]
  },
  testimonials: {
    title: "Что ценят серьёзные участники.",
    subtitle: "Зрелые отзывы от людей, которым важны ясность, документация и дисциплина исполнения.",
    items: [
      { quote: "Ритм отчётности ощущается скорее как операционный партнёр, чем финансовый дашборд. Я вижу реальное движение товара.", name: "M. Alvarez", role: "Частный инвестор" },
      { quote: "Привлекательность проста: задокументированные торговые циклы, понятные аллокации и команда, которая говорит об операциях раньше, чем о доходности.", name: "Johann K.", role: "Советник семейного офиса" },
      { quote: "Я хотел доступ к реальной торговой инфраструктуре без спекулятивного шума. OTIZ представляет процесс с уместной сдержанностью.", name: "Elena R.", role: "Оператор маркетплейса" }
    ]
  },
  faq: {
    title: "Вопросы о доверии — с прямыми ответами.",
    subtitle: "Прозрачная основа для механики аллокаций, проверки, сроков, выводов средств и отчётности.",
    items: [
      { question: "Что такое аллокация?", answer: "Аллокация — это капитал, назначенный на определённый цикл торговли электроникой: закупка, продажа на маркетплейсе, расчёт и отчётность." },
      { question: "Как предоставляется отчётность?", answer: "Инвесторы получают сводки на уровне цикла с операционным статусом, активностью маркетплейсов, заметками о расчётах и доступными записями-подтверждениями." },
      { question: "Когда возможны выводы средств?", answer: "Выводы следуют условиям соглашения и окнам расчёта циклов. Платформа не построена вокруг мгновенной спекулятивной ликвидности." },
      { question: "Какие маркетплейсы используются?", answer: "Операции могут использовать устоявшиеся каналы маркетплейсов и торговых партнёров в зависимости от категории, качества товара и регионального спроса." },
      { question: "Можно ли проверить товар?", answer: "Применимые партии могут включать записи об отгрузке, складе, маркетплейсе, выплатах или проверке серийных номеров по запросу." },
      { question: "Можно ли реинвестировать доход?", answer: "Да. Инвесторы могут выбрать выплату или реинвестирование согласно своему соглашению и доступности подходящих аллокаций." }
    ]
  },
  finalCta: { title: "Войдите в более спокойную модель коммерческого капитала.", subtitle: "Подайте заявку, чтобы изучить доступ, стандарты отчётности и операционную документацию OTIZ CAPITAL.", cta: "Стать инвестором" },
  footer: { description: "OTIZ CAPITAL - премиальная платформа для аллокаций в электронике, логистики, отчётов маркетплейсов и видимости распределений.", legal: "Правовая информация", about: "О компании", reports: "Отчёты", transparency: "Прозрачность", contact: "Контакты", creators: "Партнёрства с авторами", social: "Соцсети", language: "Язык", disclaimer: "Частные предложения могут зависеть от пригодности, юрисдикции и условий соглашения. Доходность не гарантируется." },
  dashboard: {
    liveOps: "Онлайн-операции",
    trendLabel: "Тренд капитала / объёма",
    trendRange: "8 мес.",
    chartCapital: "Активный капитал",
    chartVolume: "Объём торговли",
    monthlyValue: "Ежемесячно"
  },
  commerce: {
    allocations: [
      { id: "OC-AL-1842", cycle: "Устройства Apple", marketplace: "Amazon / eBay", capital: "$420K", status: "Закупка", progress: 46 },
      { id: "OC-AL-1818", cycle: "Наборы для авторов", marketplace: "Walmart Marketplace", capital: "$310K", status: "В пути", progress: 68 },
      { id: "OC-AL-1796", cycle: "Восстановленные премиум", marketplace: "Back Market", capital: "$265K", status: "Продажа на маркетплейсе", progress: 82 }
    ],
    operations: [
      { time: "09:30", title: "Партия принята на складе в Нью-Джерси", detail: "146 сериализованных планшетов поступили на контроль качества", state: "Проверено" },
      { time: "11:45", title: "Расчёт маркетплейса проведён", detail: "Цикл OC-AL-1772 переведён в закрытие отчётности", state: "Рассчитано" },
      { time: "14:20", title: "Исходящая отгрузка выпущена", detail: "Товары набора для авторов направлены в фулфилмент", state: "В пути" }
    ],
    proofSignals: ["Медиа отгрузок", "Складские сканы", "Выписки маркетплейсов", "Записи выплат", "Проверки серийных номеров"],
    chartMonths: ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг"]
  }
};

const chinese: HomeDictionary = {
  ...english,
  meta: { title: "真实电子商务配置", description: "围绕真实电子产品、市场销售、物流、报告和配置透明度的资本平台。" },
  nav: { operations: "运营", transparency: "透明度", process: "流程", faq: "FAQ", reports: "报告", cta: "成为投资人", calculator: "计算器" },
  hero: { headline: "投资真实电子商务", subheadline: "OTIZ CAPITAL 将资本配置到真实电子库存、市场销售周期、物流和清晰的运营报告。", cta: "成为投资人", secondary: "查看透明度模型", dashboardTitle: "商务配置台", dashboardSubtitle: "运营视图，而非市场投机。", activeAllocations: "活跃资本", commerceVolume: "商务规模", deliveredDevices: "已交付设备", monthlyReporting: "月度报告" },
  trust: { title: "每个商务周期都有机构级清晰度。", subtitle: "资本、产品、销售、交付和报告在同一运营模型中连接。", items: [
    { label: "商务规模", value: "$16.2M", detail: "已跟踪市场销售" }, { label: "活跃资本", value: "$12.8M", detail: "配置于实时周期" }, { label: "完成交付", value: "48.6K", detail: "序列化设备流转" }, { label: "活跃配置", value: "36", detail: "当前供应周期" }, { label: "报告透明度", value: "Monthly", detail: "周期报表与证明" }
  ] },
  how: {
    title: "资本如何转化为运营中的商贸。",
    subtitle: "从资金配置到商品流转、电商平台销售与分配的严谨流程。",
    steps: [
      { title: "资本", body: "经批准的投资者资本进入既定的商贸授权范围。" },
      { title: "资金配置", body: "资金按毛利率与周转目标配置到各电子产品品类。" },
      { title: "采购", body: "商品经采购、核验、序列化，并通过物流合作方转运。" },
      { title: "电商平台销售", body: "产品经由成熟的电商平台渠道与结算周期流转。" },
      { title: "利润分配", body: "周期结果经报告后，按投资者指示进行分配或再投资。" }
    ]
  },
  transparency: {
    title: "凭证已内建于运营系统之中。",
    subtitle: "投资者可看到商品流转、销售、报告与付款的凭证，而无需嘈杂的交易仪表板。",
    items: [
      { title: "发货凭证", body: "每个配置周期的承运人记录、收货日志与批次流转汇总。" },
      { title: "仓库影像", body: "库存影像、质检记录，以及在可用时的序列化设备记录。" },
      { title: "电商平台报告", body: "已完成周期的销售渠道对账单与结算可见性。" },
      { title: "付款凭证", body: "与周期结算、投资者账户及再投资偏好相匹配的分配记录。" },
      { title: "投资者见证", body: "来自配置参与者的平和运营更新，绝无夸张的业绩宣称。" },
      { title: "序列号核验", body: "对适用的库存批次，可按需申请设备级核验。" }
    ],
    request: "序列号核验按需提供",
    proofChain: "凭证链",
    operational: "运营中",
    qcMedia: "质检影像",
    qcMediaDetail: "仓库采集",
    settlement: "结算",
    settlementDetail: "与周期匹配"
  },
  live: {
    title: "无交易噪音的实时运营。",
    subtitle: "对当前资金配置、供应周期、交付状态与商贸活动的审慎视图。",
    currentAllocations: "当前资金配置",
    recentOperations: "近期运营",
    allocationsSubtitle: "运营状态平稳的既定供应周期。",
    activeCount: "36 项活跃",
    eventsSubtitle: "当前商贸日中以凭证为导向的事件。"
  },
  realCommerce: {
    title: "真实产品，而非投机性资产。",
    subtitle: "电子商贸带来更短的周期、可衡量的需求、物流凭证与运营透明度。",
    points: [
      { title: "通过电商平台获得流动性", body: "销售经由具有既有客户需求与结算记录的商贸渠道完成。" },
      { title: "有形电子产品", body: "资本与真实设备、配件、库存批次及履约活动相连接。" },
      { title: "短周期商贸", body: "资金配置围绕采购、销售、结算、报告与分配的时间窗构建。" },
      { title: "运营透明度", body: "凭证要点与商品流转和报告挂钩，而非投机性价格屏幕。" }
    ],
    infrastructureTitle: "商贸基础设施",
    infrastructureBody: "真实库存产生可见凭证：采购订单、发货事件、电商平台结算、付款记录与周期报告。"
  },
  investor: {
    title: "一套私密且经审核的投资者流程。",
    subtitle: "该流程刻意审慎：资格审核、核验、签约、配置、报告，并决定下一周期。",
    steps: ["申请", "审核", "批准", "KYC", "签约", "资金配置", "报告", "付款 / 再投资"]
  },
  testimonials: {
    title: "严肃参与者所看重的。",
    subtitle: "来自重视清晰度、文档与执行纪律者的成熟反馈。",
    items: [
      { quote: "报告节奏更像是一位运营伙伴，而非财务仪表板。我能够跟踪商品的真实流转。", name: "M. Alvarez", role: "私人投资者" },
      { quote: "吸引力很简单：有据可查的商贸周期、清晰的资金配置，以及一支先谈运营、后谈收益的团队。", name: "Johann K.", role: "家族办公室顾问" },
      { quote: "我希望在没有投机噪音的情况下接触真实的商贸基础设施。OTIZ 以适度克制的方式呈现整个流程。", name: "Elena R.", role: "电商平台运营者" }
    ]
  },
  faq: {
    title: "以信任为导向的问题，直接作答。",
    subtitle: "关于配置机制、核验、时间安排、提取与报告的透明基础。",
    items: [
      { question: "什么是资金配置？", answer: "资金配置是指投入到既定电子商贸周期的资本，如采购、电商平台销售、结算与报告。" },
      { question: "报告如何提供？", answer: "投资者会收到周期级别的汇总，包含运营状态、电商平台活动、结算说明及可用的凭证记录。" },
      { question: "何时可以提取？", answer: "提取遵循协议条款与周期结算窗口。本平台并非围绕即时投机性流动性设计。" },
      { question: "使用哪些电商平台？", answer: "运营可根据品类、库存质量与区域需求，使用成熟的电商平台渠道与商贸合作方。" },
      { question: "我可以核验库存吗？", answer: "适用批次可按需包含发货、仓库、电商平台、付款或序列号核验记录。" },
      { question: "收益可以再投资吗？", answer: "可以。投资者可根据其协议与合格配置的可用性，选择付款或再投资。" }
    ]
  },
  finalCta: { title: "进入更平静的商务资本模型。", subtitle: "申请查看 OTIZ CAPITAL 配置访问、报告标准和运营文件。", cta: "成为投资人" },
  footer: { description: "OTIZ CAPITAL 是围绕电子产品配置、物流、市场报告和分配可见性的高端商务资本平台。", legal: "法律", about: "关于我们", reports: "报告", transparency: "透明度", contact: "联系", creators: "创作者合作", social: "社交", language: "语言", disclaimer: "私募机会可能受资格、司法辖区和协议条款限制。不保证收益。" },
  dashboard: {
    liveOps: "实时运营",
    trendLabel: "资本 / 规模趋势",
    trendRange: "8 个月",
    chartCapital: "活跃资本",
    chartVolume: "商务规模",
    monthlyValue: "月度"
  },
  commerce: {
    allocations: [
      { id: "OC-AL-1842", cycle: "Apple 设备", marketplace: "Amazon / eBay", capital: "$420K", status: "采购", progress: 46 },
      { id: "OC-AL-1818", cycle: "创作者套装", marketplace: "Walmart Marketplace", capital: "$310K", status: "运输中", progress: 68 },
      { id: "OC-AL-1796", cycle: "高端翻新", marketplace: "Back Market", capital: "$265K", status: "电商平台销售", progress: 82 }
    ],
    operations: [
      { time: "09:30", title: "批次已在新泽西仓库入库", detail: "146 台序列化平板电脑进入质检", state: "已核验" },
      { time: "11:45", title: "电商平台结算已入账", detail: "周期 OC-AL-1772 已转入报告收尾", state: "已结算" },
      { time: "14:20", title: "出库发货已放行", detail: "创作者套装库存已转入履约", state: "运输中" }
    ],
    proofSignals: ["发货影像", "仓库扫描", "电商平台对账单", "付款记录", "序列号核查"],
    chartMonths: ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月"]
  }
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

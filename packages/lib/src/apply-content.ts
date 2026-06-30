import { type Locale } from "./i18n";

export type ApplyDictionary = {
  meta: {
    title: string;
    description: string;
  };
  hero: {
    title: string;
    body: string;
    back: string;
    metrics: Array<{ label: string; value: string }>;
  };
  form: {
    title: string;
    subtitle: string;
    fullName: string;
    telegram: string;
    email: string;
    country: string;
    preferredContactMethod: string;
    plannedAllocationAmount: string;
    preferredDepositMethod: string;
    investorType: string;
    reinvestInterest: string;
    heardFrom: string;
    message: string;
    consent: string;
    submit: string;
    submitting: string;
    successTitle: string;
    successMessage: string;
    startAnother: string;
    validationRequired: string;
    validationEmail: string;
    validationMinimum: string;
    validationConsent: string;
  };
  options: {
    contact: Record<string, string>;
    deposit: Record<string, string>;
    investorType: Record<string, string>;
    reinvest: Record<string, string>;
  };
  sidebar: {
    title: string;
    subtitle: string;
    trustTitle: string;
    stepsTitle: string;
  };
  faq: {
    title: string;
    items: Array<{ question: string; answer: string }>;
  };
};

const base: ApplyDictionary = {
  meta: {
    title: "Apply to OTIZ CAPITAL",
    description: "Submit a reviewed investor application for real electronics commerce allocations."
  },
  hero: {
    title: "Apply to Otiz Capital",
    body: "Tell us how you want to participate in real electronics commerce allocations. Every application is manually reviewed before approval, KYC, agreement, and allocation access.",
    back: "Back to homepage",
    metrics: [
      { label: "Minimum allocation", value: "$5,000" },
      { label: "Approval", value: "Manual" },
      { label: "Reporting", value: "Monthly" },
      { label: "Withdrawal cooldown", value: "60 days" }
    ]
  },
  form: {
    title: "Investor application",
    subtitle: "This is a preliminary review form. A manager will contact you before any agreement or allocation is opened.",
    fullName: "Full name",
    telegram: "Telegram",
    email: "Email",
    country: "Country",
    preferredContactMethod: "Preferred contact method",
    plannedAllocationAmount: "Planned allocation amount",
    preferredDepositMethod: "Preferred deposit method",
    investorType: "Investor type",
    reinvestInterest: "Reinvest interest",
    heardFrom: "How did you hear about us?",
    message: "Message / notes",
    consent: "I confirm that the information is accurate and agree to be contacted by OTIZ CAPITAL for manual review.",
    submit: "Submit application",
    submitting: "Submitting...",
    successTitle: "Application received.",
    successMessage: "Application received. Our manager will contact you after review.",
    startAnother: "Submit another application",
    validationRequired: "Please complete all required fields.",
    validationEmail: "Please enter a valid email address.",
    validationMinimum: "Minimum planned allocation is $5,000.",
    validationConsent: "Please confirm consent before submitting."
  },
  options: {
    contact: { telegram: "Telegram", email: "Email" },
    deposit: { usdt: "USDT", btc: "BTC", cash: "Cash", bank_transfer: "Bank transfer" },
    investorType: { individual: "Individual", company: "Company" },
    reinvest: { yes: "Yes", no: "No", not_sure: "Not sure" }
  },
  sidebar: {
    title: "Reviewed access, not instant onboarding.",
    subtitle: "OTIZ CAPITAL keeps allocation access measured, documented, and tied to real operating cycles.",
    trustTitle: "Trust model",
    stepsTitle: "Application flow"
  },
  faq: {
    title: "Application FAQ",
    items: [
      { question: "What is the minimum capital?", answer: "The current minimum planned allocation is $5,000. Final eligibility depends on manual review and agreement terms." },
      { question: "How does approval work?", answer: "Applications are reviewed manually. If suitable, a manager will contact you for KYC, agreement review, and allocation availability." },
      { question: "How is reporting handled?", answer: "Approved investors receive monthly cycle reporting connected to commerce operations, marketplace activity, and proof records." },
      { question: "How do withdrawals work?", answer: "Withdrawal requests follow agreement terms and a 60-day cooldown. The model is not designed for instant speculative liquidity." },
      { question: "Can I reinvest?", answer: "Yes. Reinvestment can be selected after reporting and cycle close when eligible allocation capacity is available." }
    ]
  }
};

export const applyDictionaries: Record<Locale, ApplyDictionary> = {
  en: base,
  es: {
    ...base,
    meta: { title: "Solicitud para OTIZ CAPITAL", description: "Envía una solicitud revisada para asignaciones de comercio real de electrónica." },
    hero: {
      title: "Solicita acceso a Otiz Capital",
      body: "Cuéntanos cómo quieres participar en asignaciones de comercio real de electrónica. Cada solicitud se revisa manualmente antes de aprobación, KYC, acuerdo y acceso.",
      back: "Volver al inicio",
      metrics: [
        { label: "Asignación mínima", value: "$5,000" },
        { label: "Aprobación", value: "Manual" },
        { label: "Informes", value: "Mensual" },
        { label: "Cooldown de retiro", value: "60 días" }
      ]
    },
    form: {
      ...base.form,
      title: "Solicitud de inversor",
      subtitle: "Este es un formulario preliminar. Un manager te contactará antes de cualquier acuerdo o asignación.",
      fullName: "Nombre completo",
      country: "País",
      preferredContactMethod: "Método de contacto preferido",
      plannedAllocationAmount: "Monto de asignación previsto",
      preferredDepositMethod: "Método de depósito preferido",
      investorType: "Tipo de inversor",
      reinvestInterest: "Interés en reinvertir",
      heardFrom: "¿Cómo nos conociste?",
      message: "Mensaje / notas",
      consent: "Confirmo que la información es correcta y acepto ser contactado por OTIZ CAPITAL para revisión manual.",
      submit: "Enviar solicitud",
      submitting: "Enviando...",
      successTitle: "Solicitud recibida.",
      successMessage: "Application received. Our manager will contact you after review.",
      startAnother: "Enviar otra solicitud",
      validationRequired: "Completa todos los campos requeridos.",
      validationEmail: "Introduce un email válido.",
      validationMinimum: "La asignación mínima prevista es $5,000.",
      validationConsent: "Confirma el consentimiento antes de enviar."
    },
    sidebar: { title: "Acceso revisado, no onboarding instantáneo.", subtitle: "OTIZ CAPITAL mantiene el acceso medido, documentado y conectado a ciclos reales.", trustTitle: "Modelo de confianza", stepsTitle: "Flujo de solicitud" },
    faq: { ...base.faq, title: "FAQ de solicitud" }
  },
  de: {
    ...base,
    meta: { title: "Bewerbung bei OTIZ CAPITAL", description: "Reichen Sie eine geprüfte Investor-Anfrage fuer reale Elektronik-Commerce-Allokationen ein." },
    hero: {
      title: "Bei Otiz Capital bewerben",
      body: "Teilen Sie uns mit, wie Sie an realen Elektronik-Commerce-Allokationen teilnehmen möchten. Jede Anfrage wird manuell geprüft.",
      back: "Zur Startseite",
      metrics: [
        { label: "Mindestallokation", value: "$5,000" },
        { label: "Freigabe", value: "Manuell" },
        { label: "Reporting", value: "Monatlich" },
        { label: "Withdrawal Cooldown", value: "60 Tage" }
      ]
    },
    form: {
      ...base.form,
      title: "Investor-Anfrage",
      subtitle: "Dies ist ein Vorprüfungsformular. Ein Manager kontaktiert Sie vor Vertrag oder Allokation.",
      fullName: "Vollständiger Name",
      country: "Land",
      preferredContactMethod: "Bevorzugte Kontaktmethode",
      plannedAllocationAmount: "Geplanter Allokationsbetrag",
      preferredDepositMethod: "Bevorzugte Einzahlungsmethode",
      investorType: "Investorentyp",
      reinvestInterest: "Interesse an Reinvestition",
      heardFrom: "Wie haben Sie von uns erfahren?",
      message: "Nachricht / Notizen",
      consent: "Ich bestätige die Richtigkeit der Angaben und stimme der Kontaktaufnahme durch OTIZ CAPITAL zur manuellen Prüfung zu.",
      submit: "Anfrage senden",
      submitting: "Wird gesendet...",
      successTitle: "Anfrage erhalten.",
      successMessage: "Application received. Our manager will contact you after review.",
      startAnother: "Weitere Anfrage senden",
      validationRequired: "Bitte füllen Sie alle Pflichtfelder aus.",
      validationEmail: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
      validationMinimum: "Die Mindestallokation beträgt $5,000.",
      validationConsent: "Bitte bestätigen Sie die Zustimmung vor dem Absenden."
    },
    sidebar: { title: "Geprüfter Zugang, kein Instant-Onboarding.", subtitle: "OTIZ CAPITAL hält Allokationszugang gemessen, dokumentiert und an reale Zyklen gebunden.", trustTitle: "Vertrauensmodell", stepsTitle: "Bewerbungsablauf" },
    faq: { ...base.faq, title: "Bewerbungs-FAQ" }
  },
  ru: {
    ...base,
    meta: { title: "Заявка в OTIZ CAPITAL", description: "Отправьте заявку на участие в реальных аллокациях торговли электроникой." },
    hero: {
      title: "Подать заявку в Otiz Capital",
      body: "Расскажите, как вы хотите участвовать в реальных коммерческих аллокациях электроники. Каждая заявка проходит ручную проверку до одобрения, KYC, соглашения и доступа к аллокациям.",
      back: "На главную",
      metrics: [
        { label: "Минимальная аллокация", value: "$5,000" },
        { label: "Одобрение", value: "Ручное" },
        { label: "Отчётность", value: "Ежемесячно" },
        { label: "Cooldown вывода", value: "60 дней" }
      ]
    },
    form: {
      ...base.form,
      title: "Заявка инвестора",
      subtitle: "Это предварительная форма. Менеджер свяжется с вами до открытия соглашения или аллокации.",
      fullName: "Полное имя",
      telegram: "Telegram",
      email: "Email",
      country: "Страна",
      preferredContactMethod: "Предпочтительный способ связи",
      plannedAllocationAmount: "Планируемая сумма аллокации",
      preferredDepositMethod: "Предпочтительный метод депозита",
      investorType: "Тип инвестора",
      reinvestInterest: "Интерес к реинвесту",
      heardFrom: "Как вы узнали о нас?",
      message: "Сообщение / заметки",
      consent: "Я подтверждаю корректность информации и согласен на контакт от OTIZ CAPITAL для ручной проверки.",
      submit: "Отправить заявку",
      submitting: "Отправка...",
      successTitle: "Заявка получена.",
      successMessage: "Application received. Our manager will contact you after review.",
      startAnother: "Отправить ещё одну заявку",
      validationRequired: "Пожалуйста, заполните все обязательные поля.",
      validationEmail: "Введите корректный email.",
      validationMinimum: "Минимальная планируемая аллокация — $5,000.",
      validationConsent: "Подтвердите согласие перед отправкой."
    },
    sidebar: { title: "Проверенный доступ, не мгновенный onboarding.", subtitle: "OTIZ CAPITAL держит доступ к аллокациям измеримым, документированным и привязанным к реальным операционным циклам.", trustTitle: "Модель доверия", stepsTitle: "Путь заявки" },
    faq: { ...base.faq, title: "FAQ по заявке" }
  },
  zh: {
    ...base,
    meta: { title: "申请 OTIZ CAPITAL", description: "提交真实电子商务配置的投资人审核申请。" },
    hero: {
      title: "申请 Otiz Capital",
      body: "告诉我们你希望如何参与真实电子商务配置。每份申请都会在批准、KYC、协议和配置开放前进行人工审核。",
      back: "返回首页",
      metrics: [
        { label: "最低配置", value: "$5,000" },
        { label: "批准", value: "人工" },
        { label: "报告", value: "每月" },
        { label: "提款冷却期", value: "60 天" }
      ]
    },
    form: {
      ...base.form,
      title: "投资人申请",
      subtitle: "这是初步审核表。任何协议或配置开放前，经理会先与你联系。",
      fullName: "姓名",
      country: "国家",
      preferredContactMethod: "首选联系方式",
      plannedAllocationAmount: "计划配置金额",
      preferredDepositMethod: "首选入金方式",
      investorType: "投资人类型",
      reinvestInterest: "是否有再投资兴趣",
      heardFrom: "你如何知道我们？",
      message: "信息 / 备注",
      consent: "我确认信息准确，并同意 OTIZ CAPITAL 为人工审核联系我。",
      submit: "提交申请",
      submitting: "提交中...",
      successTitle: "申请已收到。",
      successMessage: "Application received. Our manager will contact you after review.",
      startAnother: "提交另一份申请",
      validationRequired: "请填写所有必填字段。",
      validationEmail: "请输入有效的邮箱地址。",
      validationMinimum: "最低计划配置为 $5,000。",
      validationConsent: "提交前请确认同意。"
    },
    sidebar: { title: "审核式准入，而非即时开户。", subtitle: "OTIZ CAPITAL 保持配置准入有节制、有文件记录，并连接到真实运营周期。", trustTitle: "信任模型", stepsTitle: "申请流程" },
    faq: { ...base.faq, title: "申请 FAQ" }
  }
};

export function getApplyDictionary(locale: Locale) {
  return applyDictionaries[locale];
}

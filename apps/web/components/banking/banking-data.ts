export type BankOption = {
  id: string;
  name: string;
  monthlyCost: string;
  transferCost: string;
  note: string;
};

export type ScenarioOption = {
  id: string;
  title: string;
  description: string;
};

export type PeriodOption = {
  id: string;
  label: string;
  description: string;
};

export type OperationItem = {
  title: string;
  counterparty: string;
  amount: string;
  fee: string;
  tone: "income" | "expense" | "neutral";
};

export type FeeItem = {
  label: string;
  value: string;
};

export type InsightItem = {
  title: string;
  body: string;
};

export const icpItems = [
  "ИП перед регистрацией",
  "микробизнес в первые месяцы работы",
  "предприниматель без финансового директора",
  "бизнес, который уже платит комиссии, но не понимает их реальную структуру"
];

export const painItems = [
  "скрытые комиссии",
  "непонятная стоимость платежей",
  "риск блокировок",
  "неудобные операции",
  "сложность сравнения тарифов",
  "непонимание, какой банк выгоднее именно под сценарий бизнеса"
];

export const conceptItems = [
  "виртуальный счёт",
  "операции",
  "платежи контрагентам",
  "комиссии",
  "предупреждения о рисках",
  "сравнение банков",
  "переключение банка в один клик"
];

export const scenarioItems = [
  {
    title: "Открыть ИП / ООО",
    body: "Проверить, как банк ведёт себя в первые дни до первых регулярных поступлений."
  },
  {
    title: "Принять первый платёж",
    body: "Посмотреть зачисление, срок доступности денег и возможную комиссию."
  },
  {
    title: "Оплатить контрагента",
    body: "Смоделировать платёж поставщику и увидеть цену операции."
  },
  {
    title: "Вывести деньги",
    body: "Оценить стоимость вывода и подсказки по безопасному назначению."
  },
  {
    title: "Заплатить налоги",
    body: "Понять, какие действия стоит держать в календаре и где появляются риски."
  },
  {
    title: "Проверить комиссии",
    body: "Собрать еженедельную стоимость обслуживания без чтения сложных тарифов."
  },
  {
    title: "Сравнить банк А и банк Б",
    body: "Переключить банк и увидеть, где меняются комиссии, лимиты и предупреждения."
  },
  {
    title: "Выбрать банк перед стартом",
    body: "Сделать выбор на основе сценария бизнеса, а не рекламного обещания."
  }
];

export const bankOptions: BankOption[] = [
  {
    id: "bank-a",
    name: "Банк А",
    monthlyCost: "0 ₽ за период",
    transferCost: "49 ₽ за платёж",
    note: "ниже цена платежей, больше подсказок по рискам"
  },
  {
    id: "bank-b",
    name: "Банк Б",
    monthlyCost: "790 ₽ за период",
    transferCost: "0 ₽ до лимита",
    note: "выгоднее при частых переводах поставщикам"
  },
  {
    id: "bank-c",
    name: "Банк В",
    monthlyCost: "1 490 ₽ за период",
    transferCost: "0 ₽ внутри пакета",
    note: "дороже на старте, спокойнее при росте оборота"
  }
];

export const scenarioOptions: ScenarioOption[] = [
  {
    id: "first-month",
    title: "Первый месяц услуг",
    description: "Поступления от клиентов, два поставщика, вывод дохода"
  },
  {
    id: "registration",
    title: "Регистрация ИП",
    description: "Первые платежи, налоги, проверка лимитов"
  },
  {
    id: "trade",
    title: "Небольшая торговля",
    description: "Частые закупки, эквайринг, больше платёжных поручений"
  }
];

export const periodOptions: PeriodOption[] = [
  {
    id: "week",
    label: "7 дней",
    description: "быстро увидеть слабые места"
  },
  {
    id: "month",
    label: "30 дней",
    description: "понять реальную стоимость месяца"
  },
  {
    id: "quarter",
    label: "квартал",
    description: "оценить влияние регулярных операций"
  }
];

export const accountOperations: OperationItem[] = [
  {
    title: "Входящий платёж от клиента",
    counterparty: "ООО «Северный проект»",
    amount: "+120 000 ₽",
    fee: "0 ₽",
    tone: "income"
  },
  {
    title: "Платёж поставщику",
    counterparty: "ИП Смирнов",
    amount: "-46 000 ₽",
    fee: "49 ₽",
    tone: "expense"
  },
  {
    title: "Вывод на личную карту",
    counterparty: "Личный счёт предпринимателя",
    amount: "-35 000 ₽",
    fee: "350 ₽",
    tone: "expense"
  }
];

export const feeItems: FeeItem[] = [
  { label: "Платежи контрагентам", value: "49 ₽" },
  { label: "Вывод средств", value: "350 ₽" },
  { label: "Обслуживание", value: "0 ₽" }
];

export const insightItems: InsightItem[] = [
  {
    title: "Подсказка",
    body: "Разделите вывод дохода и оплату поставщиков по назначению платежа. Так сценарий выглядит понятнее для банка."
  },
  {
    title: "Сравнение",
    body: "Если выбрать Банк Б, платежи поставщикам станут дешевле, но фиксированная стоимость периода вырастет."
  },
  {
    title: "Рекомендация",
    body: "Для первого месяца услуг Банк А выглядит спокойнее: ниже обязательная стоимость и достаточно подсказок по рискам."
  }
];

export const riskNotes = [
  "Частый вывод средств сразу после поступления может потребовать пояснения.",
  "Один крупный платёж новому поставщику лучше сопровождать понятным назначением.",
  "При росте числа переводов стоит заново сравнить пакет обслуживания."
];

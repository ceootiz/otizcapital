import type { Metadata } from "next";
import {
  BankComparisonPreview,
  DemoAccountPreview,
  PrimaryAction,
  ProductShell,
  ScenarioCard,
  SecondaryAction,
  SectionHeader,
  SoftCard
} from "@/components/banking/banking-components";
import { conceptItems, icpItems, painItems, scenarioItems } from "@/components/banking/banking-data";

export const metadata: Metadata = {
  title: "Финансовый навигатор для микробизнеса",
  description:
    "Демо-кабинет для проверки реальной стоимости банка, комиссий, рисков и операций до открытия счёта."
};

export default function BankingPage() {
  return (
    <ProductShell>
      <main>
        <section className="px-5 pb-12 pt-28 sm:px-8 lg:px-10">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:min-h-[440px] lg:grid-cols-[0.95fr_1.05fr]">
            <div className="max-w-3xl">
              <h1 className="text-5xl font-semibold leading-[1.02] text-[#28231d] sm:text-6xl lg:text-7xl">
                Финансовый навигатор для микробизнеса
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-[#746d62] sm:text-xl sm:leading-9">
                Попробуйте банк в демо-кабинете до открытия счёта или проверьте, сколько ваш текущий банк реально стоит бизнесу.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <PrimaryAction href="/banking/demo">Открыть демо-кабинет</PrimaryAction>
                <SecondaryAction href="#comparison">Сравнить банки</SecondaryAction>
              </div>
            </div>

            <div className="hidden lg:block lg:pl-4">
              <DemoAccountPreview compact />
            </div>
          </div>
        </section>

        <section id="fit" className="border-y border-[#e4d7c4] bg-[#fbf6ed] px-5 py-20 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <SectionHeader title="Кому подходит" />
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {icpItems.map((item) => (
                <SoftCard key={item} className="p-5" as="article">
                  <p className="text-lg font-semibold leading-7 text-[#28231d]">{item}</p>
                </SoftCard>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-20 sm:px-8 lg:px-10">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <SectionHeader
              title="Банк выбирают по рекламе, а реальную стоимость узнают уже после ошибок."
              body="Тарифы выглядят просто, пока предприниматель не начинает совершать реальные операции: получать деньги, платить поставщикам, выводить доход и отвечать на вопросы банка."
            />
            <div className="grid gap-3 sm:grid-cols-2">
              {painItems.map((item) => (
                <div key={item} className="rounded-lg border border-[#ded2c1] bg-[#fffaf2] p-5">
                  <p className="text-base font-semibold text-[#28231d]">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="concept" className="bg-[#f3eadf] px-5 py-20 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
              <SectionHeader
                title="Не читайте тарифы. Проживите неделю работы бизнеса в каждом банке."
                body="Демо-кабинет показывает банк через действия предпринимателя: что происходит со счётом, где появляются комиссии и какие решения повышают риск."
              />
              <SoftCard className="p-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  {conceptItems.map((item) => (
                    <div key={item} className="rounded-md border border-[#e1d4c2] bg-[#fffdf8] p-4">
                      <p className="text-sm font-semibold text-[#4c4033]">{item}</p>
                    </div>
                  ))}
                </div>
              </SoftCard>
            </div>
          </div>
        </section>

        <section className="px-5 py-20 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <SectionHeader
              title="Сценарии для решения перед стартом"
              body="Пользователь не сравнивает абстрактные пакеты. Он смотрит, как банк поведёт себя в понятной неделе бизнеса."
            />
            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {scenarioItems.map((scenario) => (
                <ScenarioCard key={scenario.title} title={scenario.title} body={scenario.body} />
              ))}
            </div>
          </div>
        </section>

        <section id="comparison" className="border-y border-[#e4d7c4] bg-[#fbf6ed] px-5 py-20 sm:px-8 lg:px-10">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <SectionHeader
              title="Не каталог банков. Симулятор финансовой реальности бизнеса."
              body="Банки.ру помогает читать и сравнивать предложения. Финансовый навигатор помогает попробовать работу бизнеса в банке до открытия счёта."
            />
            <BankComparisonPreview />
          </div>
        </section>

        <section className="px-5 py-20 sm:px-8 lg:px-10">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <SectionHeader
              title="Первый вид демо-кабинета"
              body="Структура уже разделена на выбранный банк, виртуальный счёт, операции, комиссии, предупреждение и блок смены банка."
            />
            <DemoAccountPreview />
          </div>
        </section>
      </main>
    </ProductShell>
  );
}

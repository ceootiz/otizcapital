import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  CircleAlert,
  Lightbulb,
  RefreshCw,
  ShieldAlert
} from "lucide-react";
import { cn } from "@otiz/lib";
import {
  accountOperations,
  bankOptions,
  feeItems,
  insightItems,
  periodOptions,
  riskNotes,
  scenarioOptions,
  type OperationItem
} from "./banking-data";

const pageBackground =
  "bg-[linear-gradient(180deg,#f7f1e7_0%,#fffaf2_42%,#f5eee3_100%)]";
const textColor = "text-[#28231d]";
const mutedText = "text-[#746d62]";

export function ProductShell({
  children,
  active = "home"
}: {
  children: ReactNode;
  active?: "home" | "cabinet";
}) {
  return (
    <div lang="ru" className={cn("min-h-screen overflow-hidden", pageBackground, textColor)}>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[#e5d8c4] bg-[#fbf6ed]">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-5 px-5 sm:px-8 lg:px-10">
          <Link href="/banking" className="flex items-center gap-3" aria-label="Финансовый навигатор">
            <span className="flex size-9 items-center justify-center rounded-md border border-[#c9b899] bg-[#efe1c9] text-sm font-semibold text-[#5c4326]">
              ФН
            </span>
            <span className="text-sm font-semibold text-[#28231d]">Финансовый навигатор</span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-[#6f675d] lg:flex" aria-label="Навигация">
            <Link href="/banking#fit" className="transition-colors hover:text-[#28231d]">
              Кому подходит
            </Link>
            <Link href="/banking#concept" className="transition-colors hover:text-[#28231d]">
              Как работает
            </Link>
            <Link href="/banking#comparison" className="transition-colors hover:text-[#28231d]">
              Сравнение
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            {active === "cabinet" ? (
              <SecondaryAction href="/banking">К странице продукта</SecondaryAction>
            ) : (
              <PrimaryAction href="/banking/demo">Открыть демо-кабинет</PrimaryAction>
            )}
          </div>
        </div>
      </header>
      {children}
      <footer className="border-t border-[#e1d4c2] px-5 py-10 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm text-[#746d62] md:flex-row md:items-center md:justify-between">
          <p>Финансовый навигатор для микробизнеса</p>
          <p>Спокойное сравнение банков под реальный сценарий бизнеса.</p>
        </div>
      </footer>
    </div>
  );
}

export function SoftCard({
  children,
  className,
  as: Component = "div"
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "article" | "aside" | "section";
}) {
  return (
    <Component
      className={cn(
        "rounded-lg border border-[#ddd0bd] bg-[#fffaf2] shadow-[0_24px_80px_-58px_rgba(82,63,37,0.68)]",
        className
      )}
    >
      {children}
    </Component>
  );
}

export function SectionHeader({
  title,
  body,
  align = "left"
}: {
  title: string;
  body?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center")}>
      <h2 className="text-3xl font-semibold leading-tight text-[#28231d] sm:text-4xl">{title}</h2>
      {body ? <p className={cn("mt-5 text-base leading-8 sm:text-lg", mutedText)}>{body}</p> : null}
    </div>
  );
}

export function PrimaryAction({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#8f642f] px-5 py-3 text-sm font-semibold text-[#fffaf2] shadow-[0_16px_36px_-26px_rgba(98,63,24,0.85)] transition hover:bg-[#765126] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8f642f]"
    >
      {children}
      <ArrowRight className="size-4" aria-hidden="true" />
    </Link>
  );
}

export function SecondaryAction({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#cdbd9f] bg-[#fffaf2] px-5 py-3 text-sm font-semibold text-[#4c4033] transition hover:border-[#a98455] hover:text-[#28231d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8f642f]"
    >
      {children}
    </Link>
  );
}

export function ScenarioCard({ title, body }: { title: string; body: string }) {
  return (
    <article className="rounded-lg border border-[#ded2c1] bg-[#fffaf2] p-5">
      <h3 className="text-base font-semibold text-[#28231d]">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-[#746d62]">{body}</p>
    </article>
  );
}

export function RiskNote({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-lg border border-[#e0c19a] bg-[#fbefd9] p-4 text-sm leading-6 text-[#654317]",
        className
      )}
    >
      <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}

export function InsightBlock({
  title,
  children,
  className
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border border-[#ddd0bd] bg-[#fffaf2] p-5", className)}>
      <div className="flex items-center gap-2 text-sm font-semibold text-[#4b3c2a]">
        <Lightbulb className="size-4" aria-hidden="true" />
        {title}
      </div>
      <p className="mt-3 text-sm leading-7 text-[#746d62]">{children}</p>
    </div>
  );
}

export function BankComparisonPreview({ className }: { className?: string }) {
  return (
    <SoftCard className={cn("p-5", className)}>
      <div className="flex items-start justify-between gap-5">
        <div>
          <h3 className="text-lg font-semibold text-[#28231d]">Если сменить банк</h3>
          <p className="mt-2 text-sm leading-6 text-[#746d62]">
            Та же неделя работы бизнеса в другом банке меняет стоимость и характер рисков.
          </p>
        </div>
        <RefreshCw className="size-5 shrink-0 text-[#8f642f]" aria-hidden="true" />
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-md border border-[#e1d4c2] bg-[#fbf4e8] p-4">
          <p className="text-xs font-semibold text-[#746d62]">Банк А</p>
          <p className="mt-2 text-2xl font-semibold text-[#28231d]">399 ₽</p>
          <p className="mt-2 text-xs leading-5 text-[#746d62]">меньше обязательная стоимость</p>
        </div>
        <div className="rounded-md border border-[#d8c2a5] bg-[#f3e5cf] p-4">
          <p className="text-xs font-semibold text-[#746d62]">Банк Б</p>
          <p className="mt-2 text-2xl font-semibold text-[#28231d]">790 ₽</p>
          <p className="mt-2 text-xs leading-5 text-[#746d62]">лучше при частых платежах</p>
        </div>
      </div>
    </SoftCard>
  );
}

export function DemoAccountPreview({
  className,
  showHeading = true,
  compact = false
}: {
  className?: string;
  showHeading?: boolean;
  compact?: boolean;
}) {
  const shownOperations = compact ? accountOperations.slice(0, 2) : accountOperations;

  return (
    <SoftCard className={cn("overflow-hidden", className)}>
      {showHeading ? (
        <div className={cn("border-b border-[#e4d7c4] px-5 sm:px-6", compact ? "py-3" : "py-4")}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#746d62]">Выбранный банк</p>
              <h3 className="mt-1 text-xl font-semibold text-[#28231d]">Банк А</h3>
            </div>
            <div className="rounded-md border border-[#d7c6aa] bg-[#f6ead8] px-4 py-2 text-sm font-semibold text-[#654317]">
              Комиссия за период: 399 ₽
            </div>
          </div>
        </div>
      ) : null}
      <div className={cn("p-5 sm:p-6", compact && "sm:p-5")}>
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-start">
          <div>
            <p className="text-sm font-semibold text-[#746d62]">Виртуальный счёт</p>
            <p className={cn("mt-2 font-semibold text-[#28231d]", compact ? "text-3xl" : "text-4xl")}>39 601 ₽</p>
            <p className="mt-2 text-sm text-[#746d62]">после операций первой недели</p>
          </div>
          <div className={cn("rounded-md border border-[#d9c9ad] bg-[#fbf4e8] text-sm text-[#4c4033]", compact ? "p-3" : "p-4")}>
            <p className="font-semibold">Итог обслуживания</p>
            <p className={cn("mt-2 font-semibold text-[#8f642f]", compact ? "text-xl" : "text-2xl")}>399 ₽</p>
          </div>
        </div>

        <div className={cn(compact ? "mt-5" : "mt-6")}>
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="font-semibold text-[#28231d]">Операции</span>
            <span className="text-[#746d62]">{compact ? "2 из 3" : "3 действия"}</span>
          </div>
          <div className="divide-y divide-[#e7dac8] rounded-md border border-[#e1d4c2] bg-[#fffdf8]">
            {shownOperations.map((operation) => (
              <OperationRow key={operation.title} operation={operation} />
            ))}
          </div>
        </div>

        {compact ? null : (
          <RiskNote className="mt-5">
            Предупреждение: частый вывод средств сразу после поступления может потребовать пояснения.
          </RiskNote>
        )}
      </div>
    </SoftCard>
  );
}

function OperationRow({ operation }: { operation: OperationItem }) {
  return (
    <div className="grid gap-3 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
      <div>
        <p className="text-sm font-semibold text-[#28231d]">{operation.title}</p>
        <p className="mt-1 text-xs leading-5 text-[#746d62]">{operation.counterparty}</p>
      </div>
      <p
        className={cn(
          "text-sm font-semibold",
          operation.tone === "income" ? "text-[#52724c]" : "text-[#28231d]"
        )}
      >
        {operation.amount}
      </p>
      <p className="text-xs text-[#746d62]">комиссия {operation.fee}</p>
    </div>
  );
}

export function DemoCabinetSkeleton() {
  return (
    <main className="px-5 pb-16 pt-28 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 max-w-3xl">
          <h1 className="text-4xl font-semibold leading-tight text-[#28231d] sm:text-5xl">
            Демо-кабинет финансового навигатора
          </h1>
          <p className="mt-5 text-lg leading-8 text-[#746d62]">
            Выберите банк, сценарий и период, чтобы увидеть операции, комиссии, риски и рекомендацию в одном спокойном финансовом разборе.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)_320px] lg:items-start">
          <aside className="grid gap-5">
            <ControlPanel title="Выбор банка">
              <div className="grid gap-3">
                {bankOptions.map((bank, index) => (
                  <ControlOption key={bank.id} active={index === 0} title={bank.name} meta={bank.note} />
                ))}
              </div>
            </ControlPanel>

            <ControlPanel title="Сценарий бизнеса">
              <div className="grid gap-3">
                {scenarioOptions.map((scenario, index) => (
                  <ControlOption
                    key={scenario.id}
                    active={index === 0}
                    title={scenario.title}
                    meta={scenario.description}
                  />
                ))}
              </div>
            </ControlPanel>

            <ControlPanel title="Период симуляции">
              <div className="grid gap-3">
                {periodOptions.map((period, index) => (
                  <ControlOption key={period.id} active={index === 0} title={period.label} meta={period.description} />
                ))}
              </div>
            </ControlPanel>
          </aside>

          <section className="grid gap-5" aria-label="Виртуальный счёт и операции">
            <SoftCard className="p-5 sm:p-6">
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#746d62]">Виртуальный счёт</p>
                  <h2 className="mt-2 text-4xl font-semibold text-[#28231d]">39 601 ₽</h2>
                  <p className="mt-3 max-w-xl text-sm leading-7 text-[#746d62]">
                    Остаток после входящего платежа, оплаты поставщика и вывода дохода предпринимателя.
                  </p>
                </div>
                <div className="rounded-md border border-[#d8c2a5] bg-[#f3e5cf] p-4">
                  <p className="text-sm font-semibold text-[#654317]">Итоговая стоимость обслуживания</p>
                  <p className="mt-2 text-3xl font-semibold text-[#28231d]">399 ₽</p>
                </div>
              </div>
            </SoftCard>

            <SoftCard className="overflow-hidden">
              <div className="border-b border-[#e4d7c4] px-5 py-4 sm:px-6">
                <h2 className="text-xl font-semibold text-[#28231d]">Операции и платежи</h2>
              </div>
              <div className="divide-y divide-[#e7dac8] bg-[#fffdf8]">
                {accountOperations.map((operation) => (
                  <OperationRow key={operation.title} operation={operation} />
                ))}
              </div>
            </SoftCard>

            <SoftCard className="p-5 sm:p-6">
              <h2 className="text-xl font-semibold text-[#28231d]">Комиссии</h2>
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {feeItems.map((item) => (
                  <div key={item.label} className="rounded-md border border-[#e1d4c2] bg-[#fffdf8] p-4">
                    <p className="text-sm leading-6 text-[#746d62]">{item.label}</p>
                    <p className="mt-3 text-2xl font-semibold text-[#28231d]">{item.value}</p>
                  </div>
                ))}
              </div>
            </SoftCard>
          </section>

          <aside className="grid gap-5">
            {insightItems.map((item) => (
              <InsightBlock key={item.title} title={item.title}>
                {item.body}
              </InsightBlock>
            ))}

            <SoftCard className="p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#4b3c2a]">
                <CircleAlert className="size-4" aria-hidden="true" />
                Риски
              </div>
              <div className="mt-4 grid gap-3">
                {riskNotes.map((note) => (
                  <p key={note} className="rounded-md border border-[#e5d3ba] bg-[#fbf4e8] p-3 text-sm leading-6 text-[#654317]">
                    {note}
                  </p>
                ))}
              </div>
            </SoftCard>

            <BankComparisonPreview />
          </aside>
        </div>
      </div>
    </main>
  );
}

function ControlPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <SoftCard className="p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-[#28231d]">{title}</h2>
        <ChevronDown className="size-4 text-[#8f642f]" aria-hidden="true" />
      </div>
      {children}
    </SoftCard>
  );
}

function ControlOption({
  active,
  title,
  meta
}: {
  active?: boolean;
  title: string;
  meta: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "w-full rounded-md border p-3 text-left transition",
        active
          ? "border-[#b7905e] bg-[#f3e5cf] text-[#28231d]"
          : "border-[#e2d5c2] bg-[#fffdf8] text-[#4c4033] hover:border-[#c8b391]"
      )}
    >
      <span className="block text-sm font-semibold">{title}</span>
      <span className="mt-1 block text-xs leading-5 text-[#746d62]">{meta}</span>
    </button>
  );
}

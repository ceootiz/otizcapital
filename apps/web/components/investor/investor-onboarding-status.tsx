import Link from "next/link";
import { CheckCircle2, Circle, ExternalLink } from "lucide-react";
import type { InvestorOnboardingStatus, InvestorOnboardingStepKey } from "@otiz/database";
import type { Locale } from "@otiz/lib";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@otiz/ui";

const COPY: Record<Locale, {
  title: string;
  description: string;
  progress: (done: number, total: number) => string;
  complete: string;
  next: string;
  open: string;
  steps: Record<InvestorOnboardingStepKey, string>;
}> = {
  en: {
    title: "Getting started",
    description: "Your completed steps and the next action for putting capital to work.",
    progress: (done, total) => `${done} of ${total} complete`,
    complete: "All setup steps are complete.",
    next: "Next step",
    open: "Open",
    steps: { application: "Application received", approval: "Account approved", agreement: "Agreement signed", deposit: "Deposit confirmed", allocation: "First deal started", report: "First report published" }
  },
  ru: {
    title: "Начало работы",
    description: "Завершённые этапы и следующее действие для запуска капитала в работу.",
    progress: (done, total) => `Выполнено ${done} из ${total}`,
    complete: "Все этапы начала работы завершены.",
    next: "Следующий шаг",
    open: "Открыть",
    steps: { application: "Заявка получена", approval: "Аккаунт одобрен", agreement: "Соглашение подписано", deposit: "Пополнение подтверждено", allocation: "Первая сделка начата", report: "Первый отчёт опубликован" }
  },
  de: {
    title: "Erste Schritte",
    description: "Abgeschlossene Schritte und die nächste Aktion, damit Ihr Kapital eingesetzt werden kann.",
    progress: (done, total) => `${done} von ${total} abgeschlossen`,
    complete: "Alle Einrichtungsschritte sind abgeschlossen.",
    next: "Nächster Schritt",
    open: "Öffnen",
    steps: { application: "Antrag eingegangen", approval: "Konto genehmigt", agreement: "Vereinbarung unterzeichnet", deposit: "Einzahlung bestätigt", allocation: "Erstes Geschäft gestartet", report: "Erster Bericht veröffentlicht" }
  },
  es: {
    title: "Primeros pasos",
    description: "Pasos completados y la siguiente acción para poner el capital a trabajar.",
    progress: (done, total) => `${done} de ${total} completados`,
    complete: "Todos los pasos iniciales están completos.",
    next: "Siguiente paso",
    open: "Abrir",
    steps: { application: "Solicitud recibida", approval: "Cuenta aprobada", agreement: "Acuerdo firmado", deposit: "Depósito confirmado", allocation: "Primera operación iniciada", report: "Primer informe publicado" }
  },
  zh: {
    title: "开始使用",
    description: "查看已完成步骤以及资金开始运作前的下一项操作。",
    progress: (done, total) => `已完成 ${done}/${total}`,
    complete: "所有初始步骤均已完成。",
    next: "下一步",
    open: "打开",
    steps: { application: "申请已收到", approval: "账户已批准", agreement: "协议已签署", deposit: "入金已确认", allocation: "首笔交易已开始", report: "首份报告已发布" }
  }
};

const STEP_ROUTES: Partial<Record<InvestorOnboardingStepKey, string>> = {
  agreement: "documents",
  deposit: "deposit",
  allocation: "allocations",
  report: "reports"
};

export function InvestorOnboardingStatusCard({ locale, status }: { locale: Locale; status: InvestorOnboardingStatus }) {
  const t = COPY[locale];
  const nextRoute = status.nextStep ? STEP_ROUTES[status.nextStep] : null;
  const progress = Math.round((status.completedSteps / status.totalSteps) * 100);

  return (
    <Card className="overflow-hidden border-gold-200/20">
      <CardHeader className="gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>{t.title}</CardTitle>
            <CardDescription className="mt-2 max-w-2xl">{t.description}</CardDescription>
          </div>
          <Badge variant="secondary" className="w-fit">{t.progress(status.completedSteps, status.totalSteps)}</Badge>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted" aria-label={t.progress(status.completedSteps, status.totalSteps)}>
          <div className="h-full rounded-full bg-gold-300 transition-[width]" style={{ width: `${progress}%` }} />
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {status.steps.map((step) => (
            <div key={step.key} className={`flex min-w-0 items-center gap-3 rounded-2xl border p-3 ${step.complete ? "border-emerald-500/20 bg-emerald-500/5" : "border-border bg-muted/30 dark:border-white/10 dark:bg-black/20"}`}>
              {step.complete ? <CheckCircle2 className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" /> : <Circle className="size-5 shrink-0 text-muted-foreground" />}
              <span className="text-sm font-medium leading-5 text-foreground">{t.steps[step.key]}</span>
            </div>
          ))}
        </div>
        {status.nextStep ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-gold-200/20 bg-gold-300/10 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t.next}</p>
              <p className="mt-1 font-medium text-foreground">{t.steps[status.nextStep]}</p>
            </div>
            {nextRoute ? <Button asChild size="sm"><Link href={`/${locale}/investor/${nextRoute}`}>{t.open}<ExternalLink className="ml-2 size-4" /></Link></Button> : null}
          </div>
        ) : <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{t.complete}</p>}
      </CardContent>
    </Card>
  );
}

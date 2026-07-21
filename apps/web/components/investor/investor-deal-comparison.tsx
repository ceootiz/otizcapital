"use client";

import { useMemo, useState } from "react";
import type { InvestorDashboardAllocation } from "@otiz/database";
import type { Locale } from "@otiz/lib";
import { Badge, Card, CardContent } from "@otiz/ui";

const COPY = {
  en: { title: "Compare deals", description: "Select up to three of your deals.", select: "Choose deals", max: "You can compare up to three deals.", empty: "At least two deals are needed for comparison.", capital: "Capital", result: "Result", expected: "Expected", roi: "ROI", duration: "Duration", days: "days", payout: "Payout", stages: { funding: "Funding", purchasing: "Purchased", shipping: "Logistics", warehouse: "Received", selling: "Selling", completed: "Completed", paid_out: "Paid", loss: "Loss" }, payouts: { NOT_READY: "Not ready", PENDING: "Pending", APPROVED: "Approved", SCHEDULED: "Scheduled", PAID: "Paid", REINVESTED: "Reinvested", REJECTED: "Rejected" } },
  ru: { title: "Сравнить сделки", description: "Выберите до трёх своих сделок.", select: "Выберите сделки", max: "Можно сравнить не более трёх сделок.", empty: "Для сравнения нужны как минимум две сделки.", capital: "Капитал", result: "Результат", expected: "Ожидаемый", roi: "ROI", duration: "Срок", days: "дн.", payout: "Выплата", stages: { funding: "Финансирование", purchasing: "Закупка", shipping: "Логистика", warehouse: "Получено", selling: "Продажа", completed: "Завершена", paid_out: "Выплачено", loss: "Убыток" }, payouts: { NOT_READY: "Не готова", PENDING: "Ожидает", APPROVED: "Одобрена", SCHEDULED: "Запланирована", PAID: "Выплачена", REINVESTED: "Реинвестировано", REJECTED: "Отклонена" } },
  de: { title: "Geschäfte vergleichen", description: "Wählen Sie bis zu drei Ihrer Geschäfte aus.", select: "Geschäfte auswählen", max: "Sie können bis zu drei Geschäfte vergleichen.", empty: "Für einen Vergleich sind mindestens zwei Geschäfte erforderlich.", capital: "Kapital", result: "Ergebnis", expected: "Erwartet", roi: "ROI", duration: "Dauer", days: "Tage", payout: "Auszahlung", stages: { funding: "Finanzierung", purchasing: "Einkauf", shipping: "Logistik", warehouse: "Eingang", selling: "Verkauf", completed: "Abgeschlossen", paid_out: "Ausgezahlt", loss: "Verlust" }, payouts: { NOT_READY: "Nicht bereit", PENDING: "Ausstehend", APPROVED: "Genehmigt", SCHEDULED: "Geplant", PAID: "Ausgezahlt", REINVESTED: "Reinvestiert", REJECTED: "Abgelehnt" } },
  es: { title: "Comparar operaciones", description: "Seleccione hasta tres de sus operaciones.", select: "Elegir operaciones", max: "Puede comparar hasta tres operaciones.", empty: "Se necesitan al menos dos operaciones para comparar.", capital: "Capital", result: "Resultado", expected: "Esperado", roi: "ROI", duration: "Duración", days: "días", payout: "Pago", stages: { funding: "Financiación", purchasing: "Compra", shipping: "Logística", warehouse: "Recibido", selling: "Venta", completed: "Completada", paid_out: "Pagada", loss: "Pérdida" }, payouts: { NOT_READY: "No listo", PENDING: "Pendiente", APPROVED: "Aprobado", SCHEDULED: "Programado", PAID: "Pagado", REINVESTED: "Reinvertido", REJECTED: "Rechazado" } },
  zh: { title: "对比交易", description: "最多选择三笔您的交易。", select: "选择交易", max: "最多可对比三笔交易。", empty: "至少需要两笔交易才能对比。", capital: "本金", result: "结果", expected: "预期", roi: "回报率", duration: "周期", days: "天", payout: "付款", stages: { funding: "融资", purchasing: "采购", shipping: "物流", warehouse: "已收货", selling: "销售中", completed: "已完成", paid_out: "已付款", loss: "亏损" }, payouts: { NOT_READY: "未就绪", PENDING: "待处理", APPROVED: "已批准", SCHEDULED: "已安排", PAID: "已付款", REINVESTED: "已再投资", REJECTED: "已拒绝" } }
} satisfies Record<Locale, { title: string; description: string; select: string; max: string; empty: string; capital: string; result: string; expected: string; roi: string; duration: string; days: string; payout: string; stages: Record<InvestorDashboardAllocation["currentStage"], string>; payouts: Record<string, string> }>;

function money(value: number | null, currency: string, locale: Locale) {
  if (value === null) return "—";
  if (currency === "USDT") return `${new Intl.NumberFormat(locale === "zh" ? "zh-CN" : locale, { maximumFractionDigits: 2 }).format(value)} USDT`;
  return new Intl.NumberFormat(locale === "zh" ? "zh-CN" : locale, { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
}

export function InvestorDealComparison({ locale, allocations }: { locale: Locale; allocations: InvestorDashboardAllocation[] }) {
  const t = COPY[locale];
  const payoutLabels = t.payouts as Record<string, string>;
  const available = allocations.filter((allocation) => allocation.status !== "CANCELED");
  const [selected, setSelected] = useState(() => available.slice(0, Math.min(2, available.length)).map((allocation) => allocation.id));
  const compared = useMemo(() => available.filter((allocation) => selected.includes(allocation.id)), [available, selected]);
  const [limitReached, setLimitReached] = useState(false);
  const toggle = (id: string) => {
    setSelected((current) => {
      if (current.includes(id)) { setLimitReached(false); return current.filter((item) => item !== id); }
      if (current.length >= 3) { setLimitReached(true); return current; }
      setLimitReached(false);
      return [...current, id];
    });
  };

  return <Card className="rounded-[1.35rem] bg-card dark:bg-graphite-900/[0.72]"><CardContent className="space-y-5 p-5 sm:p-6">
    <div><h2 className="text-xl font-semibold text-foreground">{t.title}</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">{t.description}</p></div>
    {available.length < 2 ? <p className="rounded-2xl bg-muted/30 p-6 text-center text-sm text-muted-foreground dark:bg-black/20">{t.empty}</p> : <>
      <fieldset><legend className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{t.select}</legend><div className="mt-3 flex flex-wrap gap-2">{available.map((allocation) => <label key={allocation.id} className={`cursor-pointer rounded-full border px-3 py-2 text-sm font-semibold transition-colors ${selected.includes(allocation.id) ? "border-amber-600 bg-amber-50 text-amber-800 dark:border-gold-200/40 dark:bg-gold-200/10 dark:text-gold-100" : "border-border text-muted-foreground dark:border-white/10"}`}><input type="checkbox" className="sr-only" checked={selected.includes(allocation.id)} onChange={() => toggle(allocation.id)} />{allocation.product} · {allocation.supplyId}</label>)}</div>{limitReached ? <p className="mt-2 text-sm text-amber-700 dark:text-gold-100">{t.max}</p> : null}</fieldset>
      <div className="grid gap-3 lg:grid-cols-3">{compared.map((allocation) => <div key={allocation.id} className="rounded-2xl border border-border p-4 dark:border-white/10"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-foreground">{allocation.product}</p><p className="mt-1 text-xs text-muted-foreground">{allocation.supplyId}</p></div><Badge variant="secondary">{t.stages[allocation.currentStage]}</Badge></div><dl className="mt-5 space-y-3 text-sm"><div className="flex justify-between gap-3"><dt className="text-muted-foreground">{t.capital}</dt><dd className="font-semibold text-foreground">{money(allocation.investedAmount, allocation.currency, locale)}</dd></div><div className="flex justify-between gap-3"><dt className="text-muted-foreground">{allocation.resultIsEstimated ? t.expected : t.result}</dt><dd className="font-semibold text-foreground">{money(allocation.comparisonResult, allocation.currency, locale)}</dd></div><div className="flex justify-between gap-3"><dt className="text-muted-foreground">{t.roi}</dt><dd className="font-semibold text-foreground">{allocation.roiPercent === null ? "—" : `${allocation.roiPercent.toFixed(1)}%`}</dd></div><div className="flex justify-between gap-3"><dt className="text-muted-foreground">{t.duration}</dt><dd className="font-semibold text-foreground">{allocation.durationDays} {t.days}</dd></div><div className="flex justify-between gap-3"><dt className="text-muted-foreground">{t.payout}</dt><dd className="font-semibold text-foreground">{payoutLabels[allocation.payoutStatus] ?? allocation.payoutStatus}</dd></div></dl></div>)}</div>
    </>}
  </CardContent></Card>;
}

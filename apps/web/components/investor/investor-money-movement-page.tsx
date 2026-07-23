import Link from "next/link";
import { ArrowDownLeft, ArrowLeft, ArrowRight, ArrowUpRight, BriefcaseBusiness, CircleDollarSign, Gift, RefreshCw } from "lucide-react";
import { INVESTOR_LEDGER_ENTRY_TYPES, type InvestorLedgerEntry, type InvestorLedgerEntryType, type InvestorLedgerPage } from "@otiz/database";
import { enumLabel, type Locale } from "@otiz/lib";
import { Badge, Card, CardContent } from "@otiz/ui";
import { InvestorCapitalChart } from "@/components/investor/investor-capital-chart";
import { ledgerYears, monthRange, summarizeLedgerPeriod, yearRange } from "@/lib/investor-financial-periods";

const COPY: Record<Locale, {
  filter: string; all: string; from: string; to: string; apply: string; reset: string; empty: string; emptyFiltered: string;
  prev: string; next: string; page: (current: number, total: number) => string;
  totalProfit: string; totalPaid: string; totalReinvested: string; source: string;
  statement: string; pdf: string; xlsx: string;
  filtersTitle: string; emptyTitle: string; emptyDesc: string; depositAction: string;
  periodSummary: string; thisMonth: string; previousMonth: string; thisYear: string; allTime: string;
  periodDeposits: string; periodProfit: string; periodWithdrawals: string; periodReinvested: string;
  yearlyArchive: string; yearlyArchiveDescription: string; annualPackage: string;
  statuses: Record<string, string>;
  types: Record<InvestorLedgerEntryType, string>;
}> = {
  en: { filter: "Operation", all: "All operations", from: "From", to: "To", apply: "Apply", reset: "Reset", empty: "Account operations will appear here after they are recorded.", emptyFiltered: "No operations match these filters.", prev: "Previous", next: "Next", page: (current, total) => `Page ${current} of ${total}`, totalProfit: "Total profit", totalPaid: "Total paid", totalReinvested: "Total reinvested", source: "Open source", statement: "Download statement", pdf: "PDF", xlsx: "XLSX", filtersTitle: "Filters", emptyTitle: "No money movements yet", emptyDesc: "Your deposits, deals, profit, reinvestments and withdrawals will appear here in order.", depositAction: "Add capital", periodSummary: "Period summary", thisMonth: "This month", previousMonth: "Previous month", thisYear: "This year", allTime: "All time", periodDeposits: "Deposits", periodProfit: "Profit", periodWithdrawals: "Withdrawals", periodReinvested: "Reinvested", yearlyArchive: "Yearly archive", yearlyArchiveDescription: "Download a complete account statement for any recorded year.", annualPackage: "Annual package", statuses: { PENDING: "Under review", CONFIRMED: "Confirmed", REJECTED: "Rejected" }, types: { DEPOSIT: "Deposit", DEAL: "Deal", PROFIT: "Profit", REINVESTMENT: "Reinvestment", WITHDRAWAL: "Withdrawal", REFERRAL_BONUS: "Referral bonus" } },
  ru: { filter: "Операция", all: "Все операции", from: "С", to: "По", apply: "Применить", reset: "Сбросить", empty: "Операции по счёту появятся здесь после их записи.", emptyFiltered: "По выбранным фильтрам операций нет.", prev: "Назад", next: "Вперёд", page: (current, total) => `Страница ${current} из ${total}`, totalProfit: "Общая прибыль", totalPaid: "Всего выплачено", totalReinvested: "Всего реинвестировано", source: "Открыть источник", statement: "Скачать выписку", pdf: "PDF", xlsx: "XLSX", filtersTitle: "Фильтры", emptyTitle: "Движений денег пока нет", emptyDesc: "Пополнения, сделки, прибыль, реинвестирование и выводы будут появляться здесь по порядку.", depositAction: "Пополнить счёт", periodSummary: "Сводка за период", thisMonth: "Этот месяц", previousMonth: "Прошлый месяц", thisYear: "Этот год", allTime: "Всё время", periodDeposits: "Пополнения", periodProfit: "Прибыль", periodWithdrawals: "Выводы", periodReinvested: "Реинвестировано", yearlyArchive: "Архив по годам", yearlyArchiveDescription: "Скачайте полную выписку по счёту за любой год с операциями.", annualPackage: "Годовой пакет", statuses: { PENDING: "На проверке", CONFIRMED: "Подтверждено", REJECTED: "Отклонено" }, types: { DEPOSIT: "Пополнение", DEAL: "Сделка", PROFIT: "Прибыль", REINVESTMENT: "Реинвестирование", WITHDRAWAL: "Вывод", REFERRAL_BONUS: "Реферальный бонус" } },
  de: { filter: "Vorgang", all: "Alle Vorgänge", from: "Von", to: "Bis", apply: "Anwenden", reset: "Zurücksetzen", empty: "Kontobewegungen erscheinen hier, sobald sie erfasst wurden.", emptyFiltered: "Keine Vorgänge entsprechen diesen Filtern.", prev: "Zurück", next: "Weiter", page: (current, total) => `Seite ${current} von ${total}`, totalProfit: "Gesamtgewinn", totalPaid: "Insgesamt ausgezahlt", totalReinvested: "Insgesamt reinvestiert", source: "Quelle öffnen", statement: "Auszug herunterladen", pdf: "PDF", xlsx: "XLSX", filtersTitle: "Filter", emptyTitle: "Noch keine Geldbewegungen", emptyDesc: "Einzahlungen, Geschäfte, Gewinne, Reinvestitionen und Auszahlungen erscheinen hier in zeitlicher Reihenfolge.", depositAction: "Kapital einzahlen", periodSummary: "Zeitraumübersicht", thisMonth: "Dieser Monat", previousMonth: "Vorheriger Monat", thisYear: "Dieses Jahr", allTime: "Gesamter Zeitraum", periodDeposits: "Einzahlungen", periodProfit: "Gewinn", periodWithdrawals: "Auszahlungen", periodReinvested: "Reinvestiert", yearlyArchive: "Jahresarchiv", yearlyArchiveDescription: "Laden Sie für jedes erfasste Jahr einen vollständigen Kontoauszug herunter.", annualPackage: "Jahrespaket", statuses: { PENDING: "In Prüfung", CONFIRMED: "Bestätigt", REJECTED: "Abgelehnt" }, types: { DEPOSIT: "Einzahlung", DEAL: "Geschäft", PROFIT: "Gewinn", REINVESTMENT: "Reinvestition", WITHDRAWAL: "Auszahlung", REFERRAL_BONUS: "Empfehlungsbonus" } },
  es: { filter: "Operación", all: "Todas las operaciones", from: "Desde", to: "Hasta", apply: "Aplicar", reset: "Restablecer", empty: "Las operaciones de la cuenta aparecerán aquí cuando se registren.", emptyFiltered: "Ninguna operación coincide con estos filtros.", prev: "Anterior", next: "Siguiente", page: (current, total) => `Página ${current} de ${total}`, totalProfit: "Beneficio total", totalPaid: "Total pagado", totalReinvested: "Total reinvertido", source: "Abrir origen", statement: "Descargar estado", pdf: "PDF", xlsx: "XLSX", filtersTitle: "Filtros", emptyTitle: "Aún no hay movimientos", emptyDesc: "Los depósitos, operaciones, beneficios, reinversiones y retiros aparecerán aquí por orden.", depositAction: "Añadir capital", periodSummary: "Resumen del periodo", thisMonth: "Este mes", previousMonth: "Mes anterior", thisYear: "Este año", allTime: "Todo el periodo", periodDeposits: "Depósitos", periodProfit: "Beneficio", periodWithdrawals: "Retiros", periodReinvested: "Reinvertido", yearlyArchive: "Archivo anual", yearlyArchiveDescription: "Descargue un estado de cuenta completo para cualquier año registrado.", annualPackage: "Paquete anual", statuses: { PENDING: "En revisión", CONFIRMED: "Confirmado", REJECTED: "Rechazado" }, types: { DEPOSIT: "Depósito", DEAL: "Operación", PROFIT: "Beneficio", REINVESTMENT: "Reinversión", WITHDRAWAL: "Retiro", REFERRAL_BONUS: "Bono por recomendación" } },
  zh: { filter: "操作", all: "全部操作", from: "开始日期", to: "结束日期", apply: "应用", reset: "重置", empty: "账户操作记录将在保存后显示在这里。", emptyFiltered: "没有符合筛选条件的操作。", prev: "上一页", next: "下一页", page: (current, total) => `第 ${current}/${total} 页`, totalProfit: "总利润", totalPaid: "已支付总额", totalReinvested: "再投资总额", source: "打开来源", statement: "下载对账单", pdf: "PDF", xlsx: "XLSX", filtersTitle: "筛选", emptyTitle: "暂无资金记录", emptyDesc: "入金、项目、利润、再投资和提现将按时间显示在这里。", depositAction: "增加资金", periodSummary: "期间汇总", thisMonth: "本月", previousMonth: "上月", thisYear: "本年", allTime: "全部时间", periodDeposits: "入金", periodProfit: "利润", periodWithdrawals: "提现", periodReinvested: "再投资", yearlyArchive: "年度归档", yearlyArchiveDescription: "下载任一有记录年份的完整账户对账单。", annualPackage: "年度文件", statuses: { PENDING: "审核中", CONFIRMED: "已确认", REJECTED: "已拒绝" }, types: { DEPOSIT: "入金", DEAL: "交易", PROFIT: "利润", REINVESTMENT: "再投资", WITHDRAWAL: "提现", REFERRAL_BONUS: "推荐奖励" } }
};

const ICONS = { DEPOSIT: ArrowDownLeft, DEAL: BriefcaseBusiness, PROFIT: CircleDollarSign, REINVESTMENT: RefreshCw, WITHDRAWAL: ArrowUpRight, REFERRAL_BONUS: Gift } as const;

function money(value: number, currency: string, locale: Locale) {
  if (currency === "USDT") {
    return `${new Intl.NumberFormat(locale === "zh" ? "zh-CN" : locale, { maximumFractionDigits: 2 }).format(value)} USDT`;
  }
  return new Intl.NumberFormat(locale === "zh" ? "zh-CN" : locale, { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
}

export function InvestorMoneyMovementPage({ locale, ledger, totals, filters, statementsEnabled, performanceEnabled, performanceEntries }: { locale: Locale; ledger: InvestorLedgerPage; totals: { profit: number; payout: number; reinvested: number }; filters: { type: string; from: string; to: string }; statementsEnabled: boolean; performanceEnabled: boolean; performanceEntries: InvestorLedgerEntry[] }) {
  const t = COPY[locale];
  const base = `/${locale}/investor/history`;
  const hasFilters = Boolean(filters.type || filters.from || filters.to);
  const pageHref = (page: number) => {
    const query = new URLSearchParams();
    if (filters.type) query.set("type", filters.type);
    if (filters.from) query.set("from", filters.from);
    if (filters.to) query.set("to", filters.to);
    if (page > 1) query.set("page", String(page));
    return query.size ? `${base}?${query}` : base;
  };
  const statementHref = (format: "pdf" | "xlsx") => {
    const query = new URLSearchParams({ format, locale });
    if (filters.type) query.set("type", filters.type);
    if (filters.from) query.set("from", filters.from);
    if (filters.to) query.set("to", filters.to);
    return `/api/investor/statement?${query}`;
  };
  const rangeHref = (range?: { from: string; to: string }) => range ? `${base}?from=${range.from}&to=${range.to}` : base;
  const statementRangeHref = (format: "pdf" | "xlsx", range: { from: string; to: string }) => {
    const query = new URLSearchParams({ format, locale, ...range });
    return `/api/investor/statement?${query}`;
  };
  const summary = summarizeLedgerPeriod(performanceEntries, filters);
  const years = ledgerYears(performanceEntries);
  const now = new Date();
  const thisMonth = monthRange(now);
  const previousMonth = monthRange(now, -1);
  const thisYear = yearRange(new Date().getUTCFullYear());

  return <div className="space-y-6">
    <div className="grid gap-4 sm:grid-cols-3">
      {[[t.totalProfit, totals.profit], [t.totalPaid, totals.payout], [t.totalReinvested, totals.reinvested]].map(([label, value]) => <Card key={String(label)}><CardContent className="p-5"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold text-foreground">{money(Number(value), "USD", locale)}</p></CardContent></Card>)}
    </div>
    {performanceEnabled ? <InvestorCapitalChart locale={locale} entries={performanceEntries} /> : null}
    <Card><CardContent className="space-y-5 p-5 sm:p-6">
      <div className="space-y-4 rounded-2xl bg-muted/30 p-4 dark:bg-black/20">
        <div className="flex flex-wrap gap-2">
          <Link href={rangeHref(thisMonth)} className="rounded-full border border-border px-3 py-2 text-xs font-semibold dark:border-white/10">{t.thisMonth}</Link>
          <Link href={rangeHref(previousMonth)} className="rounded-full border border-border px-3 py-2 text-xs font-semibold dark:border-white/10">{t.previousMonth}</Link>
          <Link href={rangeHref(thisYear)} className="rounded-full border border-border px-3 py-2 text-xs font-semibold dark:border-white/10">{t.thisYear}</Link>
          <Link href={base} className="rounded-full border border-border px-3 py-2 text-xs font-semibold dark:border-white/10">{t.allTime}</Link>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{t.periodSummary}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[[t.periodDeposits, summary.deposits], [t.periodProfit, summary.profit], [t.periodWithdrawals, summary.withdrawals], [t.periodReinvested, summary.reinvested]].map(([label, value]) => <div key={String(label)}><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-semibold text-foreground">{money(Number(value), "USD", locale)}</p></div>)}
          </div>
        </div>
      </div>
      {statementsEnabled ? <div className="flex flex-col gap-3 rounded-2xl bg-muted/30 p-4 dark:bg-black/20 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm font-semibold text-foreground">{t.statement}</p><div className="flex gap-2"><Link href={statementHref("pdf")} className="rounded-full border border-border px-4 py-2 text-sm font-semibold dark:border-white/10">{t.pdf}</Link><Link href={statementHref("xlsx")} className="rounded-full border border-border px-4 py-2 text-sm font-semibold dark:border-white/10">{t.xlsx}</Link></div></div> : null}
      {statementsEnabled && years.length ? <details className="rounded-2xl border border-border p-4 dark:border-white/10"><summary className="cursor-pointer text-sm font-semibold text-foreground">{t.yearlyArchive}</summary><p className="mt-2 text-sm text-muted-foreground">{t.yearlyArchiveDescription}</p><div className="mt-4 space-y-2">{years.map((year) => { const range = yearRange(year); return <div key={year} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/30 p-3 dark:bg-black/20"><div><p className="font-semibold text-foreground">{year}</p><p className="text-xs text-muted-foreground">{t.annualPackage}</p></div><div className="flex gap-2"><Link href={statementRangeHref("pdf", range)} className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold dark:border-white/10">{t.pdf}</Link><Link href={statementRangeHref("xlsx", range)} className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold dark:border-white/10">{t.xlsx}</Link></div></div>; })}</div></details> : null}
      <details open={hasFilters} className="rounded-2xl border border-border p-4 dark:border-white/10">
        <summary className="cursor-pointer text-sm font-semibold text-foreground">{t.filtersTitle}</summary>
      <form method="get" className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_auto] lg:items-end">
        <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{t.filter}<select name="type" defaultValue={filters.type} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground dark:border-white/10"><option value="">{t.all}</option>{INVESTOR_LEDGER_ENTRY_TYPES.map((type) => <option key={type} value={type}>{t.types[type]}</option>)}</select></label>
        <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{t.from}<input type="date" name="from" defaultValue={filters.from} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground dark:border-white/10" /></label>
        <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{t.to}<input type="date" name="to" defaultValue={filters.to} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground dark:border-white/10" /></label>
        <div className="flex gap-2"><button type="submit" className="rounded-full bg-foreground px-4 py-2.5 text-sm font-semibold text-background">{t.apply}</button>{hasFilters ? <Link href={base} className="rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground dark:border-white/10">{t.reset}</Link> : null}</div>
      </form>
      </details>
      <div className="space-y-3">
        {ledger.entries.length === 0 ? (hasFilters ? <p className="rounded-2xl bg-muted/30 p-8 text-center text-sm text-muted-foreground dark:bg-black/20">{t.emptyFiltered}</p> : <div className="rounded-2xl bg-muted/30 p-8 text-center dark:bg-black/20"><p className="font-semibold text-foreground">{t.emptyTitle}</p><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">{t.emptyDesc}</p><Link href={`/${locale}/investor/deposit`} className="mt-4 inline-flex rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background">{t.depositAction}</Link></div>) : ledger.entries.map((entry) => {
          const Icon = ICONS[entry.type];
          const sign = entry.direction === "IN" ? "+" : entry.direction === "OUT" ? "−" : "";
          const status = entry.status ? (entry.sourceType === "DEPOSIT_NOTIFICATION" ? t.statuses[entry.status] : entry.sourceType === "ALLOCATION" ? enumLabel("allocationStatus", entry.status, locale) : entry.sourceType === "WITHDRAWAL_REQUEST" ? enumLabel("withdrawalStatus", entry.status, locale) : null) : null;
          return <div key={entry.id} className="flex flex-col gap-4 rounded-2xl border border-border p-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-start gap-3"><span className="rounded-xl bg-muted p-2.5 dark:bg-white/10"><Icon className="size-5" /></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-foreground">{t.types[entry.type]}</p>{status ? <Badge>{status}</Badge> : null}<Badge variant="secondary">{new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : locale, { dateStyle: "medium" }).format(new Date(entry.occurredAt))}</Badge></div><p className="mt-1 break-words text-sm text-muted-foreground">{entry.detail ?? t.types[entry.type]}</p><Link href={`/${locale}${entry.href}`} className="mt-2 inline-flex text-xs font-semibold text-amber-700 hover:underline dark:text-gold-100">{t.source}</Link></div></div><p className={`shrink-0 text-lg font-semibold ${entry.direction === "IN" ? "text-emerald-600 dark:text-emerald-400" : entry.direction === "OUT" ? "text-red-600 dark:text-red-400" : "text-foreground"}`}>{sign}{money(entry.amount, entry.currency, locale)}</p></div>;
        })}
      </div>
      {ledger.pageCount > 1 ? <div className="flex items-center justify-between gap-3 text-sm"><Link aria-disabled={ledger.page === 1} href={pageHref(Math.max(1, ledger.page - 1))} className={`inline-flex items-center gap-1 rounded-full border border-border px-3 py-2 dark:border-white/10 ${ledger.page === 1 ? "pointer-events-none opacity-40" : ""}`}><ArrowLeft className="size-4" />{t.prev}</Link><span className="text-muted-foreground">{t.page(ledger.page, ledger.pageCount)}</span><Link aria-disabled={ledger.page === ledger.pageCount} href={pageHref(Math.min(ledger.pageCount, ledger.page + 1))} className={`inline-flex items-center gap-1 rounded-full border border-border px-3 py-2 dark:border-white/10 ${ledger.page === ledger.pageCount ? "pointer-events-none opacity-40" : ""}`}>{t.next}<ArrowRight className="size-4" /></Link></div> : null}
    </CardContent></Card>
  </div>;
}

import type { InvestorLedgerEntry, InvestorLedgerEntryType } from "@otiz/database";

export type FinancialPeriod = { from: string; to: string };

function dateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function monthRange(now: Date, offset = 0): FinancialPeriod {
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1));
  const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset + 1, 0));
  return { from: dateOnly(from), to: dateOnly(to) };
}

export function yearRange(year: number): FinancialPeriod {
  return { from: `${year}-01-01`, to: `${year}-12-31` };
}

export function summarizeLedgerPeriod(entries: InvestorLedgerEntry[], period: Partial<FinancialPeriod>) {
  const selected = entries.filter((entry) =>
    (!period.from || entry.occurredAt >= period.from) &&
    (!period.to || entry.occurredAt <= `${period.to}T23:59:59.999Z`)
  );
  const total = (type: InvestorLedgerEntryType) =>
    selected.filter((entry) => entry.type === type).reduce((sum, entry) => sum + entry.amount, 0);
  return {
    deposits: total("DEPOSIT"),
    profit: total("PROFIT"),
    withdrawals: total("WITHDRAWAL"),
    reinvested: total("REINVESTMENT")
  };
}

export function ledgerYears(entries: InvestorLedgerEntry[]) {
  return [...new Set(entries.map((entry) => new Date(entry.occurredAt).getUTCFullYear()))]
    .filter(Number.isFinite)
    .sort((a, b) => b - a);
}

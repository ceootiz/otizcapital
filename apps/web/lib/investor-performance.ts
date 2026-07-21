import type { InvestorLedgerEntry } from "@otiz/database";

export type InvestorPerformancePeriod = "30d" | "90d" | "1y" | "all";

export type InvestorPerformancePoint = {
  occurredAt: string;
  capital: number;
  profit: number;
};

const PERIOD_DAYS: Record<Exclude<InvestorPerformancePeriod, "all">, number> = {
  "30d": 30,
  "90d": 90,
  "1y": 365
};

function capitalDelta(entry: InvestorLedgerEntry) {
  if (entry.direction === "IN") return entry.amount;
  if (entry.direction === "OUT") return -entry.amount;
  return 0;
}

export function listInvestorPerformanceCurrencies(entries: InvestorLedgerEntry[]) {
  return Array.from(new Set(entries.map((entry) => entry.currency))).sort((left, right) => {
    if (left === "USD") return -1;
    if (right === "USD") return 1;
    return left.localeCompare(right);
  });
}

export function buildInvestorPerformanceSeries(input: {
  entries: InvestorLedgerEntry[];
  currency: string;
  period: InvestorPerformancePeriod;
  now?: Date;
  maxPoints?: number;
}): InvestorPerformancePoint[] {
  const now = input.now ?? new Date();
  const maxPoints = Math.max(2, input.maxPoints ?? 80);
  const entries = input.entries
    .filter((entry) => entry.currency === input.currency)
    .sort((left, right) => left.occurredAt.localeCompare(right.occurredAt) || left.id.localeCompare(right.id));

  if (entries.length === 0) return [];

  const cutoff = input.period === "all"
    ? new Date(entries[0].occurredAt)
    : new Date(now.getTime() - PERIOD_DAYS[input.period] * 24 * 60 * 60 * 1000);
  let capital = entries
    .filter((entry) => new Date(entry.occurredAt) < cutoff)
    .reduce((total, entry) => total + capitalDelta(entry), 0);
  let profit = 0;
  const points: InvestorPerformancePoint[] = [{ occurredAt: cutoff.toISOString(), capital, profit }];

  for (const entry of entries) {
    if (new Date(entry.occurredAt) < cutoff) continue;
    capital += capitalDelta(entry);
    if ((entry.type === "PROFIT" || entry.type === "REFERRAL_BONUS") && entry.direction === "IN") {
      profit += entry.amount;
    }
    points.push({ occurredAt: entry.occurredAt, capital, profit });
  }

  if (points.length <= maxPoints) return points;
  const result = [points[0]];
  const step = (points.length - 1) / (maxPoints - 1);
  for (let index = 1; index < maxPoints - 1; index += 1) {
    result.push(points[Math.round(index * step)]);
  }
  result.push(points[points.length - 1]);
  return result;
}

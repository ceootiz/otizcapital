import { Prisma } from "@prisma/client";
import { prisma } from "./client";
import { getInvestorBalanceSummary } from "./investor-balance";

export const CANONICAL_MONEY_LEDGER_TYPES = [
  "INVESTOR_FREE",
  "INVESTOR_WORKING",
  "INVESTOR_PENDING_WITHDRAWAL"
] as const;

export type CanonicalMoneyLedgerType = (typeof CANONICAL_MONEY_LEDGER_TYPES)[number];

export type CanonicalMoneyEntry = {
  ledgerType: string;
  amount: string | number | Prisma.Decimal;
  currency: string;
  voidedAt?: Date | string | null;
};

export type CanonicalMoneyPosition = {
  currency: string;
  free: string;
  working: string;
  pendingWithdrawal: string;
  currentCapital: string;
  issues: string[];
};

export type MoneyIntegrityReport = {
  investorId: string;
  currency: string;
  balanced: boolean;
  canonical: CanonicalMoneyPosition;
  legacy: {
    free: string;
    working: string;
    pendingWithdrawal: string;
    currentCapital: string;
  };
  differences: {
    free: string;
    working: string;
    pendingWithdrawal: string;
    currentCapital: string;
  };
};

function decimal(value: string | number | Prisma.Decimal | null | undefined) {
  try {
    return new Prisma.Decimal(value ?? 0);
  } catch {
    return new Prisma.Decimal(0);
  }
}

function normalizedCurrency(value: string) {
  return value.trim().toUpperCase() || "USD";
}

function positionRecord(currency: string) {
  return {
    currency,
    free: new Prisma.Decimal(0),
    working: new Prisma.Decimal(0),
    pendingWithdrawal: new Prisma.Decimal(0)
  };
}

function serialized(value: Prisma.Decimal) {
  return value.toDecimalPlaces(18).toString();
}

export function calculateCanonicalMoneyPositions(entries: CanonicalMoneyEntry[]): CanonicalMoneyPosition[] {
  const positions = new Map<string, ReturnType<typeof positionRecord>>();

  for (const entry of entries) {
    if (entry.voidedAt) continue;
    if (!CANONICAL_MONEY_LEDGER_TYPES.includes(entry.ledgerType as CanonicalMoneyLedgerType)) continue;
    const currency = normalizedCurrency(entry.currency);
    const position = positions.get(currency) ?? positionRecord(currency);
    const amount = decimal(entry.amount);

    if (entry.ledgerType === "INVESTOR_FREE") position.free = position.free.add(amount);
    if (entry.ledgerType === "INVESTOR_WORKING") position.working = position.working.add(amount);
    if (entry.ledgerType === "INVESTOR_PENDING_WITHDRAWAL") {
      position.pendingWithdrawal = position.pendingWithdrawal.add(amount);
    }
    positions.set(currency, position);
  }

  return [...positions.values()]
    .map((position) => {
      const currentCapital = position.free.add(position.working).add(position.pendingWithdrawal);
      const issues = [
        position.free.isNegative() ? "NEGATIVE_FREE_CAPITAL" : null,
        position.working.isNegative() ? "NEGATIVE_WORKING_CAPITAL" : null,
        position.pendingWithdrawal.isNegative() ? "NEGATIVE_PENDING_WITHDRAWAL" : null,
        currentCapital.isNegative() ? "NEGATIVE_CURRENT_CAPITAL" : null
      ].filter((value): value is string => Boolean(value));

      return {
        currency: position.currency,
        free: serialized(position.free),
        working: serialized(position.working),
        pendingWithdrawal: serialized(position.pendingWithdrawal),
        currentCapital: serialized(currentCapital),
        issues
      };
    })
    .sort((left, right) => left.currency.localeCompare(right.currency));
}

export function compareMoneyPosition(input: {
  investorId: string;
  canonical: CanonicalMoneyPosition;
  legacy: { free: unknown; working: unknown; pendingWithdrawal: unknown; currentCapital: unknown };
}): MoneyIntegrityReport {
  const legacy = {
    free: decimal(String(input.legacy.free ?? 0)),
    working: decimal(String(input.legacy.working ?? 0)),
    pendingWithdrawal: decimal(String(input.legacy.pendingWithdrawal ?? 0)),
    currentCapital: decimal(String(input.legacy.currentCapital ?? 0))
  };
  const differences = {
    free: decimal(input.canonical.free).sub(legacy.free),
    working: decimal(input.canonical.working).sub(legacy.working),
    pendingWithdrawal: decimal(input.canonical.pendingWithdrawal).sub(legacy.pendingWithdrawal),
    currentCapital: decimal(input.canonical.currentCapital).sub(legacy.currentCapital)
  };
  const balanced =
    input.canonical.issues.length === 0 &&
    Object.values(differences).every((difference) => difference.isZero());

  return {
    investorId: input.investorId,
    currency: input.canonical.currency,
    balanced,
    canonical: input.canonical,
    legacy: {
      free: serialized(legacy.free),
      working: serialized(legacy.working),
      pendingWithdrawal: serialized(legacy.pendingWithdrawal),
      currentCapital: serialized(legacy.currentCapital)
    },
    differences: {
      free: serialized(differences.free),
      working: serialized(differences.working),
      pendingWithdrawal: serialized(differences.pendingWithdrawal),
      currentCapital: serialized(differences.currentCapital)
    }
  };
}

export async function getInvestorMoneyIntegrity(investorId: string): Promise<MoneyIntegrityReport> {
  const [entries, legacy] = await Promise.all([
    prisma.ledgerEntry.findMany({
      where: { investorId, ledgerType: { in: [...CANONICAL_MONEY_LEDGER_TYPES] } },
      select: { ledgerType: true, amount: true, currency: true, voidedAt: true }
    }),
    getInvestorBalanceSummary(investorId)
  ]);
  const canonical =
    calculateCanonicalMoneyPositions(entries).find((position) => position.currency === "USD") ??
    calculateCanonicalMoneyPositions([]).concat({
      currency: "USD",
      free: "0",
      working: "0",
      pendingWithdrawal: "0",
      currentCapital: "0",
      issues: []
    })[0];

  return compareMoneyPosition({
    investorId,
    canonical,
    legacy: {
      free: legacy.availableBalance,
      working: legacy.workingCapital,
      pendingWithdrawal: legacy.pendingWithdrawals,
      currentCapital: legacy.totalBalance
    }
  });
}

import { describe, expect, it } from "vitest";
import {
  buildInvestorLedger,
  INVESTOR_LEDGER_DEFAULT_PAGE_SIZE,
  type BuildInvestorLedgerInput,
  type LedgerAllocationRecord,
  type LedgerCommissionRecord,
  type LedgerDepositRecord,
  type LedgerPaymentRecord,
  type LedgerWithdrawalRecord
} from "./investor-ledger";

const INVESTOR = "investor-a";
const OTHER = "investor-b";

function deposit(input: Partial<LedgerDepositRecord> & { id: string; amount: unknown }): LedgerDepositRecord {
  return {
    id: input.id,
    investorId: input.investorId ?? INVESTOR,
    amount: input.amount,
    network: input.network ?? "USDT TRC20",
    status: input.status ?? "CONFIRMED",
    reviewedAt: input.reviewedAt ?? new Date("2026-01-10T00:00:00.000Z"),
    createdAt: input.createdAt ?? new Date("2026-01-09T00:00:00.000Z")
  };
}

function allocation(input: Partial<LedgerAllocationRecord> & { id: string; allocationAmount: unknown }): LedgerAllocationRecord {
  return {
    id: input.id,
    investorId: input.investorId ?? INVESTOR,
    allocationAmount: input.allocationAmount,
    productName: input.productName ?? "iPhone batch",
    supplyCode: input.supplyCode ?? "SUP-1",
    currency: input.currency ?? "USD",
    status: input.status ?? "SELLING",
    startedAt: input.startedAt ?? new Date("2026-02-01T00:00:00.000Z"),
    createdAt: input.createdAt ?? new Date("2026-01-31T00:00:00.000Z")
  };
}

function payment(input: Partial<LedgerPaymentRecord> & { id: string }): LedgerPaymentRecord {
  return {
    id: input.id,
    investorId: input.investorId ?? INVESTOR,
    month: input.month ?? "Февраль 2026",
    profit: input.profit ?? 0,
    reinvested: input.reinvested ?? 0,
    createdAt: input.createdAt ?? new Date("2026-03-01T00:00:00.000Z")
  };
}

function withdrawal(input: Partial<LedgerWithdrawalRecord> & { id: string; amount: unknown; status: string }): LedgerWithdrawalRecord {
  return {
    id: input.id,
    investorId: input.investorId ?? INVESTOR,
    amount: input.amount,
    currency: input.currency ?? "USD",
    status: input.status,
    requestedAt: input.requestedAt ?? new Date("2026-04-01T00:00:00.000Z"),
    scheduledFor: input.scheduledFor ?? null,
    paidAt: input.paidAt ?? null,
    createdAt: input.createdAt ?? new Date("2026-04-01T00:00:00.000Z")
  };
}

function commission(input: Partial<LedgerCommissionRecord> & { id: string; commissionAmount: unknown }): LedgerCommissionRecord {
  return {
    id: input.id,
    investorReferrerId: input.investorReferrerId ?? INVESTOR,
    level: input.level,
    commissionAmount: input.commissionAmount,
    status: input.status ?? "PENDING",
    createdAt: input.createdAt ?? new Date("2026-05-01T00:00:00.000Z"),
    referredInvestorName: input.referredInvestorName ?? "Referred Person"
  };
}

function emptyInput(overrides: Partial<BuildInvestorLedgerInput> = {}): BuildInvestorLedgerInput {
  return {
    investorId: INVESTOR,
    deposits: [],
    allocations: [],
    payments: [],
    withdrawals: [],
    commissions: [],
    ...overrides
  };
}

describe("investor ledger projection", () => {
  it("aggregates all five sources into one chronological (newest-first) feed", () => {
    const page = buildInvestorLedger(
      emptyInput({
        deposits: [deposit({ id: "d1", amount: 5000, reviewedAt: new Date("2026-01-10T00:00:00.000Z") })],
        allocations: [allocation({ id: "a1", allocationAmount: "4000", startedAt: new Date("2026-02-01T00:00:00.000Z") })],
        payments: [payment({ id: "p1", profit: 300, reinvested: 100, createdAt: new Date("2026-03-01T00:00:00.000Z") })],
        withdrawals: [withdrawal({ id: "w1", amount: "200", status: "PAID", paidAt: new Date("2026-04-01T00:00:00.000Z") })],
        commissions: [commission({ id: "c1", commissionAmount: 50, createdAt: new Date("2026-05-01T00:00:00.000Z") })]
      })
    );

    // profit + reinvested split the payment row into two entries → 6 total.
    expect(page.total).toBe(6);
    expect(page.entries.map((entry) => entry.type)).toEqual([
      "REFERRAL", // 2026-05
      "WITHDRAWAL", // 2026-04
      "YIELD", // 2026-03 (id tie-break: :YIELD > :REINVEST desc)
      "REINVEST", // 2026-03
      "ALLOCATION", // 2026-02
      "DEPOSIT" // 2026-01
    ]);
  });

  it("marks direction: deposit/yield/referral IN, paid withdrawal OUT, allocation/reinvest/unpaid-withdrawal NEUTRAL", () => {
    const page = buildInvestorLedger(
      emptyInput({
        deposits: [deposit({ id: "d1", amount: 1000 })],
        allocations: [allocation({ id: "a1", allocationAmount: 900 })],
        payments: [payment({ id: "p1", profit: 100, reinvested: 40 })],
        withdrawals: [
          withdrawal({ id: "wp", amount: 50, status: "PAID", paidAt: new Date("2026-04-02T00:00:00.000Z") }),
          withdrawal({ id: "wr", amount: 70, status: "REQUESTED" })
        ],
        commissions: [commission({ id: "c1", commissionAmount: 25 })]
      })
    );
    const byType = Object.fromEntries(page.entries.map((entry) => [entry.type === "WITHDRAWAL" ? entry.sourceId : entry.type, entry.direction]));
    expect(byType.DEPOSIT).toBe("IN");
    expect(byType.YIELD).toBe("IN");
    expect(byType.REFERRAL).toBe("IN");
    expect(byType.ALLOCATION).toBe("NEUTRAL");
    expect(byType.REINVEST).toBe("NEUTRAL");
    expect(byType.wp).toBe("OUT"); // paid
    expect(byType.wr).toBe("NEUTRAL"); // requested, not yet money-out
  });

  it("only projects CONFIRMED deposits (pending/rejected excluded)", () => {
    const page = buildInvestorLedger(
      emptyInput({
        deposits: [
          deposit({ id: "confirmed", amount: 1000, status: "CONFIRMED" }),
          deposit({ id: "pending", amount: 2000, status: "PENDING" }),
          deposit({ id: "rejected", amount: 3000, status: "REJECTED" })
        ]
      })
    );
    expect(page.entries.map((entry) => entry.sourceId)).toEqual(["confirmed"]);
  });

  it("does not emit a payout entry from the monthly payment row (withdrawals are the sole money-out source)", () => {
    // A payment row with only a payout figure must produce NO entry — otherwise
    // it would double-count against the withdrawal stream.
    const page = buildInvestorLedger(
      emptyInput({ payments: [{ id: "p1", investorId: INVESTOR, month: "Март", profit: 0, reinvested: 0, createdAt: new Date() }] })
    );
    expect(page.total).toBe(0);
  });

  it("shows only DIRECT (level 1) referral commissions; second-level bonuses are hidden", () => {
    const page = buildInvestorLedger(
      emptyInput({
        commissions: [
          commission({ id: "direct", commissionAmount: 50, level: 1 }),
          commission({ id: "second", commissionAmount: 10, level: 2 })
        ]
      })
    );
    expect(page.entries.map((entry) => entry.sourceId)).toEqual(["direct"]);
  });

  it("treats a missing level as level 1 (single-level schema compatibility)", () => {
    const page = buildInvestorLedger(emptyInput({ commissions: [commission({ id: "legacy", commissionAmount: 50, level: undefined })] }));
    expect(page.total).toBe(1);
  });

  it("never leaks another investor's rows even if the query is mis-scoped", () => {
    const page = buildInvestorLedger(
      emptyInput({
        deposits: [deposit({ id: "mine", amount: 100 }), deposit({ id: "theirs", investorId: OTHER, amount: 999999 })],
        commissions: [commission({ id: "theirs-comm", investorReferrerId: OTHER, commissionAmount: 8888 })]
      })
    );
    expect(page.total).toBe(1);
    expect(page.entries[0].sourceId).toBe("mine");
  });

  it("filters by entry type", () => {
    const page = buildInvestorLedger(
      emptyInput({
        deposits: [deposit({ id: "d1", amount: 100 })],
        withdrawals: [withdrawal({ id: "w1", amount: 50, status: "PAID", paidAt: new Date("2026-04-02T00:00:00.000Z") })]
      }),
      { type: "WITHDRAWAL" }
    );
    expect(page.entries.every((entry) => entry.type === "WITHDRAWAL")).toBe(true);
    expect(page.total).toBe(1);
  });

  it("filters by date range (inclusive)", () => {
    const page = buildInvestorLedger(
      emptyInput({
        deposits: [
          deposit({ id: "jan", amount: 1, reviewedAt: new Date("2026-01-15T00:00:00.000Z") }),
          deposit({ id: "mar", amount: 1, reviewedAt: new Date("2026-03-15T00:00:00.000Z") })
        ]
      }),
      { from: "2026-02-01T00:00:00.000Z", to: "2026-03-31T23:59:59.000Z" }
    );
    expect(page.entries.map((entry) => entry.sourceId)).toEqual(["mar"]);
  });

  it("paginates and reports total/pageCount", () => {
    const deposits = Array.from({ length: 25 }, (_, index) =>
      deposit({ id: `d${index}`, amount: index + 1, reviewedAt: new Date(2026, 0, index + 1) })
    );
    const first = buildInvestorLedger(emptyInput({ deposits }), { page: 1, pageSize: 10 });
    expect(first.total).toBe(25);
    expect(first.pageCount).toBe(3);
    expect(first.entries).toHaveLength(10);

    const last = buildInvestorLedger(emptyInput({ deposits }), { page: 3, pageSize: 10 });
    expect(last.entries).toHaveLength(5);

    // Out-of-range page clamps to the last page rather than returning empty.
    const clamped = buildInvestorLedger(emptyInput({ deposits }), { page: 99, pageSize: 10 });
    expect(clamped.page).toBe(3);
    expect(clamped.entries).toHaveLength(5);
  });

  it("clamps an oversized pageSize and defaults an invalid one", () => {
    const huge = buildInvestorLedger(emptyInput(), { pageSize: 100000 });
    expect(huge.pageSize).toBe(100);
    const invalid = buildInvestorLedger(emptyInput(), { pageSize: "not-a-number" });
    expect(invalid.pageSize).toBe(INVESTOR_LEDGER_DEFAULT_PAGE_SIZE);
  });

  it("ignores an unknown type filter (returns the full feed)", () => {
    const page = buildInvestorLedger(emptyInput({ deposits: [deposit({ id: "d1", amount: 100 })] }), { type: "NONSENSE" });
    expect(page.appliedFilters.type).toBeNull();
    expect(page.total).toBe(1);
  });
});

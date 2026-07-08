import { describe, expect, it } from "vitest";
import { computeReferralCommissions, REFERRAL_MAX_DEPTH, type CommissionRates, type ReferralGraphNode } from "./referrals";

const RATES: CommissionRates = {
  arbitrageurRate: 0.1,
  investorReferrerRate: 0.1,
  secondLevelRate: 0.05,
  minDeposit: 5000
};

// Build a graph from `id -> referredBy` edges. An edge value prefixed with
// "arb:" marks an arbitrageur referrer; otherwise it is an investor referrer.
function graph(edges: Record<string, string | null>): Map<string, ReferralGraphNode> {
  const map = new Map<string, ReferralGraphNode>();
  for (const [id, referredBy] of Object.entries(edges)) {
    const isArb = typeof referredBy === "string" && referredBy.startsWith("arb:");
    map.set(id, {
      investorId: id,
      referredByInvestorId: referredBy && !isArb ? referredBy : null,
      referredByArbitrageId: isArb ? (referredBy as string).slice(4) : null
    });
  }
  return map;
}

describe("computeReferralCommissions", () => {
  it("pays a level-1 investor referrer and a level-2 investor grandparent", () => {
    // A referred B referred C; C deposits.
    const specs = computeReferralCommissions({
      depositorId: "C",
      depositAmount: 10000,
      rates: RATES,
      investors: graph({ C: "B", B: "A", A: null })
    });

    expect(specs).toHaveLength(2);
    expect(specs[0]).toMatchObject({ level: 1, rate: 0.1, commissionAmount: 1000, beneficiary: { type: "investor", investorId: "B" } });
    expect(specs[1]).toMatchObject({ level: 2, rate: 0.05, commissionAmount: 500, beneficiary: { type: "investor", investorId: "A" } });
  });

  it("uses distinct, independently configured level-1 and level-2 rates (no magic numbers)", () => {
    const specs = computeReferralCommissions({
      depositorId: "C",
      depositAmount: 8000,
      rates: { arbitrageurRate: 0.1, investorReferrerRate: 0.12, secondLevelRate: 0.03, minDeposit: 5000 },
      investors: graph({ C: "B", B: "A", A: null })
    });
    expect(specs[0]).toMatchObject({ level: 1, rate: 0.12, commissionAmount: 960 });
    expect(specs[1]).toMatchObject({ level: 2, rate: 0.03, commissionAmount: 240 });
  });

  it("pays only a level-1 arbitrageur (arbitrageurs have no upstream referrer)", () => {
    const specs = computeReferralCommissions({
      depositorId: "C",
      depositAmount: 10000,
      rates: RATES,
      investors: graph({ C: "arb:ARB1" }),
      arbitrageurCustomRates: new Map([["ARB1", null]])
    });
    expect(specs).toHaveLength(1);
    expect(specs[0]).toMatchObject({ level: 1, rate: 0.1, commissionAmount: 1000, beneficiary: { type: "arbitrageur", arbitrageurId: "ARB1" } });
  });

  it("honours an arbitrageur custom rate override at level 1", () => {
    const specs = computeReferralCommissions({
      depositorId: "C",
      depositAmount: 10000,
      rates: RATES,
      investors: graph({ C: "arb:ARB1" }),
      arbitrageurCustomRates: new Map([["ARB1", 0.2]])
    });
    expect(specs[0]).toMatchObject({ rate: 0.2, commissionAmount: 2000 });
  });

  it("does NOT pay a level-2 arbitrageur grandparent (investor chains only)", () => {
    // B was referred by an arbitrageur; C referred by investor B deposits.
    const specs = computeReferralCommissions({
      depositorId: "C",
      depositAmount: 10000,
      rates: RATES,
      investors: graph({ C: "B", B: "arb:ARB1" }),
      arbitrageurCustomRates: new Map([["ARB1", null]])
    });
    expect(specs).toHaveLength(1);
    expect(specs[0]).toMatchObject({ level: 1, beneficiary: { type: "investor", investorId: "B" } });
  });

  it("pays only level 1 when the direct referrer has no referrer", () => {
    const specs = computeReferralCommissions({
      depositorId: "C",
      depositAmount: 10000,
      rates: RATES,
      investors: graph({ C: "B", B: null })
    });
    expect(specs.map((spec) => spec.level)).toEqual([1]);
  });

  it("accrues nothing when the depositor has no referrer", () => {
    const specs = computeReferralCommissions({ depositorId: "C", depositAmount: 10000, rates: RATES, investors: graph({ C: null }) });
    expect(specs).toEqual([]);
  });

  it("accrues nothing below the program minimum (applies to both levels)", () => {
    const specs = computeReferralCommissions({
      depositorId: "C",
      depositAmount: 4999,
      rates: RATES,
      investors: graph({ C: "B", B: "A", A: null })
    });
    expect(specs).toEqual([]);
  });

  it("protects against a self-referral (A referred by A pays nothing)", () => {
    const specs = computeReferralCommissions({ depositorId: "A", depositAmount: 10000, rates: RATES, investors: graph({ A: "A" }) });
    expect(specs).toEqual([]);
  });

  it("protects against a 2-cycle (A→B, B→A pays only level 1, never re-pays the depositor)", () => {
    // A deposits; A referred by B, B referred by A. Level 2 would be A itself.
    const specs = computeReferralCommissions({ depositorId: "A", depositAmount: 10000, rates: RATES, investors: graph({ A: "B", B: "A" }) });
    expect(specs).toHaveLength(1);
    expect(specs[0]).toMatchObject({ level: 1, beneficiary: { type: "investor", investorId: "B" } });
  });

  it("caps depth at exactly two — a great-grandparent never accrues", () => {
    // A → B → C → D chain; D deposits. Pays C (L1) and B (L2), never A.
    const specs = computeReferralCommissions({
      depositorId: "D",
      depositAmount: 10000,
      rates: RATES,
      investors: graph({ D: "C", C: "B", B: "A", A: null })
    });
    expect(specs).toHaveLength(REFERRAL_MAX_DEPTH);
    expect(specs.map((spec) => (spec.beneficiary.type === "investor" ? spec.beneficiary.investorId : null))).toEqual(["C", "B"]);
  });

  it("rounds commission amounts to cents", () => {
    const specs = computeReferralCommissions({
      depositorId: "C",
      depositAmount: 5333.33, // above the 5000 minimum, but yields fractional cents
      rates: RATES,
      investors: graph({ C: "B", B: "A", A: null })
    });
    expect(specs[0].commissionAmount).toBe(533.33); // 5333.33 * 0.1  = 533.333
    expect(specs[1].commissionAmount).toBe(266.67); // 5333.33 * 0.05 = 266.6665
  });

  it("stops the chain when a level-2 grandparent is missing from the graph but is a cycle-free investor", () => {
    // C → B (investor), B → A but A's node absent: still pays L1 + L2 by id.
    const specs = computeReferralCommissions({
      depositorId: "C",
      depositAmount: 10000,
      rates: RATES,
      investors: graph({ C: "B", B: "A" })
    });
    expect(specs.map((spec) => spec.level)).toEqual([1, 2]);
  });
});

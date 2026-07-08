import crypto from "node:crypto";
import { Prisma, type Arbitrageur, type ReferralClick, type ReferralCommission, type ReferralProgram } from "@prisma/client";
import { prisma } from "./client";

// ---------------------------------------------------------------------------
// Referral program — arbitrageurs + investor-to-investor referrals.
//
// Commission is accrued only when a referred investor's deposit is CONFIRMED by
// an admin and meets the program minimum. Only DIRECT referrals count: an
// investor carries at most one referrer id, so chains never pay out upstream.
// ---------------------------------------------------------------------------

export const ARBITRAGEUR_STATUSES = ["PENDING", "ACTIVE", "SUSPENDED"] as const;
export type ArbitrageurStatus = (typeof ARBITRAGEUR_STATUSES)[number];

export const REFERRAL_COMMISSION_STATUSES = ["PENDING", "PAID"] as const;
export type ReferralCommissionStatus = (typeof REFERRAL_COMMISSION_STATUSES)[number];

const DAY_MS = 24 * 60 * 60 * 1000;
// Fraud threshold: strictly MORE than this many clicks from one IP for one
// arbitrageur inside 24h flags the click as suspicious (spec: "> 3").
const SUSPICIOUS_CLICK_THRESHOLD = 3;

// 8-char code from an unambiguous alphabet (no I/O/0/1) so codes are easy to
// read aloud and type. 32^8 ≈ 1.1e12 combinations.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateReferralCode(length = 8): string {
  const bytes = crypto.randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return out;
}

// DB-checked unique code across BOTH arbitrageurs and investors (the two code
// namespaces must not collide, since resolveReferralCode searches both). Use
// this outside a transaction; inside one, a raw generateReferralCode() plus the
// @unique constraint is sufficient given the collision odds.
export async function generateUniqueReferralCode(): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = generateReferralCode();
    const [arb, inv] = await Promise.all([
      prisma.arbitrageur.findUnique({ where: { referralCode: code }, select: { id: true } }),
      prisma.investor.findUnique({ where: { referralCode: code }, select: { id: true } })
    ]);
    if (!arb && !inv) return code;
  }
  throw new Error("Could not generate a unique referral code after several attempts.");
}

// First name only — used everywhere a referrer sees a referred investor so the
// full identity is never exposed in a partner cabinet.
export function maskInvestorName(fullName: string): string {
  const first = fullName.trim().split(/\s+/)[0] || "";
  return first || "—";
}

// ---------------------------------------------------------------------------
// Program settings (singleton row id "default")
// ---------------------------------------------------------------------------

export type SerializedReferralProgram = {
  arbitrageurRate: number;
  investorReferrerRate: number;
  secondLevelRate: number;
  minDepositForCommission: number;
  updatedAt: string;
};

export function serializeReferralProgram(program: ReferralProgram): SerializedReferralProgram {
  return {
    arbitrageurRate: Number(program.arbitrageurRate),
    investorReferrerRate: Number(program.investorReferrerRate),
    secondLevelRate: Number(program.secondLevelRate),
    minDepositForCommission: Number(program.minDepositForCommission),
    updatedAt: program.updatedAt.toISOString()
  };
}

export async function getReferralProgram(): Promise<ReferralProgram> {
  const existing = await prisma.referralProgram.findUnique({ where: { id: "default" } });
  if (existing) return existing;
  return prisma.referralProgram.create({ data: { id: "default" } });
}

export async function updateReferralProgram(input: {
  arbitrageurRate?: number;
  investorReferrerRate?: number;
  secondLevelRate?: number;
  minDepositForCommission?: number;
}): Promise<ReferralProgram> {
  const data: Prisma.ReferralProgramUpdateInput = {};
  if (input.arbitrageurRate !== undefined) data.arbitrageurRate = new Prisma.Decimal(input.arbitrageurRate);
  if (input.investorReferrerRate !== undefined) data.investorReferrerRate = new Prisma.Decimal(input.investorReferrerRate);
  if (input.secondLevelRate !== undefined) data.secondLevelRate = new Prisma.Decimal(input.secondLevelRate);
  if (input.minDepositForCommission !== undefined) data.minDepositForCommission = new Prisma.Decimal(input.minDepositForCommission);

  await getReferralProgram(); // ensure the row exists
  return prisma.referralProgram.update({ where: { id: "default" }, data });
}

// ---------------------------------------------------------------------------
// Referral code resolution + click tracking (Block 1 + Block 6)
// ---------------------------------------------------------------------------

export type ResolvedReferral =
  | { type: "arbitrageur"; arbitrageurId: string; investorReferrerId: null }
  | { type: "investor"; arbitrageurId: null; investorReferrerId: string };

// Looks a code up in the arbitrageur namespace first, then the investor one.
export async function resolveReferralCode(code: string): Promise<ResolvedReferral | null> {
  const trimmed = code.trim();
  if (!trimmed) return null;

  const arbitrageur = await prisma.arbitrageur.findUnique({ where: { referralCode: trimmed }, select: { id: true } });
  if (arbitrageur) return { type: "arbitrageur", arbitrageurId: arbitrageur.id, investorReferrerId: null };

  const investor = await prisma.investor.findUnique({ where: { referralCode: trimmed }, select: { id: true } });
  if (investor) return { type: "investor", arbitrageurId: null, investorReferrerId: investor.id };

  return null;
}

// Records a referral landing/attribution. Runs the fraud check inline: if this
// IP already has > 3 clicks for this arbitrageur in the last 24h, the click is
// stored with suspicious = true (and later excluded from commission accrual).
export async function createReferralClick(input: {
  arbitrageurId?: string | null;
  investorReferrerId?: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  convertedToApplicationId?: string | null;
}): Promise<ReferralClick> {
  let suspicious = false;
  if (input.arbitrageurId && input.ipAddress) {
    const recent = await prisma.referralClick.count({
      where: {
        arbitrageurId: input.arbitrageurId,
        ipAddress: input.ipAddress,
        createdAt: { gte: new Date(Date.now() - DAY_MS) }
      }
    });
    suspicious = recent >= SUSPICIOUS_CLICK_THRESHOLD;
  }

  return prisma.referralClick.create({
    data: {
      arbitrageurId: input.arbitrageurId ?? null,
      investorReferrerId: input.investorReferrerId ?? null,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      convertedToApplicationId: input.convertedToApplicationId ?? null,
      suspicious
    }
  });
}

// ---------------------------------------------------------------------------
// Commission accrual (Block 2) — called from the deposit-confirm route
//
// Two-level program: the direct referrer earns a level-1 commission, and — for
// investor→investor chains only — the referrer's own referrer earns a smaller
// level-2 commission. Depth is capped at exactly two by an explicit bounded
// walk (no recursion), and a visited-set guards against cyclic referral data.
// The single computation lives in the pure `computeReferralCommissions` engine
// so level-1 and level-2 share one code path (no duplicated math).
// ---------------------------------------------------------------------------

// Hard cap on referral depth. The chain walk below never exceeds this, so a
// "referral of a referral of a referral" can never accrue — enforced in code,
// not by assumption.
export const REFERRAL_MAX_DEPTH = 2;

// Minimal referral-graph shape the engine needs for one investor.
export type ReferralGraphNode = {
  investorId: string;
  referredByInvestorId: string | null;
  referredByArbitrageId: string | null;
};

export type CommissionRates = {
  arbitrageurRate: number; // program default for arbitrageur referrers (level 1)
  investorReferrerRate: number; // level-1 rate for investor referrers
  secondLevelRate: number; // level-2 rate (investor grandparents only)
  minDeposit: number; // deposit must clear this for ANY commission to accrue
};

export type CommissionBeneficiary =
  | { type: "arbitrageur"; arbitrageurId: string; customRate: number | null }
  | { type: "investor"; investorId: string };

export type CommissionSpec = {
  level: 1 | 2;
  beneficiary: CommissionBeneficiary;
  rate: number;
  commissionAmount: number;
};

function round2(value: number): number {
  return Number(value.toFixed(2));
}

// Pure engine: given a deposit and the relevant slice of the referral graph,
// returns the commission specs to accrue (0, 1, or 2 rows). No I/O, so it is
// unit-tested directly with an in-memory graph.
//
// Rules encoded here:
//  - Nothing accrues below the program minimum.
//  - Level 1: the depositor's direct referrer (arbitrageur OR investor).
//  - Level 2: ONLY when level 1 is an investor and THAT investor was in turn
//    referred by another investor (arbitrageur grandparents are out of scope).
//  - Cycle/self protection: a `visited` set (seeded with the depositor) means an
//    id already in the chain is never paid again, so A→B→A pays no level 2 and a
//    self-referral pays nothing.
export function computeReferralCommissions(input: {
  depositorId: string;
  depositAmount: number;
  rates: CommissionRates;
  investors: Map<string, ReferralGraphNode>;
  arbitrageurCustomRates?: Map<string, number | null>;
}): CommissionSpec[] {
  const specs: CommissionSpec[] = [];
  if (input.depositAmount < input.rates.minDeposit) return specs;

  const visited = new Set<string>([input.depositorId]);
  let currentId = input.depositorId;

  for (let level = 1; level <= REFERRAL_MAX_DEPTH; level += 1) {
    const node = input.investors.get(currentId);
    if (!node) break;

    // An arbitrageur referrer only pays at level 1 — arbitrageurs have no
    // upstream referrer, and arbitrageur grandparents are excluded at level 2.
    if (node.referredByArbitrageId) {
      if (level === 1) {
        const customRate = input.arbitrageurCustomRates?.get(node.referredByArbitrageId) ?? null;
        const rate = customRate != null ? customRate : input.rates.arbitrageurRate;
        specs.push({
          level: 1,
          beneficiary: { type: "arbitrageur", arbitrageurId: node.referredByArbitrageId, customRate },
          rate,
          commissionAmount: round2(input.depositAmount * rate)
        });
      }
      break;
    }

    const referrerId = node.referredByInvestorId;
    if (!referrerId || visited.has(referrerId)) break; // no referrer, or a cycle

    const rate = level === 1 ? input.rates.investorReferrerRate : input.rates.secondLevelRate;
    specs.push({
      level: level as 1 | 2,
      beneficiary: { type: "investor", investorId: referrerId },
      rate,
      commissionAmount: round2(input.depositAmount * rate)
    });
    visited.add(referrerId);
    currentId = referrerId; // walk one hop up for the next level
  }

  return specs;
}

export type AccruedCommission = {
  commission: ReferralCommission;
  referrerName: string;
  referrerType: "arbitrageur" | "investor";
  level: number;
};

// Creates PENDING commissions for a confirmed deposit: a level-1 row for the
// direct referrer and, for investor chains, a level-2 row for the grandparent.
// Idempotency against double-confirmation is handled upstream by
// reviewDepositNotification's PENDING→CONFIRMED guard, so this only fires once
// per real confirmation.
export async function accrueReferralCommission(input: {
  investorId: string;
  depositAmount: number;
}): Promise<{ commissions: AccruedCommission[] }> {
  const depositor = await prisma.investor.findUnique({
    where: { id: input.investorId },
    select: { id: true, referredByArbitrageId: true, referredByInvestorId: true }
  });
  if (!depositor) return { commissions: [] };

  const program = await getReferralProgram();

  // Build only the graph slice the engine needs: the depositor, plus — when the
  // direct referrer is an investor — that investor's node, so a grandparent can
  // be reached. At most two investor reads regardless of chain length.
  const investors = new Map<string, ReferralGraphNode>();
  investors.set(depositor.id, {
    investorId: depositor.id,
    referredByInvestorId: depositor.referredByInvestorId,
    referredByArbitrageId: depositor.referredByArbitrageId
  });

  if (depositor.referredByInvestorId) {
    const l1 = await prisma.investor.findUnique({
      where: { id: depositor.referredByInvestorId },
      select: { id: true, referredByInvestorId: true, referredByArbitrageId: true }
    });
    if (l1) {
      investors.set(l1.id, {
        investorId: l1.id,
        referredByInvestorId: l1.referredByInvestorId,
        referredByArbitrageId: l1.referredByArbitrageId
      });
    }
  }

  const arbitrageurCustomRates = new Map<string, number | null>();
  if (depositor.referredByArbitrageId) {
    const arbitrageur = await prisma.arbitrageur.findUnique({
      where: { id: depositor.referredByArbitrageId },
      select: { customRate: true }
    });
    arbitrageurCustomRates.set(
      depositor.referredByArbitrageId,
      arbitrageur?.customRate != null ? Number(arbitrageur.customRate) : null
    );
  }

  const specs = computeReferralCommissions({
    depositorId: depositor.id,
    depositAmount: input.depositAmount,
    rates: {
      arbitrageurRate: Number(program.arbitrageurRate),
      investorReferrerRate: Number(program.investorReferrerRate),
      secondLevelRate: Number(program.secondLevelRate),
      minDeposit: Number(program.minDepositForCommission)
    },
    investors,
    arbitrageurCustomRates
  });

  // Resolve each beneficiary's name up front (reads) and confirm it still
  // exists — referredBy* are plain scalars, not FKs, so a dangling id is
  // possible after data edits. A vanished beneficiary is silently skipped.
  const resolved: Array<{ spec: CommissionSpec; referrerName: string }> = [];
  for (const spec of specs) {
    if (spec.beneficiary.type === "arbitrageur") {
      const arbitrageur = await prisma.arbitrageur.findUnique({ where: { id: spec.beneficiary.arbitrageurId }, select: { name: true } });
      if (!arbitrageur) continue;
      resolved.push({ spec, referrerName: arbitrageur.name });
    } else {
      const referrer = await prisma.investor.findUnique({ where: { id: spec.beneficiary.investorId }, select: { fullName: true } });
      if (!referrer) continue;
      resolved.push({ spec, referrerName: referrer.fullName });
    }
  }

  if (resolved.length === 0) return { commissions: [] };

  // Persist both levels atomically: a confirmation must never leave a level-1
  // row without its level-2 sibling (or an arbitrageur's totalEarned bumped
  // without the backing commission row).
  const created = await prisma.$transaction(async (tx) => {
    const rows: AccruedCommission[] = [];
    for (const { spec, referrerName } of resolved) {
      const commission = await tx.referralCommission.create({
        data: {
          arbitrageurId: spec.beneficiary.type === "arbitrageur" ? spec.beneficiary.arbitrageurId : null,
          investorReferrerId: spec.beneficiary.type === "investor" ? spec.beneficiary.investorId : null,
          referredInvestorId: depositor.id,
          level: spec.level,
          depositAmount: new Prisma.Decimal(input.depositAmount),
          commissionRate: new Prisma.Decimal(spec.rate),
          commissionAmount: new Prisma.Decimal(spec.commissionAmount),
          status: "PENDING"
        }
      });

      if (spec.beneficiary.type === "arbitrageur") {
        await tx.arbitrageur.update({
          where: { id: spec.beneficiary.arbitrageurId },
          data: { totalEarned: { increment: new Prisma.Decimal(spec.commissionAmount) } }
        });
      }

      rows.push({ commission, referrerName, referrerType: spec.beneficiary.type, level: spec.level });
    }
    return rows;
  });

  return { commissions: created };
}

// ---------------------------------------------------------------------------
// Arbitrageur accounts (Block 3)
// ---------------------------------------------------------------------------

export type SerializedArbitrageur = {
  id: string;
  name: string;
  email: string;
  telegramHandle: string | null;
  referralCode: string;
  customRate: number | null;
  status: string;
  totalEarned: number;
  totalPaid: number;
  createdAt: string;
};

export function serializeArbitrageur(arbitrageur: Arbitrageur): SerializedArbitrageur {
  return {
    id: arbitrageur.id,
    name: arbitrageur.name,
    email: arbitrageur.email,
    telegramHandle: arbitrageur.telegramHandle,
    referralCode: arbitrageur.referralCode,
    customRate: arbitrageur.customRate != null ? Number(arbitrageur.customRate) : null,
    status: arbitrageur.status,
    totalEarned: Number(arbitrageur.totalEarned),
    totalPaid: Number(arbitrageur.totalPaid),
    createdAt: arbitrageur.createdAt.toISOString()
  };
}

export async function createArbitrageur(input: {
  name: string;
  email: string;
  telegramHandle: string | null;
  passwordHash: string;
}): Promise<Arbitrageur> {
  const referralCode = await generateUniqueReferralCode();
  return prisma.arbitrageur.create({
    data: {
      name: input.name,
      email: input.email.toLowerCase(),
      telegramHandle: input.telegramHandle,
      passwordHash: input.passwordHash,
      referralCode,
      status: "PENDING"
    }
  });
}

export async function findArbitrageurByEmail(email: string): Promise<Arbitrageur | null> {
  return prisma.arbitrageur.findUnique({ where: { email: email.toLowerCase() } });
}

export async function findArbitrageurById(id: string): Promise<Arbitrageur | null> {
  return prisma.arbitrageur.findUnique({ where: { id } });
}

export async function setArbitrageurStatus(id: string, status: ArbitrageurStatus): Promise<Arbitrageur> {
  return prisma.arbitrageur.update({ where: { id }, data: { status } });
}

export async function setArbitrageurCustomRate(id: string, rate: number | null): Promise<Arbitrageur> {
  return prisma.arbitrageur.update({
    where: { id },
    data: { customRate: rate == null ? null : new Prisma.Decimal(rate) }
  });
}

// ---------------------------------------------------------------------------
// Aggregations
// ---------------------------------------------------------------------------

export type ReferralCommissionRow = {
  id: string;
  referredInvestorMasked: string;
  depositAmount: number;
  commissionRate: number;
  commissionAmount: number;
  status: string;
  note: string | null;
  paidAt: string | null;
  createdAt: string;
};

function serializeCommissionRow(
  commission: ReferralCommission & { referredInvestor: { fullName: string } }
): ReferralCommissionRow {
  return {
    id: commission.id,
    referredInvestorMasked: maskInvestorName(commission.referredInvestor.fullName),
    depositAmount: Number(commission.depositAmount),
    commissionRate: Number(commission.commissionRate),
    commissionAmount: Number(commission.commissionAmount),
    status: commission.status,
    note: commission.note,
    paidAt: commission.paidAt ? commission.paidAt.toISOString() : null,
    createdAt: commission.createdAt.toISOString()
  };
}

export type ArbitrageurDashboard = {
  arbitrageur: SerializedArbitrageur;
  stats: {
    totalClicks: number;
    applications: number;
    approvedInvestors: number;
    confirmedDeposits: number;
    suspiciousClicks: number;
  };
  earnings: { accrued: number; paid: number; pending: number };
  commissions: ReferralCommissionRow[];
};

async function computeArbitrageurEarnings(arbitrageurId: string) {
  const [accrued, paid] = await Promise.all([
    prisma.referralCommission.aggregate({ where: { arbitrageurId }, _sum: { commissionAmount: true } }),
    prisma.referralCommission.aggregate({ where: { arbitrageurId, status: "PAID" }, _sum: { commissionAmount: true } })
  ]);
  const accruedTotal = Number(accrued._sum.commissionAmount ?? 0);
  const paidTotal = Number(paid._sum.commissionAmount ?? 0);
  return { accrued: accruedTotal, paid: paidTotal, pending: Number((accruedTotal - paidTotal).toFixed(2)) };
}

export async function getArbitrageurDashboard(arbitrageurId: string): Promise<ArbitrageurDashboard | null> {
  const arbitrageur = await prisma.arbitrageur.findUnique({ where: { id: arbitrageurId } });
  if (!arbitrageur) return null;

  const [totalClicks, suspiciousClicks, applications, approvedInvestors, confirmedDeposits, commissions, earnings] =
    await Promise.all([
      prisma.referralClick.count({ where: { arbitrageurId } }),
      prisma.referralClick.count({ where: { arbitrageurId, suspicious: true } }),
      prisma.investorApplication.count({ where: { referredByArbitrageId: arbitrageurId } }),
      prisma.investor.count({ where: { referredByArbitrageId: arbitrageurId } }),
      prisma.depositNotification.count({
        where: { status: "CONFIRMED", investor: { referredByArbitrageId: arbitrageurId } }
      }),
      prisma.referralCommission.findMany({
        where: { arbitrageurId },
        include: { referredInvestor: { select: { fullName: true } } },
        orderBy: { createdAt: "desc" },
        take: 100
      }),
      computeArbitrageurEarnings(arbitrageurId)
    ]);

  return {
    arbitrageur: serializeArbitrageur(arbitrageur),
    stats: { totalClicks, applications, approvedInvestors, confirmedDeposits, suspiciousClicks },
    earnings,
    commissions: commissions.map(serializeCommissionRow)
  };
}

export type AdminArbitrageurRow = SerializedArbitrageur & {
  totalClicks: number;
  suspiciousClicks: number;
  approvedInvestors: number;
  pendingCommission: number;
};

export async function listArbitrageursForAdmin(): Promise<AdminArbitrageurRow[]> {
  const arbitrageurs = await prisma.arbitrageur.findMany({ orderBy: { createdAt: "desc" } });
  return Promise.all(
    arbitrageurs.map(async (arbitrageur) => {
      const [totalClicks, suspiciousClicks, approvedInvestors, earnings] = await Promise.all([
        prisma.referralClick.count({ where: { arbitrageurId: arbitrageur.id } }),
        prisma.referralClick.count({ where: { arbitrageurId: arbitrageur.id, suspicious: true } }),
        prisma.investor.count({ where: { referredByArbitrageId: arbitrageur.id } }),
        computeArbitrageurEarnings(arbitrageur.id)
      ]);
      return {
        ...serializeArbitrageur(arbitrageur),
        totalClicks,
        suspiciousClicks,
        approvedInvestors,
        pendingCommission: earnings.pending
      };
    })
  );
}

export type AdminCommissionRow = {
  id: string;
  referrerName: string;
  referrerType: "arbitrageur" | "investor";
  level: number;
  referredInvestorMasked: string;
  depositAmount: number;
  commissionRate: number;
  commissionAmount: number;
  status: string;
  note: string | null;
  paidAt: string | null;
  createdAt: string;
};

export async function listReferralCommissionsForAdmin(options: { status?: ReferralCommissionStatus } = {}): Promise<AdminCommissionRow[]> {
  const rows = await prisma.referralCommission.findMany({
    where: options.status ? { status: options.status } : undefined,
    include: {
      arbitrageur: { select: { name: true } },
      investorReferrer: { select: { fullName: true } },
      referredInvestor: { select: { fullName: true } }
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 500
  });

  return rows.map((row) => ({
    id: row.id,
    referrerName: row.arbitrageur?.name ?? row.investorReferrer?.fullName ?? "—",
    referrerType: row.arbitrageurId ? "arbitrageur" : "investor",
    level: row.level,
    referredInvestorMasked: maskInvestorName(row.referredInvestor.fullName),
    depositAmount: Number(row.depositAmount),
    commissionRate: Number(row.commissionRate),
    commissionAmount: Number(row.commissionAmount),
    status: row.status,
    note: row.note,
    paidAt: row.paidAt ? row.paidAt.toISOString() : null,
    createdAt: row.createdAt.toISOString()
  }));
}

// Marks a PENDING commission PAID (idempotent via the status guard) and bumps
// the arbitrageur's totalPaid when the commission belongs to one.
export async function markCommissionPaid(input: { id: string; note: string | null }): Promise<{ updated: boolean }> {
  const commission = await prisma.referralCommission.findUnique({ where: { id: input.id } });
  if (!commission || commission.status === "PAID") return { updated: false };

  await prisma.referralCommission.update({
    where: { id: input.id },
    data: { status: "PAID", paidAt: new Date(), note: input.note ?? commission.note }
  });

  if (commission.arbitrageurId) {
    await prisma.arbitrageur.update({
      where: { id: commission.arbitrageurId },
      data: { totalPaid: { increment: commission.commissionAmount } }
    });
  }

  return { updated: true };
}

// ---------------------------------------------------------------------------
// Investor-referrer view (Block 4)
// ---------------------------------------------------------------------------

export type InvestorReferralData = {
  referralCode: string | null;
  referredCount: number;
  totalBonus: number;
  pendingBonus: number;
  paidBonus: number;
  history: ReferralCommissionRow[];
};

export async function getInvestorReferralData(investorId: string): Promise<InvestorReferralData> {
  // Investors only ever see their DIRECT (level 1) commissions. Second-level
  // bonuses are admin-only, so they are excluded from every aggregate here — an
  // investor must not learn they have a "referral of a referral".
  const [investor, referredCount, commissions, accrued, paid] = await Promise.all([
    prisma.investor.findUnique({ where: { id: investorId }, select: { referralCode: true } }),
    prisma.investor.count({ where: { referredByInvestorId: investorId } }),
    prisma.referralCommission.findMany({
      where: { investorReferrerId: investorId, level: 1 },
      include: { referredInvestor: { select: { fullName: true } } },
      orderBy: { createdAt: "desc" },
      take: 100
    }),
    prisma.referralCommission.aggregate({ where: { investorReferrerId: investorId, level: 1 }, _sum: { commissionAmount: true } }),
    prisma.referralCommission.aggregate({ where: { investorReferrerId: investorId, level: 1, status: "PAID" }, _sum: { commissionAmount: true } })
  ]);

  const totalBonus = Number(accrued._sum.commissionAmount ?? 0);
  const paidBonus = Number(paid._sum.commissionAmount ?? 0);

  return {
    referralCode: investor?.referralCode ?? null,
    referredCount,
    totalBonus,
    pendingBonus: Number((totalBonus - paidBonus).toFixed(2)),
    paidBonus,
    history: commissions.map(serializeCommissionRow)
  };
}

// Ensures an investor has a referral code, generating one on demand. Safe to
// call repeatedly (returns the existing code if already set).
export async function ensureInvestorReferralCode(investorId: string): Promise<string> {
  const investor = await prisma.investor.findUnique({ where: { id: investorId }, select: { referralCode: true } });
  if (investor?.referralCode) return investor.referralCode;

  const code = await generateUniqueReferralCode();
  await prisma.investor.update({ where: { id: investorId }, data: { referralCode: code } });
  return code;
}

// One-shot backfill: give every investor without a referral code one. Returns
// the number updated. Used by the migration script / an admin trigger.
export async function backfillInvestorReferralCodes(): Promise<number> {
  const missing = await prisma.investor.findMany({ where: { referralCode: null }, select: { id: true } });
  let updated = 0;
  for (const investor of missing) {
    await ensureInvestorReferralCode(investor.id);
    updated += 1;
  }
  return updated;
}

// Resolves who referred an investor, for the admin "Источник" line.
export type InvestorReferralSource =
  | { type: "arbitrageur"; name: string }
  | { type: "investor"; name: string }
  | null;

export async function getInvestorReferralSource(input: {
  referredByArbitrageId: string | null;
  referredByInvestorId: string | null;
}): Promise<InvestorReferralSource> {
  if (input.referredByArbitrageId) {
    const arbitrageur = await prisma.arbitrageur.findUnique({
      where: { id: input.referredByArbitrageId },
      select: { name: true }
    });
    return arbitrageur ? { type: "arbitrageur", name: arbitrageur.name } : null;
  }
  if (input.referredByInvestorId) {
    const investor = await prisma.investor.findUnique({
      where: { id: input.referredByInvestorId },
      select: { fullName: true }
    });
    return investor ? { type: "investor", name: investor.fullName } : null;
  }
  return null;
}

import { prisma } from "./client";

export type InvestorBalanceSummary = {
  totalBalance: number;
  availableBalance: number;
  awaitingAllocation: number;
  workingCapital: number;
  pendingWithdrawals: number;
  recordedCapital: number;
  confirmedDeposits: number;
  retainedProfit: number;
  referralBonus: number;
  paidWithdrawals: number;
  hasActivity: boolean;
};

const WORKING_ALLOCATION_STATUSES = ["DRAFT", "PURCHASING", "SHIPPING", "RECEIVED", "SELLING"];
const PENDING_WITHDRAWAL_STATUSES = ["REQUESTED", "APPROVED", "SCHEDULED"];

function money(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function rounded(value: number) {
  return Number(value.toFixed(2));
}

export function calculateCapitalAfterConfirmedDeposit(input: {
  recordedCapital: number;
  depositAmount: number;
  hasEstablishedCapitalActivity: boolean;
}) {
  return input.hasEstablishedCapitalActivity
    ? rounded(input.recordedCapital + input.depositAmount)
    : rounded(Math.max(input.recordedCapital, input.depositAmount));
}

export function calculateInvestorBalanceSummary(input: {
  recordedCapital: number;
  confirmedDeposits: number;
  retainedProfit: number;
  referralBonus: number;
  paidWithdrawals: number;
  pendingWithdrawals: number;
  workingCapital: number;
}): InvestorBalanceSummary {
  const principalCapital = Math.max(input.recordedCapital, input.confirmedDeposits, input.workingCapital);
  const totalBalance = principalCapital + input.retainedProfit + input.referralBonus - input.paidWithdrawals;
  const awaitingAllocation = Math.max(0, totalBalance - input.workingCapital - input.pendingWithdrawals);

  return {
    totalBalance: rounded(totalBalance),
    availableBalance: rounded(awaitingAllocation),
    awaitingAllocation: rounded(awaitingAllocation),
    workingCapital: rounded(input.workingCapital),
    pendingWithdrawals: rounded(input.pendingWithdrawals),
    recordedCapital: rounded(input.recordedCapital),
    confirmedDeposits: rounded(input.confirmedDeposits),
    retainedProfit: rounded(input.retainedProfit),
    referralBonus: rounded(input.referralBonus),
    paidWithdrawals: rounded(input.paidWithdrawals),
    hasActivity: principalCapital !== 0 || input.retainedProfit !== 0 || input.referralBonus !== 0 || input.paidWithdrawals !== 0
  };
}

export async function getInvestorBalanceSummary(investorId: string): Promise<InvestorBalanceSummary> {
  const [investor, deposits, profitCredits, paidWithdrawals, pendingWithdrawals, allocations, referralBonus] = await Promise.all([
    prisma.investor.findUnique({
      where: { id: investorId },
      select: { totalCapital: true }
    }),
    prisma.depositNotification.aggregate({
      where: { investorId, status: "CONFIRMED" },
      _sum: { amount: true }
    }),
    prisma.ledgerEntry.findMany({
      where: {
        investorId,
        ledgerType: "INVESTOR_BALANCE",
        entryType: "PROFIT",
        isReversal: false,
        voidedAt: null
      },
      select: { amount: true }
    }),
    prisma.withdrawalRequest.findMany({
      where: { investorId, status: "PAID" },
      select: { amount: true }
    }),
    prisma.withdrawalRequest.findMany({
      where: { investorId, status: { in: PENDING_WITHDRAWAL_STATUSES } },
      select: { amount: true }
    }),
    prisma.allocation.findMany({
      where: { investorId },
      select: { allocationAmount: true, status: true }
    }),
    prisma.referralCommission.aggregate({
      where: { investorReferrerId: investorId, status: "PAID" },
      _sum: { commissionAmount: true }
    })
  ]);

  const confirmedDeposits = money(deposits._sum.amount);
  const retainedProfit = profitCredits.reduce((sum, entry) => sum + money(entry.amount), 0);
  const referralBonusAmount = money(referralBonus._sum.commissionAmount);
  const paidWithdrawalAmount = paidWithdrawals.reduce((sum, withdrawal) => sum + money(withdrawal.amount), 0);
  const pendingWithdrawalAmount = pendingWithdrawals.reduce((sum, withdrawal) => sum + money(withdrawal.amount), 0);
  const workingCapital = allocations
    .filter((allocation) => WORKING_ALLOCATION_STATUSES.includes(allocation.status))
    .reduce((sum, allocation) => sum + money(allocation.allocationAmount), 0);
  return calculateInvestorBalanceSummary({
    recordedCapital: money(investor?.totalCapital),
    confirmedDeposits,
    retainedProfit,
    referralBonus: referralBonusAmount,
    paidWithdrawals: paidWithdrawalAmount,
    pendingWithdrawals: pendingWithdrawalAmount,
    workingCapital
  });
}

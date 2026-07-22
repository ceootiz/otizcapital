import { prisma } from "./client";

export type InvestorBalanceSummary = {
  totalBalance: number;
  availableBalance: number;
  workingCapital: number;
  pendingWithdrawals: number;
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

export async function getInvestorBalanceSummary(investorId: string): Promise<InvestorBalanceSummary> {
  const [deposits, profitCredits, paidWithdrawals, pendingWithdrawals, workingAllocations, referralBonus] = await Promise.all([
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
      where: { investorId, status: { in: WORKING_ALLOCATION_STATUSES } },
      select: { allocationAmount: true }
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
  const workingCapital = workingAllocations.reduce((sum, allocation) => sum + money(allocation.allocationAmount), 0);
  const totalBalance = confirmedDeposits + retainedProfit + referralBonusAmount - paidWithdrawalAmount;
  const availableBalance = Math.max(0, totalBalance - workingCapital - pendingWithdrawalAmount);

  return {
    totalBalance: rounded(totalBalance),
    availableBalance: rounded(availableBalance),
    workingCapital: rounded(workingCapital),
    pendingWithdrawals: rounded(pendingWithdrawalAmount),
    confirmedDeposits: rounded(confirmedDeposits),
    retainedProfit: rounded(retainedProfit),
    referralBonus: rounded(referralBonusAmount),
    paidWithdrawals: rounded(paidWithdrawalAmount),
    hasActivity: confirmedDeposits !== 0 || retainedProfit !== 0 || referralBonusAmount !== 0 || paidWithdrawalAmount !== 0
  };
}

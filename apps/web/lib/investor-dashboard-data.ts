import type { Investor } from "@prisma/client";
import { getInvestorDashboardDataForInvestor, getInvestorWithdrawalRequests, serializeInvestorWithdrawalRequest, type InvestorDashboardAllocation, type InvestorDashboardData as DatabaseInvestorDashboardData, type InvestorDashboardSummary } from "@otiz/database";

export type { InvestorDashboardAllocation, InvestorDashboardSummary };

export type InvestorWithdrawal = {
  id: string;
  amount: string;
  currency: string;
  status: string;
  requestedAt: string;
  approvedAt: string | null;
  rejectedAt: string | null;
  paidAt: string | null;
  scheduledFor: string | null;
  method: string | null;
  destinationMasked: string | null;
  investorNote: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type InvestorDashboardData = DatabaseInvestorDashboardData & {
  withdrawals: InvestorWithdrawal[];
};

export async function getInvestorDashboardData(investor: Pick<Investor, "id">): Promise<InvestorDashboardData> {
  const [data, withdrawalRequests] = await Promise.all([
    getInvestorDashboardDataForInvestor(investor.id),
    getInvestorWithdrawalRequests(investor.id)
  ]);

  if (!data) {
    throw new Error("Investor dashboard data is not available.");
  }

  return {
    ...data,
    withdrawals: withdrawalRequests.map(serializeInvestorWithdrawalRequest)
  };
}

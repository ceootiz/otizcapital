import { prisma } from "./client";
import { getExpectedPayoutsForMonth } from "./investor-payments";

// Aggregated business snapshot for the admin dashboard. All queries are
// read-only; money strings are coerced with Number() like the rest of the app.

export type AdminDashboardInvestor = {
  id: string;
  fullName: string;
  email: string;
  status: string;
  totalCapital: number;
  lastReportAt: string | null;
  allocationsCount: number;
};

export type AdminDashboardData = {
  totalCapital: number;
  activeInvestorsCount: number;
  expectedPayoutsThisMonth: number;
  newApplications7d: number;
  investors: AdminDashboardInvestor[];
  topInvestors: AdminDashboardInvestor[];
  pending: {
    staleApplications: number;
    pendingWithdrawals: number;
    investorsWithoutAllocation: number;
    unsignedDocuments: number;
  };
};

export async function getAdminDashboardData(now = new Date()): Promise<AdminDashboardData> {
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [activeInvestorRows, newApplications7d, staleApplications, pendingWithdrawals, unsignedDocuments, expectedPayoutsThisMonth] =
    await Promise.all([
      prisma.investor.findMany({
        where: { status: "ACTIVE" },
        select: {
          id: true,
          fullName: true,
          email: true,
          status: true,
          totalCapital: true,
          lastReportAt: true,
          _count: { select: { allocations: true } }
        },
        orderBy: { createdAt: "desc" }
      }),
      prisma.investorApplication.count({ where: { createdAt: { gte: weekAgo } } }),
      // Applications waiting on a first response for more than 24h.
      prisma.investorApplication.count({ where: { status: "NEW", contactedAt: null, createdAt: { lte: dayAgo } } }),
      prisma.withdrawalRequest.count({ where: { status: "REQUESTED" } }),
      prisma.investorDocument.count({ where: { status: "PENDING_SIGNATURE" } }),
      getExpectedPayoutsForMonth(now)
    ]);

  const investors: AdminDashboardInvestor[] = activeInvestorRows.map((row) => ({
    id: row.id,
    fullName: row.fullName,
    email: row.email,
    status: row.status,
    totalCapital: Number(row.totalCapital) || 0,
    lastReportAt: row.lastReportAt?.toISOString() ?? null,
    allocationsCount: row._count.allocations
  }));

  const byCapitalDesc = [...investors].sort((a, b) => b.totalCapital - a.totalCapital);

  return {
    totalCapital: investors.reduce((sum, investor) => sum + investor.totalCapital, 0),
    activeInvestorsCount: investors.length,
    expectedPayoutsThisMonth,
    newApplications7d,
    investors: byCapitalDesc,
    topInvestors: byCapitalDesc.slice(0, 5),
    pending: {
      staleApplications,
      pendingWithdrawals,
      investorsWithoutAllocation: investors.filter((investor) => investor.allocationsCount === 0).length,
      unsignedDocuments
    }
  };
}

// Flat per-investor rows for the XLSX export (all investors, any status), with
// total profit summed from allocation actualProfit values.
export type AdminExportRow = {
  fullName: string;
  email: string;
  totalCapital: number;
  status: string;
  totalProfit: number;
  lastReportAt: string | null;
};

export async function getAdminExportRows(): Promise<AdminExportRow[]> {
  const rows = await prisma.investor.findMany({
    select: {
      fullName: true,
      email: true,
      totalCapital: true,
      status: true,
      lastReportAt: true,
      allocations: { select: { actualProfit: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return rows.map((row) => ({
    fullName: row.fullName,
    email: row.email,
    totalCapital: Number(row.totalCapital) || 0,
    status: row.status,
    totalProfit: row.allocations.reduce((sum, allocation) => sum + (Number(allocation.actualProfit) || 0), 0),
    lastReportAt: row.lastReportAt?.toISOString() ?? null
  }));
}

import { NextResponse } from "next/server";
import {
  countPaymentsByFileReport,
  getReportProfitCreditSummaries,
  findInvestorById,
  getLatestAgreementForInvestor,
  listInvestorFileReports,
  serializeInvestorDocument,
  serializeInvestorFileReport
} from "@otiz/database";
import { getAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

// GET: list the XLSX file reports uploaded for this investor (metadata only).
export async function GET(_request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = getAdminSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const investor = await findInvestorById(params.id);
  if (!investor) {
    return NextResponse.json({ ok: false, error: "Investor not found." }, { status: 404 });
  }

  const [reports, agreement, paymentCounts, creditSummaries] = await Promise.all([
    listInvestorFileReports(investor.id),
    getLatestAgreementForInvestor(investor.id),
    countPaymentsByFileReport(investor.id),
    getReportProfitCreditSummaries(investor.id)
  ]);

  return NextResponse.json({
    ok: true,
    data: reports.map((report) => ({
      ...serializeInvestorFileReport(report),
      parsedRows: paymentCounts[report.id] ?? 0,
      credit: creditSummaries[report.id] ?? { profitTotal: 0, creditedProfit: 0, uncreditedProfit: 0 }
    })),
    agreement: agreement ? serializeInvestorDocument(agreement) : null
  });
}

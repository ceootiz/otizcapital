import { NextResponse } from "next/server";
import { listInvestorFileReports, serializeInvestorFileReport } from "@otiz/database";
import { investorApiErrorResponse, requireInvestorApi } from "@/lib/investor-api-auth";

export const dynamic = "force-dynamic";

// GET: list the admin-uploaded XLSX file reports for the signed-in investor.
export async function GET() {
  const auth = await requireInvestorApi();
  if (!auth.ok) return investorApiErrorResponse(auth);

  const reports = await listInvestorFileReports(auth.investor.id);
  return NextResponse.json({ ok: true, data: reports.map(serializeInvestorFileReport) });
}

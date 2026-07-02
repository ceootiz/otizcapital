import { NextResponse } from "next/server";
import {
  findInvestorById,
  getLatestAgreementForInvestor,
  listInvestorFileReports,
  serializeInvestorDocument,
  serializeInvestorFileReport
} from "@otiz/database";
import { getAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

// GET: list the XLSX file reports uploaded for this investor (metadata only).
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = getAdminSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const investor = await findInvestorById(params.id);
  if (!investor) {
    return NextResponse.json({ ok: false, error: "Investor not found." }, { status: 404 });
  }

  const [reports, agreement] = await Promise.all([
    listInvestorFileReports(investor.id),
    getLatestAgreementForInvestor(investor.id)
  ]);

  return NextResponse.json({
    ok: true,
    data: reports.map(serializeInvestorFileReport),
    agreement: agreement ? serializeInvestorDocument(agreement) : null
  });
}

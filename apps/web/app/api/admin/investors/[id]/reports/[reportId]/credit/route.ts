import { NextResponse } from "next/server";
import { creditInvestorReportProfit } from "@otiz/database";
import { verifyAdminCsrfToken } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: { id: string; reportId: string } }) {
  const csrf = verifyAdminCsrfToken(request);
  if (!csrf.ok) return NextResponse.json({ ok: false, error: csrf.error }, { status: csrf.status });

  const result = await creditInvestorReportProfit({
    investorId: params.id,
    fileReportId: params.reportId,
    actor: csrf.session.actor
  });
  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: result.status });

  return NextResponse.json({ ok: true, creditedAmount: result.creditedAmount });
}

import { NextResponse } from "next/server";
import { cancelInvestorWithdrawalRequest, serializeInvestorWithdrawalRequest } from "@otiz/database";
import { investorApiErrorResponse, requireInvestorApi } from "@/lib/investor-api-auth";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireInvestorApi();
  if (!auth.ok) return investorApiErrorResponse(auth);
  const { id } = await context.params;
  const result = await cancelInvestorWithdrawalRequest({ id, investorId: auth.investor.id });
  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true, data: serializeInvestorWithdrawalRequest(result.request) });
}

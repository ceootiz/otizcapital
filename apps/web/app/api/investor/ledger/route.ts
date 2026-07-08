import { NextResponse } from "next/server";
import { getInvestorLedger } from "@otiz/database";
import { investorApiErrorResponse, requireInvestorApi } from "@/lib/investor-api-auth";

export const dynamic = "force-dynamic";

// GET: the signed-in investor's unified transaction ledger (deposits,
// allocations, yield, reinvests, withdrawals, direct referral bonuses) as one
// paginated, chronological feed. Filters: ?type= ?from= ?to= ?page= ?pageSize=
// All filters are normalized/clamped inside getInvestorLedger.
export async function GET(request: Request) {
  const auth = await requireInvestorApi();
  if (!auth.ok) return investorApiErrorResponse(auth);

  const url = new URL(request.url);
  const page = await getInvestorLedger(auth.investor.id, {
    type: url.searchParams.get("type"),
    from: url.searchParams.get("from"),
    to: url.searchParams.get("to"),
    page: url.searchParams.get("page"),
    pageSize: url.searchParams.get("pageSize")
  });

  return NextResponse.json({ ok: true, data: page });
}

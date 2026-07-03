import { NextResponse } from "next/server";
import { getInvestorPaymentTotals, listInvestorPayments, serializeInvestorPayment } from "@otiz/database";
import { investorApiErrorResponse, requireInvestorApi } from "@/lib/investor-api-auth";

export const dynamic = "force-dynamic";

// GET: the signed-in investor's extracted payment history + totals.
export async function GET() {
  const auth = await requireInvestorApi();
  if (!auth.ok) return investorApiErrorResponse(auth);

  const [payments, totals] = await Promise.all([
    listInvestorPayments(auth.investor.id),
    getInvestorPaymentTotals(auth.investor.id)
  ]);

  return NextResponse.json({ ok: true, data: payments.map(serializeInvestorPayment), totals });
}

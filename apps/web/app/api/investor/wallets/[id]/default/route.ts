import { NextResponse } from "next/server";
import { setDefaultInvestorWallet } from "@otiz/database";
import { investorApiErrorResponse, requireInvestorApi } from "@/lib/investor-api-auth";

export const dynamic = "force-dynamic";

// PATCH: mark one of the investor's wallets as the default withdrawal destination.
export async function PATCH(_request: Request, { params }: { params: { id: string } }) {
  const auth = await requireInvestorApi();
  if (!auth.ok) return investorApiErrorResponse(auth);
  const updated = await setDefaultInvestorWallet(auth.investor.id, params.id);
  if (!updated) return NextResponse.json({ ok: false, error: "Wallet not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}

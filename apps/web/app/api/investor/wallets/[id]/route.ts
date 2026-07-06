import { NextResponse } from "next/server";
import { deleteInvestorWallet } from "@otiz/database";
import { investorApiErrorResponse, requireInvestorApi } from "@/lib/investor-api-auth";

export const dynamic = "force-dynamic";

// DELETE: remove one of the signed-in investor's saved wallets.
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const auth = await requireInvestorApi();
  if (!auth.ok) return investorApiErrorResponse(auth);
  const deleted = await deleteInvestorWallet(auth.investor.id, params.id);
  if (!deleted) return NextResponse.json({ ok: false, error: "Wallet not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}

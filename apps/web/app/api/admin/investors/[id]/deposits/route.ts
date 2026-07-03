import { NextResponse } from "next/server";
import { findInvestorById, listDepositNotificationsForInvestor, serializeDepositNotification } from "@otiz/database";
import { getAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

// GET: this investor's deposit claims for the admin detail page.
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = getAdminSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const investor = await findInvestorById(params.id);
  if (!investor) {
    return NextResponse.json({ ok: false, error: "Investor not found." }, { status: 404 });
  }

  const rows = await listDepositNotificationsForInvestor(investor.id);
  return NextResponse.json({ ok: true, data: rows.map(serializeDepositNotification) });
}

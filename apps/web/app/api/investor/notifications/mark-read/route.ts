import { NextResponse } from "next/server";
import { markAllInvestorNotificationsRead } from "@otiz/database";
import { investorApiErrorResponse, requireInvestorApi } from "@/lib/investor-api-auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const auth = await requireInvestorApi();
  if (!auth.ok) return investorApiErrorResponse(auth);

  await markAllInvestorNotificationsRead(auth.investor.id);

  return NextResponse.json({ ok: true });
}

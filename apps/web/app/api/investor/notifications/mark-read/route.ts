import { NextResponse } from "next/server";
import { markAllInvestorNotificationsRead } from "@otiz/database";
import { requireInvestorApi } from "@/lib/investor-api-auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const auth = await requireInvestorApi();
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  await markAllInvestorNotificationsRead(auth.investor.id);

  return NextResponse.json({ ok: true });
}

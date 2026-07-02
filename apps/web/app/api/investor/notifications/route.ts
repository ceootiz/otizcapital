import { NextResponse } from "next/server";
import { countUnreadInvestorNotifications, listInvestorNotifications, serializeInvestorNotification } from "@otiz/database";
import { requireInvestorApi } from "@/lib/investor-api-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireInvestorApi();
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const [rows, unreadCount] = await Promise.all([
    listInvestorNotifications(auth.investor.id, 20),
    countUnreadInvestorNotifications(auth.investor.id)
  ]);

  return NextResponse.json({ ok: true, unreadCount, notifications: rows.map(serializeInvestorNotification) });
}

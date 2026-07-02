import { NextResponse } from "next/server";
import { listInvestorSessions, serializeInvestorSession } from "@otiz/database";
import { requireInvestorApi } from "@/lib/investor-api-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireInvestorApi();
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const rows = await listInvestorSessions(auth.investor.id, 10);
  const sessions = rows.map((row) => ({
    ...serializeInvestorSession(row),
    isCurrent: row.id === auth.session.sessionId
  }));

  return NextResponse.json({ ok: true, sessions });
}

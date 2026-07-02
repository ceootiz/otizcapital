import { NextResponse } from "next/server";
import { terminateAllInvestorSessions } from "@otiz/database";
import { requireInvestorApi } from "@/lib/investor-api-auth";
import { clearInvestorSession } from "@/lib/investor-session";

export const dynamic = "force-dynamic";

// Terminates every session for the investor and clears the current cookie.
// Other devices lose access on their next request (DB session check fails).
export async function POST() {
  const auth = await requireInvestorApi();
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  await terminateAllInvestorSessions(auth.investor.id);
  clearInvestorSession();

  return NextResponse.json({ ok: true });
}

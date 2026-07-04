import { NextResponse } from "next/server";
import { backfillInvestorReferralCodes } from "@otiz/database";
import { verifyAdminCsrfToken } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

// POST: generate referral codes for every investor that lacks one (Block 4
// migration). Idempotent — investors that already have a code are skipped.
export async function POST(request: Request) {
  const csrf = verifyAdminCsrfToken(request);
  if (!csrf.ok) return NextResponse.json({ ok: false, error: csrf.error }, { status: csrf.status });

  const updated = await backfillInvestorReferralCodes();
  return NextResponse.json({ ok: true, data: { updated } });
}

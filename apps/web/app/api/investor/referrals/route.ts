import { NextResponse } from "next/server";
import { ensureInvestorReferralCode, getInvestorReferralData, isProductFeatureEnabled } from "@otiz/database";
import { investorApiErrorResponse, requireInvestorApi } from "@/lib/investor-api-auth";

export const dynamic = "force-dynamic";

// GET: the investor's referral link + referral bonus stats/history. Ensures a
// referral code exists (covers legacy investors created before the field), then
// returns the data for the settings "Referral program" section.
export async function GET() {
  const auth = await requireInvestorApi();
  if (!auth.ok) return investorApiErrorResponse(auth);

  await ensureInvestorReferralCode(auth.investor.id);
  const [data, shareEnabled] = await Promise.all([
    getInvestorReferralData(auth.investor.id),
    isProductFeatureEnabled("referral-share")
  ]);

  return NextResponse.json({
    ok: true,
    data: {
      ...data,
      shareEnabled
    }
  });
}

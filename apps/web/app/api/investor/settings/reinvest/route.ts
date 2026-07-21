import { NextResponse } from "next/server";
import { isProductFeatureEnabled, updateInvestorRecord } from "@otiz/database";
import { investorApiErrorResponse, requireInvestorApi } from "@/lib/investor-api-auth";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const auth = await requireInvestorApi();
  if (!auth.ok) return investorApiErrorResponse(auth);

  if (!(await isProductFeatureEnabled("reinvest-preference"))) {
    return NextResponse.json({ ok: false, error: "Reinvestment preference saving is temporarily unavailable." }, { status: 503 });
  }

  const payload = (await request.json().catch(() => null)) as { enabled?: unknown } | null;
  if (!payload || typeof payload.enabled !== "boolean") {
    return NextResponse.json({ ok: false, error: "enabled must be a boolean." }, { status: 422 });
  }

  const result = await updateInvestorRecord({
    id: auth.investor.id,
    reinvestEnabled: payload.enabled,
    actor: `investor:${auth.investor.id}`
  });

  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true, enabled: result.investor.reinvestEnabled });
}

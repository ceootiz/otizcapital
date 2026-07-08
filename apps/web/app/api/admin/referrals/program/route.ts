import { NextResponse } from "next/server";
import { serializeReferralProgram, updateReferralProgram } from "@otiz/database";
import { verifyAdminCsrfToken } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

function parseRate(value: unknown): number | undefined {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0 || num > 1) return undefined;
  return num;
}

function parseMin(value: unknown): number | undefined {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return undefined;
  return num;
}

// PATCH: update program rates (0..1 fractions) and the commission minimum.
export async function PATCH(request: Request) {
  const csrf = verifyAdminCsrfToken(request);
  if (!csrf.ok) return NextResponse.json({ ok: false, error: csrf.error }, { status: csrf.status });

  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!payload) return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 422 });

  const arbitrageurRate = parseRate(payload.arbitrageurRate);
  const investorReferrerRate = parseRate(payload.investorReferrerRate);
  const secondLevelRate = parseRate(payload.secondLevelRate);
  const minDepositForCommission = parseMin(payload.minDepositForCommission);

  if (
    arbitrageurRate === undefined &&
    investorReferrerRate === undefined &&
    secondLevelRate === undefined &&
    minDepositForCommission === undefined
  ) {
    return NextResponse.json({ ok: false, error: "Nothing valid to update. Rates must be between 0 and 1." }, { status: 422 });
  }

  const program = await updateReferralProgram({ arbitrageurRate, investorReferrerRate, secondLevelRate, minDepositForCommission });
  return NextResponse.json({ ok: true, data: serializeReferralProgram(program) });
}

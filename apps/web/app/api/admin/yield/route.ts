import { NextResponse } from "next/server";
import { getYieldSettings, setYieldSettings } from "@otiz/database";
import { getAdminSession, verifyAdminCsrfToken } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

// GET /api/admin/yield — current annual rate for the homepage yield calculator.
export async function GET() {
  if (!getAdminSession()) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const settings = await getYieldSettings();
  return NextResponse.json({
    ok: true,
    annualRatePercent: settings.annualRatePercent,
    updatedAt: settings.updatedAt
  });
}

// PUT /api/admin/yield  { annualRatePercent } — update the calculator rate.
export async function PUT(request: Request) {
  const csrf = verifyAdminCsrfToken(request);
  if (!csrf.ok) return NextResponse.json({ ok: false, error: csrf.error }, { status: csrf.status });

  const payload = (await request.json().catch(() => null)) as { annualRatePercent?: unknown } | null;
  if (!payload) return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 422 });

  const rate = payload.annualRatePercent;
  if (typeof rate !== "number" || !Number.isFinite(rate) || rate < 0 || rate > 1000) {
    return NextResponse.json({ ok: false, error: "Annual rate must be a number between 0 and 1000." }, { status: 422 });
  }

  const settings = await setYieldSettings(rate);
  return NextResponse.json({ ok: true, annualRatePercent: settings.annualRatePercent });
}

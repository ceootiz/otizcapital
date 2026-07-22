import { NextResponse } from "next/server";
import { forceUnlockInvestorWithdrawals, getInvestorWithdrawalLockStatus } from "@otiz/database";
import { getAdminSession, verifyAdminCsrfToken } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

function sanitizeReason(value: unknown) {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, 1000);
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = getAdminSession();
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  return NextResponse.json({ ok: true, data: await getInvestorWithdrawalLockStatus(params.id) });
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const csrf = verifyAdminCsrfToken(request);
  if (!csrf.ok) return NextResponse.json({ ok: false, error: csrf.error }, { status: csrf.status });
  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const reason = sanitizeReason(payload?.reason);
  if (!reason) return NextResponse.json({ ok: false, error: "Unlock reason is required." }, { status: 422 });

  const result = await forceUnlockInvestorWithdrawals({ investorId: params.id, actor: csrf.session.actor, reason });
  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true, data: result.access });
}

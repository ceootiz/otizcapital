import { NextResponse } from "next/server";
import { prisma } from "@otiz/database";
import { getAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

// GET: lightweight summary of pending (REQUESTED) withdrawals for the dashboard
// widget — count + total amount. Read-only, admin-session gated.
export async function GET() {
  const session = getAdminSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const pending = await prisma.withdrawalRequest.findMany({
    where: { status: "REQUESTED" },
    select: { amount: true }
  });

  const total = pending.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
  return NextResponse.json({ ok: true, count: pending.length, total });
}

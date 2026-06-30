import { NextResponse } from "next/server";
import { processPendingNotificationEvents } from "@otiz/database";
import { verifyAdminCsrfToken } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

function parseLimit(value: unknown) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 25;
  }

  return Math.min(100, Math.floor(parsed));
}

export async function POST(request: Request) {
  const csrf = verifyAdminCsrfToken(request);

  if (!csrf.ok) {
    return NextResponse.json({ ok: false, error: csrf.error }, { status: csrf.status });
  }

  const payload = (await request.json().catch(() => ({}))) as { limit?: unknown };
  const result = await processPendingNotificationEvents({
    actor: csrf.session.actor,
    limit: parseLimit(payload.limit)
  });

  return NextResponse.json({ ok: true, data: result });
}

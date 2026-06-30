import { NextResponse } from "next/server";
import { clearAdminSession, verifyAdminCsrfToken } from "@/lib/admin-session";

export async function POST(request: Request) {
  const csrf = verifyAdminCsrfToken(request);

  if (!csrf.ok) {
    return NextResponse.json({ ok: false, error: csrf.error }, { status: csrf.status });
  }

  clearAdminSession();

  return NextResponse.json({ ok: true });
}

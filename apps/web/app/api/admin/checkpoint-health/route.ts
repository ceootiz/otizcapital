import { NextResponse } from "next/server";
import { getAdminCheckpointHealthSummary } from "@otiz/database";
import { getAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = getAdminSession();
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  const snapshot = await getAdminCheckpointHealthSummary();
  return NextResponse.json({ ok: true, data: snapshot });
}

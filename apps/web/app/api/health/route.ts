import { NextResponse } from "next/server";
import { checkDatabaseConnection } from "@otiz/database";

export const dynamic = "force-dynamic";

// Uptime/health probe: returns 200 when the database responds, 503 otherwise.
export async function GET() {
  const db = await checkDatabaseConnection(3000);

  if (!db.ok) {
    return NextResponse.json(
      { ok: false, error: "db_unavailable", timestamp: new Date().toISOString() },
      { status: 503 }
    );
  }

  return NextResponse.json({ ok: true, timestamp: new Date().toISOString() });
}

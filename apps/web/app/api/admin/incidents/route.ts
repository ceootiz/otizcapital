import { NextResponse } from "next/server";
import { getOperationalIncidents, serializeOperationalIncident } from "@otiz/database";
import { getAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

function sanitizeString(value: unknown, maxLength = 120) {
  if (typeof value !== "string" && typeof value !== "number") return "";
  return String(value).replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export async function GET(request: Request) {
  const session = getAdminSession();
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });

  const url = new URL(request.url);
  const incidents = await getOperationalIncidents({
    severity: sanitizeString(url.searchParams.get("severity"), 20),
    status: sanitizeString(url.searchParams.get("status"), 24),
    source: sanitizeString(url.searchParams.get("source"), 40),
    limit: sanitizeString(url.searchParams.get("limit"), 12) || 100
  });

  return NextResponse.json({ ok: true, data: incidents.map(serializeOperationalIncident) });
}

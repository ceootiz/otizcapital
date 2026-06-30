import { NextResponse } from "next/server";
import { listAuditLogs, serializeAuditLog } from "@otiz/database";
import { getAdminSession } from "@/lib/admin-session";

function sanitizeString(value: unknown, maxLength = 120) {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export async function GET(request: Request) {
  const session = getAdminSession();

  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const url = new URL(request.url);
  const entityType = sanitizeString(url.searchParams.get("entityType"));
  const entityId = sanitizeString(url.searchParams.get("entityId"));

  if (!entityType || !entityId) {
    return NextResponse.json({ ok: false, error: "entityType and entityId are required." }, { status: 422 });
  }

  const items = await listAuditLogs({ entityType, entityId });

  return NextResponse.json({ ok: true, data: items.map(serializeAuditLog) });
}

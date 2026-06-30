import { NextResponse } from "next/server";
import { listNotificationEventRecords, serializeNotificationEvent } from "@otiz/database";
import { getAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

function sanitizeString(value: unknown, maxLength = 120) {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function parseLimit(value: string | null) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 20;
  }

  return Math.min(100, Math.floor(parsed));
}

export async function GET(request: Request) {
  const session = getAdminSession();

  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const url = new URL(request.url);
  const entityType = sanitizeString(url.searchParams.get("entityType"));
  const entityId = sanitizeString(url.searchParams.get("entityId"));
  const limit = parseLimit(url.searchParams.get("limit"));

  if (!entityType || !entityId) {
    return NextResponse.json({ ok: false, error: "entityType and entityId are required." }, { status: 422 });
  }

  const items = await listNotificationEventRecords({ entityType, entityId, limit });

  return NextResponse.json({ ok: true, data: items.map(serializeNotificationEvent) });
}

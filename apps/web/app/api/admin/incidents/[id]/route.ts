import { NextResponse } from "next/server";
import { getOperationalIncidentDetail } from "@otiz/database";
import { getAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

function sanitizeString(value: unknown, maxLength = 160) {
  if (typeof value !== "string" && typeof value !== "number") return "";
  return String(value).replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = getAdminSession();
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const locale = sanitizeString(searchParams.get("locale"), 16) || "en";
  const detail = await getOperationalIncidentDetail(sanitizeString(params.id), locale);
  if (!detail) return NextResponse.json({ ok: false, error: "Incident not found." }, { status: 404 });

  return NextResponse.json({ ok: true, data: detail });
}

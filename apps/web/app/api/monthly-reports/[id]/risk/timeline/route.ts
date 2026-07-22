import { NextResponse } from "next/server";
import { getReportRiskTimeline } from "@otiz/database";
import { getAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

function sanitizeString(value: unknown, maxLength = 160) {
  if (typeof value !== "string" && typeof value !== "number") return "";
  return String(value).replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = getAdminSession();
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });

  const url = new URL(request.url);
  const timeline = await getReportRiskTimeline(sanitizeString(params.id), {
    source: url.searchParams.get("source"),
    limit: url.searchParams.get("limit")
  });
  return NextResponse.json({ ok: true, data: { events: timeline.events, appliedFilters: timeline.appliedFilters } });
}

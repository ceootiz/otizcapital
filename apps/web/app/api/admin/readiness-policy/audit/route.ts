import { NextResponse } from "next/server";
import { getReadinessPolicyAuditEvents, READINESS_POLICY_AUDIT_ACTIONS } from "@otiz/database";
import { getAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

const ACTIONS = new Set<string>(READINESS_POLICY_AUDIT_ACTIONS);

function sanitizeString(value: unknown, maxLength = 160) {
  if (typeof value !== "string" && typeof value !== "number") return "";
  return String(value).replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function parseLimit(value: string | null) {
  const limit = Number(value || 20);
  return Number.isFinite(limit) ? Math.min(Math.max(Math.trunc(limit), 1), 100) : 20;
}

export async function GET(request: Request) {
  const session = getAdminSession();
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });

  const url = new URL(request.url);
  const action = sanitizeString(url.searchParams.get("action") || "", 80);
  if (action && !ACTIONS.has(action)) {
    return NextResponse.json({ ok: false, error: "Invalid readiness policy audit action." }, { status: 422 });
  }

  const items = await getReadinessPolicyAuditEvents({
    policyId: sanitizeString(url.searchParams.get("policyId") || "", 160) || undefined,
    action: action || undefined,
    actor: sanitizeString(url.searchParams.get("actor") || "", 160) || undefined,
    limit: parseLimit(url.searchParams.get("limit"))
  });

  return NextResponse.json({ ok: true, data: items });
}

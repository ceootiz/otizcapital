import { NextResponse } from "next/server";
import { getLedgerEntryAuditTrail } from "@otiz/database";
import { getAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

function sanitizeString(value: unknown, maxLength = 1000) {
  if (typeof value !== "string" && typeof value !== "number") return "";
  return String(value).replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export async function GET(
  _request: Request,
  props: { params: Promise<{ id: string; entryId: string }> }
) {
  const params = await props.params;
  const session = getAdminSession();
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });

  const allocationId = sanitizeString(params.id, 160);
  const entryId = sanitizeString(params.entryId, 160);
  const auditTrail = await getLedgerEntryAuditTrail(entryId);

  if (!auditTrail || auditTrail.requestedEntry.allocationId !== allocationId) {
    return NextResponse.json({ ok: false, error: "Ledger entry not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, data: auditTrail });
}

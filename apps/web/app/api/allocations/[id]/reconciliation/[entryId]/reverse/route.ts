import { NextResponse } from "next/server";
import { calculateAllocationReconciliation, reverseLedgerEntry, syncOperationalIncidentFromReconciliation } from "@otiz/database";
import { verifyAdminCsrfToken } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

function sanitizeString(value: unknown, maxLength = 1000) {
  if (typeof value !== "string" && typeof value !== "number") return "";
  return String(value).replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export async function POST(request: Request, { params }: { params: { id: string; entryId: string } }) {
  const csrf = verifyAdminCsrfToken(request);
  if (!csrf.ok) return NextResponse.json({ ok: false, error: csrf.error }, { status: csrf.status });

  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!payload) return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 422 });

  const reversalReason = sanitizeString(payload.reversalReason, 500);
  if (!reversalReason) return NextResponse.json({ ok: false, error: "reversalReason is required." }, { status: 422 });

  const result = await reverseLedgerEntry({
    ledgerEntryId: sanitizeString(params.entryId, 160),
    allocationId: sanitizeString(params.id, 160),
    reversalReason,
    actor: csrf.session.actor
  });

  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: result.status });

  const reconciliation = await calculateAllocationReconciliation(sanitizeString(params.id, 160));
  if (reconciliation) {
    await syncOperationalIncidentFromReconciliation(reconciliation, {
      actor: csrf.session.actor,
      metadata: {
        source: "ledger_entry_reversal",
        reversedLedgerEntryId: sanitizeString(params.entryId, 160)
      }
    });
  }
  return NextResponse.json({ ok: true, data: { reversal: result.reversal, reconciliation } });
}

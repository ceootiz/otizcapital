import { NextResponse } from "next/server";
import { createLedgerCsvExportAuditEvent, exportLedgerEntriesToCsv, getLedgerEntriesForAllocation } from "@otiz/database";
import { getAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

function sanitizeString(value: unknown, maxLength = 1000) {
  if (typeof value !== "string" && typeof value !== "number") return "";
  return String(value).replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function exportDateStamp() {
  return new Date().toISOString().slice(0, 10).replace(/-/g, "");
}

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = getAdminSession();
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });

  const allocationId = sanitizeString(params.id, 160);
  const url = new URL(request.url);
  const ledgerEntries = await getLedgerEntriesForAllocation(allocationId, {
    ledgerType: url.searchParams.get("ledgerType"),
    entryType: url.searchParams.get("entryType"),
    sourceType: url.searchParams.get("sourceType"),
    reversalStatus: url.searchParams.get("reversalStatus"),
    dateFrom: url.searchParams.get("dateFrom"),
    dateTo: url.searchParams.get("dateTo"),
    minAmount: url.searchParams.get("minAmount"),
    maxAmount: url.searchParams.get("maxAmount"),
    query: url.searchParams.get("query"),
    limit: url.searchParams.get("limit")
  });
  await createLedgerCsvExportAuditEvent({
    actor: session.actor,
    allocationId,
    appliedFilters: ledgerEntries.appliedFilters,
    exportedRowCount: ledgerEntries.entries.length,
    reversalEntriesIncluded: ledgerEntries.entries.some((entry) => entry.isReversal)
  });
  const csv = exportLedgerEntriesToCsv(ledgerEntries.entries);
  const filename = `allocation-ledger-${allocationId}-${exportDateStamp()}.csv`;

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store"
    }
  });
}

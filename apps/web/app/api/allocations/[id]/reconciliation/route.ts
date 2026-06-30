import { NextResponse } from "next/server";
import { calculateAllocationReconciliation, createLedgerEntry, getLedgerEntriesForAllocation, LEDGER_SOURCE_TYPES, LEDGER_TYPES, syncOperationalIncidentFromReconciliation } from "@otiz/database";
import { getAdminSession, verifyAdminCsrfToken } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

const LEDGER_ENTRY_OPTIONS = {
  INVENTORY: ["UNITS_PURCHASED", "UNITS_RECEIVED", "UNITS_SOLD", "UNITS_RETURNED", "UNITS_REMAINING_ADJUSTMENT"],
  CASH: ["INVESTOR_CASH_IN", "SUPPLIER_PAYMENT", "LOGISTICS_COST", "MARKETPLACE_SETTLEMENT", "MARKETPLACE_FEE", "REFUND", "PAYOUT", "REINVESTMENT"],
  INVESTOR_LIABILITY: ["CAPITAL_ALLOCATED", "PROFIT_ACCRUED", "PAYOUT_APPROVED", "PAYOUT_PAID", "REINVESTED", "LOSS_RECOGNIZED", "LIABILITY_ADJUSTMENT"]
} as const;

function sanitizeString(value: unknown, maxLength = 1000) {
  if (typeof value !== "string" && typeof value !== "number") return "";
  return String(value).replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function parseOptionalNumber(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function parseOptionalDate(value: unknown) {
  if (!value || typeof value !== "string") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseMetadataJson(value: unknown) {
  if (value === undefined || value === null || value === "") return { ok: true as const, value: null };
  if (typeof value === "object" && !Array.isArray(value)) return { ok: true as const, value: JSON.stringify(value).slice(0, 4000) };
  if (typeof value !== "string") return { ok: false as const, error: "metadataJson must be valid JSON." };
  try {
    JSON.parse(value);
    return { ok: true as const, value: value.slice(0, 4000) };
  } catch {
    return { ok: false as const, error: "metadataJson must be valid JSON." };
  }
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = getAdminSession();
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });

  const allocationId = sanitizeString(params.id, 160);
  const reconciliation = await calculateAllocationReconciliation(allocationId);
  if (!reconciliation) return NextResponse.json({ ok: false, error: "Allocation not found." }, { status: 404 });
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

  return NextResponse.json({ ok: true, data: { reconciliation, filteredLedgerEntries: ledgerEntries.entries, appliedFilters: ledgerEntries.appliedFilters } });
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const csrf = verifyAdminCsrfToken(request);
  if (!csrf.ok) return NextResponse.json({ ok: false, error: csrf.error }, { status: csrf.status });

  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!payload) return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 422 });

  const ledgerType = sanitizeString(payload.ledgerType, 40);
  const sourceType = sanitizeString(payload.sourceType, 80) || "MANUAL_ADJUSTMENT";
  const entryType = sanitizeString(payload.entryType, 80);
  const amount = sanitizeString(payload.amount, 40);
  const quantity = parseOptionalNumber(payload.quantity);
  const unitCost = payload.unitCost === undefined ? null : sanitizeString(payload.unitCost, 40) || null;
  const description = sanitizeString(payload.description, 500);
  const occurredAt = parseOptionalDate(payload.occurredAt);
  const metadataResult = parseMetadataJson(payload.metadataJson);
  const currency = sanitizeString(payload.currency, 12);

  if (!LEDGER_TYPES.includes(ledgerType as (typeof LEDGER_TYPES)[number])) return NextResponse.json({ ok: false, error: "Invalid ledger type." }, { status: 422 });
  if (!LEDGER_SOURCE_TYPES.includes(sourceType as (typeof LEDGER_SOURCE_TYPES)[number])) return NextResponse.json({ ok: false, error: "Invalid source type." }, { status: 422 });
  if (!LEDGER_ENTRY_OPTIONS[ledgerType as keyof typeof LEDGER_ENTRY_OPTIONS]?.includes(entryType as never)) return NextResponse.json({ ok: false, error: "Invalid entry type for selected ledger." }, { status: 422 });
  if (!entryType) return NextResponse.json({ ok: false, error: "entryType is required." }, { status: 422 });
  if (!occurredAt) return NextResponse.json({ ok: false, error: "occurredAt is required." }, { status: 422 });
  if ((ledgerType === "CASH" || ledgerType === "INVESTOR_LIABILITY") && !amount) return NextResponse.json({ ok: false, error: "amount is required for cash and investor liability entries." }, { status: 422 });
  if (!Number.isFinite(Number(amount))) return NextResponse.json({ ok: false, error: "amount must be numeric." }, { status: 422 });
  if (amount && !currency) return NextResponse.json({ ok: false, error: "currency is required when amount is provided." }, { status: 422 });
  if (ledgerType === "INVENTORY" && quantity === null) return NextResponse.json({ ok: false, error: "quantity is required for inventory entries." }, { status: 422 });
  if (quantity !== null && quantity < 0 && entryType !== "UNITS_REMAINING_ADJUSTMENT") return NextResponse.json({ ok: false, error: "quantity cannot be negative unless entryType is UNITS_REMAINING_ADJUSTMENT." }, { status: 422 });
  if (!description) return NextResponse.json({ ok: false, error: "description is required." }, { status: 422 });
  if (!metadataResult.ok) return NextResponse.json({ ok: false, error: metadataResult.error }, { status: 422 });

  const result = await createLedgerEntry({
    ledgerType,
    allocationId: sanitizeString(params.id, 160),
    investorId: payload.investorId === undefined ? null : sanitizeString(payload.investorId, 160) || null,
    monthlyReportId: payload.monthlyReportId === undefined ? null : sanitizeString(payload.monthlyReportId, 160) || null,
    entryType,
    amount: amount || "0",
    currency: currency || "USD",
    quantity: quantity === null ? null : Math.trunc(quantity),
    unitCost,
    occurredAt,
    sourceType,
    sourceId: payload.sourceId === undefined ? null : sanitizeString(payload.sourceId, 160) || null,
    description,
    metadataJson: metadataResult.value,
    createdBy: csrf.session.actor
  });

  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: result.status });

  const reconciliation = await calculateAllocationReconciliation(sanitizeString(params.id, 160));
  if (reconciliation) {
    await syncOperationalIncidentFromReconciliation(reconciliation, {
      actor: csrf.session.actor,
      metadata: {
        source: "ledger_entry_create",
        entryType,
        ledgerType
      }
    });
  }
  return NextResponse.json({ ok: true, data: { entry: result.entry, reconciliation } });
}

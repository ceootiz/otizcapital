import { NextResponse } from "next/server";
import { ALLOCATION_RISK_LEVELS, ALLOCATION_STATUSES, createAllocationRecord, isPositiveAmount, serializeAllocation, type AllocationRiskLevel, type AllocationStatus } from "@otiz/database";
import { verifyAdminCsrfToken } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

function sanitizeString(value: unknown, maxLength = 1000) {
  if (typeof value !== "string" && typeof value !== "number") return "";
  return String(value).replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function parseOptionalInt(value: unknown) {
  if (value === null || value === "") return null;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) return undefined;
  return number;
}

function parseOptionalDate(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function isAllocationStatus(value: string): value is AllocationStatus {
  return ALLOCATION_STATUSES.includes(value as AllocationStatus);
}

function isAllocationRiskLevel(value: string): value is AllocationRiskLevel {
  return ALLOCATION_RISK_LEVELS.includes(value as AllocationRiskLevel);
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const csrf = verifyAdminCsrfToken(request);

  if (!csrf.ok) {
    return NextResponse.json({ ok: false, error: csrf.error }, { status: csrf.status });
  }

  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  if (!payload) {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 422 });
  }

  const supplyCode = sanitizeString(payload.supplyCode, 80);
  const productName = sanitizeString(payload.productName, 180);
  const allocationAmount = sanitizeString(payload.allocationAmount, 32);
  const status = sanitizeString(payload.status || "DRAFT", 24);
  const riskLevel = sanitizeString(payload.riskLevel || "STANDARD", 24);
  const expectedCycleDays = parseOptionalInt(payload.expectedCycleDays);
  const expectedPayoutAt = parseOptionalDate(payload.expectedPayoutAt);

  if (!supplyCode) return NextResponse.json({ ok: false, error: "supplyCode is required." }, { status: 422 });
  if (!productName) return NextResponse.json({ ok: false, error: "productName is required." }, { status: 422 });
  if (!isPositiveAmount(allocationAmount)) return NextResponse.json({ ok: false, error: "allocationAmount must be greater than 0." }, { status: 422 });
  if (!isAllocationStatus(status)) return NextResponse.json({ ok: false, error: "Invalid allocation status." }, { status: 422 });
  if (!isAllocationRiskLevel(riskLevel)) return NextResponse.json({ ok: false, error: "Invalid risk level." }, { status: 422 });
  if (expectedCycleDays === undefined) return NextResponse.json({ ok: false, error: "expectedCycleDays must be a non-negative integer." }, { status: 422 });
  if (expectedPayoutAt === undefined) return NextResponse.json({ ok: false, error: "expectedPayoutAt must be a valid date." }, { status: 422 });

  const result = await createAllocationRecord({
    investorId: sanitizeString(params.id, 160),
    supplyCode,
    productName,
    marketplace: sanitizeString(payload.marketplace, 120) || null,
    allocationAmount,
    currency: sanitizeString(payload.currency || "USD", 8) || "USD",
    status,
    expectedCycleDays,
    expectedPayoutAt,
    riskLevel,
    estimatedResult: sanitizeString(payload.estimatedResult, 120) || null,
    notes: sanitizeString(payload.notes, 4000) || null,
    actor: csrf.session.actor
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true, data: serializeAllocation(result.allocation) }, { status: 201 });
}

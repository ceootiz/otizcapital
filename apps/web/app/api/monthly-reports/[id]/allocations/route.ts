import { NextResponse } from "next/server";
import {
  addAllocationToMonthlyReport,
  getEligibleAllocationsForReport,
  getReportAllocations,
  serializeMonthlyReportAllocation,
  type AllocationRecord
} from "@otiz/database";
import { getAdminSession, verifyAdminCsrfToken } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

function sanitizeString(value: unknown, maxLength = 1000) {
  if (typeof value !== "string" && typeof value !== "number") return "";
  return String(value).replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function serializeEligibleAllocation(record: AllocationRecord & { proofs: Array<{ id: string; status: string; type: string }> }) {
  return {
    id: record.id,
    investorId: record.investorId,
    supplyCode: record.supplyCode,
    productName: record.productName,
    marketplace: record.marketplace,
    allocationAmount: record.allocationAmount,
    currency: record.currency,
    status: record.status,
    expectedCycleDays: record.expectedCycleDays,
    expectedPayoutAt: record.expectedPayoutAt?.toISOString() ?? null,
    riskLevel: record.riskLevel,
    estimatedResult: record.estimatedResult,
    actualProfit: record.actualProfit,
    payoutStatus: record.payoutStatus,
    reinvestDecision: record.reinvestDecision,
    updatedAt: record.updatedAt.toISOString(),
    proofCount: record.proofs.length,
    investorVisibleProofCount: record.proofs.filter((proof) => proof.status === "AVAILABLE" || proof.status === "VERIFIED").length
  };
}

export async function GET(_request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = getAdminSession();
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });

  const monthlyReportId = sanitizeString(params.id, 160);
  const [linkedAllocations, eligibleResult] = await Promise.all([
    getReportAllocations(monthlyReportId),
    getEligibleAllocationsForReport(monthlyReportId)
  ]);

  if (!eligibleResult.ok) {
    return NextResponse.json({ ok: false, error: eligibleResult.error }, { status: eligibleResult.status });
  }

  return NextResponse.json({
    ok: true,
    data: {
      linkedAllocations: linkedAllocations.map(serializeMonthlyReportAllocation),
      eligibleAllocations: eligibleResult.allocations.map(serializeEligibleAllocation)
    }
  });
}

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const csrf = verifyAdminCsrfToken(request);
  if (!csrf.ok) return NextResponse.json({ ok: false, error: csrf.error }, { status: csrf.status });

  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!payload) return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 422 });

  const allocationId = sanitizeString(payload.allocationId, 160);
  if (!allocationId) return NextResponse.json({ ok: false, error: "allocationId is required." }, { status: 422 });

  const result = await addAllocationToMonthlyReport({
    monthlyReportId: sanitizeString(params.id, 160),
    allocationId,
    note: sanitizeString(payload.note, 2000) || null,
    actor: csrf.session.actor
  });

  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true, data: serializeMonthlyReportAllocation(result.link) }, { status: 201 });
}

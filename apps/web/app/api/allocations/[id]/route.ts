import { NextResponse } from "next/server";
import {
  ALLOCATION_PAYOUT_STATUSES,
  ALLOCATION_REINVEST_DECISIONS,
  ALLOCATION_RISK_LEVELS,
  ALLOCATION_STATUSES,
  isPositiveAmount,
  markAllocationCompleted,
  markAllocationLoss,
  serializeAllocation,
  updateAllocationRisk,
  updateAllocationRecord,
  updateAllocationStage,
  type AllocationRiskLevel,
  type AllocationPayoutStatus,
  type AllocationReinvestDecision,
  type AllocationStatus
} from "@otiz/database";
import { verifyAdminCsrfToken } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

function sanitizeString(value: unknown, maxLength = 1000) {
  if (typeof value !== "string" && typeof value !== "number") return "";
  return String(value).replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function parseOptionalInt(value: unknown) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) return undefined;
  return number;
}

function parseOptionalDate(value: unknown) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (typeof value !== "string") return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function isAllocationStatus(value: string): value is AllocationStatus {
  return ALLOCATION_STATUSES.includes(value as AllocationStatus);
}

function isAllocationPayoutStatus(value: string): value is AllocationPayoutStatus {
  return ALLOCATION_PAYOUT_STATUSES.includes(value as AllocationPayoutStatus);
}

function isAllocationReinvestDecision(value: string): value is AllocationReinvestDecision {
  return ALLOCATION_REINVEST_DECISIONS.includes(value as AllocationReinvestDecision);
}

function isAllocationRiskLevel(value: string): value is AllocationRiskLevel {
  return ALLOCATION_RISK_LEVELS.includes(value as AllocationRiskLevel);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const csrf = verifyAdminCsrfToken(request);

  if (!csrf.ok) {
    return NextResponse.json({ ok: false, error: csrf.error }, { status: csrf.status });
  }

  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  if (!payload) {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 422 });
  }

  const action = sanitizeString(payload.action, 40);
  const statusValue = typeof payload.status === "string" ? sanitizeString(payload.status, 24) : undefined;
  const allocationAmount = payload.allocationAmount === undefined ? undefined : sanitizeString(payload.allocationAmount, 32);
  const riskLevelValue = typeof payload.riskLevel === "string" ? sanitizeString(payload.riskLevel, 24) : undefined;
  const payoutStatusValue = typeof payload.payoutStatus === "string" ? sanitizeString(payload.payoutStatus, 32) : undefined;
  const reinvestDecisionValue = typeof payload.reinvestDecision === "string" ? sanitizeString(payload.reinvestDecision, 32) : undefined;
  const expectedCycleDays = parseOptionalInt(payload.expectedCycleDays);
  const expectedPayoutAt = parseOptionalDate(payload.expectedPayoutAt);
  const startedAt = parseOptionalDate(payload.startedAt);
  const completedAt = parseOptionalDate(payload.completedAt);

  if (statusValue && !isAllocationStatus(statusValue)) return NextResponse.json({ ok: false, error: "Invalid allocation status." }, { status: 422 });
  const status = statusValue as AllocationStatus | undefined;
  if (riskLevelValue && !isAllocationRiskLevel(riskLevelValue)) return NextResponse.json({ ok: false, error: "Invalid risk level." }, { status: 422 });
  const riskLevel = riskLevelValue as AllocationRiskLevel | undefined;
  if (payoutStatusValue && !isAllocationPayoutStatus(payoutStatusValue)) return NextResponse.json({ ok: false, error: "Invalid payout status." }, { status: 422 });
  const payoutStatus = payoutStatusValue as AllocationPayoutStatus | undefined;
  if (reinvestDecisionValue && !isAllocationReinvestDecision(reinvestDecisionValue)) return NextResponse.json({ ok: false, error: "Invalid reinvest decision." }, { status: 422 });
  const reinvestDecision = reinvestDecisionValue as AllocationReinvestDecision | undefined;
  if (allocationAmount !== undefined && !isPositiveAmount(allocationAmount)) return NextResponse.json({ ok: false, error: "allocationAmount must be greater than 0." }, { status: 422 });
  if (expectedCycleDays === undefined && payload.expectedCycleDays !== undefined) return NextResponse.json({ ok: false, error: "expectedCycleDays must be a non-negative integer." }, { status: 422 });
  if (expectedPayoutAt === undefined && payload.expectedPayoutAt !== undefined) return NextResponse.json({ ok: false, error: "expectedPayoutAt must be a valid date." }, { status: 422 });
  if (startedAt === undefined && payload.startedAt !== undefined) return NextResponse.json({ ok: false, error: "startedAt must be a valid date." }, { status: 422 });
  if (completedAt === undefined && payload.completedAt !== undefined) return NextResponse.json({ ok: false, error: "completedAt must be a valid date." }, { status: 422 });

  const result =
    action === "update-stage" && status
      ? await updateAllocationStage({ id: sanitizeString(params.id, 160), status, actor: csrf.session.actor })
      : action === "update-risk" && riskLevel
        ? await updateAllocationRisk({ id: sanitizeString(params.id, 160), riskLevel, actor: csrf.session.actor })
        : action === "mark-completed"
          ? await markAllocationCompleted({ id: sanitizeString(params.id, 160), actualProfit: payload.actualProfit === undefined ? undefined : sanitizeString(payload.actualProfit, 32) || null, completedAt: completedAt === undefined ? undefined : completedAt, actor: csrf.session.actor })
          : action === "mark-loss"
            ? await markAllocationLoss({ id: sanitizeString(params.id, 160), notes: payload.notes === undefined ? undefined : sanitizeString(payload.notes, 4000) || null, actor: csrf.session.actor })
            : await updateAllocationRecord({
    id: sanitizeString(params.id, 160),
    status,
    marketplace: payload.marketplace === undefined ? undefined : sanitizeString(payload.marketplace, 120) || null,
    allocationAmount,
    expectedCycleDays,
    expectedPayoutAt,
    riskLevel,
    estimatedResult: payload.estimatedResult === undefined ? undefined : sanitizeString(payload.estimatedResult, 120) || null,
    actualProfit: payload.actualProfit === undefined ? undefined : sanitizeString(payload.actualProfit, 32) || null,
    startedAt,
    completedAt,
    payoutStatus,
    reinvestDecision,
    notes: payload.notes === undefined ? undefined : sanitizeString(payload.notes, 4000) || null,
    actor: csrf.session.actor
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true, data: serializeAllocation(result.allocation) });
}

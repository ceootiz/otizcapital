import { NextResponse } from "next/server";
import {
  accrueReferralCommission,
  createInvestorNotification,
  getDepositNotificationById,
  recordCommissionAccruedEvent,
  reviewDepositNotification,
  serializeDepositNotification,
  type DepositVerificationStatus
} from "@otiz/database";
import { verifyTransaction, type VerificationResult } from "@otiz/lib";
import { sanitizeAdminInput, verifyAdminCsrfToken } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

// Classify a verification outcome into a stored status. API/timeout problems are
// distinguished from genuine "not found / failed on-chain" so the admin knows
// whether to retry or to treat it as a real mismatch.
function classifyVerification(result: VerificationResult): DepositVerificationStatus {
  if (result.verified) return "VERIFIED";
  const apiIssue = /unavailable|timed out|rate limit/i.test(result.error || "");
  return apiIssue ? "API_ERROR" : "FAILED";
}

// PATCH: confirm or reject a pending deposit claim. On confirmation, if the
// claim carries a txHash we auto-verify it on-chain first; a failed/errored
// verification blocks confirmation UNLESS the admin passes manualOverride.
export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const csrf = verifyAdminCsrfToken(request);
  if (!csrf.ok) return NextResponse.json({ ok: false, error: csrf.error }, { status: csrf.status });

  const payload = (await request.json().catch(() => null)) as
    | { action?: unknown; adminNote?: unknown; manualOverride?: unknown }
    | null;
  const action = typeof payload?.action === "string" ? payload.action : "";
  const manualOverride = payload?.manualOverride === true;
  if (action !== "confirm" && action !== "reject") {
    return NextResponse.json({ ok: false, error: "action must be confirm or reject." }, { status: 422 });
  }

  const adminNote = sanitizeAdminInput(payload?.adminNote, 1000) || null;

  const existing = await getDepositNotificationById(params.id);
  if (!existing) {
    return NextResponse.json({ ok: false, error: "Deposit notification not found." }, { status: 404 });
  }
  if (existing.status !== "PENDING") {
    return NextResponse.json({ ok: false, error: "This deposit claim was already reviewed." }, { status: 409 });
  }

  // On-chain verification only runs on confirmation and only when a hash exists.
  let verificationStatus: DepositVerificationStatus | null = null;
  let verificationData: (VerificationResult & { network: string; checkedAt: string }) | null = null;

  if (action === "confirm") {
    if (existing.txHash && existing.txHash.trim()) {
      const result = await verifyTransaction(existing.txHash, existing.network, Number(existing.amount));
      verificationStatus = classifyVerification(result);
      verificationData = { ...result, network: existing.network, checkedAt: new Date().toISOString() };

      // Failed or errored verification blocks confirmation until the admin
      // explicitly overrides. The UI reads `verification` to show the warning,
      // amount, and explorer link, then re-submits with manualOverride: true.
      if (verificationStatus !== "VERIFIED" && !manualOverride) {
        return NextResponse.json(
          { ok: false, code: "VERIFICATION_FAILED", verification: { status: verificationStatus, ...verificationData } },
          { status: 409 }
        );
      }
    } else {
      verificationStatus = "SKIPPED";
    }
  }

  const { updated, record } = await reviewDepositNotification({
    id: params.id,
    status: action === "confirm" ? "CONFIRMED" : "REJECTED",
    adminNote,
    reviewedBy: csrf.session.actor,
    verificationStatus,
    verificationData
  });

  if (!record) {
    return NextResponse.json({ ok: false, error: "Deposit notification not found." }, { status: 404 });
  }
  if (!updated) {
    return NextResponse.json({ ok: false, error: "This deposit claim was already reviewed." }, { status: 409 });
  }

  // Investor-facing bell notification (best-effort).
  await createInvestorNotification({
    investorId: record.investorId,
    type: action === "confirm" ? "DEPOSIT_CONFIRMED" : "DEPOSIT_REJECTED",
    title: action === "confirm" ? "Ваш депозит подтверждён" : "По вашему депозиту нужна уточняющая информация",
    body:
      action === "confirm"
        ? `Поступление на сумму $${Number(record.amount)} (${record.network}) подтверждено менеджером.`
        : `Менеджер не смог подтвердить поступление $${Number(record.amount)} (${record.network}).${adminNote ? ` Комментарий: ${adminNote}` : " Свяжитесь с менеджером."}`,
    linkHref: "/ru/investor/deposit"
  });

  // Referral commission (Block 2): accrue only on a real PENDING→CONFIRMED
  // transition (the `updated` guard above already enforced that). Best-effort —
  // a commission failure must not fail the confirmation the manager just made.
  if (action === "confirm") {
    try {
      const accrual = await accrueReferralCommission({
        investorId: record.investorId,
        depositAmount: Number(record.amount)
      });
      if (accrual.created) {
        await recordCommissionAccruedEvent({
          commissionId: accrual.commission.id,
          referrerName: accrual.referrerName,
          referrerType: accrual.referrerType,
          commissionAmount: Number(accrual.commission.commissionAmount)
        });
      }
    } catch (error) {
      console.error("[otiz] Referral commission accrual failed:", error);
    }
  }

  return NextResponse.json({ ok: true, data: serializeDepositNotification(record) });
}

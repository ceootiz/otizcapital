import { NextResponse } from "next/server";
import {
  DEPOSIT_NETWORKS,
  createDepositNotification,
  createNotificationEventRecord,
  listDepositNotificationsForInvestor,
  serializeDepositNotification
} from "@otiz/database";
import { investorApiErrorResponse, requireInvestorApi } from "@/lib/investor-api-auth";

export const dynamic = "force-dynamic";

function sanitizeString(value: unknown, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.replace(/[ -]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

// GET: the investor's own deposit claims (for showing past submissions).
export async function GET() {
  const auth = await requireInvestorApi();
  if (!auth.ok) return investorApiErrorResponse(auth);

  const rows = await listDepositNotificationsForInvestor(auth.investor.id);
  return NextResponse.json({ ok: true, data: rows.map(serializeDepositNotification) });
}

// POST: "I sent a deposit" claim. Creates the DepositNotification record and an
// INTERNAL admin event so the manager sees it in the operational feed.
export async function POST(request: Request) {
  const auth = await requireInvestorApi();
  if (!auth.ok) return investorApiErrorResponse(auth);

  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!payload) return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 422 });

  const amount = Number(payload.amount);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000_000) {
    return NextResponse.json({ ok: false, error: "AMOUNT_INVALID" }, { status: 422 });
  }

  const network = sanitizeString(payload.network, 40);
  if (!(DEPOSIT_NETWORKS as readonly string[]).includes(network)) {
    return NextResponse.json({ ok: false, error: "NETWORK_INVALID" }, { status: 422 });
  }

  const txHash = sanitizeString(payload.txHash, 200) || null;
  const note = sanitizeString(payload.note, 1000) || null;

  const record = await createDepositNotification({
    investorId: auth.investor.id,
    amount,
    network,
    txHash,
    note
  });

  // Admin-facing operational event (best-effort — the claim row itself is the
  // durable admin queue, so a failed event must not fail the claim).
  try {
    await createNotificationEventRecord({
      type: "DEPOSIT_CLAIMED",
      channel: "INTERNAL",
      recipient: "admin",
      entityType: "DepositNotification",
      entityId: record.id,
      payload: {
        investorId: auth.investor.id,
        fullName: auth.investor.fullName,
        amount: `$${amount}`,
        network,
        txHash: txHash || ""
      },
      status: "PENDING"
    });
  } catch (eventError) {
    console.error("[otiz] DEPOSIT_CLAIMED event failed:", eventError);
  }

  return NextResponse.json({ ok: true, data: serializeDepositNotification(record) }, { status: 201 });
}

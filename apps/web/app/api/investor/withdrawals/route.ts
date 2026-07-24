import { NextResponse } from "next/server";
import {
  createWithdrawalRequest,
  getInvestorWalletById,
  getInvestorWithdrawalRequests,
  normalizeIdempotencyKey,
  serializeInvestorWithdrawalRequest
} from "@otiz/database";
import { investorApiErrorResponse, requireInvestorApi } from "@/lib/investor-api-auth";

export const dynamic = "force-dynamic";

function sanitizeString(value: unknown, maxLength = 1000) {
  if (typeof value !== "string" && typeof value !== "number") return "";
  return String(value).replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export async function GET() {
  const auth = await requireInvestorApi();
  if (!auth.ok) return investorApiErrorResponse(auth);
  const requests = await getInvestorWithdrawalRequests(auth.investor.id);
  return NextResponse.json({ ok: true, data: requests.map(serializeInvestorWithdrawalRequest) });
}

export async function POST(request: Request) {
  const auth = await requireInvestorApi();
  if (!auth.ok) return investorApiErrorResponse(auth);
  const idempotencyKey = normalizeIdempotencyKey(request.headers.get("idempotency-key"));
  if (!idempotencyKey) {
    return NextResponse.json({ ok: false, error: "A valid Idempotency-Key is required." }, { status: 422 });
  }
  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!payload) return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 422 });

  // Preferred path: the investor selects a saved wallet. We resolve it server-
  // side (verifying ownership) and derive method + destination from it, so the
  // client never dictates the masked destination. Legacy manual fields remain a
  // fallback for older clients.
  let method = sanitizeString(payload.method, 80) || null;
  let destination = sanitizeString(payload.destinationMasked, 240) || null;
  const walletId = sanitizeString(payload.walletId, 40);
  if (walletId) {
    const wallet = await getInvestorWalletById(auth.investor.id, walletId);
    if (!wallet) return NextResponse.json({ ok: false, error: "Selected wallet not found." }, { status: 404 });
    method = wallet.network;
    destination = wallet.address; // createWithdrawalRequest masks this before storing.
  }

  const result = await createWithdrawalRequest({
    investorId: auth.investor.id,
    idempotencyKey,
    amount: sanitizeString(payload.amount, 32),
    currency: sanitizeString(payload.currency || "USD", 8) || "USD",
    method,
    destinationMasked: destination,
    investorNote: sanitizeString(payload.investorNote, 1000) || null
  });

  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  return NextResponse.json(
    { ok: true, data: serializeInvestorWithdrawalRequest(result.request), replayed: result.replayed },
    { status: result.replayed ? 200 : 201 }
  );
}

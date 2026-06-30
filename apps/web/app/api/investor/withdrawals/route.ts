import { NextResponse } from "next/server";
import { createWithdrawalRequest, findInvestorById, getInvestorWithdrawalRequests, serializeInvestorWithdrawalRequest } from "@otiz/database";
import { clearInvestorSession, getInvestorSession } from "@/lib/investor-session";

export const dynamic = "force-dynamic";

function sanitizeString(value: unknown, maxLength = 1000) {
  if (typeof value !== "string" && typeof value !== "number") return "";
  return String(value).replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

async function requireApiInvestor() {
  const session = getInvestorSession();
  if (!session) return { ok: false as const, status: 401 as const, error: "Unauthorized." };
  const investor = await findInvestorById(session.investorId);
  if (!investor || investor.email !== session.email || investor.status !== "ACTIVE") {
    clearInvestorSession();
    return { ok: false as const, status: 401 as const, error: "Unauthorized." };
  }
  return { ok: true as const, investor };
}

export async function GET() {
  const session = await requireApiInvestor();
  if (!session.ok) return NextResponse.json({ ok: false, error: session.error }, { status: session.status });
  const requests = await getInvestorWithdrawalRequests(session.investor.id);
  return NextResponse.json({ ok: true, data: requests.map(serializeInvestorWithdrawalRequest) });
}

export async function POST(request: Request) {
  const session = await requireApiInvestor();
  if (!session.ok) return NextResponse.json({ ok: false, error: session.error }, { status: session.status });
  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!payload) return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 422 });

  const result = await createWithdrawalRequest({
    investorId: session.investor.id,
    amount: sanitizeString(payload.amount, 32),
    currency: sanitizeString(payload.currency || "USD", 8) || "USD",
    method: sanitizeString(payload.method, 80) || null,
    destinationMasked: sanitizeString(payload.destinationMasked, 240) || null,
    investorNote: sanitizeString(payload.investorNote, 1000) || null
  });

  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true, data: serializeInvestorWithdrawalRequest(result.request) }, { status: 201 });
}

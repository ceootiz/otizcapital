import { NextResponse } from "next/server";
import { createInvestorWallet, listInvestorWallets, serializeInvestorWallet } from "@otiz/database";
import { investorApiErrorResponse, requireInvestorApi } from "@/lib/investor-api-auth";

export const dynamic = "force-dynamic";

function sanitizeString(value: unknown, maxLength = 240) {
  if (typeof value !== "string" && typeof value !== "number") return "";
  return String(value)
    .replace(/[\x00-\x1f\x7f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export async function GET() {
  const auth = await requireInvestorApi();
  if (!auth.ok) return investorApiErrorResponse(auth);
  const wallets = await listInvestorWallets(auth.investor.id);
  return NextResponse.json({ ok: true, data: wallets.map(serializeInvestorWallet) });
}

export async function POST(request: Request) {
  const auth = await requireInvestorApi();
  if (!auth.ok) return investorApiErrorResponse(auth);
  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!payload) return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 422 });

  const result = await createInvestorWallet({
    investorId: auth.investor.id,
    label: sanitizeString(payload.label, 60),
    network: sanitizeString(payload.network, 40),
    address: sanitizeString(payload.address, 240)
  });
  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true, data: serializeInvestorWallet(result.wallet) }, { status: 201 });
}

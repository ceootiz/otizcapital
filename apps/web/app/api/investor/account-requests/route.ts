import { NextResponse } from "next/server";
import { createInvestorAccountRequest, validateInvestorAccountRequest } from "@otiz/database";
import { investorApiErrorResponse, requireInvestorApi } from "@/lib/investor-api-auth";

export async function POST(request: Request) {
  const auth = await requireInvestorApi();
  if (!auth.ok) return investorApiErrorResponse(auth);

  const payload = await request.json().catch(() => ({})) as { type?: unknown; details?: unknown };
  const validated = validateInvestorAccountRequest(payload);
  if (!validated.ok) {
    return NextResponse.json({ ok: false, error: validated.error }, { status: 400 });
  }

  const incident = await createInvestorAccountRequest({
    investorId: auth.investor.id,
    type: validated.type,
    details: validated.details
  });
  return NextResponse.json({ ok: true, data: { id: incident.id, status: incident.status } }, { status: 201 });
}

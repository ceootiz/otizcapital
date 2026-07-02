import { NextResponse } from "next/server";
import { getInvestorDocumentForInvestor, serializeInvestorDocument, signInvestorDocument } from "@otiz/database";
import { investorApiErrorResponse, requireInvestorApi } from "@/lib/investor-api-auth";

export const dynamic = "force-dynamic";

// PATCH: e-sign a pending document. Requires the acknowledgement checkbox
// (accept: true) so a stray request cannot sign on the investor's behalf.
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireInvestorApi();
  if (!auth.ok) return investorApiErrorResponse(auth);

  const payload = (await request.json().catch(() => null)) as { accept?: unknown } | null;
  if (payload?.accept !== true) {
    return NextResponse.json({ ok: false, error: "You must accept the terms to sign." }, { status: 422 });
  }

  const existing = await getInvestorDocumentForInvestor(params.id, auth.investor.id);
  if (!existing) {
    return NextResponse.json({ ok: false, error: "Document not found." }, { status: 404 });
  }

  const { document } = await signInvestorDocument(params.id, auth.investor.id);
  if (!document) {
    return NextResponse.json({ ok: false, error: "Document not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, data: serializeInvestorDocument(document) });
}

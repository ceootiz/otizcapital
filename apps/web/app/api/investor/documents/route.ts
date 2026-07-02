import { NextResponse } from "next/server";
import { listInvestorDocuments, serializeInvestorDocument } from "@otiz/database";
import { investorApiErrorResponse, requireInvestorApi } from "@/lib/investor-api-auth";

export const dynamic = "force-dynamic";

// GET: list the signed-in investor's documents (metadata only).
export async function GET() {
  const auth = await requireInvestorApi();
  if (!auth.ok) return investorApiErrorResponse(auth);

  const documents = await listInvestorDocuments(auth.investor.id);
  return NextResponse.json({ ok: true, data: documents.map(serializeInvestorDocument) });
}

import { NextResponse } from "next/server";
import { getInvestorDocumentForInvestor } from "@otiz/database";
import { investorApiErrorResponse, requireInvestorApi } from "@/lib/investor-api-auth";

export const dynamic = "force-dynamic";

// GET: download a document PDF. Ownership enforced by scoping to the investor.
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const auth = await requireInvestorApi();
  if (!auth.ok) return investorApiErrorResponse(auth);

  const document = await getInvestorDocumentForInvestor(params.id, auth.investor.id);
  if (!document) {
    return NextResponse.json({ ok: false, error: "Document not found." }, { status: 404 });
  }

  const buffer = Buffer.from(document.fileData, "base64");
  const asciiName = document.fileName.replace(/[^\x20-\x7E]+/g, "_").replace(/"/g, "'");
  const body = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  return new NextResponse(body as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${asciiName}"`,
      "Cache-Control": "no-store"
    }
  });
}

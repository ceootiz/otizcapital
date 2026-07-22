import { NextResponse } from "next/server";
import { getInvestorFileReportForInvestor } from "@otiz/database";
import { investorApiErrorResponse, requireInvestorApi } from "@/lib/investor-api-auth";

export const dynamic = "force-dynamic";

// GET: download one file report as .xlsx. Ownership is enforced by scoping the
// lookup to the signed-in investor.
export async function GET(_request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const auth = await requireInvestorApi();
  if (!auth.ok) return investorApiErrorResponse(auth);

  const report = await getInvestorFileReportForInvestor(params.id, auth.investor.id);
  if (!report) {
    return NextResponse.json({ ok: false, error: "Report not found." }, { status: 404 });
  }

  const buffer = Buffer.from(report.fileData, "base64");
  const asciiName = report.fileName.replace(/[^\x20-\x7E]+/g, "_").replace(/"/g, "'");
  const body = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  return new NextResponse(body as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${asciiName}"`,
      "Cache-Control": "no-store"
    }
  });
}

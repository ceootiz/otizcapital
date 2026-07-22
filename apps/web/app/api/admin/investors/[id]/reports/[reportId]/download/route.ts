import { NextResponse } from "next/server";
import { getInvestorFileReportForInvestor } from "@otiz/database";
import { getAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

// GET: admin download of an uploaded report file. Read-only, admin-session gated
// (no CSRF — opened as a direct download). Scoped to the investor in the path.
export async function GET(
  _request: Request,
  props: { params: Promise<{ id: string; reportId: string }> }
) {
  const params = await props.params;
  const session = getAdminSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const report = await getInvestorFileReportForInvestor(params.reportId, params.id);
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

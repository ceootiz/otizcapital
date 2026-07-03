import { NextResponse } from "next/server";
import { getAdminExportRows } from "@otiz/database";
import { getAdminSession } from "@/lib/admin-session";
import { buildInvestorExportXlsx } from "@/lib/report-xlsx";

export const dynamic = "force-dynamic";

// GET: download all investor data as XLSX. Read-only, admin-session gated
// (no CSRF — opened as a direct download, same pattern as report-template).
export async function GET() {
  const session = getAdminSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const rows = await getAdminExportRows();
  const workbook = buildInvestorExportXlsx(rows);

  const stamp = new Date().toISOString().slice(0, 10);
  const body = new Uint8Array(workbook.buffer, workbook.byteOffset, workbook.byteLength);
  return new NextResponse(body as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="otiz-investors-${stamp}.xlsx"`,
      "Cache-Control": "no-store"
    }
  });
}

import { NextResponse } from "next/server";
import { findInvestorById, prisma } from "@otiz/database";
import { getAdminSession } from "@/lib/admin-session";
import { buildReportTemplateXlsx } from "@/lib/report-xlsx";

export const dynamic = "force-dynamic";

// GET: download a pre-filled XLSX report template for this investor. Read-only,
// so it is gated by the admin session only (no CSRF header — this is opened as a
// direct download).
export async function GET(_request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = getAdminSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const investor = await findInvestorById(params.id);
  if (!investor) {
    return NextResponse.json({ ok: false, error: "Investor not found." }, { status: 404 });
  }

  const allocations = await prisma.allocation.findMany({
    where: { investorId: investor.id },
    orderBy: { createdAt: "desc" },
    select: { productName: true, allocationAmount: true, currency: true }
  });

  const workbook = buildReportTemplateXlsx({
    investor: { fullName: investor.fullName, email: investor.email },
    allocations: allocations.map((allocation) => ({
      product: allocation.productName,
      amount: allocation.allocationAmount,
      currency: allocation.currency
    }))
  });

  const fileNameSafe = investor.email.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  const body = new Uint8Array(workbook.buffer, workbook.byteOffset, workbook.byteLength);
  return new NextResponse(body as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="otiz-report-template-${fileNameSafe}.xlsx"`,
      "Cache-Control": "no-store"
    }
  });
}

import { NextResponse } from "next/server";
import { getInvestorLedger, isProductFeatureEnabled } from "@otiz/database";
import { isLocale, type Locale } from "@otiz/lib";
import { investorApiErrorResponse, requireInvestorApi } from "@/lib/investor-api-auth";
import { buildAccountStatementData, buildAccountStatementPdf, buildAccountStatementXlsx } from "@/lib/account-statement";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireInvestorApi();
  if (!auth.ok) return investorApiErrorResponse(auth);
  if (!(await isProductFeatureEnabled("account-statements"))) return NextResponse.json({ ok: false, error: "Account statements are disabled." }, { status: 404 });
  const url = new URL(request.url);
  const format = url.searchParams.get("format");
  if (format !== "pdf" && format !== "xlsx") return NextResponse.json({ ok: false, error: "Unsupported statement format." }, { status: 422 });
  const localeValue = url.searchParams.get("locale") || "en";
  const locale: Locale = isLocale(localeValue) ? localeValue : "en";
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const type = url.searchParams.get("type");
  const ledger = await getInvestorLedger(auth.investor.id, { pageSize: 10000 });
  const statement = buildAccountStatementData({
    investor: { fullName: auth.investor.fullName, email: auth.investor.email },
    entries: ledger.entries,
    filters: { type, from, to: to ? `${to}T23:59:59.999Z` : null }
  });
  const stamp = new Date().toISOString().slice(0, 10);
  const file = format === "pdf" ? await buildAccountStatementPdf(statement, locale) : buildAccountStatementXlsx(statement);
  const body = new Uint8Array(file.buffer, file.byteOffset, file.byteLength);
  return new NextResponse(body as unknown as BodyInit, {
    headers: {
      "Content-Type": format === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="otiz-statement-${stamp}.${format}"`,
      "Cache-Control": "no-store"
    }
  });
}

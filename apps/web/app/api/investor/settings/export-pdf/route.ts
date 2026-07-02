import { NextResponse } from "next/server";
import {
  getInvestorDashboardDataForInvestor,
  getInvestorWithdrawalRequests,
  listPublishedMonthlyReportsForInvestor,
  serializeInvestorWithdrawalRequest,
  serializeMonthlyReport
} from "@otiz/database";
import { createAdminFormatters, isLocale, type Locale } from "@otiz/lib";
import { requireInvestorApi } from "@/lib/investor-api-auth";
import { buildAccountPdf } from "@/lib/account-pdf";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireInvestorApi();
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const url = new URL(request.url);
  const localeParam = url.searchParams.get("locale") || "en";
  const locale: Locale = isLocale(localeParam) ? localeParam : "en";
  const fmt = createAdminFormatters(locale);
  const investor = auth.investor;

  const [dashboard, withdrawalRows, reportRows] = await Promise.all([
    getInvestorDashboardDataForInvestor(investor.id),
    getInvestorWithdrawalRequests(investor.id),
    listPublishedMonthlyReportsForInvestor(investor.id)
  ]);

  const allocations = (dashboard?.allocations ?? []).map((allocation) => ({
    ref: allocation.supplyId,
    product: allocation.product,
    amount: fmt.currency(allocation.investedAmount),
    status: allocation.currentStage,
    started: allocation.startedAt ? fmt.date(allocation.startedAt) : "—",
    payout: allocation.expectedPayoutAt ? fmt.date(allocation.expectedPayoutAt) : "—"
  }));

  const withdrawals = withdrawalRows.map(serializeInvestorWithdrawalRequest).map((withdrawal) => ({
    amount: `${withdrawal.currency} ${withdrawal.amount}`,
    status: withdrawal.status,
    requested: fmt.date(withdrawal.requestedAt),
    paid: withdrawal.paidAt ? fmt.date(withdrawal.paidAt) : "—"
  }));

  const reports = reportRows.map(serializeMonthlyReport).map((report) => ({
    title: report.title,
    month: report.month,
    summary: report.summary
  }));

  const pdf = await buildAccountPdf(
    { investor: { fullName: investor.fullName, email: investor.email, status: investor.status }, allocations, withdrawals, reports },
    locale,
    fmt.dateTime(new Date())
  );

  const body = new Uint8Array(pdf.buffer, pdf.byteOffset, pdf.byteLength);
  return new NextResponse(body as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="otiz-account-history.pdf"',
      "Cache-Control": "no-store"
    }
  });
}

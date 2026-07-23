import { NextResponse } from "next/server";
import { getInvestorCalendarItems, isProductFeatureEnabled } from "@otiz/database";
import { isLocale } from "@otiz/lib";
import { investorApiErrorResponse, requireInvestorApi } from "@/lib/investor-api-auth";

export const dynamic = "force-dynamic";

function escapeIcs(value: string) {
  return value.replace(/\\/gu, "\\\\").replace(/,/gu, "\\,").replace(/;/gu, "\\;").replace(/\r?\n/gu, "\\n");
}

function icsDate(value: string) {
  return new Date(value).toISOString().replace(/[-:]/gu, "").replace(/\.\d{3}Z$/u, "Z");
}

export async function GET(request: Request) {
  const auth = await requireInvestorApi();
  if (!auth.ok) return investorApiErrorResponse(auth);
  if (!(await isProductFeatureEnabled("investor-calendar"))) return NextResponse.json({ ok: false, error: "Feature disabled." }, { status: 404 });

  const url = new URL(request.url);
  const locale = isLocale(url.searchParams.get("locale") ?? "") ? (url.searchParams.get("locale") as string) : "en";
  const items = await getInvestorCalendarItems(auth.investor.id);
  if (url.searchParams.get("format") !== "ics") return NextResponse.json({ ok: true, data: items });

  const events = items.flatMap((item) => [
    "BEGIN:VEVENT",
    `UID:${escapeIcs(item.id)}@otiz.capital`,
    `DTSTAMP:${icsDate(new Date().toISOString())}`,
    `DTSTART:${icsDate(item.date)}`,
    `DTEND:${icsDate(new Date(new Date(item.date).getTime() + 60 * 60 * 1000).toISOString())}`,
    `SUMMARY:${escapeIcs(item.title)}`,
    `DESCRIPTION:${escapeIcs(item.description)}`,
    `URL:${escapeIcs(new URL(`/${locale}${item.href}`, request.url).toString())}`,
    "END:VEVENT"
  ]);
  const body = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//OTIZ Capital//Investor Calendar//EN", "CALSCALE:GREGORIAN", ...events, "END:VCALENDAR", ""].join("\r\n");

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="otiz-investor-calendar.ics"',
      "Cache-Control": "private, no-store"
    }
  });
}

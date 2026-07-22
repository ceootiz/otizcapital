import { NextResponse } from "next/server";
import { isLocale } from "@otiz/lib";
import { prisma } from "@otiz/database";
import { investorApiErrorResponse, requireInvestorApi } from "@/lib/investor-api-auth";

const CATEGORIES = new Set(["MONEY", "DOCUMENTS", "REPORTS", "ACCOUNT", "OTHER"]);

function clean(value: FormDataEntryValue | null, limit: number) {
  return typeof value === "string" ? value.replace(/\s+/gu, " ").trim().slice(0, limit) : "";
}

function redirect(request: Request, locale: string, query: string) {
  return NextResponse.redirect(new URL(`/${locale}/investor/support?${query}`, request.url), 303);
}

export async function POST(request: Request) {
  const auth = await requireInvestorApi();
  if (!auth.ok) return investorApiErrorResponse(auth);

  const form = await request.formData();
  const requestedLocale = clean(form.get("locale"), 5);
  const locale = isLocale(requestedLocale) ? requestedLocale : "en";
  const category = clean(form.get("category"), 30);
  const subject = clean(form.get("subject"), 140);
  const message = clean(form.get("message"), 1200);

  if (!CATEGORIES.has(category) || subject.length < 4 || message.length < 10) {
    return redirect(request, locale, "error=missing");
  }

  await prisma.$transaction(async (transaction) => {
    const incident = await transaction.operationalIncident.create({
      data: {
        incidentType: "SUPPORT_REQUEST",
        severity: "MEDIUM",
        status: "OPEN",
        title: `Investor support: ${subject}`,
        summary: message,
        investorId: auth.investor.id,
        source: "manual",
        metadataJson: JSON.stringify({ category, origin: "investor_portal" })
      }
    });

    await transaction.auditLog.create({
      data: {
        actor: `investor:${auth.investor.id}`,
        action: "CREATE_SUPPORT_REQUEST",
        entityType: "OperationalIncident",
        entityId: incident.id,
        afterJson: JSON.stringify({ category, status: incident.status, title: incident.title })
      }
    });
  });

  return redirect(request, locale, "sent=1");
}

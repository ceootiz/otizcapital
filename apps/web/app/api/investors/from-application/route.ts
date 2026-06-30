import { NextResponse } from "next/server";
import { createInvestorFromApprovedApplication, serializeInvestor, serializeInvestorApplication } from "@otiz/database";
import { verifyAdminCsrfToken } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

function sanitizeString(value: unknown, maxLength = 160) {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export async function POST(request: Request) {
  const csrf = verifyAdminCsrfToken(request);

  if (!csrf.ok) {
    return NextResponse.json({ ok: false, error: csrf.error }, { status: csrf.status });
  }

  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const applicationId = sanitizeString(payload?.applicationId);

  if (!applicationId) {
    return NextResponse.json({ ok: false, error: "applicationId is required." }, { status: 422 });
  }

  const result = await createInvestorFromApprovedApplication({
    applicationId,
    actor: csrf.session.actor
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    ok: true,
    created: result.created,
    data: {
      investor: serializeInvestor(result.investor),
      application: serializeInvestorApplication(result.application)
    }
  });
}

import { NextResponse } from "next/server";
import { updateInvestorEmailNotifications } from "@otiz/database";
import { investorApiErrorResponse, requireInvestorApi } from "@/lib/investor-api-auth";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const auth = await requireInvestorApi();
  if (!auth.ok) return investorApiErrorResponse(auth);

  const payload = (await request.json().catch(() => null)) as { emailNotificationsEnabled?: unknown } | null;
  if (!payload || typeof payload.emailNotificationsEnabled !== "boolean") {
    return NextResponse.json({ ok: false, error: "emailNotificationsEnabled must be a boolean." }, { status: 422 });
  }

  await updateInvestorEmailNotifications(auth.investor.id, payload.emailNotificationsEnabled);

  return NextResponse.json({ ok: true, emailNotificationsEnabled: payload.emailNotificationsEnabled });
}

import { NextResponse } from "next/server";
import {
  APPLICATION_STATUSES,
  serializeInvestorApplication,
  updateInvestorApplicationStatus,
  type ApplicationStatus
} from "@otiz/database";
import { verifyAdminCsrfToken } from "@/lib/admin-session";

function isAllowedStatus(value: string): value is ApplicationStatus {
  return APPLICATION_STATUSES.includes(value as ApplicationStatus);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const csrf = verifyAdminCsrfToken(request);

  if (!csrf.ok) {
    return NextResponse.json({ ok: false, error: csrf.error }, { status: csrf.status });
  }

  const payload = (await request.json().catch(() => null)) as { status?: string } | null;
  const status = payload?.status || "";

  if (!isAllowedStatus(status)) {
    return NextResponse.json({ ok: false, error: "Invalid status." }, { status: 422 });
  }

  const updated = await updateInvestorApplicationStatus({
    id: params.id,
    status,
    actor: csrf.session.actor
  });

  if (!updated) {
    return NextResponse.json({ ok: false, error: "Investor application not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, data: serializeInvestorApplication(updated) });
}

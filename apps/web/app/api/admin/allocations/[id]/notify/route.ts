import { NextResponse } from "next/server";
import { notifyInvestorAllocationCreated } from "@otiz/database";
import { verifyAdminCsrfToken } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

// POST: re-send the "allocation created" notification (bell + email) to the
// investor — useful when the original was missed.
export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const csrf = verifyAdminCsrfToken(request);
  if (!csrf.ok) return NextResponse.json({ ok: false, error: csrf.error }, { status: csrf.status });

  const result = await notifyInvestorAllocationCreated(params.id);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true });
}

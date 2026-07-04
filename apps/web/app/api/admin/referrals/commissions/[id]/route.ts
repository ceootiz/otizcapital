import { NextResponse } from "next/server";
import { markCommissionPaid } from "@otiz/database";
import { sanitizeAdminInput, verifyAdminCsrfToken } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

// PATCH: mark a PENDING commission as PAID, with an optional note.
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const csrf = verifyAdminCsrfToken(request);
  if (!csrf.ok) return NextResponse.json({ ok: false, error: csrf.error }, { status: csrf.status });

  const payload = (await request.json().catch(() => null)) as { action?: unknown; note?: unknown } | null;
  const action = typeof payload?.action === "string" ? payload.action : "";
  if (action !== "mark-paid") {
    return NextResponse.json({ ok: false, error: "Unsupported action." }, { status: 422 });
  }

  const note = sanitizeAdminInput(payload?.note, 1000) || null;
  const { updated } = await markCommissionPaid({ id: params.id, note });
  if (!updated) {
    return NextResponse.json({ ok: false, error: "Commission not found or already paid." }, { status: 409 });
  }

  return NextResponse.json({ ok: true });
}

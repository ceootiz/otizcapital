import { NextResponse } from "next/server";
import { deleteInvestorRecords } from "@otiz/database";
import { verifyAdminCsrfToken } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

function parseIds(value: unknown) {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.filter((id): id is string => typeof id === "string").map((id) => id.trim()).filter(Boolean)));
}

export async function DELETE(request: Request) {
  const csrf = verifyAdminCsrfToken(request);
  if (!csrf.ok) {
    return NextResponse.json({ ok: false, error: csrf.error }, { status: csrf.status });
  }

  const payload = (await request.json().catch(() => null)) as { ids?: unknown } | null;
  const ids = parseIds(payload?.ids);
  if (ids.length === 0) {
    return NextResponse.json({ ok: false, error: "Select at least one investor." }, { status: 422 });
  }
  if (ids.length > 50) {
    return NextResponse.json({ ok: false, error: "A maximum of 50 investors can be deleted at once." }, { status: 422 });
  }

  const result = await deleteInvestorRecords({ ids, actor: csrf.session.actor });
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true, deletedIds: result.deletedIds });
}

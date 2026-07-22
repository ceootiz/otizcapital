import { NextResponse } from "next/server";
import { serializeArbitrageur, setArbitrageurCustomRate, setArbitrageurStatus } from "@otiz/database";
import { verifyAdminCsrfToken } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

// PATCH: approve/suspend an arbitrageur or set a per-partner commission rate.
//   { action: "approve" | "suspend" }
//   { action: "set-rate", customRate: number | null }  (fraction 0..1, or null to clear)
export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const csrf = verifyAdminCsrfToken(request);
  if (!csrf.ok) return NextResponse.json({ ok: false, error: csrf.error }, { status: csrf.status });

  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const action = typeof payload?.action === "string" ? payload.action : "";

  try {
    if (action === "approve") {
      const updated = await setArbitrageurStatus(params.id, "ACTIVE");
      return NextResponse.json({ ok: true, data: serializeArbitrageur(updated) });
    }
    if (action === "suspend") {
      const updated = await setArbitrageurStatus(params.id, "SUSPENDED");
      return NextResponse.json({ ok: true, data: serializeArbitrageur(updated) });
    }
    if (action === "set-rate") {
      const raw = payload?.customRate;
      let customRate: number | null = null;
      if (raw !== null && raw !== undefined && raw !== "") {
        const num = Number(raw);
        if (!Number.isFinite(num) || num < 0 || num > 1) {
          return NextResponse.json({ ok: false, error: "Rate must be between 0 and 1." }, { status: 422 });
        }
        customRate = num;
      }
      const updated = await setArbitrageurCustomRate(params.id, customRate);
      return NextResponse.json({ ok: true, data: serializeArbitrageur(updated) });
    }
    return NextResponse.json({ ok: false, error: "Unsupported action." }, { status: 422 });
  } catch {
    return NextResponse.json({ ok: false, error: "Arbitrageur not found." }, { status: 404 });
  }
}

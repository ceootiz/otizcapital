import { NextResponse } from "next/server";
import { getProductFeatureFlags, isProductFeatureKey, setProductFeatureFlag } from "@otiz/database";
import { getAdminSession, verifyAdminCsrfToken } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!getAdminSession()) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  return NextResponse.json({ ok: true, data: await getProductFeatureFlags() });
}

export async function PATCH(request: Request) {
  const csrf = verifyAdminCsrfToken(request);
  if (!csrf.ok) return NextResponse.json({ ok: false, error: csrf.error }, { status: csrf.status });

  const payload = (await request.json().catch(() => null)) as { key?: unknown; enabled?: unknown } | null;
  if (!payload || !isProductFeatureKey(payload.key) || typeof payload.enabled !== "boolean") {
    return NextResponse.json({ ok: false, error: "A valid feature key and boolean enabled value are required." }, { status: 422 });
  }

  const flags = await setProductFeatureFlag({ key: payload.key, enabled: payload.enabled, actor: csrf.session.actor });
  return NextResponse.json({ ok: true, data: flags });
}

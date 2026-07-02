import { NextResponse } from "next/server";
import { getSiteSettings, sanitizeTelegramHandle, setContactTelegram } from "@otiz/database";
import { getAdminSession, verifyAdminCsrfToken } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

// GET /api/admin/settings/contact — current contact settings (admin-session gated).
export async function GET() {
  if (!getAdminSession()) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const settings = await getSiteSettings();
  return NextResponse.json({ ok: true, telegram: settings.contactTelegram, updatedAt: settings.updatedAt });
}

// PUT /api/admin/settings/contact  { telegram } — update the Telegram handle.
export async function PUT(request: Request) {
  const csrf = verifyAdminCsrfToken(request);
  if (!csrf.ok) return NextResponse.json({ ok: false, error: csrf.error }, { status: csrf.status });

  const payload = (await request.json().catch(() => null)) as { telegram?: unknown } | null;
  if (!payload) return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 422 });

  const cleaned = sanitizeTelegramHandle(payload.telegram);
  // Reject input that reduced to nothing usable (only symbols / too short).
  if (typeof payload.telegram !== "string" || cleaned.length < 3) {
    return NextResponse.json({ ok: false, error: "A valid Telegram handle is required (letters, digits, underscore)." }, { status: 422 });
  }

  const settings = await setContactTelegram(cleaned);
  return NextResponse.json({ ok: true, telegram: settings.contactTelegram, updatedAt: settings.updatedAt });
}

import { NextResponse } from "next/server";
import { getSiteSettings } from "@otiz/database";

export const dynamic = "force-dynamic";

// GET /api/settings/contact — PUBLIC (no auth). Exposes only the Telegram
// contact handle so the investor cabinet / status page can render the button.
export async function GET() {
  const settings = await getSiteSettings();
  return NextResponse.json(
    { ok: true, telegram: settings.contactTelegram },
    { headers: { "Cache-Control": "public, max-age=60, s-maxage=60" } }
  );
}

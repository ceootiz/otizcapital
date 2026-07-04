import { NextResponse } from "next/server";
import { clearArbitrageurSession } from "@/lib/arbitrageur-session";

export const dynamic = "force-dynamic";

export async function POST() {
  clearArbitrageurSession();
  return NextResponse.json({ ok: true });
}

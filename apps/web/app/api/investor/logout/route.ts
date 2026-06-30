import { NextResponse } from "next/server";
import { clearInvestorSession } from "@/lib/investor-session";

export const dynamic = "force-dynamic";

export async function POST() {
  clearInvestorSession();

  return NextResponse.json({ ok: true });
}

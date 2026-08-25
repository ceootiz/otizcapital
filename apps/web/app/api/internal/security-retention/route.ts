import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { runSecurityRetention } from "@otiz/database";

export const dynamic = "force-dynamic";

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET || "";
  const authorization = request.headers.get("authorization") || "";
  const supplied = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";

  if (!secret) {
    return NextResponse.json({ ok: false, error: "Security retention is not configured." }, { status: 503 });
  }
  if (!supplied || !safeEqual(supplied, secret)) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const result = await runSecurityRetention();
  return NextResponse.json({ ok: true, data: result }, { headers: { "Cache-Control": "no-store" } });
}

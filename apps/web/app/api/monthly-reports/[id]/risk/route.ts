import { NextResponse } from "next/server";
import { buildRiskSnapshot } from "@otiz/database";
import { getAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

function sanitizeString(value: unknown, maxLength = 160) {
  if (typeof value !== "string" && typeof value !== "number") return "";
  return String(value).replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export async function GET(_request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = getAdminSession();
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });

  const risk = await buildRiskSnapshot(sanitizeString(params.id));
  if (!risk) return NextResponse.json({ ok: false, error: "Monthly report not found." }, { status: 404 });
  return NextResponse.json({ ok: true, data: risk });
}

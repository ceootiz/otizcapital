import { NextResponse } from "next/server";
import { findInvestorByEmail, serializeInvestor } from "@otiz/database";
import { createInvestorSession, verifyInvestorAccessCode } from "@/lib/investor-session";

export const dynamic = "force-dynamic";

function sanitizeString(value: unknown, maxLength = 160) {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function isEmail(value: string) {
  return /^\S+@\S+\.\S+$/.test(value);
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const email = sanitizeString(payload?.email, 180).toLowerCase();
  const accessCode = sanitizeString(payload?.accessCode, 120);

  if (!isEmail(email)) {
    return NextResponse.json({ ok: false, error: "A valid investor email is required." }, { status: 422 });
  }

  if (!verifyInvestorAccessCode(accessCode)) {
    return NextResponse.json({ ok: false, error: "Invalid investor access code." }, { status: 401 });
  }

  const investor = await findInvestorByEmail(email);

  if (!investor) {
    return NextResponse.json({ ok: false, error: "Investor account not found. Ask a manager to activate access from an approved application." }, { status: 404 });
  }

  if (investor.status !== "ACTIVE") {
    return NextResponse.json({ ok: false, error: "Investor access is not active." }, { status: 403 });
  }

  if (!createInvestorSession({ investorId: investor.id, email: investor.email })) {
    return NextResponse.json({ ok: false, error: "Investor session is not available." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data: serializeInvestor(investor) });
}

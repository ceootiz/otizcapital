import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { updateInvestorPasswordHash } from "@otiz/database";
import { requireInvestorApi } from "@/lib/investor-api-auth";

export const dynamic = "force-dynamic";

// Sets or changes the investor's personal password (separate from the email +
// access-code login). If a password already exists, the current one must match.
export async function POST(request: Request) {
  const auth = await requireInvestorApi();
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });

  const payload = (await request.json().catch(() => null)) as
    | { currentPassword?: unknown; newPassword?: unknown; confirmPassword?: unknown }
    | null;
  if (!payload) return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 422 });

  const newPassword = typeof payload.newPassword === "string" ? payload.newPassword : "";
  const confirmPassword = typeof payload.confirmPassword === "string" ? payload.confirmPassword : "";
  const currentPassword = typeof payload.currentPassword === "string" ? payload.currentPassword : "";

  if (newPassword.length < 8) {
    return NextResponse.json({ ok: false, error: "PASSWORD_TOO_SHORT" }, { status: 422 });
  }
  if (newPassword.length > 200) {
    return NextResponse.json({ ok: false, error: "PASSWORD_TOO_LONG" }, { status: 422 });
  }
  if (newPassword !== confirmPassword) {
    return NextResponse.json({ ok: false, error: "PASSWORD_MISMATCH" }, { status: 422 });
  }

  // If a password is already set, verify the current one before changing it.
  if (auth.investor.passwordHash) {
    const matches = currentPassword ? await bcrypt.compare(currentPassword, auth.investor.passwordHash) : false;
    if (!matches) {
      return NextResponse.json({ ok: false, error: "WRONG_CURRENT_PASSWORD" }, { status: 401 });
    }
  }

  const hash = await bcrypt.hash(newPassword, 12);
  await updateInvestorPasswordHash(auth.investor.id, hash);

  return NextResponse.json({ ok: true });
}

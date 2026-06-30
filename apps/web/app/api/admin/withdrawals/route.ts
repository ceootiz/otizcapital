import { NextResponse } from "next/server";
import { getAdminWithdrawalRequests, isWithdrawalRequestStatus, serializeAdminWithdrawalRequest, type WithdrawalRequestStatus } from "@otiz/database";
import { getAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

function sanitizeString(value: unknown, maxLength = 1000) {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export async function GET(request: Request) {
  const session = getAdminSession();
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  const url = new URL(request.url);
  const statusValue = sanitizeString(url.searchParams.get("status"), 24);
  const status = statusValue && isWithdrawalRequestStatus(statusValue) ? (statusValue as WithdrawalRequestStatus) : undefined;
  const requests = await getAdminWithdrawalRequests({ status });
  return NextResponse.json({ ok: true, data: requests.map(serializeAdminWithdrawalRequest) });
}

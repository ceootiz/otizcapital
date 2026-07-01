import { NextResponse } from "next/server";
import {
  createDepositAddress,
  listAllDepositAddresses,
  serializeDepositAddress
} from "@otiz/database";
import { getAdminSession, verifyAdminCsrfToken } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

function sanitize(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

// GET /api/admin/deposit-addresses — list all deposit addresses (serialized).
export async function GET() {
  if (!getAdminSession()) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const rows = await listAllDepositAddresses();
  return NextResponse.json({ ok: true, addresses: rows.map(serializeDepositAddress) });
}

// POST /api/admin/deposit-addresses — create a deposit address.
export async function POST(request: Request) {
  const csrf = verifyAdminCsrfToken(request);
  if (!csrf.ok) return NextResponse.json({ ok: false, error: csrf.error }, { status: csrf.status });

  const payload = (await request.json().catch(() => null)) as
    | { currency?: unknown; network?: unknown; address?: unknown; isActive?: unknown; sortOrder?: unknown }
    | null;
  if (!payload) return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 422 });

  const currency = sanitize(payload.currency);
  const network = sanitize(payload.network);
  const address = sanitize(payload.address);
  if (!currency || !network || !address) {
    return NextResponse.json({ ok: false, error: "Currency, network and address are required." }, { status: 422 });
  }

  const isActive = typeof payload.isActive === "boolean" ? payload.isActive : undefined;
  const sortOrder =
    typeof payload.sortOrder === "number" && Number.isFinite(payload.sortOrder)
      ? Math.trunc(payload.sortOrder)
      : undefined;

  const row = await createDepositAddress({ currency, network, address, isActive, sortOrder });
  return NextResponse.json({ ok: true, address: serializeDepositAddress(row) });
}

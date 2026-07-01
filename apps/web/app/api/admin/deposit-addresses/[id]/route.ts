import { NextResponse } from "next/server";
import { deleteDepositAddress, serializeDepositAddress, updateDepositAddress } from "@otiz/database";
import { verifyAdminCsrfToken } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

function sanitize(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

// PATCH /api/admin/deposit-addresses/[id] — update any subset of fields.
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const csrf = verifyAdminCsrfToken(request);
  if (!csrf.ok) return NextResponse.json({ ok: false, error: csrf.error }, { status: csrf.status });

  const payload = (await request.json().catch(() => null)) as
    | { currency?: unknown; network?: unknown; address?: unknown; isActive?: unknown; sortOrder?: unknown }
    | null;
  if (!payload) return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 422 });

  const update: Partial<{
    currency: string;
    network: string;
    address: string;
    isActive: boolean;
    sortOrder: number;
  }> = {};

  if (payload.currency !== undefined) {
    const currency = sanitize(payload.currency);
    if (!currency) return NextResponse.json({ ok: false, error: "Currency cannot be empty." }, { status: 422 });
    update.currency = currency;
  }
  if (payload.network !== undefined) {
    const network = sanitize(payload.network);
    if (!network) return NextResponse.json({ ok: false, error: "Network cannot be empty." }, { status: 422 });
    update.network = network;
  }
  if (payload.address !== undefined) {
    const address = sanitize(payload.address);
    if (!address) return NextResponse.json({ ok: false, error: "Address cannot be empty." }, { status: 422 });
    update.address = address;
  }
  if (payload.isActive !== undefined) {
    if (typeof payload.isActive !== "boolean") {
      return NextResponse.json({ ok: false, error: "isActive must be a boolean." }, { status: 422 });
    }
    update.isActive = payload.isActive;
  }
  if (payload.sortOrder !== undefined) {
    if (typeof payload.sortOrder !== "number" || !Number.isFinite(payload.sortOrder)) {
      return NextResponse.json({ ok: false, error: "sortOrder must be a number." }, { status: 422 });
    }
    update.sortOrder = Math.trunc(payload.sortOrder);
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ ok: false, error: "No fields to update." }, { status: 422 });
  }

  try {
    const row = await updateDepositAddress(params.id, update);
    return NextResponse.json({ ok: true, address: serializeDepositAddress(row) });
  } catch {
    return NextResponse.json({ ok: false, error: "Deposit address not found." }, { status: 404 });
  }
}

// DELETE /api/admin/deposit-addresses/[id] — remove a deposit address.
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const csrf = verifyAdminCsrfToken(request);
  if (!csrf.ok) return NextResponse.json({ ok: false, error: csrf.error }, { status: csrf.status });

  try {
    await deleteDepositAddress(params.id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Deposit address not found." }, { status: 404 });
  }
}

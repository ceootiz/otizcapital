import { NextResponse } from "next/server";
import {
  ALLOCATION_PROOF_STATUSES,
  ALLOCATION_PROOF_TYPES,
  createAllocationProofRecord,
  serializeAllocationProof,
  type AllocationProofStatus,
  type AllocationProofType
} from "@otiz/database";
import { verifyAdminCsrfToken } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

function sanitizeString(value: unknown, maxLength = 1000) {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function isProofType(value: string): value is AllocationProofType {
  return ALLOCATION_PROOF_TYPES.includes(value as AllocationProofType);
}

function isProofStatus(value: string): value is AllocationProofStatus {
  return ALLOCATION_PROOF_STATUSES.includes(value as AllocationProofStatus);
}

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const csrf = verifyAdminCsrfToken(request);
  if (!csrf.ok) return NextResponse.json({ ok: false, error: csrf.error }, { status: csrf.status });

  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!payload) return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 422 });

  const typeValue = sanitizeString(payload.type, 40);
  const statusValue = sanitizeString(payload.status || "PENDING", 24);
  const title = sanitizeString(payload.title, 160);

  if (!isProofType(typeValue)) return NextResponse.json({ ok: false, error: "Invalid proof type." }, { status: 422 });
  if (!isProofStatus(statusValue)) return NextResponse.json({ ok: false, error: "Invalid proof status." }, { status: 422 });
  if (!title) return NextResponse.json({ ok: false, error: "title is required." }, { status: 422 });

  const result = await createAllocationProofRecord({
    allocationId: sanitizeString(params.id, 160),
    type: typeValue,
    title,
    description: sanitizeString(payload.description, 1000) || null,
    proofUrl: sanitizeString(payload.proofUrl, 500) || null,
    status: statusValue,
    actor: csrf.session.actor
  });

  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: result.status });

  return NextResponse.json({ ok: true, data: serializeAllocationProof(result.proof) }, { status: 201 });
}

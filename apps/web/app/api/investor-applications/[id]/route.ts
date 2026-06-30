import { NextResponse } from "next/server";
import {
  APPLICATION_PRIORITIES,
  APPLICATION_STATUSES,
  serializeInvestorApplication,
  updateInvestorApplication,
  type ApplicationPriority,
  type ApplicationStatus
} from "@otiz/database";
import { verifyAdminCsrfToken } from "@/lib/admin-session";

function sanitizeString(value: unknown, maxLength = 500) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function isOneOf<T extends readonly string[]>(value: string, allowed: T): value is T[number] {
  return allowed.includes(value);
}

function parseNullableDate(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return { ok: true as const, value: null };
  }

  if (typeof value !== "string") {
    return { ok: false as const };
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return { ok: false as const };
  }

  return { ok: true as const, value: parsed };
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const csrf = verifyAdminCsrfToken(request);

  if (!csrf.ok) {
    return NextResponse.json({ ok: false, error: csrf.error }, { status: csrf.status });
  }

  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ ok: false, error: "Invalid payload." }, { status: 422 });
  }

  const status = sanitizeString(payload.status, 40);
  const priority = sanitizeString(payload.priority, 20);
  const nextActionAt = parseNullableDate(payload.nextActionAt);

  if (status && !isOneOf(status, APPLICATION_STATUSES)) {
    return NextResponse.json({ ok: false, error: "Invalid status." }, { status: 422 });
  }

  if (priority && !isOneOf(priority, APPLICATION_PRIORITIES)) {
    return NextResponse.json({ ok: false, error: "Invalid priority." }, { status: 422 });
  }

  if (!nextActionAt.ok) {
    return NextResponse.json({ ok: false, error: "Invalid next action date." }, { status: 422 });
  }

  const updated = await updateInvestorApplication({
    id: params.id,
    status: status ? (status as ApplicationStatus) : undefined,
    priority: priority ? (priority as ApplicationPriority) : undefined,
    managerNotes: "managerNotes" in payload ? sanitizeString(payload.managerNotes, 4000) || null : undefined,
    sourceLabel: "sourceLabel" in payload ? sanitizeString(payload.sourceLabel, 160) || null : undefined,
    nextAction: "nextAction" in payload ? sanitizeString(payload.nextAction, 280) || null : undefined,
    nextActionAt: "nextActionAt" in payload ? nextActionAt.value : undefined,
    actor: csrf.session.actor,
    action: "UPDATE_APPLICATION"
  });

  if (!updated) {
    return NextResponse.json({ ok: false, error: "Investor application not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, data: serializeInvestorApplication(updated) });
}

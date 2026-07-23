import { NextResponse } from "next/server";
import { prisma } from "@otiz/database";
import { verifyAdminCsrfToken } from "@/lib/admin-session";

const INVESTOR_REQUEST_TYPES = new Set(["SUPPORT_REQUEST", "PROFILE_CHANGE_REQUEST", "ACCOUNT_PAUSE_REQUEST", "ACCOUNT_CLOSE_REQUEST"]);

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const csrf = verifyAdminCsrfToken(request);
  if (!csrf.ok) return NextResponse.json({ ok: false, error: csrf.error }, { status: csrf.status });

  const { id } = await context.params;
  const payload = await request.json().catch(() => ({})) as { message?: unknown };
  const message = typeof payload.message === "string" ? payload.message.trim().slice(0, 1200) : "";
  if (message.length < 2) return NextResponse.json({ ok: false, error: "Reply is required." }, { status: 400 });

  const incident = await prisma.operationalIncident.findUnique({
    where: { id },
    select: { id: true, incidentType: true, investorId: true, status: true, acknowledgedAt: true, acknowledgedBy: true }
  });
  if (!incident) return NextResponse.json({ ok: false, error: "Incident not found." }, { status: 404 });
  if (!INVESTOR_REQUEST_TYPES.has(incident.incidentType) || !incident.investorId) {
    return NextResponse.json({ ok: false, error: "This incident is not an investor request." }, { status: 409 });
  }
  if (incident.status === "RESOLVED") return NextResponse.json({ ok: false, error: "Resolved requests cannot receive a new reply." }, { status: 409 });

  const now = new Date();
  const nextStatus = incident.status === "OPEN" ? "ACKNOWLEDGED" : incident.status;
  const acknowledgedAt = incident.acknowledgedAt ?? now;
  const acknowledgedBy = incident.acknowledgedBy ?? csrf.session.actor;

  await prisma.$transaction(async (transaction) => {
    await transaction.investorNotification.create({
      data: {
        investorId: incident.investorId as string,
        type: "SUPPORT_REPLY",
        title: "OTIZ",
        body: message,
        linkHref: "/investor/support"
      }
    });
    if (incident.status === "OPEN") {
      await transaction.operationalIncident.update({
        where: { id: incident.id },
        data: { status: nextStatus, acknowledgedAt, acknowledgedBy }
      });
    }
    await transaction.auditLog.create({
      data: {
        actor: csrf.session.actor,
        action: "SUPPORT_REPLY",
        entityType: "OperationalIncident",
        entityId: incident.id,
        beforeJson: null,
        afterJson: JSON.stringify({ investorId: incident.investorId, message })
      }
    });
  });

  return NextResponse.json({ ok: true, data: { status: nextStatus, acknowledgedAt: acknowledgedAt.toISOString(), acknowledgedBy } });
}

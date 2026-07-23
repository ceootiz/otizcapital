import { prisma } from "./client";

export const INVESTOR_ACCOUNT_REQUEST_TYPES = ["PROFILE_CHANGE", "ACCOUNT_PAUSE", "ACCOUNT_CLOSE"] as const;
export type InvestorAccountRequestType = (typeof INVESTOR_ACCOUNT_REQUEST_TYPES)[number];

const REQUEST_CONFIG: Record<InvestorAccountRequestType, { incidentType: string; title: string; severity: string }> = {
  PROFILE_CHANGE: { incidentType: "PROFILE_CHANGE_REQUEST", title: "Investor profile change request", severity: "LOW" },
  ACCOUNT_PAUSE: { incidentType: "ACCOUNT_PAUSE_REQUEST", title: "Investor account pause request", severity: "MEDIUM" },
  ACCOUNT_CLOSE: { incidentType: "ACCOUNT_CLOSE_REQUEST", title: "Investor account closure request", severity: "MEDIUM" }
};

export function validateInvestorAccountRequest(input: { type?: unknown; details?: unknown }) {
  const type = typeof input.type === "string" && INVESTOR_ACCOUNT_REQUEST_TYPES.includes(input.type as InvestorAccountRequestType)
    ? input.type as InvestorAccountRequestType
    : null;
  const details = typeof input.details === "string" ? input.details.replace(/\s+/gu, " ").trim().slice(0, 1200) : "";
  if (!type) return { ok: false as const, error: "INVALID_REQUEST_TYPE" };
  if (details.length < 10) return { ok: false as const, error: "INVALID_DETAILS" };
  return { ok: true as const, type, details };
}

export async function createInvestorAccountRequest(input: {
  investorId: string;
  type: InvestorAccountRequestType;
  details: string;
}) {
  const config = REQUEST_CONFIG[input.type];
  return prisma.$transaction(async (transaction) => {
    const incident = await transaction.operationalIncident.create({
      data: {
        incidentType: config.incidentType,
        severity: config.severity,
        status: "OPEN",
        title: config.title,
        summary: input.details,
        investorId: input.investorId,
        source: "manual",
        metadataJson: JSON.stringify({ requestType: input.type, origin: "investor_settings" })
      }
    });
    await transaction.auditLog.create({
      data: {
        actor: `investor:${input.investorId}`,
        action: "CREATE_INVESTOR_ACCOUNT_REQUEST",
        entityType: "OperationalIncident",
        entityId: incident.id,
        afterJson: JSON.stringify({ requestType: input.type, status: incident.status })
      }
    });
    return incident;
  });
}

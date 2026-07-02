import type { InvestorSession } from "@prisma/client";
import { prisma } from "./client";

export type SerializedInvestorSession = {
  id: string;
  ip: string;
  userAgent: string;
  isActive: boolean;
  createdAt: string;
  expiresAt: string;
};

export function serializeInvestorSession(record: InvestorSession): SerializedInvestorSession {
  return {
    id: record.id,
    ip: record.ip,
    userAgent: record.userAgent,
    isActive: record.isActive,
    createdAt: record.createdAt.toISOString(),
    expiresAt: record.expiresAt.toISOString()
  };
}

export async function createInvestorSessionRecord(input: {
  investorId: string;
  ip: string;
  userAgent: string;
  expiresAt: Date;
}) {
  return prisma.investorSession.create({
    data: {
      investorId: input.investorId,
      ip: input.ip,
      userAgent: input.userAgent,
      expiresAt: input.expiresAt
    }
  });
}

// True only when the session row exists, is active, and has not expired.
export async function isInvestorSessionActive(sessionId: string, investorId: string): Promise<boolean> {
  if (!sessionId) return false;
  const row = await prisma.investorSession.findUnique({ where: { id: sessionId } });
  return Boolean(row && row.investorId === investorId && row.isActive && row.expiresAt.getTime() > Date.now());
}

export async function listInvestorSessions(investorId: string, limit = 10) {
  return prisma.investorSession.findMany({
    where: { investorId },
    orderBy: { createdAt: "desc" },
    take: limit
  });
}

// Terminates every session for the investor (used by "log out all devices").
export async function terminateAllInvestorSessions(investorId: string) {
  return prisma.investorSession.updateMany({ where: { investorId, isActive: true }, data: { isActive: false } });
}

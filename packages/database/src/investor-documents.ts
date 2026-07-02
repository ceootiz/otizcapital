import type { InvestorDocument, Prisma } from "@prisma/client";
import { prisma } from "./client";

// Onboarding / agreement documents. The PDF is stored inline as base64. Status
// is PENDING_SIGNATURE until the investor e-signs, then SIGNED with signedAt.

export const INVESTOR_DOCUMENT_STATUS = {
  PENDING: "PENDING_SIGNATURE",
  SIGNED: "SIGNED"
} as const;

export type SerializedInvestorDocument = {
  id: string;
  investorId: string;
  type: string;
  fileName: string;
  status: string;
  signedAt: string | null;
  createdAt: string;
};

// fileData (base64) is omitted — only the download route reads it.
export function serializeInvestorDocument(
  record: Pick<InvestorDocument, "id" | "investorId" | "type" | "fileName" | "status" | "signedAt" | "createdAt">
): SerializedInvestorDocument {
  return {
    id: record.id,
    investorId: record.investorId,
    type: record.type,
    fileName: record.fileName,
    status: record.status,
    signedAt: record.signedAt ? record.signedAt.toISOString() : null,
    createdAt: record.createdAt.toISOString()
  };
}

export async function createInvestorDocument(
  input: {
    investorId: string;
    type: string;
    fileName: string;
    fileData: string;
    status?: string;
  },
  client: Prisma.TransactionClient | typeof prisma = prisma
) {
  return client.investorDocument.create({
    data: {
      investorId: input.investorId,
      type: input.type,
      fileName: input.fileName,
      fileData: input.fileData,
      status: input.status ?? INVESTOR_DOCUMENT_STATUS.PENDING
    }
  });
}

export async function listInvestorDocuments(investorId: string) {
  return prisma.investorDocument.findMany({
    where: { investorId },
    orderBy: { createdAt: "desc" },
    select: { id: true, investorId: true, type: true, fileName: true, status: true, signedAt: true, createdAt: true }
  });
}

export async function getInvestorDocumentForInvestor(id: string, investorId: string) {
  return prisma.investorDocument.findFirst({ where: { id, investorId } });
}

// Signs a pending document owned by the investor. Uses updateMany so a
// non-owned or already-signed document is a no-op (count === 0), then returns
// the fresh row. Idempotent-safe: signing an already-signed doc returns it
// unchanged with signed: false.
export async function signInvestorDocument(id: string, investorId: string) {
  const result = await prisma.investorDocument.updateMany({
    where: { id, investorId, status: INVESTOR_DOCUMENT_STATUS.PENDING },
    data: { status: INVESTOR_DOCUMENT_STATUS.SIGNED, signedAt: new Date() }
  });

  const document = await prisma.investorDocument.findFirst({ where: { id, investorId } });
  return { signed: result.count > 0, document };
}

// Admin-facing: the latest agreement document status for an investor (for the
// "Соглашение: ожидает подписания / подписано" line on the detail page).
export async function getLatestAgreementForInvestor(investorId: string) {
  return prisma.investorDocument.findFirst({
    where: { investorId, type: "AGREEMENT" },
    orderBy: { createdAt: "desc" },
    select: { id: true, investorId: true, type: true, fileName: true, status: true, signedAt: true, createdAt: true }
  });
}

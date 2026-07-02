import type { InvestorFileReport } from "@prisma/client";
import { prisma } from "./client";

// Admin-uploaded XLSX report files, stored inline as base64. Distinct from the
// text-based MonthlyReport model.

export type SerializedInvestorFileReport = {
  id: string;
  investorId: string;
  fileName: string;
  month: string;
  uploadedBy: string;
  uploadedAt: string;
};

// Note: fileData (base64) is intentionally omitted from the serialized shape —
// it is only ever read by the download routes, never sent to a list view.
export function serializeInvestorFileReport(
  record: Pick<InvestorFileReport, "id" | "investorId" | "fileName" | "month" | "uploadedBy" | "uploadedAt">
): SerializedInvestorFileReport {
  return {
    id: record.id,
    investorId: record.investorId,
    fileName: record.fileName,
    month: record.month,
    uploadedBy: record.uploadedBy,
    uploadedAt: record.uploadedAt.toISOString()
  };
}

export async function createInvestorFileReport(input: {
  investorId: string;
  fileName: string;
  fileData: string;
  month: string;
  uploadedBy: string;
}) {
  return prisma.investorFileReport.create({ data: input });
}

export async function listInvestorFileReports(investorId: string) {
  return prisma.investorFileReport.findMany({
    where: { investorId },
    orderBy: { uploadedAt: "desc" },
    select: { id: true, investorId: true, fileName: true, month: true, uploadedBy: true, uploadedAt: true }
  });
}

// Fetches the full row (including fileData) but only when it belongs to the
// given investor — used by the investor-facing download route as an ownership
// gate.
export async function getInvestorFileReportForInvestor(id: string, investorId: string) {
  return prisma.investorFileReport.findFirst({ where: { id, investorId } });
}

export async function getInvestorFileReportById(id: string) {
  return prisma.investorFileReport.findUnique({ where: { id } });
}

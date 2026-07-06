import { NextResponse } from "next/server";
import {
  getInvestorDocumentForInvestor,
  getInvestorFileReportForInvestor,
  listInvestorDocuments,
  listInvestorFileReports
} from "@otiz/database";
import JSZip from "jszip";
import { investorApiErrorResponse, requireInvestorApi } from "@/lib/investor-api-auth";

export const dynamic = "force-dynamic";

// GET: bundle all of the signed-in investor's documents (signed/pending
// agreements + admin-uploaded XLSX file reports) into a single ZIP.
// The list helpers omit fileData (base64) from their select, so we re-fetch the
// full owned row per item via the ownership-scoped getters to get the bytes.
export async function GET() {
  const auth = await requireInvestorApi();
  if (!auth.ok) return investorApiErrorResponse(auth);

  const investorId = auth.investor.id;
  const [documents, reports] = await Promise.all([
    listInvestorDocuments(investorId),
    listInvestorFileReports(investorId)
  ]);

  if (documents.length === 0 && reports.length === 0) {
    return NextResponse.json({ ok: false, error: "No documents to download." }, { status: 404 });
  }

  const zip = new JSZip();
  const usedPaths = new Set<string>();

  // Ensures each entry has a unique path within the ZIP; on a collision, append
  // the record id before the extension so nothing gets silently overwritten.
  const uniquePath = (folder: string, fileName: string, id: string, fallbackExt: string) => {
    const safeName = fileName && fileName.trim().length > 0 ? fileName : `${id}${fallbackExt}`;
    let candidate = `${folder}/${safeName}`;
    if (usedPaths.has(candidate)) {
      const dot = safeName.lastIndexOf(".");
      const base = dot > 0 ? safeName.slice(0, dot) : safeName;
      const ext = dot > 0 ? safeName.slice(dot) : "";
      candidate = `${folder}/${base}-${id}${ext}`;
    }
    usedPaths.add(candidate);
    return candidate;
  };

  for (const meta of documents) {
    const full = await getInvestorDocumentForInvestor(meta.id, investorId);
    if (!full) continue;
    zip.file(uniquePath("agreements", full.fileName, full.id, ".pdf"), Buffer.from(full.fileData, "base64"));
  }

  for (const meta of reports) {
    const full = await getInvestorFileReportForInvestor(meta.id, investorId);
    if (!full) continue;
    zip.file(uniquePath("reports", full.fileName, full.id, ".xlsx"), Buffer.from(full.fileData, "base64"));
  }

  const buffer = await zip.generateAsync({ type: "nodebuffer" });
  const body = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  return new Response(body as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="otiz-documents.zip"',
      "Cache-Control": "no-store"
    }
  });
}

import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";
import * as XLSX from "xlsx";
import type { InvestorLedgerEntry, InvestorLedgerEntryType } from "@otiz/database";
import type { Locale } from "@otiz/lib";

type StatementFilters = { type?: string | null; from?: string | null; to?: string | null };
export type AccountStatementPosition = { currency: string; opening: number; movement: number; closing: number };
export type AccountStatementData = {
  investor: { fullName: string; email: string };
  generatedAt: string;
  from: string | null;
  to: string | null;
  type: InvestorLedgerEntryType | null;
  entries: InvestorLedgerEntry[];
  positions: AccountStatementPosition[];
};

const TYPES = new Set<InvestorLedgerEntryType>(["DEPOSIT", "DEAL", "PROFIT", "REINVESTMENT", "WITHDRAWAL", "REFERRAL_BONUS"]);

function signed(entry: InvestorLedgerEntry) {
  return entry.direction === "IN" ? entry.amount : entry.direction === "OUT" ? -entry.amount : 0;
}

export function buildAccountStatementData(input: { investor: AccountStatementData["investor"]; entries: InvestorLedgerEntry[]; filters?: StatementFilters; generatedAt?: Date }): AccountStatementData {
  const from = input.filters?.from ? new Date(input.filters.from).toISOString() : null;
  const to = input.filters?.to ? new Date(input.filters.to).toISOString() : null;
  const type = TYPES.has(input.filters?.type as InvestorLedgerEntryType) ? input.filters?.type as InvestorLedgerEntryType : null;
  const currencies = [...new Set(input.entries.map((entry) => entry.currency))].sort();
  const positions = currencies.map((currency) => {
    const currencyEntries = input.entries.filter((entry) => entry.currency === currency);
    const opening = currencyEntries.filter((entry) => from && entry.occurredAt < from).reduce((sum, entry) => sum + signed(entry), 0);
    const movement = currencyEntries.filter((entry) => (!from || entry.occurredAt >= from) && (!to || entry.occurredAt <= to)).reduce((sum, entry) => sum + signed(entry), 0);
    return { currency, opening, movement, closing: opening + movement };
  });
  const entries = input.entries.filter((entry) => (!type || entry.type === type) && (!from || entry.occurredAt >= from) && (!to || entry.occurredAt <= to));

  return { investor: input.investor, generatedAt: (input.generatedAt ?? new Date()).toISOString(), from, to, type, entries, positions };
}

function safeCell(value: string) {
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}

export function buildAccountStatementXlsx(data: AccountStatementData) {
  const rows: Array<Array<string | number>> = [
    ["OTIZ CAPITAL — Account statement"],
    ["Investor", safeCell(data.investor.fullName)],
    ["Email", safeCell(data.investor.email)],
    ["Generated", data.generatedAt],
    ["Period", `${data.from ?? "Start"} — ${data.to ?? "Now"}`],
    [],
    ["Recorded positions"],
    ["Currency", "Opening", "Movement", "Closing"],
    ...data.positions.map((position) => [position.currency, position.opening, position.movement, position.closing]),
    [],
    ["Date", "Operation", "Details", "Direction", "Amount", "Currency", "Source", "Source ID"],
    ...data.entries.map((entry) => [entry.occurredAt, entry.type, safeCell(entry.detail ?? ""), entry.direction, entry.amount, entry.currency, entry.sourceType, safeCell(entry.sourceId)])
  ];
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  sheet["!cols"] = [{ wch: 24 }, { wch: 20 }, { wch: 34 }, { wch: 12 }, { wch: 16 }, { wch: 12 }, { wch: 24 }, { wch: 28 }];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Statement");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

const LABELS: Record<Locale, { title: string; generated: string; period: string; positions: string; opening: string; movement: string; closing: string; operations: string; empty: string; note: string }> = {
  en: { title: "Account statement", generated: "Generated", period: "Period", positions: "Recorded net positions", opening: "Opening", movement: "Movement", closing: "Closing", operations: "Operations", empty: "No operations in this period.", note: "Positions are calculated from recorded account operations. Original currencies are not converted." },
  ru: { title: "Выписка по счёту", generated: "Сформировано", period: "Период", positions: "Зафиксированные чистые позиции", opening: "На начало", movement: "Движение", closing: "На конец", operations: "Операции", empty: "В этом периоде операций нет.", note: "Позиции рассчитаны по записанным операциям счёта. Исходные валюты не конвертируются." },
  de: { title: "Kontoauszug", generated: "Erstellt", period: "Zeitraum", positions: "Erfasste Nettopositionen", opening: "Anfang", movement: "Bewegung", closing: "Ende", operations: "Vorgänge", empty: "Keine Vorgänge in diesem Zeitraum.", note: "Positionen werden aus erfassten Kontobewegungen berechnet. Ursprüngliche Währungen werden nicht umgerechnet." },
  es: { title: "Estado de cuenta", generated: "Generado", period: "Periodo", positions: "Posiciones netas registradas", opening: "Inicial", movement: "Movimiento", closing: "Final", operations: "Operaciones", empty: "No hay operaciones en este periodo.", note: "Las posiciones se calculan con las operaciones registradas. Las monedas originales no se convierten." },
  zh: { title: "账户对账单", generated: "生成时间", period: "期间", positions: "已记录净头寸", opening: "期初", movement: "变动", closing: "期末", operations: "操作记录", empty: "此期间没有操作记录。", note: "头寸根据已记录的账户操作计算。原始币种不会换算。" }
};

let regularFont: Buffer | null = null;
let semiboldFont: Buffer | null = null;
function fonts() {
  const directory = path.join(process.cwd(), "assets", "fonts");
  regularFont ??= fs.readFileSync(path.join(directory, "Inter_400Regular.ttf"));
  semiboldFont ??= fs.readFileSync(path.join(directory, "Inter_600SemiBold.ttf"));
  return { regular: regularFont, semibold: semiboldFont };
}

export function buildAccountStatementPdf(data: AccountStatementData, locale: Locale): Promise<Buffer> {
  const t = LABELS[locale];
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 52 });
      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
      const loaded = fonts();
      doc.registerFont("Body", loaded.regular).registerFont("Head", loaded.semibold);
      const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const ensure = (height = 80) => { if (doc.y > doc.page.height - height) doc.addPage(); };
      doc.font("Head").fontSize(13).fillColor("#9a7d32").text("OTIZ CAPITAL", { characterSpacing: 2 });
      doc.font("Head").fontSize(25).fillColor("#1a1a1a").text(t.title);
      doc.font("Body").fontSize(10).fillColor("#666").text(`${data.investor.fullName} · ${data.investor.email}`);
      doc.text(`${t.generated}: ${data.generatedAt}`);
      doc.text(`${t.period}: ${data.from ?? "—"} — ${data.to ?? "—"}`);
      doc.moveDown();
      doc.font("Head").fontSize(12).fillColor("#9a7d32").text(t.positions);
      for (const position of data.positions) {
        doc.font("Body").fontSize(10).fillColor("#1a1a1a").text(`${position.currency} · ${t.opening}: ${position.opening.toFixed(2)} · ${t.movement}: ${position.movement.toFixed(2)} · ${t.closing}: ${position.closing.toFixed(2)}`);
      }
      doc.moveDown();
      doc.font("Head").fontSize(12).fillColor("#9a7d32").text(t.operations);
      if (data.entries.length === 0) doc.font("Body").fontSize(10).fillColor("#666").text(t.empty);
      for (const entry of data.entries) {
        ensure();
        const sign = entry.direction === "IN" ? "+" : entry.direction === "OUT" ? "-" : "";
        doc.font("Head").fontSize(10).fillColor("#1a1a1a").text(`${entry.occurredAt.slice(0, 10)} · ${entry.type} · ${sign}${entry.amount.toFixed(2)} ${entry.currency}`);
        doc.font("Body").fontSize(9).fillColor("#666").text(`${entry.detail ?? "—"} · ${entry.sourceType}:${entry.sourceId}`, { width });
        doc.moveDown(0.45);
      }
      doc.moveDown();
      doc.font("Body").fontSize(8).fillColor("#666").text(t.note, { width });
      doc.end();
    } catch (error) {
      reject(error instanceof Error ? error : new Error("Statement PDF generation failed."));
    }
  });
}

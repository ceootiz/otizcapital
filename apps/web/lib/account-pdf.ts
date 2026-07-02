import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";

// Cyrillic-capable font vendored into the app; read at runtime (not bundled) and
// shipped to the serverless function via next.config outputFileTracingIncludes.
let cachedRegular: Buffer | null = null;
let cachedSemibold: Buffer | null = null;

function loadFonts() {
  const dir = path.join(process.cwd(), "assets", "fonts");
  if (!cachedRegular) cachedRegular = fs.readFileSync(path.join(dir, "Inter_400Regular.ttf"));
  if (!cachedSemibold) cachedSemibold = fs.readFileSync(path.join(dir, "Inter_600SemiBold.ttf"));
  return { regular: cachedRegular, semibold: cachedSemibold };
}

const INK = "#1a1a1a";
const MUTED = "#6b6b6b";
const GOLD = "#9a7d32";
const RULE = "#e4e4e4";

export type AccountPdfData = {
  investor: { fullName: string; email: string; status: string };
  allocations: Array<{ ref: string; product: string; amount: string; status: string; started: string; payout: string }>;
  withdrawals: Array<{ amount: string; status: string; requested: string; paid: string }>;
  reports: Array<{ title: string; month: string; summary: string }>;
};

type PdfLabels = {
  brand: string;
  docTitle: string;
  generated: string;
  accountSection: string;
  name: string;
  email: string;
  status: string;
  allocations: string;
  allocationCols: { ref: string; product: string; amount: string; status: string; started: string; payout: string };
  withdrawals: string;
  withdrawalCols: { amount: string; status: string; requested: string; paid: string };
  reports: string;
  none: string;
  disclaimer: string;
};

const LABELS: Record<"en" | "ru", PdfLabels> = {
  en: {
    brand: "OTIZ CAPITAL",
    docTitle: "Account History",
    generated: "Generated",
    accountSection: "Account",
    name: "Name",
    email: "Email",
    status: "Status",
    allocations: "Allocations",
    allocationCols: { ref: "Reference", product: "Product", amount: "Amount", status: "Status", started: "Started", payout: "Expected payout" },
    withdrawals: "Withdrawal requests",
    withdrawalCols: { amount: "Amount", status: "Status", requested: "Requested", paid: "Paid" },
    reports: "Published monthly reports",
    none: "No records.",
    disclaimer: "This document is an operational summary generated for the account holder. No return is guaranteed."
  },
  ru: {
    brand: "OTIZ CAPITAL",
    docTitle: "История аккаунта",
    generated: "Сформировано",
    accountSection: "Аккаунт",
    name: "Имя",
    email: "Email",
    status: "Статус",
    allocations: "Аллокации",
    allocationCols: { ref: "Идентификатор", product: "Продукт", amount: "Сумма", status: "Статус", started: "Начато", payout: "Ожидаемая выплата" },
    withdrawals: "Запросы на вывод",
    withdrawalCols: { amount: "Сумма", status: "Статус", requested: "Запрошено", paid: "Выплачено" },
    reports: "Опубликованные ежемесячные отчёты",
    none: "Нет записей.",
    disclaimer: "Этот документ — операционная сводка, сформированная для владельца аккаунта. Доходность не гарантируется."
  }
};

export function buildAccountPdf(data: AccountPdfData, locale: string, generatedAt: string): Promise<Buffer> {
  const t = locale === "ru" ? LABELS.ru : LABELS.en;

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 56 });
      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const fonts = loadFonts();
      doc.registerFont("Body", fonts.regular);
      doc.registerFont("Head", fonts.semibold);

      const left = doc.page.margins.left;
      const contentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

      const sectionHeading = (label: string) => {
        if (doc.y > doc.page.height - 120) doc.addPage();
        doc.moveDown(1.1);
        doc.font("Head").fontSize(11).fillColor(GOLD).text(label.toUpperCase(), { characterSpacing: 1.2 });
        doc.moveDown(0.4);
        doc.strokeColor(RULE).lineWidth(1).moveTo(left, doc.y).lineTo(left + contentWidth, doc.y).stroke();
        doc.moveDown(0.6);
      };

      const kv = (label: string, value: string) => {
        doc.font("Body").fontSize(9).fillColor(MUTED).text(label.toUpperCase(), { characterSpacing: 0.8, continued: false });
        doc.font("Body").fontSize(12).fillColor(INK).text(value || "—");
        doc.moveDown(0.5);
      };

      // Header
      doc.font("Head").fontSize(13).fillColor(INK).text(t.brand, { characterSpacing: 2 });
      doc.font("Head").fontSize(26).fillColor(INK).text(t.docTitle);
      doc.font("Body").fontSize(9).fillColor(MUTED).text(`${t.generated}: ${generatedAt}`);

      // Account
      sectionHeading(t.accountSection);
      kv(t.name, data.investor.fullName);
      kv(t.email, data.investor.email);
      kv(t.status, data.investor.status);

      // Allocations
      sectionHeading(t.allocations);
      if (data.allocations.length === 0) {
        doc.font("Body").fontSize(11).fillColor(MUTED).text(t.none);
      } else {
        for (const a of data.allocations) {
          if (doc.y > doc.page.height - 110) doc.addPage();
          doc.font("Head").fontSize(12).fillColor(INK).text(`${a.ref}  ·  ${a.product}`);
          doc.font("Body").fontSize(10).fillColor(MUTED).text(
            `${t.allocationCols.amount}: ${a.amount}   ·   ${t.allocationCols.status}: ${a.status}   ·   ${t.allocationCols.started}: ${a.started}   ·   ${t.allocationCols.payout}: ${a.payout}`
          );
          doc.moveDown(0.6);
        }
      }

      // Withdrawals
      sectionHeading(t.withdrawals);
      if (data.withdrawals.length === 0) {
        doc.font("Body").fontSize(11).fillColor(MUTED).text(t.none);
      } else {
        for (const w of data.withdrawals) {
          if (doc.y > doc.page.height - 90) doc.addPage();
          doc.font("Head").fontSize(12).fillColor(INK).text(w.amount);
          doc.font("Body").fontSize(10).fillColor(MUTED).text(
            `${t.withdrawalCols.status}: ${w.status}   ·   ${t.withdrawalCols.requested}: ${w.requested}   ·   ${t.withdrawalCols.paid}: ${w.paid}`
          );
          doc.moveDown(0.6);
        }
      }

      // Reports
      sectionHeading(t.reports);
      if (data.reports.length === 0) {
        doc.font("Body").fontSize(11).fillColor(MUTED).text(t.none);
      } else {
        for (const r of data.reports) {
          if (doc.y > doc.page.height - 130) doc.addPage();
          doc.font("Head").fontSize(12).fillColor(INK).text(`${r.title}  ·  ${r.month}`);
          doc.font("Body").fontSize(10).fillColor(MUTED).text(r.summary, { width: contentWidth });
          doc.moveDown(0.7);
        }
      }

      doc.moveDown(1.4);
      doc.font("Body").fontSize(8).fillColor(MUTED).text(t.disclaimer, { width: contentWidth });

      doc.end();
    } catch (error) {
      reject(error instanceof Error ? error : new Error("PDF generation failed."));
    }
  });
}

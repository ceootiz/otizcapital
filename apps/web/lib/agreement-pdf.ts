import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";

// Cyrillic-capable fonts vendored into the app; read at runtime and shipped to
// the serverless function via next.config outputFileTracingIncludes. Mirrors the
// approach in account-pdf.ts.
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

export type AgreementPdfInput = {
  fullName: string;
  email: string;
  plannedAllocation: string; // formatted, e.g. "$50,000"
  date: string; // formatted agreement date
};

const TERMS: string[] = [
  "1. Период удержания. Инвестированный капитал закрепляется на срок не менее 90 (девяноста) дней с даты первой аллокации. В течение этого периода вывод средств недоступен, что позволяет управляющей команде завершить операционные торговые циклы.",
  "2. Ежемесячная отчётность. Инвестор получает ежемесячные операционные отчёты в личном кабинете. Отчёты отражают состояние аллокаций, результаты циклов и заметки по выплатам после проверки менеджером.",
  "3. Процесс вывода. По истечении периода удержания инвестор может подать запрос на вывод. Каждый запрос проходит ручную проверку менеджера; сроки выплат планируются управляющей стороной и обычно составляют 3–5 рабочих дней с момента одобрения.",
  "4. Раскрытие рисков. Результаты аллокаций зависят от исполнения реальных торговых операций. Доходность не гарантируется, и инвестор принимает риск частичной или полной потери капитала. Ничто в настоящем документе не является гарантией прибыли.",
  "5. Согласие. Подписывая настоящее соглашение в личном кабинете, инвестор подтверждает, что ознакомился с изложенными условиями, принимает их и предоставляет свои данные добровольно."
];

export function buildAgreementPdf(input: AgreementPdfInput): Promise<Buffer> {
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

      const rule = () => {
        doc.strokeColor(RULE).lineWidth(1).moveTo(left, doc.y).lineTo(left + contentWidth, doc.y).stroke();
      };

      // Header
      doc.font("Head").fontSize(13).fillColor(GOLD).text("OTIZ CAPITAL", { characterSpacing: 2 });
      doc.moveDown(0.4);
      doc.font("Head").fontSize(24).fillColor(INK).text("OTIZ Capital — Инвестиционное соглашение");
      doc.moveDown(0.4);
      doc.font("Body").fontSize(9).fillColor(MUTED).text(`Дата: ${input.date}`);
      doc.moveDown(0.8);
      rule();
      doc.moveDown(0.9);

      // Party block
      const kv = (label: string, value: string) => {
        doc.font("Body").fontSize(9).fillColor(MUTED).text(label.toUpperCase(), { characterSpacing: 0.8 });
        doc.font("Body").fontSize(12).fillColor(INK).text(value || "—");
        doc.moveDown(0.5);
      };
      kv("Инвестор", input.fullName);
      kv("Email", input.email);
      kv("Планируемая аллокация", input.plannedAllocation);

      doc.moveDown(0.6);
      rule();
      doc.moveDown(0.9);

      // Terms
      doc.font("Head").fontSize(11).fillColor(GOLD).text("УСЛОВИЯ", { characterSpacing: 1.2 });
      doc.moveDown(0.6);
      for (const paragraph of TERMS) {
        if (doc.y > doc.page.height - 140) doc.addPage();
        doc.font("Body").fontSize(10.5).fillColor(INK).text(paragraph, { width: contentWidth, align: "left", lineGap: 2 });
        doc.moveDown(0.7);
      }

      // Signature area
      if (doc.y > doc.page.height - 170) doc.addPage();
      doc.moveDown(1.2);
      rule();
      doc.moveDown(1.2);
      doc.font("Body").fontSize(9).fillColor(MUTED).text("ПОДПИСЬ ИНВЕСТОРА", { characterSpacing: 0.8 });
      doc.moveDown(1.6);
      const lineY = doc.y;
      doc.strokeColor(INK).lineWidth(1).moveTo(left, lineY).lineTo(left + 240, lineY).stroke();
      doc.moveDown(0.4);
      doc.font("Body").fontSize(10).fillColor(INK).text(input.fullName);
      doc.moveDown(1.2);
      doc.font("Body").fontSize(8).fillColor(MUTED).text(
        "Электронное подписание в личном кабинете OTIZ Capital приравнивается к собственноручной подписи. Доходность не гарантируется.",
        { width: contentWidth }
      );

      doc.end();
    } catch (error) {
      reject(error instanceof Error ? error : new Error("Agreement PDF generation failed."));
    }
  });
}

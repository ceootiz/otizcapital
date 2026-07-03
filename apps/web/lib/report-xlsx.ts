import * as XLSX from "xlsx";

// XLSX report helpers. The admin downloads a pre-filled template, fills in the
// monthly figures, and uploads it back. Both operations run server-side only.

const SHEET_NAME = "Отчёт";

const COLUMNS = [
  "Месяц",
  "Период",
  "Аллоцированный капитал",
  "Прибыль",
  "ROI %",
  "Выплата",
  "Реинвестировано",
  "Примечания"
] as const;

export type ReportTemplateInput = {
  investor: { fullName: string; email: string };
  allocations: Array<{ product: string; amount: string; currency: string }>;
};

// Builds the pre-filled XLSX template: an info header (investor name/email) plus
// the report table with one row seeded per current allocation.
export function buildReportTemplateXlsx(input: ReportTemplateInput): Buffer {
  const rows: (string | number)[][] = [
    ["OTIZ Capital — Шаблон отчёта"],
    ["Инвестор", input.investor.fullName],
    ["Email", input.investor.email],
    [],
    [...COLUMNS]
  ];

  if (input.allocations.length === 0) {
    rows.push(["", "", "", "", "", "", "", ""]);
  } else {
    for (const allocation of input.allocations) {
      rows.push(["", "", `${allocation.currency} ${allocation.amount}`, "", "", "", "", allocation.product]);
    }
  }

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  worksheet["!cols"] = COLUMNS.map((column) => ({ wch: Math.max(16, column.length + 4) }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, SHEET_NAME);

  const out = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
  return out;
}

// Admin business export: one row per investor.
export type InvestorExportRow = {
  fullName: string;
  email: string;
  totalCapital: number;
  status: string;
  totalProfit: number;
  lastReportAt: string | null;
};

export function buildInvestorExportXlsx(rows: InvestorExportRow[]): Buffer {
  const header = ["Имя", "Email", "Капитал", "Статус", "Общая прибыль", "Дата последнего отчёта"];
  const grid: (string | number)[][] = [
    ["OTIZ Capital — Экспорт данных инвесторов"],
    [],
    header,
    ...rows.map((row) => [
      row.fullName,
      row.email,
      row.totalCapital,
      row.status,
      row.totalProfit,
      row.lastReportAt ? row.lastReportAt.slice(0, 10) : ""
    ])
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(grid);
  worksheet["!cols"] = header.map((column) => ({ wch: Math.max(18, column.length + 4) }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Инвесторы");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

export type ParsedPaymentRow = {
  month: string;
  period: string | null;
  profit: number;
  payout: number;
  reinvested: number;
  roiPercent: number | null;
};

// Header aliases, matched case-insensitively after trimming.
const HEADER_ALIASES: Record<string, keyof ParsedPaymentRow> = {
  "месяц": "month",
  "month": "month",
  "период": "period",
  "period": "period",
  "прибыль": "profit",
  "profit": "profit",
  "выплата": "payout",
  "payout": "payout",
  "реинвестировано": "reinvested",
  "reinvested": "reinvested",
  "roi %": "roiPercent",
  "roi%": "roiPercent",
  "roi": "roiPercent"
};

function normalizeHeader(value: unknown): string {
  return typeof value === "string" ? value.replace(/ /g, " ").trim().toLowerCase() : "";
}

// "1 234,56 $" / "$1,234.56" / 1234.56 → number. Null when not numeric.
function parseMoney(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const cleaned = value
    .replace(/ /g, "")
    .replace(/[$€₽%\s]/g, "")
    .replace(/,(?=\d{1,2}$)/, ".") // decimal comma only when it looks like one
    .replace(/,/g, "");
  if (!cleaned || !/^-?\d+(\.\d+)?$/.test(cleaned)) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

// Extracts structured payment rows from an uploaded report workbook. Finds the
// header row anywhere in the sheet (the template has an info block above it),
// maps columns by RU/EN aliases, and returns one row per month line. Returns
// ok:false when no recognizable header exists — the caller stores the file
// anyway and just skips extraction.
export function parseReportPaymentRows(data: Buffer): { ok: boolean; rows: ParsedPaymentRow[]; error?: string } {
  try {
    const workbook = XLSX.read(data, { type: "buffer" });
    if (!workbook.SheetNames.length) return { ok: false, rows: [], error: "empty workbook" };

    const sheet = workbook.Sheets[workbook.SheetNames.find((name) => name === SHEET_NAME) || workbook.SheetNames[0]];
    const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });

    // Locate the header row: the first row containing a "Месяц"/"Month" cell.
    let headerRowIndex = -1;
    let columns: Partial<Record<keyof ParsedPaymentRow, number>> = {};
    for (let index = 0; index < Math.min(grid.length, 30); index += 1) {
      const mapped: Partial<Record<keyof ParsedPaymentRow, number>> = {};
      (grid[index] ?? []).forEach((cell, cellIndex) => {
        const key = HEADER_ALIASES[normalizeHeader(cell)];
        if (key && mapped[key] === undefined) mapped[key] = cellIndex;
      });
      if (mapped.month !== undefined) {
        headerRowIndex = index;
        columns = mapped;
        break;
      }
    }

    if (headerRowIndex === -1) {
      return { ok: false, rows: [], error: "no Месяц/Month header row found" };
    }

    const rows: ParsedPaymentRow[] = [];
    for (const raw of grid.slice(headerRowIndex + 1)) {
      const cell = (key: keyof ParsedPaymentRow) => (columns[key] === undefined ? "" : raw[columns[key] as number]);
      const month = typeof cell("month") === "string" ? (cell("month") as string).trim() : String(cell("month") ?? "").trim();
      if (!month) continue; // skip blank/spacer rows

      const profit = parseMoney(cell("profit"));
      const payout = parseMoney(cell("payout"));
      const reinvested = parseMoney(cell("reinvested"));
      const roiPercent = parseMoney(cell("roiPercent"));
      // A month label alone is not a data row — require at least one figure.
      if (profit === null && payout === null && reinvested === null && roiPercent === null) continue;

      const periodRaw = cell("period");
      rows.push({
        month: month.slice(0, 60),
        period: typeof periodRaw === "string" && periodRaw.trim() ? periodRaw.trim().slice(0, 120) : null,
        profit: profit ?? 0,
        payout: payout ?? 0,
        reinvested: reinvested ?? 0,
        roiPercent
      });
    }

    return { ok: true, rows };
  } catch (error) {
    return { ok: false, rows: [], error: error instanceof Error ? error.message : "parse failed" };
  }
}

// Validates that an uploaded buffer is a real, non-empty workbook. Returns a
// derived month hint if a value is present in the first data row's "Месяц"
// column, so the admin does not have to retype it.
export function parseUploadedReportXlsx(data: Buffer): { ok: boolean; monthHint: string | null } {
  try {
    const workbook = XLSX.read(data, { type: "buffer" });
    if (!workbook.SheetNames.length) {
      return { ok: false, monthHint: null };
    }

    const sheet = workbook.Sheets[workbook.SheetNames.find((name) => name === SHEET_NAME) || workbook.SheetNames[0]];
    const table = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
    const firstMonth = table.map((row) => row["Месяц"]).find((value) => typeof value === "string" && value.trim().length > 0);

    return { ok: true, monthHint: typeof firstMonth === "string" ? firstMonth.trim() : null };
  } catch {
    return { ok: false, monthHint: null };
  }
}

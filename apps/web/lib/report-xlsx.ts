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

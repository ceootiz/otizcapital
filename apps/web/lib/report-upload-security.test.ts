import { describe, expect, it } from "vitest";
import { isValidXlsxUpload, MAX_XLSX_UPLOAD_BYTES } from "./report-upload-security";

const validHeader = new Uint8Array([0x50, 0x4b, 0x03, 0x04]);

describe("isValidXlsxUpload", () => {
  it("accepts a bounded XLSX ZIP container", () => {
    expect(isValidXlsxUpload({ name: "report.xlsx", type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", size: 4 }, validHeader)).toBe(true);
  });

  it("rejects renamed, oversized, empty, and unexpected file content", () => {
    expect(isValidXlsxUpload({ name: "report.xlsx", type: "application/pdf", size: 4 }, validHeader)).toBe(false);
    expect(isValidXlsxUpload({ name: "report.xlsx", type: "application/octet-stream", size: MAX_XLSX_UPLOAD_BYTES + 1 }, validHeader)).toBe(false);
    expect(isValidXlsxUpload({ name: "report.xlsx", type: "application/octet-stream", size: 4 }, new Uint8Array([1, 2, 3, 4]))).toBe(false);
    expect(isValidXlsxUpload({ name: "report.xls", type: "application/octet-stream", size: 4 }, validHeader)).toBe(false);
  });
});

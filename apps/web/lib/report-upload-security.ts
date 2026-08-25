export const MAX_XLSX_UPLOAD_BYTES = 8 * 1024 * 1024;

const XLSX_MIME_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/octet-stream"
]);

export function isValidXlsxUpload(file: { name: string; type: string; size: number }, bytes: Uint8Array) {
  const mimeType = file.type.toLowerCase();
  if (!file.name.toLowerCase().endsWith(".xlsx")) return false;
  if (file.size <= 0 || file.size > MAX_XLSX_UPLOAD_BYTES) return false;
  if (mimeType && !XLSX_MIME_TYPES.has(mimeType)) return false;

  // XLSX is a ZIP container. Accept only standard ZIP local/empty/data-descriptor
  // signatures before handing bytes to the workbook parser.
  return bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && (
    (bytes[2] === 0x03 && bytes[3] === 0x04) ||
    (bytes[2] === 0x05 && bytes[3] === 0x06) ||
    (bytes[2] === 0x07 && bytes[3] === 0x08)
  );
}

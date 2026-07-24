const FORMULA_PREFIX = /^[=+\-@]/u;

export function safeCsvCell(value: unknown) {
  let raw = value === null || value === undefined ? "" : String(value);
  const trimmedStart = raw.replace(/^[\t\r\n ]+/u, "");

  // Spreadsheet programs can execute cells beginning with these characters as
  // formulas. Prefix an apostrophe before CSV escaping so exported user or
  // audit data is always interpreted as text.
  if (FORMULA_PREFIX.test(trimmedStart)) {
    raw = `'${raw}`;
  }

  return `"${raw.replace(/"/g, '""')}"`;
}

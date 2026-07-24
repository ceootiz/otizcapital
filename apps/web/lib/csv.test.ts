import { describe, expect, it } from "vitest";
import { safeCsvCell } from "./csv";

describe("safeCsvCell", () => {
  it.each(["=1+1", "+cmd", "-2+3", "@SUM(A1:A2)", " \t=HYPERLINK(\"https://example.invalid\")"])(
    "neutralizes spreadsheet formula input %s",
    (value) => {
      expect(safeCsvCell(value)).toMatch(/^"'/u);
    }
  );

  it("escapes quotes and preserves ordinary text", () => {
    expect(safeCsvCell('Investor "A", active')).toBe('"Investor ""A"", active"');
  });

  it("serializes nullish values as empty cells", () => {
    expect(safeCsvCell(null)).toBe('""');
    expect(safeCsvCell(undefined)).toBe('""');
  });
});

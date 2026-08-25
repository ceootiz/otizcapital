import { describe, expect, it } from "vitest";
import { isTrustedRequestOrigin } from "./request-origin";

describe("isTrustedRequestOrigin", () => {
  it("accepts requests without Origin and matching same-origin requests", () => {
    expect(isTrustedRequestOrigin(null, "otiz.example", "https")).toBe(true);
    expect(isTrustedRequestOrigin("https://otiz.example", "otiz.example", "https")).toBe(true);
  });

  it("rejects cross-origin, protocol-confused, and malformed origins", () => {
    expect(isTrustedRequestOrigin("https://evil.example", "otiz.example", "https")).toBe(false);
    expect(isTrustedRequestOrigin("http://otiz.example", "otiz.example", "https")).toBe(false);
    expect(isTrustedRequestOrigin("not-a-url", "otiz.example", "https")).toBe(false);
    expect(isTrustedRequestOrigin("https://otiz.example", null, "https")).toBe(false);
  });
});

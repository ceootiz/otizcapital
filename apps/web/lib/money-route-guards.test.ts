import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(process.cwd(), "apps/web/app/api");

function source(relativePath: string) {
  return readFileSync(resolve(root, relativePath), "utf8");
}

describe("money mutation route boundaries", () => {
  it.each([
    "investor/deposits/route.ts",
    "investor/withdrawals/route.ts",
    "investor/withdrawals/[id]/cancel/route.ts"
  ])("requires the investor server session in %s", (route) => {
    expect(source(route)).toContain("requireInvestorApi");
  });

  it.each([
    "admin/deposits/[id]/route.ts",
    "admin/investors/[id]/reports/[reportId]/credit/route.ts"
  ])("requires the admin CSRF boundary in %s", (route) => {
    expect(source(route)).toContain("verifyAdminCsrfToken");
  });

  it.each([
    "investor/deposits/route.ts",
    "investor/withdrawals/route.ts"
  ])("requires an idempotency key for create operations in %s", (route) => {
    const content = source(route);
    expect(content).toContain('request.headers.get("idempotency-key")');
    expect(content).toContain("normalizeIdempotencyKey");
  });
});

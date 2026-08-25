import { describe, expect, it } from "vitest";
import { requiresDatabaseDuringBuild } from "./build-database-policy";

describe("requiresDatabaseDuringBuild", () => {
  it("fails closed only for the explicit build gate", () => {
    expect(requiresDatabaseDuringBuild("1")).toBe(true);
    expect(requiresDatabaseDuringBuild("0")).toBe(false);
    expect(requiresDatabaseDuringBuild(undefined)).toBe(false);
  });
});

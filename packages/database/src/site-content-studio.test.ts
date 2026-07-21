import { describe, expect, it } from "vitest";
import { getContentDraftScope } from "./site-content-studio";

describe("getContentDraftScope", () => {
  it("keeps draft rows separate from published content", () => {
    expect(getContentDraftScope("home")).toBe("content-draft:home");
    expect(getContentDraftScope("apply")).toBe("content-draft:apply");
  });

  it("is deterministic for a content scope", () => {
    expect(getContentDraftScope("legal")).toBe(getContentDraftScope("legal"));
  });
});

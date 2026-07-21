import { describe, expect, it } from "vitest";
import { PRODUCT_FEATURE_KEYS, isProductFeatureKey, parseProductFeatureFlagData } from "./site-settings";

describe("product feature flag registry", () => {
  it("contains one key for every approved capability except the control page itself", () => {
    expect(PRODUCT_FEATURE_KEYS).toHaveLength(24);
    expect(new Set(PRODUCT_FEATURE_KEYS).size).toBe(PRODUCT_FEATURE_KEYS.length);
  });

  it("defaults every feature to disabled when storage is missing or malformed", () => {
    expect(Object.values(parseProductFeatureFlagData(null)).every((enabled) => enabled === false)).toBe(true);
    expect(Object.values(parseProductFeatureFlagData("not-json")).every((enabled) => enabled === false)).toBe(true);
  });

  it("accepts only registered boolean values and ignores unknown keys", () => {
    const state = parseProductFeatureFlagData(JSON.stringify({
      "money-movement": true,
      "support-requests": "true",
      unknown: true
    }));

    expect(state["money-movement"]).toBe(true);
    expect(state["support-requests"]).toBe(false);
    expect("unknown" in state).toBe(false);
    expect(isProductFeatureKey("money-movement")).toBe(true);
    expect(isProductFeatureKey("unknown")).toBe(false);
  });
});

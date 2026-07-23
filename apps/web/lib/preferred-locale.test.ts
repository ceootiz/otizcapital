import { describe, expect, it } from "vitest";
import { preferredLocale } from "./preferred-locale";

describe("preferredLocale", () => {
  it("supports every product locale and respects quality order", () => {
    expect(preferredLocale("fr-FR, de-DE;q=0.9, en;q=0.8")).toBe("de");
    expect(preferredLocale("zh-CN, en;q=0.7")).toBe("zh");
    expect(preferredLocale("es-ES")).toBe("es");
    expect(preferredLocale("ru-RU")).toBe("ru");
  });

  it("does not depend on IP or country headers", () => {
    expect(preferredLocale("it-IT, en;q=0.5")).toBe("en");
    expect(preferredLocale(null)).toBe("en");
  });
});

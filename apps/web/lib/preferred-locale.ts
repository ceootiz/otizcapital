import type { Locale } from "@otiz/lib";

const SUPPORTED = new Set<Locale>(["en", "es", "de", "ru", "zh"]);

export function preferredLocale(acceptLanguage: string | null | undefined): Locale {
  const candidates = (acceptLanguage ?? "")
    .split(",")
    .map((part, index) => {
      const [tag, ...parameters] = part.trim().toLowerCase().split(";");
      const quality = Number(parameters.find((item) => item.trim().startsWith("q="))?.split("=")[1] ?? "1");
      return { tag, quality: Number.isFinite(quality) ? quality : 0, index };
    })
    .sort((left, right) => right.quality - left.quality || left.index - right.index);

  for (const candidate of candidates) {
    const base = candidate.tag.split("-")[0] as Locale;
    if (SUPPORTED.has(base)) return base;
  }
  return "en";
}

export const locales = ["en", "es", "de", "ru", "zh"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  es: "Español",
  de: "Deutsch",
  ru: "Русский",
  zh: "中文"
};

export const localeShortNames: Record<Locale, string> = {
  en: "EN",
  es: "ES",
  de: "DE",
  ru: "RU",
  zh: "中文"
};

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

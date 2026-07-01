import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";
import ruLocale from "i18n-iso-countries/langs/ru.json";
import esLocale from "i18n-iso-countries/langs/es.json";
import deLocale from "i18n-iso-countries/langs/de.json";
import zhLocale from "i18n-iso-countries/langs/zh.json";
import type { Locale } from "./i18n";

countries.registerLocale(enLocale);
countries.registerLocale(ruLocale);
countries.registerLocale(esLocale);
countries.registerLocale(deLocale);
countries.registerLocale(zhLocale);

const LOCALE_TO_ISO: Record<Locale, string> = { en: "en", es: "es", de: "de", ru: "ru", zh: "zh" };

export type CountryOption = { code: string; name: string };

/** Full ISO 3166-1 country list, names localized to `locale`, sorted by name. */
export function getCountryOptions(locale: Locale): CountryOption[] {
  const iso = LOCALE_TO_ISO[locale] ?? "en";
  const names = countries.getNames(iso, { select: "official" });
  return Object.entries(names)
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name, iso));
}

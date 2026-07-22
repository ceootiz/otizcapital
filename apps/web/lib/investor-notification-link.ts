import { locales, type Locale } from "@otiz/lib";

const LOCALE_PREFIX = new RegExp(`^/(?:${locales.join("|")})(?=/|$)`);

export function getInvestorNotificationHref(locale: Locale, linkHref: string) {
  const path = linkHref.startsWith("/") ? linkHref : `/${linkHref}`;
  const pathWithoutStoredLocale = path.replace(LOCALE_PREFIX, "");

  return `/${locale}${pathWithoutStoredLocale}`;
}

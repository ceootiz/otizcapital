import { locales, type Locale } from "@otiz/lib";

const LOCALE_PREFIX = new RegExp(`^/(?:${locales.join("|")})(?=/|$)`);
const DETAIL_ROUTES = [/^\/investor\/allocations\/[^/]+$/, /^\/investor\/reports\/[^/]+$/];
const LIST_ROUTES = new Set([
  "/investor/dashboard",
  "/investor/deposit",
  "/investor/allocations",
  "/investor/reports",
  "/investor/documents",
  "/investor/history",
  "/investor/withdrawals",
  "/investor/reinvest",
  "/investor/support",
  "/investor/settings"
]);

export function getInvestorNotificationHref(locale: Locale, linkHref: string) {
  const path = linkHref.startsWith("/") ? linkHref : `/${linkHref}`;
  const pathWithoutStoredLocale = path.replace(LOCALE_PREFIX, "");
  const [pathname, suffix = ""] = pathWithoutStoredLocale.split(/(?=[?#])/u, 2);

  if (pathname.startsWith("/investor/documents/")) return `/${locale}/investor/documents`;
  if (!LIST_ROUTES.has(pathname) && !DETAIL_ROUTES.some((pattern) => pattern.test(pathname))) {
    return `/${locale}/investor/dashboard`;
  }

  return `/${locale}${pathname}${suffix}`;
}

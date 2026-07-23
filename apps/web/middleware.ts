import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { preferredLocale } from "@/lib/preferred-locale";

// Locales kept in sync with packages/lib/src/i18n.ts. Hard-coded here because
// middleware runs on the Edge runtime and must stay free of heavier imports.
const LOCALES = ["en", "es", "de", "ru", "zh"] as const;
const DEFAULT_LOCALE = "en";

const ADMIN_SESSION_COOKIE = "admin_session";
const INVESTOR_SESSION_COOKIE = "investor_session";
const ARBITRAGEUR_SESSION_COOKIE = "arbitrageur_session";
const REFERRAL_COOKIE = "referral_code";
const REFERRAL_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

// Referral codes are 8-char alphanumeric; accept a slightly wider shape and
// clamp length so a hostile ?ref= value can never bloat the cookie.
function sanitizeReferralCode(value: string | null): string {
  if (!value) return "";
  return value.replace(/[^A-Za-z0-9]/g, "").slice(0, 32);
}

// Splits an optional leading /<locale> segment off the pathname so the area
// checks below are locale-agnostic. Falls back to the default locale when the
// path is not locale-prefixed (e.g. a bare /admin request).
function splitLocale(pathname: string): { locale: string; rest: string } {
  const segments = pathname.split("/").filter(Boolean);
  const maybeLocale = segments[0];

  if (maybeLocale && (LOCALES as readonly string[]).includes(maybeLocale)) {
    return { locale: maybeLocale, rest: `/${segments.slice(1).join("/")}` };
  }

  return { locale: DEFAULT_LOCALE, rest: pathname };
}

function redirectToLogin(request: NextRequest, locale: string, area: "admin" | "investor") {
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}/${area}/login`;
  url.search = "";
  return NextResponse.redirect(url);
}

// Lightweight cookie-presence gate. Full validation (signature, TTL, DB state)
// stays in the route handlers / server components — this is defense-in-depth so
// an unauthenticated request never renders a protected page shell at all.
export function middleware(request: NextRequest) {
  // Referral capture: any request carrying ?ref=CODE drops a 30-day cookie that
  // the application-submit route later reads for attribution. Applied to every
  // response below (including redirects) so the code survives the "/" redirect.
  const referralCode = sanitizeReferralCode(request.nextUrl.searchParams.get("ref"));
  const withReferral = (response: NextResponse) => {
    if (referralCode) {
      response.cookies.set(REFERRAL_COOKIE, referralCode, {
        maxAge: REFERRAL_COOKIE_MAX_AGE,
        path: "/",
        sameSite: "lax",
        httpOnly: true
      });
    }
    return response;
  };

  // First-visit language detection: a bare "/" (no locale prefix) uses the
  // browser's best supported language. Locale-prefixed paths
  // (/ru, /en, /es, /de, /zh, ...) are never touched, so an explicit choice is
  // always respected. IP and inferred country are deliberately ignored.
  if (request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = `/${preferredLocale(request.headers.get("accept-language"))}`;
    return withReferral(NextResponse.redirect(url));
  }

  const { locale, rest } = splitLocale(request.nextUrl.pathname);

  // Login and password-recovery pages must remain reachable without a session.
  if (
    rest === "/admin/login" ||
    rest === "/investor/login" ||
    rest === "/investor/forgot-password" ||
    rest === "/investor/reset-password" ||
    rest === "/arbitrage/login" ||
    rest === "/arbitrage/register"
  ) {
    return withReferral(NextResponse.next());
  }

  const isAdminArea = rest === "/admin" || rest.startsWith("/admin/");
  if (isAdminArea && !request.cookies.get(ADMIN_SESSION_COOKIE)?.value) {
    return withReferral(redirectToLogin(request, locale, "admin"));
  }

  const isInvestorArea = rest === "/investor" || rest.startsWith("/investor/");
  if (isInvestorArea && !request.cookies.get(INVESTOR_SESSION_COOKIE)?.value) {
    return withReferral(redirectToLogin(request, locale, "investor"));
  }

  // Arbitrageur cabinet: everything under /arbitrage except the public
  // login/register pages (handled above) requires an arbitrageur session.
  const isArbitrageurArea = rest === "/arbitrage" || rest.startsWith("/arbitrage/");
  if (isArbitrageurArea && !request.cookies.get(ARBITRAGEUR_SESSION_COOKIE)?.value) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/arbitrage/login`;
    url.search = "";
    return withReferral(NextResponse.redirect(url));
  }

  // Everything else (/, /apply, marketing sections, static assets) is public.
  return withReferral(NextResponse.next());
}

export const config = {
  // Run on every page request except API routes, Next internals, and files with
  // an extension. Area gating itself is decided inside middleware().
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"]
};

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Locales kept in sync with packages/lib/src/i18n.ts. Hard-coded here because
// middleware runs on the Edge runtime and must stay free of heavier imports.
const LOCALES = ["en", "es", "de", "ru", "zh"] as const;
const DEFAULT_LOCALE = "en";

const ADMIN_SESSION_COOKIE = "admin_session";
const INVESTOR_SESSION_COOKIE = "investor_session";

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
  const { locale, rest } = splitLocale(request.nextUrl.pathname);

  // Login pages must remain reachable without a session.
  if (rest === "/admin/login" || rest === "/investor/login") {
    return NextResponse.next();
  }

  const isAdminArea = rest === "/admin" || rest.startsWith("/admin/");
  if (isAdminArea && !request.cookies.get(ADMIN_SESSION_COOKIE)?.value) {
    return redirectToLogin(request, locale, "admin");
  }

  const isInvestorArea = rest === "/investor" || rest.startsWith("/investor/");
  if (isInvestorArea && !request.cookies.get(INVESTOR_SESSION_COOKIE)?.value) {
    return redirectToLogin(request, locale, "investor");
  }

  // Everything else (/, /apply, marketing sections, static assets) is public.
  return NextResponse.next();
}

export const config = {
  // Run on every page request except API routes, Next internals, and files with
  // an extension. Area gating itself is decided inside middleware().
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"]
};

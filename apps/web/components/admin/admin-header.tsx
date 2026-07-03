"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, LogOut } from "lucide-react";
import type { Locale } from "@otiz/lib";
import { Button } from "@otiz/ui";
import { AdminNavigation, type AdminNavigationSection } from "./admin-navigation";

const ADMIN_CSRF_COOKIE = "admin_csrf_token";
const ADMIN_CSRF_HEADER = "x-csrf-token";

const STRINGS = {
  en: { backHome: "Home", brand: "OTIZ ADMIN", logout: "Log out", loggingOut: "Logging out..." },
  ru: { backHome: "На главную", brand: "OTIZ ADMIN", logout: "Выйти", loggingOut: "Выходим..." }
} as const;
type Strings = typeof STRINGS.en;
const getStrings = (locale: Locale): Strings => (STRINGS as unknown as Record<string, Strings>)[locale] ?? STRINGS.en;

// Maps the current pathname to the nav section to highlight. Longest prefixes
// first so /admin/settings/contact does not match a shorter sibling.
const SECTION_PREFIXES: Array<[string, AdminNavigationSection]> = [
  ["/admin/settings/readiness-policy", "readiness-policy"],
  ["/admin/settings/contact", "contact-settings"],
  ["/admin/checkpoint-health", "checkpoint-health"],
  ["/admin/deposit-addresses", "deposit-addresses"],
  ["/admin/applications", "applications"],
  ["/admin/allocations", "allocations"],
  ["/admin/withdrawals", "withdrawals"],
  ["/admin/dashboard", "dashboard"],
  ["/admin/incidents", "incidents"],
  ["/admin/investors", "investors"],
  ["/admin/content", "content"]
];

function getCookieValue(name: string) {
  if (typeof document === "undefined") return "";
  return document.cookie.split("; ").find((cookie) => cookie.startsWith(`${name}=`))?.split("=").slice(1).join("=") || "";
}

// Shared sticky admin header, mounted once via app/[locale]/admin/layout.tsx.
// Top row: home link · brand · logout. Second row: the navigation pills in a
// single horizontally-scrollable line (no more free-floating wrap on pages).
// Hidden on the login and 2FA-setup routes where no session exists yet.
export function AdminHeader({ locale }: { locale: Locale }) {
  const t = getStrings(locale);
  const router = useRouter();
  const pathname = usePathname() || "";
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  // Strip the locale segment so matching is locale-agnostic.
  const rest = pathname.replace(/^\/[a-z]{2}(?=\/)/, "");
  if (rest === "/admin/login" || rest === "/admin/setup-2fa") {
    return null;
  }

  const activeSection = SECTION_PREFIXES.find(([prefix]) => rest.startsWith(prefix))?.[1];

  async function logout() {
    setIsLoggingOut(true);
    try {
      const response = await fetch("/api/admin/logout", {
        method: "POST",
        headers: { [ADMIN_CSRF_HEADER]: getCookieValue(ADMIN_CSRF_COOKIE) }
      });
      const payload = (await response.json().catch(() => null)) as { ok?: boolean } | null;
      if (!response.ok || !payload?.ok) throw new Error("logout failed");
      router.push(`/${locale}/admin/login`);
      router.refresh();
    } catch {
      setIsLoggingOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border dark:border-white/10 bg-background/85 backdrop-blur-xl">
      <div className="container">
        <div className="flex h-14 items-center justify-between gap-4">
          <Link href={`/${locale}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">{t.backHome}</span>
          </Link>
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-700 dark:text-gold-100">{t.brand}</span>
          <Button type="button" variant="outline" size="sm" disabled={isLoggingOut} onClick={logout}>
            <LogOut data-icon="inline-start" />
            <span className="hidden sm:inline">{isLoggingOut ? t.loggingOut : t.logout}</span>
          </Button>
        </div>
        <div className="scrollbar-none -mx-1 overflow-x-auto px-1 pb-3">
          <AdminNavigation locale={locale} activeSection={activeSection} className="flex w-max items-center gap-2" />
        </div>
      </div>
    </header>
  );
}

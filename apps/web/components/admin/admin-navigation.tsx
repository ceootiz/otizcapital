import Link from "next/link";
import type { Locale } from "@otiz/lib";

export type AdminNavigationSection =
  | "applications"
  | "investors"
  | "allocations"
  | "incidents"
  | "withdrawals"
  | "readiness-policy"
  | "checkpoint-health";

const ADMIN_NAVIGATION_ITEMS: Array<{ key: AdminNavigationSection; label: string; href: (locale: Locale) => string }> = [
  { key: "applications", label: "Applications", href: (locale) => `/${locale}/admin/applications` },
  { key: "investors", label: "Investors", href: (locale) => `/${locale}/admin/investors` },
  { key: "allocations", label: "Allocations", href: (locale) => `/${locale}/admin/allocations` },
  { key: "incidents", label: "Incidents", href: (locale) => `/${locale}/admin/incidents` },
  { key: "withdrawals", label: "Withdrawals", href: (locale) => `/${locale}/admin/withdrawals` },
  { key: "readiness-policy", label: "Readiness policy", href: (locale) => `/${locale}/admin/settings/readiness-policy` },
  { key: "checkpoint-health", label: "Checkpoint health", href: (locale) => `/${locale}/admin/checkpoint-health` }
];

const baseLinkClass = "rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition-colors";
const inactiveLinkClass = "border-white/10 bg-white/[0.03] text-muted-foreground hover:text-foreground";
const activeLinkClass = "border-gold-200/35 bg-gold-200/10 text-gold-100";

export function AdminNavigation({
  locale,
  activeSection,
  className
}: {
  locale: Locale;
  activeSection?: AdminNavigationSection;
  className?: string;
}) {
  return (
    <nav className={className ?? "flex flex-wrap gap-2"} aria-label="Admin navigation">
      {ADMIN_NAVIGATION_ITEMS.map((item) => (
        <Link
          key={item.key}
          href={item.href(locale)}
          aria-current={activeSection === item.key ? "page" : undefined}
          className={`${baseLinkClass} ${activeSection === item.key ? activeLinkClass : inactiveLinkClass}`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

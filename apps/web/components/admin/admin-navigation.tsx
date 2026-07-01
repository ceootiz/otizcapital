import Link from "next/link";
import type { Locale } from "@otiz/lib";

export type AdminNavigationSection =
  | "applications"
  | "investors"
  | "allocations"
  | "incidents"
  | "withdrawals"
  | "readiness-policy"
  | "checkpoint-health"
  | "content";

const ADMIN_NAVIGATION_ITEMS: Array<{ key: AdminNavigationSection; href: (locale: Locale) => string }> = [
  { key: "applications", href: (locale) => `/${locale}/admin/applications` },
  { key: "investors", href: (locale) => `/${locale}/admin/investors` },
  { key: "allocations", href: (locale) => `/${locale}/admin/allocations` },
  { key: "incidents", href: (locale) => `/${locale}/admin/incidents` },
  { key: "withdrawals", href: (locale) => `/${locale}/admin/withdrawals` },
  { key: "readiness-policy", href: (locale) => `/${locale}/admin/settings/readiness-policy` },
  { key: "checkpoint-health", href: (locale) => `/${locale}/admin/checkpoint-health` },
  { key: "content", href: (locale) => `/${locale}/admin/content` }
];

const NAV_LABELS: Record<string, Record<AdminNavigationSection, string>> = {
  en: {
    applications: "Applications",
    investors: "Investors",
    allocations: "Allocations",
    incidents: "Incidents",
    withdrawals: "Withdrawals",
    "readiness-policy": "Readiness policy",
    "checkpoint-health": "Checkpoint health",
    content: "Content"
  },
  ru: {
    applications: "Заявки",
    investors: "Инвесторы",
    allocations: "Аллокации",
    incidents: "Инциденты",
    withdrawals: "Выводы",
    "readiness-policy": "Политика готовности",
    "checkpoint-health": "Контроль состояния",
    content: "Контент"
  }
};

const NAV_ARIA_LABEL: Record<string, string> = {
  en: "Admin navigation",
  ru: "Навигация администратора"
};

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
  const labels = NAV_LABELS[locale] ?? NAV_LABELS.en;

  return (
    <nav className={className ?? "flex flex-wrap gap-2"} aria-label={NAV_ARIA_LABEL[locale] ?? NAV_ARIA_LABEL.en}>
      {ADMIN_NAVIGATION_ITEMS.map((item) => (
        <Link
          key={item.key}
          href={item.href(locale)}
          aria-current={activeSection === item.key ? "page" : undefined}
          className={`${baseLinkClass} ${activeSection === item.key ? activeLinkClass : inactiveLinkClass}`}
        >
          {labels[item.key]}
        </Link>
      ))}
    </nav>
  );
}

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
  | "deposit-addresses"
  | "content"
  | "contact-settings";

const ADMIN_NAVIGATION_ITEMS: Array<{ key: AdminNavigationSection; href: (locale: Locale) => string }> = [
  { key: "applications", href: (locale) => `/${locale}/admin/applications` },
  { key: "investors", href: (locale) => `/${locale}/admin/investors` },
  { key: "allocations", href: (locale) => `/${locale}/admin/allocations` },
  { key: "incidents", href: (locale) => `/${locale}/admin/incidents` },
  { key: "withdrawals", href: (locale) => `/${locale}/admin/withdrawals` },
  { key: "readiness-policy", href: (locale) => `/${locale}/admin/settings/readiness-policy` },
  { key: "checkpoint-health", href: (locale) => `/${locale}/admin/checkpoint-health` },
  { key: "deposit-addresses", href: (locale) => `/${locale}/admin/deposit-addresses` },
  { key: "content", href: (locale) => `/${locale}/admin/content` },
  { key: "contact-settings", href: (locale) => `/${locale}/admin/settings/contact` }
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
    "deposit-addresses": "Deposits",
    content: "Content",
    "contact-settings": "Contact"
  },
  ru: {
    applications: "Заявки",
    investors: "Инвесторы",
    allocations: "Аллокации",
    incidents: "Инциденты",
    withdrawals: "Выводы",
    "readiness-policy": "Политика готовности",
    "checkpoint-health": "Контроль состояния",
    "deposit-addresses": "Пополнение",
    content: "Контент",
    "contact-settings": "Контакты"
  }
};

const NAV_ARIA_LABEL: Record<string, string> = {
  en: "Admin navigation",
  ru: "Навигация администратора"
};

const baseLinkClass = "rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition-colors";
const inactiveLinkClass = "border-border dark:border-white/10 bg-muted/30 dark:bg-white/[0.03] text-muted-foreground hover:text-foreground";
const activeLinkClass = "border-gold-200/35 bg-gold-300/20 dark:bg-gold-200/10 text-amber-700 dark:text-gold-100";

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

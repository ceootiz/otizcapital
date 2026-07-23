"use client";

import * as React from "react";
import Link from "next/link";
import { LifeBuoy } from "lucide-react";
import type { Locale } from "@otiz/lib";

const LABELS: Record<Locale, string> = {
  en: "Contact manager",
  ru: "Написать менеджеру",
  es: "Contactar al gestor",
  de: "Manager kontaktieren",
  zh: "联系经理"
};

export function ContactManagerButton({ locale, context }: { locale: Locale; context?: string }) {
  const query = context ? `?context=${encodeURIComponent(context)}` : "";

  return (
    <Link
      href={`/${locale}/investor/support${query}#new-request`}
      className="inline-flex h-10 items-center gap-2 rounded-full border border-border dark:border-white/10 bg-muted/40 dark:bg-white/[0.06] px-4 text-sm font-semibold text-foreground transition-colors hover:border-gold-200/40 hover:bg-muted/60 dark:hover:bg-white/[0.1]"
    >
      <LifeBuoy className="size-4 text-amber-700 dark:text-gold-100" />
      <span className="hidden sm:inline">{LABELS[locale]}</span>
    </Link>
  );
}

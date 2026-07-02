"use client";

import * as React from "react";
import { Send } from "lucide-react";
import type { Locale } from "@otiz/lib";

const LABELS: Record<string, string> = {
  en: "Contact manager",
  ru: "Написать менеджеру"
};

// Header button that opens the admin-configured Telegram handle in a new tab.
// The handle is read from the public GET /api/settings/contact endpoint; until
// it resolves we fall back to the default so the button is always functional.
export function ContactManagerButton({ locale }: { locale: Locale }) {
  const label = LABELS[locale] ?? LABELS.en;
  const [handle, setHandle] = React.useState("otizceo");

  React.useEffect(() => {
    const controller = new AbortController();
    fetch("/api/settings/contact", { signal: controller.signal })
      .then((response) => response.json())
      .then((payload: { ok: boolean; telegram?: string }) => {
        if (payload.ok && payload.telegram) setHandle(payload.telegram);
      })
      .catch(() => {
        /* keep the default handle */
      });
    return () => controller.abort();
  }, []);

  return (
    <a
      href={`https://t.me/${handle}`}
      target="_blank"
      rel="noreferrer"
      className="inline-flex h-10 items-center gap-2 rounded-full border border-border dark:border-white/10 bg-muted/40 dark:bg-white/[0.06] px-4 text-sm font-semibold text-foreground transition-colors hover:border-gold-200/40 hover:bg-muted/60 dark:hover:bg-white/[0.1]"
    >
      <Send className="size-4 text-amber-700 dark:text-gold-100" />
      <span className="hidden sm:inline">{label}</span>
    </a>
  );
}

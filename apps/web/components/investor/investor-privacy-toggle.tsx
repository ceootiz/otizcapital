"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import type { Locale } from "@otiz/lib";

const STORAGE_KEY = "otiz-investor-privacy";
const ROOT_CLASS = "otiz-investor-privacy";

const LABELS: Record<Locale, { show: string; hide: string }> = {
  en: { show: "Show money amounts", hide: "Hide money amounts" },
  ru: { show: "Показать денежные суммы", hide: "Скрыть денежные суммы" },
  de: { show: "Geldbeträge anzeigen", hide: "Geldbeträge ausblenden" },
  es: { show: "Mostrar importes", hide: "Ocultar importes" },
  zh: { show: "显示金额", hide: "隐藏金额" }
};

function applyPrivacy(hidden: boolean) {
  document.documentElement.classList.toggle(ROOT_CLASS, hidden);
}

export function InvestorPrivacyToggle({ locale }: { locale: Locale }) {
  const [hidden, setHidden] = React.useState(false);
  const labels = LABELS[locale];

  React.useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY) === "hidden";
    setHidden(saved);
    applyPrivacy(saved);
  }, []);

  function toggle() {
    const next = !hidden;
    setHidden(next);
    applyPrivacy(next);
    window.localStorage.setItem(STORAGE_KEY, next ? "hidden" : "visible");
  }

  const label = hidden ? labels.show : labels.hide;
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={hidden}
      onClick={toggle}
      className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-muted/40 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground dark:border-white/10 dark:bg-white/[0.06]"
    >
      {hidden ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
    </button>
  );
}

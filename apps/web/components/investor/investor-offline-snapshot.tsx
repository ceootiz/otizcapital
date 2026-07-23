"use client";

import * as React from "react";
import { Download } from "lucide-react";
import type { Locale } from "@otiz/lib";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type OfflineSummary = {
  availableBalance: number;
  workingCapital: number;
  pendingPayouts: number;
  totalBalance: number;
};

const COPY: Record<Locale, string> = {
  en: "Install OTIZ",
  ru: "Установить OTIZ",
  de: "OTIZ installieren",
  es: "Instalar OTIZ",
  zh: "安装 OTIZ"
};

export function InvestorOfflineSnapshot({ locale, summary }: { locale: Locale; summary: OfflineSummary }) {
  const [installPrompt, setInstallPrompt] = React.useState<InstallPromptEvent | null>(null);

  React.useEffect(() => {
    if (navigator.onLine) {
      try {
        localStorage.setItem("otiz-investor-offline-summary", JSON.stringify({ locale, updatedAt: new Date().toISOString(), ...summary }));
      } catch {
        // Private browsing may block storage; the live dashboard still works.
      }
    }
    const capturePrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", capturePrompt);
    return () => window.removeEventListener("beforeinstallprompt", capturePrompt);
  }, [locale, summary]);

  if (!installPrompt) return null;

  return (
    <button
      type="button"
      className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold text-foreground dark:border-white/10"
      onClick={async () => {
        await installPrompt.prompt();
        await installPrompt.userChoice;
        setInstallPrompt(null);
      }}
    >
      <Download className="size-4" aria-hidden="true" />
      {COPY[locale]}
    </button>
  );
}

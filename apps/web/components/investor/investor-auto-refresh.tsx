"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import type { Locale } from "@otiz/lib";

const COPY = {
  en: { current: "Data updates automatically", refreshing: "Updating...", refresh: "Update now", offline: "Offline: showing the last loaded data" },
  ru: { current: "Данные обновляются автоматически", refreshing: "Обновляем...", refresh: "Обновить сейчас", offline: "Нет сети: показаны последние загруженные данные" },
  de: { current: "Daten werden automatisch aktualisiert", refreshing: "Aktualisierung...", refresh: "Jetzt aktualisieren", offline: "Offline: zuletzt geladene Daten werden angezeigt" },
  es: { current: "Los datos se actualizan automáticamente", refreshing: "Actualizando...", refresh: "Actualizar ahora", offline: "Sin conexión: se muestran los últimos datos cargados" },
  zh: { current: "数据会自动更新", refreshing: "正在更新……", refresh: "立即更新", offline: "当前离线：显示最近加载的数据" }
} as const;

export function InvestorAutoRefresh({ locale }: { locale: Locale }) {
  const router = useRouter();
  const copy = COPY[locale] ?? COPY.en;
  const [refreshing, startTransition] = React.useTransition();
  const [online, setOnline] = React.useState(true);

  const refresh = React.useCallback(() => {
    if (!navigator.onLine) return;
    startTransition(() => router.refresh());
  }, [router]);

  React.useEffect(() => {
    const updateNetworkState = () => setOnline(navigator.onLine);
    updateNetworkState();
    window.addEventListener("online", updateNetworkState);
    window.addEventListener("offline", updateNetworkState);

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible" && navigator.onLine) refresh();
    }, 30_000);

    return () => {
      window.removeEventListener("online", updateNetworkState);
      window.removeEventListener("offline", updateNetworkState);
      window.clearInterval(interval);
    };
  }, [refresh]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-muted/20 px-4 py-3 text-sm dark:border-white/10 dark:bg-white/[0.025]" role="status" aria-live="polite">
      <span className={online ? "text-muted-foreground" : "text-amber-700 dark:text-gold-100"}>
        {online ? (refreshing ? copy.refreshing : copy.current) : copy.offline}
      </span>
      <button
        type="button"
        disabled={!online || refreshing}
        onClick={refresh}
        className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border px-4 font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10"
      >
        <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} aria-hidden="true" />
        {copy.refresh}
      </button>
    </div>
  );
}

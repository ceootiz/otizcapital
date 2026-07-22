"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

export function ApplicationStatusAutoRefresh({ enabled }: { enabled: boolean }) {
  const router = useRouter();

  React.useEffect(() => {
    if (!enabled) return;

    const interval = window.setInterval(() => router.refresh(), 10_000);
    return () => window.clearInterval(interval);
  }, [enabled, router]);

  return null;
}

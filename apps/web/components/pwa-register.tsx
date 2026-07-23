"use client";

import * as React from "react";

export function PwaRegister() {
  React.useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
    try {
      if (!localStorage.getItem("otiz-timezone")) {
        localStorage.setItem("otiz-device-timezone", Intl.DateTimeFormat().resolvedOptions().timeZone);
      }
    } catch {
      // Storage may be disabled; PWA registration remains usable.
    }
  }, []);

  return null;
}

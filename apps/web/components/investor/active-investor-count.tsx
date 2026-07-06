"use client";

import * as React from "react";

// Client-side live badge for the anonymized active-investor count. Fetches the
// public, 1-hour-cached /api/stats/investors endpoint on mount. Renders nothing
// until the value arrives (avoids SSR hydration mismatch and layout shift).
// `label` is the already-localized prefix; the count is shown as "~N".
export function ActiveInvestorCount({ label, className }: { label: string; className?: string }) {
  const [count, setCount] = React.useState<number | null>(null);

  React.useEffect(() => {
    let alive = true;
    fetch("/api/stats/investors", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (alive && typeof data?.activeCount === "number") setCount(data.activeCount);
      })
      .catch(() => {
        /* silent — the badge just stays hidden */
      });
    return () => {
      alive = false;
    };
  }, []);

  if (count === null) return null;
  return (
    <span className={className}>
      {label} ~{count}
    </span>
  );
}

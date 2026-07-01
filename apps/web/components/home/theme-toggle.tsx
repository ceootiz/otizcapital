"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";

const THEME_STORAGE_KEY = "otiz-theme";

// Pill-shaped dark/light switch. The actual theme class lives on <html> and is
// initialized before paint by the inline script in app/layout.tsx, so this only
// reads the current state on mount and flips it on click.
export function ThemeToggle() {
  const [isDark, setIsDark] = React.useState(true);

  React.useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);

    const root = document.documentElement;
    root.classList.toggle("dark", next);
    root.style.colorScheme = next ? "dark" : "light";

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next ? "dark" : "light");
    } catch {
      // Storage may be unavailable (private mode) — theme still applies for this session.
    }
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="Toggle dark and light theme"
      onClick={toggleTheme}
      className="relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border border-white/10 bg-white/[0.04] transition-colors hover:border-gold-300/40"
    >
      <Sun className="absolute left-1.5 size-3.5 text-muted-foreground" aria-hidden="true" />
      <Moon className="absolute right-1.5 size-3.5 text-muted-foreground" aria-hidden="true" />
      <span
        className="pointer-events-none z-10 flex size-6 items-center justify-center rounded-full bg-gold-200 text-graphite-950 shadow-gold transition-transform duration-300 ease-out"
        style={{ transform: isDark ? "translateX(1.75rem)" : "translateX(0.25rem)" }}
      >
        {isDark ? <Moon className="size-3.5" aria-hidden="true" /> : <Sun className="size-3.5" aria-hidden="true" />}
      </span>
    </button>
  );
}

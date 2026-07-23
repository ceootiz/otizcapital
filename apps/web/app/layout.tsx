import type { Metadata, Viewport } from "next";
import { Manrope, Newsreader } from "next/font/google";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

const sans = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
  display: "swap"
});

const display = Newsreader({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  adjustFontFallback: false
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://otiz-capital-web.vercel.app"),
  title: {
    default: "OTIZ CAPITAL | Real Electronics Commerce Allocations",
    template: "%s | OTIZ CAPITAL"
  },
  description:
    "A premium commerce capital platform built around real electronics operations, marketplace sales, logistics, reporting, and allocation transparency.",
  icons: { icon: "/favicon.ico", shortcut: "/favicon.ico", apple: "/otiz-icon.svg" },
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "OTIZ" },
  openGraph: {
    title: "OTIZ CAPITAL",
    description: "Invest in real electronics commerce with operational transparency.",
    siteName: "OTIZ CAPITAL",
    type: "website",
    images: ["/og.png"]
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og.png"]
  }
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f1e8" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0f12" }
  ]
};

// Applies the theme before paint so there is no light/dark flash. Priority:
// (1) the visitor's explicit saved choice is never overridden; (2) otherwise the
// OS `prefers-color-scheme`; (3) if matchMedia is unavailable, default to dark.
const THEME_INIT_SCRIPT = `(() => { try { const root = document.documentElement; const stored = localStorage.getItem('otiz-theme'); let dark; if (stored === 'light') { dark = false; } else if (stored === 'dark') { dark = true; } else if (window.matchMedia) { dark = window.matchMedia('(prefers-color-scheme: dark)').matches; } else { dark = true; } if (dark) { root.classList.add('dark'); root.style.colorScheme = 'dark'; } else { root.classList.remove('dark'); root.style.colorScheme = 'light'; } } catch (e) {} })();`;

// On 2g / slow-2g connections, tag <html> so CSS can drop animations/transitions.
// Degrades silently when the Network Information API is unavailable.
const CONNECTION_INIT_SCRIPT = `(() => { try { const c = navigator.connection; if (c && (c.effectiveType === '2g' || c.effectiveType === 'slow-2g')) { document.documentElement.classList.add('reduce-motion'); } } catch (e) {} })();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: CONNECTION_INIT_SCRIPT }} />
      </head>
      <body className={`${sans.variable} ${display.variable} font-sans`}>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Manrope, Newsreader } from "next/font/google";
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
  icons: { icon: "/favicon.ico", shortcut: "/favicon.ico" },
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

// Applies the persisted theme before paint so there is no light/dark flash.
// Defaults to dark (the site's base) unless the visitor explicitly chose light.
const THEME_INIT_SCRIPT = `(() => { try { const root = document.documentElement; const stored = localStorage.getItem('otiz-theme'); if (stored === 'light') { root.classList.remove('dark'); root.style.colorScheme = 'light'; } else { root.classList.add('dark'); root.style.colorScheme = 'dark'; } } catch (e) {} })();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className={`${sans.variable} ${display.variable} font-sans`}>{children}</body>
    </html>
  );
}

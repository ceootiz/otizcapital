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
  metadataBase: new URL("https://otiz.capital"),
  title: {
    default: "OTIZ CAPITAL | Real Electronics Commerce Allocations",
    template: "%s | OTIZ CAPITAL"
  },
  description:
    "A premium commerce capital platform built around real electronics operations, marketplace sales, logistics, reporting, and allocation transparency.",
  openGraph: {
    title: "OTIZ CAPITAL",
    description: "Invest in real electronics commerce with operational transparency.",
    siteName: "OTIZ CAPITAL",
    type: "website"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className={`${sans.variable} ${display.variable} font-sans`}>{children}</body>
    </html>
  );
}

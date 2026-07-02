import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { withSentryConfig } from "@sentry/nextjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootEnvPath = path.resolve(__dirname, "../..", ".env");

if (fs.existsSync(rootEnvPath)) {
  const rootEnv = fs.readFileSync(rootEnvPath, "utf8");

  for (const line of rootEnv.split(/\r?\n/)) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#") || !trimmedLine.includes("=")) {
      continue;
    }

    const [key, ...valueParts] = trimmedLine.split("=");
    const value = valueParts.join("=").trim().replace(/^["']|["']$/g, "");

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

const isDev = process.env.NODE_ENV !== "production";

// Content-Security-Policy: allow self, Vercel Analytics, and Google Fonts.
// Next.js App Router injects inline hydration scripts/styles, so 'unsafe-inline'
// is required without a nonce-injecting middleware; 'unsafe-eval' is dev-only
// (React Fast Refresh). Everything else is locked down.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval' " : ""}https://va.vercel-scripts.com`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https:",
  // Sentry ingest hosts are allowed so browser error transport works when
  // SENTRY_DSN is configured; harmless when it is not (no requests are made).
  "connect-src 'self' https://va.vercel-scripts.com https://vitals.vercel-insights.com https://*.sentry.io https://*.ingest.sentry.io https://*.ingest.us.sentry.io",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'"
].join("; ");

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@otiz/ui", "@otiz/lib"],
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
    // pdfkit + fontkit rely on runtime data files; keep them external so Next
    // does not mangle them during bundling (account-history PDF export).
    serverComponentsExternalPackages: ["pdfkit", "xlsx"],
    // Ensure the embedded Cyrillic font ships in the PDF routes' serverless bundle.
    // Every route that renders a PDF with the vendored fonts must be listed here.
    outputFileTracingIncludes: {
      "/api/investor/settings/export-pdf": ["./assets/fonts/*.ttf"],
      "/api/investors/from-application": ["./assets/fonts/*.ttf"]
    }
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Keep admin pages out of search engines (belt-and-suspenders with robots.txt).
      { source: "/:locale/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }
    ];
  }
};

// Wrap with Sentry. This adds the build-time instrumentation and client-config
// injection. Source-map upload is skipped (no auth token provided), and `silent`
// + `disableLogger` keep the build output clean. Everything stays inert at
// runtime until SENTRY_DSN is set in production.
export default withSentryConfig(nextConfig, {
  silent: true,
  disableLogger: true,
  // Route browser events through a same-origin path so ad-blockers / strict CSP
  // do not drop them once monitoring is enabled.
  tunnelRoute: "/monitoring",
  widenClientFileUpload: false
});

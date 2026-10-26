# Redesign progress

## Stage 1 — Inventory

**Status:** completed.

**Done:** inspected all 45 App Router page files, both layouts, all 98 API route files, 45 app component files, six shared UI primitives, the Prisma schema, auth/session helpers, and the existing homepage content and visual tokens. Captured desktop and mobile baseline screenshots. Confirmed static unsourced investment totals and project rows appear on the public homepage.

**Changed files:** `docs/redesign/01-inventory.md`, `docs/redesign/02-reference-analysis.md`, `docs/redesign/03-content-map.md`, baseline screenshots.

**Verified:** baseline `/ru` returned HTTP 200 after generating the Prisma client; screenshots were captured at 1440 × 1100 and 390 × 844. No application code was changed during inventory.

**Problems:** authenticated/database workflows were not exercised; the prior environment setup identified a schema/migration mismatch. Preview deployment mechanism and credentials have not yet been established.

**Next:** apply the shared orange/black token system and rebuild the public home composition without unsourced numeric claims.

## Stage 2 — Reference analysis

**Status:** completed.

**Done:** documented the reference's outer frame, centered hero, side light ribbons, perspective grid, varied card collage, semantic adaptation, token values, and responsive constraints.

**Changed files:** `docs/redesign/02-reference-analysis.md`.

**Verified:** visual comparison against the user-supplied reference and baseline screenshot.

**Problems:** none for the analysis stage.

**Next:** implement the design system and home page; then apply shared tokens to the remaining routes.

## Stage 3 — Content and public claims

**Status:** completed for the Russian homepage; other locale copy remains to be reviewed.

**Done:** rewrote the Russian hero and process descriptions to state the electronics trade cycle and refer to offer terms for participation, timing, and settlements. Removed static money totals, device counts, project IDs, status claims, and fabricated testimonials from the rendered homepage. Kept investor-count data only in its existing API-backed component. Left calculations, API contracts, and authorization unchanged.

**Changed files:** `packages/lib/src/homepage-content.ts`, `apps/web/components/home/home-page.tsx`, `apps/web/components/home/hero-dashboard.tsx`.

**Verified:** Playwright confirmed no `$` financial totals or percentage claims are rendered on `/ru`.

**Problems:** English, Spanish, German, and Chinese source strings still need an editorial claim review even though unsupported metrics/testimonials are no longer displayed by the shared homepage components.

**Next:** apply and verify the shared visual language across route-specific dashboards.

## Stage 4 — Design system

**Status:** completed for shared tokens and primitives.

**Done:** changed dark tokens to black/charcoal with orange accents, updated shared Tailwind “gold” aliases to the orange scale to preserve existing class contracts, adjusted glass surfaces, and changed shared button corners to match the reference. Added a reusable reference-style frame, side lights, perspective floor, cards, and responsive rules for the home composition. Default theme is now dark; explicit saved light preference remains supported.

**Changed files:** `apps/web/app/globals.css`, `apps/web/app/layout.tsx`, `apps/web/tailwind.config.ts`, `packages/ui/src/button.tsx`.

**Verified:** investor login, admin login, and all 45 page routes inherit the shared theme without route errors. Responsive overflow checks passed at 320, 375, 390, 430, 768, 1024, 1440, and 1920 px on the home route and at 390 px on all routes.

**Problems:** route-specific CSS review is not complete; the separate banking demo retains its explicit light palette.

**Next:** finish page-specific review where authenticated data is available.

## Stage 5 — Homepage

**Status:** completed for the Russian landing page.

**Done:** replaced the two-column headline/dashboard layout with the centered CoinSphere composition, amber outer surround, dark rounded frame, light ribbons, perspective grid, and asymmetrical non-numeric commerce widgets. Reworked Russian homepage sections to describe the trade cycle and offer terms. Removed the fabricated testimonials section from rendering.

**Changed files:** `apps/web/components/home/home-page.tsx`, `apps/web/components/home/hero-dashboard.tsx`, `apps/web/app/globals.css`, `packages/lib/src/homepage-content.ts`.

**Verified:** captured and visually reviewed desktop (1440 × 1100) and mobile (390 × 844) screenshots; the mobile menu opens; `prefers-reduced-motion` computed duration is `0.00001s`; no horizontal overflow at the eight requested widths.

**Problems:** the five non-Russian locale strings are not fully re-edited.

**Next:** continue cross-route inspection and authenticated flow validation.

## Stage 6 — Investor, admin, and remaining routes

**Status:** partially completed.

**Done:** the shared design tokens cover all routes. Production-build smoke tests loaded all 45 page routes anonymously at desktop and mobile width; all returned HTTP 200 with no browser page exceptions or horizontal overflow. Screenshots were captured for Russian home, investor login, and admin login.

**Changed files:** shared global styles and button primitive; no API or page-specific business logic was modified.

**Verified:** 45/45 route files returned HTTP 200 in both smoke passes. Login screens rendered and retained their existing email/password step flow.

**Problems:** authenticated investor/admin/referral dashboards and mutation workflows were not tested with real credentials. The separately branded banking demo is still light-themed and has not been redesigned. Full route-by-route visual review is outstanding.

**Next:** obtain a reviewable preview and authorized test-account access for protected-state acceptance.

## Stage 7 — Verification

**Status:** completed for the repository's configured checks.

**Done:** ran the full `pnpm verify` command against a disposable local PostgreSQL container built from the checked-in Prisma schema. The temporary database was isolated on loopback and contained only test data.

**Verified:** 11/11 test files, 106/106 tests; lint passed with three existing React hook dependency warnings in `admin-applications-page.tsx`; typecheck passed; optimized Next.js production build passed and generated 39 static pages. Browser smoke passed for 45/45 page routes; responsive checks and reduced-motion/menu checks passed.

**Problems:** browser checks did not exercise authenticated dashboards or financial mutations. No API route mutations were invoked.

**Next:** verify a hosted preview, then publish only through the configured deployment pipeline.

## Stage 8 — Preview and publication

**Status:** blocked pending deployment mechanism discovery.

**Done:** checked repository deployment files, local tooling, and environment binding names. No Vercel CLI, `vercel.json`, or deployment variables were found. GitHub CLI authentication is available and a branch is ready, but no preview deployment has been confirmed.

**Verified:** local production build and route smoke only; no external URL or deploy status exists.

**Problems:** public preview and final publication are not yet complete.

**Next:** check whether creating a GitHub pull request triggers an existing hosted preview. If no deployment integration exists, report the precise configuration/access needed; do not invent a preview URL.

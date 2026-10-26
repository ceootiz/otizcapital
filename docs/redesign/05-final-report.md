# OTIZ Capital redesign — implementation report

## Status

**Partially complete; not published.** The Russian homepage and shared black/orange visual system are implemented and locally verified. All 45 UI page files received anonymous desktop/mobile route smoke checks. Protected investor/admin workflows did not receive authenticated acceptance testing, non-Russian editorial copy needs review, and no hosted preview/deployment has been configured or confirmed.

## Scope and inventory

- 45 App Router page files, 2 layouts, 45 app TSX components, and 6 shared UI primitives inventoried.
- 98 API route handlers inventoried; none changed.
- The banking pages are a separate microbusiness-bank demo and remain visually unchanged.
- Main implementation: `home-page.tsx`, `hero-dashboard.tsx`, global styles, root theme initialization, Tailwind colors, shared buttons, and Russian homepage content.
- Existing investor calculations, auth/session code, database models, and API contracts were not modified.

See `01-inventory.md` for the full page and API path list.

## Visual and content changes

- Recreated the reference's warm outer canvas, rounded black frame, minimal header, centered orange-emphasis hero, side light ribbons, perspective grid, and asymmetrical dashboard cards.
- Replaced dashboard amounts, delivery counts, project IDs/statuses/progress, and fabricated testimonials in the rendered homepage with an explicitly illustrative, non-numeric trade-cycle diagram.
- Rewrote Russian landing copy to describe procurement, logistics, sales, offer terms, and risks without promising performance.
- Updated dark theme tokens and shared UI colors from gold/graphite to black/charcoal/orange; retained explicit saved light theme support.
- Other locale copy and route-specific layouts have not received a full editorial/visual pass.

See `02-reference-analysis.md` and `03-content-map.md`.

## Verification results

| Check | Result |
|---|---|
| `pnpm test` | **Passed:** 11/11 files, 106/106 tests, using a temporary loopback PostgreSQL container created from the checked-in Prisma schema |
| `pnpm lint` | **Passed with 3 existing warnings** about missing `useEffect` dependencies in `admin-applications-page.tsx` |
| `pnpm typecheck` | **Passed** |
| `pnpm build` | **Passed:** Next.js production build and 39 generated static pages |
| `pnpm verify` | **Passed** with the results above |
| Desktop/mobile route smoke | **Passed:** 45/45 page files returned HTTP 200; no browser page exceptions |
| Responsive layout | **Passed:** no horizontal overflow at 320, 375, 390, 430, 768, 1024, 1440, and 1920 px on `/ru`, and at 390 px on all 45 page routes |
| Mobile navigation | **Passed:** menu opened in Playwright |
| Reduced motion | **Passed:** computed animation duration `0.00001s` under `prefers-reduced-motion: reduce` |
| Authenticated investor/admin workflows | **Not run:** no real test-user credentials were available; no fake account was introduced |
| API mutation workflows | **Not run:** no data-changing endpoint was called |

The temporary PostgreSQL container held only local test data and was stopped after verification. No production or user database was touched.

## Screenshots

- Baseline: `screenshots/baseline-desktop.png`, `screenshots/baseline-mobile.png`.
- Updated home: `screenshots/final-home-desktop.png` (1440 × 1100) and `screenshots/final-home-mobile.png` (390 × 844).
- Login screens: `screenshots/final-investor-login.png`, `screenshots/final-admin-login.png` (1440 × 1000).

The Russian homepage screenshots were visually compared against the supplied CoinSphere reference. Protected dashboards were not screenshotted because no authenticated test identities were available.

## Preview and publication

- Branch: `redesign/coinsphere-adaptation`.
- Base commit: `e454952757da853e4ae1829fcc03160de56496d8`.
- Hosted preview URL: **none confirmed**.
- External deployment: **not performed**.
- Repository inspection found no `vercel.json`, Vercel CLI, or deployment environment bindings. A GitHub PR may trigger an existing repository integration, but this has not yet been confirmed.

## Outstanding work

### Critical

- No hosted preview or publication is available yet. Next step: confirm/create a GitHub PR and check whether its CI provides a deployment URL; otherwise configure the project’s supported preview/deployment integration. Do not claim a live URL until verified.

### Serious

- Complete route-specific visual review for the investor, admin, and referral dashboards with an authorized test account; verify protected actions without changing their financial rules.
- Review English, Spanish, German, and Chinese claims and remove unsupported legacy copy.
- Decide whether the distinct banking demo is included in the final redesign scope; it remains light-themed and separate.

### Minor

- Existing lint warnings in `admin-applications-page.tsx` remain untouched because they are outside the visual redesign.
- Old unused static example metrics still exist in the content dictionary source, but are no longer rendered by the redesigned homepage.

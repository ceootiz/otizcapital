# Content map

## Editorial rules

- Describe procurement, logistics, marketplace sales, reporting, eligibility, and risk in plain Russian.
- Do not describe OTIZ as a bank, broker, exchange, or licensed investment-platform operator without evidence.
- Do not promise returns or make unverified claims about collateral, controls, sales, investor counts, capital, or delivery volumes.
- Keep existing product actions and route destinations intact.
- Keep explicit demo-only content isolated and labeled.

## Home page decisions

| Section | Current content | Adapted content | Reason / evidence | Action |
|---|---|---|---|---|
| Navigation | Operations, transparency, process, FAQ, calculator | Russian labels retained; styling and hierarchy aligned to reference | Existing `HomePage` anchors and calculator route | Explore sections, open calculator, apply, investor login |
| Hero | Electronics commerce allocation headline with a two-column chart dashboard | Centered Russian headline; concise trade-cycle explanation; no performance claims | `homepage-content.ts`, application route, existing commerce model | Apply or read transparency section |
| Dashboard collage | Hard-coded `$12.8M`, `$16.2M`, `48.6K`, project capital, progress and dates | Non-numeric procurement / logistics / sale / reporting concepts | No source for existing figures was found in the repo | Continue to operational transparency |
| Trust metrics | Static capital, sales, delivery, allocation and reporting claims | Process/evidence categories without unsupported totals | Existing static translations do not link to a live source | Inspect process and evidence |
| Operations list | Static example projects with IDs, marketplaces, capital, status and progress | Remove unsourced project records from the hero and public operating summary | Values are local content constants, not API data | Apply or open investor login |
| Testimonials | Static quotes/names in locale content | Exclude until the project can identify an approved, verifiable source | No source or consent metadata found | None |
| Process / transparency / risk / FAQ | Existing localized educational content | Preserve and retheme; avoid expanding unsupported legal or financial claims | `homepage-content.ts` and existing feature routes | Learn how the cycle and documents work |
| Banking navigator | Separate explicitly demo-labeled microbusiness banking experience | Keep its routes and behavior separate from OTIZ investment content; apply shared visual tokens where safe | `apps/web/app/banking/*` | Open its clearly labeled demo |

## Claim and data treatment

The current homepage contains static financial totals and example supply rows. No live data source was found for those elements during inventory. They are therefore not carried into the redesign. Existing authenticated investor/admin screens continue to render their API-backed records and retain their existing calculations and contracts. This work does not change those calculations or endpoints.

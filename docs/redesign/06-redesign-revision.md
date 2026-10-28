# Redesign revision

The homepage now uses a staggered card collage, brighter side lighting, a perspective grid and an illustrative electronics image. Shared card surfaces, focus states and typography are used across the investor, admin, partner and public areas. The separate banking demo has been recolored and remains labelled as a separate demo. No financial calculation, API or authentication rule was changed.

## Review

- Created an isolated PostgreSQL database and test investor, allocation and report for visual review. The test data is not production data.
- Tested authenticated investor and admin login and opened their main sections at 390 and 1440 px. Five detail routes were opened using the isolated fixtures; all returned 200 with no page exceptions or horizontal overflow.
- Checked 40 non-parameterized page routes at both widths. The first mobile pass found overflow on the admin readiness policy page; the long button was fixed and that page was rechecked at 390 px. Two navigation attempts in the automated mobile sweep were aborted; their destinations passed in the separate authenticated route review.
- The 11 Vitest files passed (106 tests). TypeScript passed. The production build passed against the local database; lint reported three existing React hook warnings.
- Screenshots with local test data: `screenshots/redesign-v2-home-390.png`, `redesign-v2-home-1440.png`, `redesign-v2-investor-390.png`, `redesign-v2-investor-1440.png`, `redesign-v2-admin-390.png`, `redesign-v2-admin-1440.png`.

## Remaining limitations

- No Vercel deployment tools or credentials are available in this session, so a hosted preview has not been created.
- Mobile navigation opened and closed. A test application was submitted successfully to the isolated database (HTTP 201); changing the calculator amount updated its results.
- Route loading is not equivalent to verifying every mutation, modal and populated data state. Further acceptance is needed before production.

# Public tree audit: real aggregates vs conceptual branches, compact UI

**22 October 2026 — inspected on the real connected GitHub organization and in Chromium WebGL.**

## What's genuinely from GitHub?

The right-hand Team Activity cards and bottom five aggregate counters are taken from `snapshot.json` (schema v2, `public-authorized-team-summary`). This document was **last collected on 21 October 2026 at 05:50:58 UTC**, so its data must not be described as live or current merely because the webpage refreshes every five minutes. The GitHub Pages deployment workflow verifies and republishes the JSON; it does **not** generate fresh GitHub measurements. The snapshot has its own scope: *repositories readable by both collaborators*, not all repositories accessible to one logged-in GitHub account. A read-only review of the connected organization's repository listing confirms that the full private-repository inventory and publication scope differ. No private names, repository URLs, tokens or contents may be exported onto this publicly accessible site by default.

The 12 original tree labels (Audio Playground, Creative Engine, etc.) **are conceptual visual areas**, not 12 repository names, and prior figures such as `38 DEMO COMMITS`, fake per-area issues, sample messages like `Create a new animation`, or user productivity observations were fabricated. These invented per-area counts and activity were removed, rather than falsely relabeled as verified data. Names/branch anchors remain to preserve the interactive 3D tree. They are labeled **PROJECT AREAS / AREA TEMATICA**, with a short topical description and a plain indication that they are not individual repositories. The sidebar filters now select thematic classes, not fabricated statuses such as assigned issues or active work.

To provide **actual live individual private-repository data** in future would require an authorized server-side GitHub Action (or service) that reads the selected private repositories, produces a specifically approved, public-safe payload and publishes it on a cadence. It must not expose repository names, issue titles, commit messages, identities or per-repository details without the owner's separate explicit approval. Do not assume the web browser can directly read private repositories or ship authentication credentials to Pages.

## Exact interface change

- Removed user-visible `DEMO`, `ESEMPIO DI ATTIVITÀ`, fake sample commit messages, false issue and PR counts, and the corresponding fake secondary commit/issue branches in the fallback renderer.
- Added categorical filters **TUTTI / CREATIVE / TECNICHE**, each actually functional.
- Preserved typography; tightened sidebar item height from measured **46.52 px to 40.52 px** at a desktop width of 1536, while keeping the rendered secondary font exactly **10 px** and using **5 px vertical gap** between dark entry surfaces.
- Added **GITHUB · SNAPSHOT [timestamp]** in the visible Team Activity heading, sourced from the actual `updated_at` timestamp in the published data, with the same date available in status/metadata. It does not imply realtime tracking.
- Kept the original moving tree, bark-mounted labels, wind, reflective lake, dark mountains, glass panels, real snapshot and existing supervisor messaging.

## Verified

- Chromium WebGL desktop 1536×970: 12 theme branches, all labels anchored, no JS exceptions; list entry 40.52 px, 10 px font unchanged, 5 px gap; snapshot date visible; 13 repository aggregation as defined by the previous scope.
- Clicking `CREATIVE` selects 6 matching thematic areas; `TECNICHE` selects 6; switching selected theme updates right-side text and branch highlight without producing fake metrics.
- Mobile 430×930: no horizontal overflow; theme area entries remain 40.52 px, preserved font, 3D tree works.
- All 76 Python regressions and the GitHub Pages privacy preflight pass. Screenshots [desktop](screenshots/compact-conceptual-map-desktop-2026-10-22.jpg) and [mobile](screenshots/compact-conceptual-map-mobile-2026-10-22.jpg).

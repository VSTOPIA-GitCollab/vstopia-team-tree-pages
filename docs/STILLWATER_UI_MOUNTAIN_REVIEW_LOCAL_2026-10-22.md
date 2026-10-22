# VSTOPIA × Stillwater — Unified UI and dark mountain materials

**Date:** 22 October 2026. **Status:** local branch and live local preview; no push, PR, merge, or GitHub Pages deploy.

## Source and isolation

This review extends the other scene agent's existing local work, preserving their layout decisions rather than replacing their scene. Working tree:
`/Users/ostino/Documents/Code/VSTOPIA-GitCollab/vstopia-team-tree-stillwater-ui-polish`
Branch: `feat/stillwater-ui-mountain-material-review`. Existing reference integration branch: `feat/stillwater-base-integration-local-20261021` at `d0e6da0`.

**Local preview** (while the test server is active): `http://127.0.0.1:38996/`; the earlier unchanged integration lives at `http://127.0.0.1:38995/`.

## Design principles respected

- Previous issue: overlapping CSS cascade (`style.css`, `liquid-glass.css`, `scene-polish.css`, `apple-glass.css`, `water-garden.css`, `team-readable.css`, `stillwater-integration.css`). The agent implemented an ordered, reproducible **one-file CSS bundle** at `site-unified.css` with human-editable `site-design.css` appended last. The eight *source* modules remain in the working copy for provenance/history; the browser now loads **one** stylesheet, not seven competing network styles. Build with `python3 scripts/build_site_css.py` whenever a source rule changes. Avoid manually editing the generated bundle.
- UI font: Apple/SF-style system sans, readable stat numerals, lightweight semitransparent glass, fewer nested cards, no tiny solid blue boxes; team information is expressly `VERIFIED GITHUB DATA`, while left-side hypothetical branches are `DEMO · EXAMPLE PROJECTS`. No private tokens or repo contents.
- Visual layout: left project explorer; original user Stillwater lake/tree as central live Three.js r180 scene; right team and task inspector. The right inspector now spans **both grid rows**, using 823px instead of 709px on 1536×970 desktop, while five important counters remain horizontally under the main 3D scene. This took inspector internal scroll from **88px to 0** without squeezing font sizes. The selected-branch/supervisor narrative text was enlarged to **12px**. At intermediate widths under 1100px, bottom metrics use a 3-column arrangement to preserve legibility. Mobile uses the existing vertical layout.
- Mountain material: `stillwater/nature.js` RGB albedo changed from pale blue-gray to charcoal/slate `#29363b…#46585f`; IBL intensity reduced `.25→.02`; the fragment shader's pale blue additive atmospheric haze changed to subdued slate so mountain slopes no longer appear white under `partly-cloudy-2k.hdr`. The three physical ridge meshes and their terrain/noise/displacement are unchanged. Clouds, lake, tree, wind, light, sliders and PMREM are untouched.

## Verified live browser QA

Actual Chrome render captured with isolated browser against the 38996 localhost preview after waiting for GitHub snapshot, landscape and loading to finish. Real page loaded **only `site-unified.css`**, rendered 13 public projects, all 12 true branch anchors and the pre-existing partly cloudy sky, while Wind and Light remained 2/2 and 1/1. At desktop 1536px: right inspector 823px high, scroll 0, team scroll 0, all inner member cards scroll 0; 12px selected project body text; document width exactly 1536px. At mobile 430px: document width exactly 430px, right inspector and member cards inner scroll 0. The left project explorer can scroll independently on mobile because it has 12 entries, but the right team cards are not clipped.

- [Actual desktop scene, dark mountains and complete team inspector](screenshots/stillwater-dark-mountains-glass-desktop-2026-10-22.jpg)
- [Actual mobile team cards and selected demo project](screenshots/stillwater-glass-team-mobile-2026-10-22.jpg)

62 Python regression tests passed. Three historical tests were **adapted, not deleted**: they now check that apple-glass, liquid-glass and team-readable original modules are present in the generated stylesheet rather than expecting seven separate `<link>` imports. New regression tests validate the one-sheet loading contract, the taller inspector, dark mountain material, readable demo/verified labels and Apple font.

**Not deployed.** The original `lake-scene 2` Downloads source remains unmodified. The 38996 HTTP server is local only; when preview is accepted, first reconcile with the current GitHub main and other active worktrees. Do not blindly merge or publish.

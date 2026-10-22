# Mobile liquid-glass color restoration

**22 October 2026 | Site-only scoped change | Desktop unchanged**

## Owner decision

The **current mobile layout is approved**. Only restore the visual palette of
the earlier mobile UI: translucent blue/green liquid-glass containers over
the cool cloudy sky and forest. Do not redesign container hierarchy, typography,
20-repository navigation, stage position or the desktop layout.

## Root causes and targeted repair

- The 20-alias/mobile branch overrode the original
  `backdrop-filter:blur(20px) saturate(122%)` with `blur(8px)`,
  changing the glass effect. This override is removed.
- Mobile layout correctly put the interactive 3D stage in the document flow,
  but this also removed the continuously rendered 3D backdrop behind the other
  translucent site panels. A **mobile-only underlying page gradient**, sampled
  from `docs/screenshots/stillwater-glass-team-mobile-2026-10-22.jpg`, now
  restores the original cool blue/green forest hue without altering the
  color/opacity tokens or layout of the container elements.
- The previous mobile optimization replaced the partly cloudy 2K HDR panorama
  with the procedural sky, changing apparent brightness and colors.
  Restore the existing original cloud HDR panorama on phones as on desktop.
  Retain mobile lowPower resolution/grass/Water.js resource budgets.

## Preserved interactivity and animation

Unchanged Stillwater Three.js r180, swaying bark and foliage shader,
moving reflective water, OrbitControls with touch rotation, and three flocks
of **30 birds** moving each frame. Sidebar and 3D branch anchors remain
unified across all **20 public aliases**, of which seven have the
display-only label **In programmazione**.

## Test and visual evidence

- Python unit/contract tests: **86/86 PASS**.
- Chrome 155 headless mobile viewport 430x930, DPR2: `body` gradient
  sampled from previous visual QA; actual computed inspector
  background `rgba(18,47,55,.21)` and `backdrop-filter:blur(20px)
  saturate(1.22)`. WebGL loads original `alpine-partly-cloudy-2k`
  backdrop, all 20 labels and anchors, birdCount 30; no horizontal
  overflow or runtime JavaScript exceptions observed.
- Headless software WebGL was ~17 FPS (not physical phone FPS).
  Actual iPhone Safari / Android Chrome are **NOT VERIFIED**.
- [Restored mobile 3D stage](screenshots/mobile-original-glass-stage-2026-10-22.jpg)
- [Restored mobile team container colors](screenshots/mobile-original-glass-inspector-2026-10-22.jpg)
- Previous color reference:
  [original mobile Team view](screenshots/stillwater-glass-team-mobile-2026-10-22.jpg)

## Scope and release safety

Source CSS is `site-design.css`; `site-unified.css` regenerated with
`python3 scripts/build_site_css.py`, never hand-edited.
Files in the private collector, tokens, GitHub Actions flags, PR/Issue
counts and automatic synchronization are completely unaffected.

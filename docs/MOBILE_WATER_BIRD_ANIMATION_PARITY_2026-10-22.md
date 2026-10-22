# Mobile: identical water and bird motion to desktop

**22 October 2026 — scoped site animation correction**

## Owner instruction

Water and birds on phones must **only move as on desktop**. No brighter
water, more turbulence, higher speeds, changed flock size/altitude, new
animations, altered tree/camera, UI, color, glass or layout.

## Root causes

The original shared clock in `stillwater/scene.js` limited `dt` to 0.05
seconds on every frame and then advanced the scene/water time by that limited
value. At a low mobile frame rate, 100 milliseconds between frames advanced
the natural scene by only 50 milliseconds: **both the Water.js surface
and the bird instancing clock appeared to run in slow motion**. Water and bird
position were both driven by `time.value`.

Independently, `prefers-reduced-motion: reduce` automatically set
`paused=true` before iframe scene initialization. Some mobile device
configurations could therefore freeze both water and flocks altogether.

## Minimal correction

- Phone embed is an explicitly live Three.js scene: do not automatically
  pause it based on `prefers-reduced-motion`; standalone Stillwater and
  embedded desktop retain their OS reduced-motion behavior, and phone users
  can pause/resume using the existing manual control.
- Continue capping **camera/control damping** at 50ms per frame, but advance
  the shared water/bird/wind clock using measured seconds, with a generous
  250ms cap only for long interrupted/suspended tabs.
- Keep the original formulas, the Water.js normals, original `wind` values,
  30 bird meshes, colors, paths, shader wing-flaps and positions unchanged.
- Add read-only QA probes (animation seconds, Water.js uniform, first bird
  instance position and paused state) to existing scene debug method. No
  extra work runs per frame when the probes are not queried.
- No change to desktop rendering, mobile WebGL resources, stage layout,
  liquid-glass CSS, sidebar/20 aliases, public snapshot, organization
  permissions or GitHub workflow.

## Verification

- Python unit/contract suite: **90/90 PASS** (includes new animation parity
  regression tests).
- Public v3 allowlist/snapshot schema: PASS.
- Chrome 155 headless WebGL / CDP on the Mac ARM using 430×930 mobile viewport,
  emulated system `prefers-reduced-motion: reduce`: animated water and birds
  moved in a roughly 2.6-second wall-clock sample, with 2.683 seconds of
  shared animation time, 2.442 seconds of Water.js uniform time, and 8.757
  world units of displacement of bird instance 0.
- Existing Pause button: froze scene animation time (delta=0) on command.
- Standalone desktop and mobile share exactly the same motion equations; a separate cold full-desktop SwiftShader run was resource-heavy and is not counted as a completed visual comparison.
- Live HTTPS deployment should be recorded separately.
- These are *browser emulation tests*, not a claim of actual iPhone Safari
  or Android Chrome hardware QA.

## Safety

Do not respond to subjective complaints about missing phone motion by
changing bird size, speed, color, altitude, route or water distortion.
The purpose is parity of temporal motion only.

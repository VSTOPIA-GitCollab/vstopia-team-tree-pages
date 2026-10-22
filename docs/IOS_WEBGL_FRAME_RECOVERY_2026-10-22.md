# iOS Safari WebGL animation frame recovery

**22 October 2026 — scope: mobile frame responsiveness only.**

## User report

On a **real iOS device**, the published living tree appeared completely
motionless (water, birds and other movement). This overrides earlier conclusions
from headless Chrome emulation: **actual Safari iOS was not verified as working**.

## Evidence and root-cause candidates

1. The branch anchor scan sampled ~18,000 bark vertices and called
   `heroTree.updateMatrixWorld(true)` and
   `camera.updateMatrixWorld(true)` **once per candidate**. This is repeated
   on a viewport resize. iOS Safari's address bar can change the iframe
   height while scrolling, continually invalidating the anchor scan, with
   enough CPU pressure to starve animation frames.
2. WebKit stops requestAnimationFrame while pages/frames are backgrounded and
   can lose WebGL contexts on iOS. Source background: WebKit power management
   article and bugs 261331, 289601; the exact iPhone failure mode is still
   unknown without live Safari Inspector or opt-in runtime diagnostic.
3. Prior release used unversioned static ES module URLs. iOS Safari may
   continue to use cached scripts after a GitHub Pages deploy.
4. The previous fix for the 50ms motion-clock cap is retained; it was not
   sufficient for the real iOS report.

## Changes

- Evaluate heroTree/camera world matrices **once per scan/batch**, rather
  than per projected vertex; mobile candidates limited to 2,400, still allowing
  selection of all 20 aliases. Desktop remains at 18,000 candidates.
- On mobile ignore height-only resize events (browser chrome/UI), retaining
  the 20 already selected bark-vertex anchors. Width changes >20px (rotation)
  still recompute them.
- Resume exactly one pending animation-frame loop when a mobile iframe
  receives `pageshow`/`visibilitychange`/`focus`. Respect page hidden state.
- Preserve 30 birds, native Water.js motion, the HDR clouds, glass colors,
  all layout, parameters, formulas and desktop behavior.
- Version the small set of nested ES module URLs to prevent the old Safari
  cache from obscuring a deployment.
- Optional visible runtime diagnostics, **only at `?iosdebug=1`**:
  frames progressing, water uniform time, first bird position delta,
  paused state, GPU context-loss flag and frame age. Read-only; no
  private identifiers, no persistent telemetry or external diagnostics.
- `webglcontextrestored` clears the existing error indicator after
  Three.js rebuilds its GPU resources.

## Verification and remaining unknowns

Automated regression tests verify the preserved original motion equations,
cache versioning, mobile anchor budget and Safari frame wake-up.
Actual device: macOS CoreDevice lists a paired **iPhone 14 Pro** with
Developer Mode enabled over localNetwork and MobileSafari active. This
does NOT itself grant Safari Web Inspector DOM access. Do not claim a
physical device pass from desktop emulation or process presence.

**Next:** open public diagnostic URL on that iPhone, allow WebGL to finish
loading, and compare frame/water/bird counters at intervals. If they remain
constant, capture Safari Web Inspector or diagnostic screenshot and follow
the failure mode. If WebGL context is lost, investigate scene memory and
context recovery. Never mask the problem by artificially increasing motion
speed or size.

## Local runtime verification

Mac ARM, Google Chrome 155 headless mobile emulation, 430×930 DPR2,
`?iosdebug=1`:

- `candidateCount=2275` (rather than ~17,433 previously), 20 real
  source aliases and 20 anchored labels after initialization.
- Read-only overlay eventually reported moving frame, water and bird
  counters, `paused=false`, `webglLost=false`, `documentVisible=true`.
- In local QA the first frame initialization was abnormally delayed by
  roughly 20s of software WebGL compilation; later frames progressed
  normally. This is a measured software-emulation issue, **not proof
  of how fast a physical iPhone loads**.
- Simulated Safari URL bar resize from 430×930 to 430×840 retained all
  20 anchors; frame counter and water uniform continued advancing.
- No JavaScript runtime exceptions observed in that emulation.
- Python unit tests: **95/95 PASS**, public snapshot allowlist PASS.
- Actual iPhone Safari DOM/console NOT inspected, despite CoreDevice
  showing a paired iPhone 14 Pro and MobileSafari process.

To verify the ACTUAL device, load:
`https://vstopia-gitcollab.github.io/vstopia-team-tree-pages/?iosdebug=1&rev=ios-frame-20261022`
and read the diagnostic counters after scrolling to the 3D stage.
If frames stay the same while `visible true`, collect iOS Safari Web
Inspector traces before making further changes. This overlay is only
present when `iosdebug=1` is supplied.

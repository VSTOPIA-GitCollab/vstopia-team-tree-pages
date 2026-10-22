# Lake life and mountain woodland — source implementation

**22 October 2026 · canonical Living Tree working folder**

This entry documents the owner's additional uncommitted work after the local
commit `8887ee1` (mountain waterfall, rain and day/night atmosphere), before
the first public release of the combined new features.

## What changed

- **Wildlife:** up to three independently scheduled lake trout make occasional
  ballistic jumps (initial trigger after ~4 / ~11 / ~19 seconds of simulation
  time). Their launch/landing coordinates are chosen by deterministic seeded
  sampling only where the existing lake's terrain is wet. A forward corridor
  and side margin are checked across 13 steps; on dry/custom terrain no fish
  is created. Fish use an elongated vertex-colored body, fins/eyes, animated
  tail, a surface impact ring and droplet spray. All actors are pooled and
  reused. Sprays and ripples are inexpensive geometry-based approximations.
- **Mountain woodland:** broadleaf trunks and shaded clustered crowns now
  grow from the **actual mountain indexed triangles**, using barycentric
  sampling and a surface-normal/slope test. A seeded patch mask controls
  density; cliffs, high elevations and the carved waterfall gorge are
  excluded. The mountains' rock shader adds a slope/altitude-dependent
  woodland-green mineral transition to connect nearby and distant greenery.
- **Performance budgets:** woodland targets 2,600 desktop / 900 mobile
  candidate trees at most, with three crown instances per accepted site;
  trout sprays use 28 desktop / 16 mobile particles per fish. Geometry is
  shared; trunks and leaves are InstancedMeshes.
- **Clock integration:** `createLakeFish({scene,clock:time,...})` reads the
  existing simulation time. The scene's existing Pause freezes fish movement
  because the same clock stops advancing. `lakeFish.update()` executes once
  in the existing renderer; no new requestAnimationFrame or timer.
- **Integration:** one new `stillwater/lake-life.js` module and targeted
  changes to `stillwater/scene.js`, `nature.js`, and the three root → parent
  → iframe module revision URLs. Module cache revision:
  `organic-grass-variation-20261022-moving-clouds-v1-weather-v1-life-v1`.
  No new runtime dependencies, extra hosted assets or GitHub data processing.

## How it works

### Fish spawning and timing
`findJumpSite(height,rnd)` attempts up to 240 corridors; the full jump path
and margin must have terrain y below -0.30m. `jumpPose(u)` computes parabolic
height `4*h*u*(1-u)` and orientation from its derivative. Each actor is
scheduled independently after 21–38 simulation seconds, with a short jump
followed by a fading surface ring and gravity-like droplet trajectory.
Runtime observation counters are placed in `document.body.dataset.fishJumps`
and `fishVisible` for non-invasive QA.

### Slope-dependent mountain cover
`addMountainVegetation` finds the three existing `Horizon ridge` meshes,
samples their indexed triangles, rejects near-vertical slopes (normal.y<0.59),
sites below the local ground, peaks above 104m and the actual waterfall
channel at x≈-570. A deterministic world-position patch mask produces
nonrectangular vegetated regions; mesh trees/clustered crowns reuse instances
instead of adding a draw call per plant. Crown wind deformation uses the
existing `uTime` and `uWind` shader uniforms.

### Relationship to previous weather/waterfall changes
`8887ee1` introduced `stillwater/mountain-waterfall.js` and
`stillwater/atmosphere.js`. Waterfall geometry modifies the source
mountain mesh to create a carved shelf and downhill path with a plunge pool,
foam and spray. The Atmosphere control exposes a manual Day/Night slider,
rain slider and optional 240-second automatic cycle; the new mood affects
sun, ambient intensity, lake reflectivity, fog, sky, mountain material and
waterfall. The initial view retains the existing moving 2K partly-cloudy
HDRI; a storm/night sky is shown only when requested. Rain streaks and
lake-impact rings share the same animation clock, and instance budgets
are reduced on mobile.

The new woodland passes over the *already carved* mountain mesh, not a
generic plane. The fish stay in the original foreground lake, with water
and clouds still animated independently through shared scene time.

## Testing, risks and release notes

Checks to run before pushing:
`node scripts/check_weather_waterfall.mjs`;
`node scripts/check_lake_life.mjs`;
`node scripts/check_surface_detail.mjs`;
`python3 -m unittest discover -s tests -q`;
`python3 scripts/validate_public_snapshot.py snapshot.json`;
Node JavaScript syntax checks for all added modules and `git diff --check`.

Visual QA should include clear day / rainy night, mountain vegetation,
river/waterfall visibility, nearby lake/trout (which are intermittent) and
responsive mobile controls. Automated source tests establish geometry and
state contracts; they cannot guarantee physical iOS Safari frame rates.

**Protection:** No changes to the 20 public alias registry, GitHub telemetry,
private collector, liquid-glass main site colors, licensing or private
handoffs. Work in the single canonical checkout; do not clone/worktree.

Reference docs:
- `docs/WATERFALL_DAY_NIGHT_RAIN_2026-10-22.md`
- `docs/SURFACE_DEPTH_MATERIAL_REVIEW_2026-10-22.md`
- `docs/MOVING_HDRI_CLOUDS_LOCAL_2026-10-22.md`
- root `AGENTS.md`

**Status at creation:** CODED locally / subject to final browser QA and
deployment. A later release ledger should record the verified SHA,
GitHub Pages workflow run, live HTTPS assets and any limitations.


## New independent verification — local Chromium WebGL

The site was loaded **from this canonical checkout** through its existing
localhost server (port 39231), Chrome desktop and 430×930 mobile emulation,
rather than a copied build. The browser's embedded iframe reported:

| Live probe | Desktop | Mobile emulation |
| --- | ---: | ---: |
| WebGL profile | desktop-webgl | mobile-webgl |
| All tree aliases & anchors | 20 / 20 | 20 / 20 |
| Mountain woodland instances | 2,600 | 900 |
| Waterfall ravine plants | 48 | 20 |
| Fish jumps seen after animation clock progressed | 1 | 1 |
| Sky/HDRI loaded | yes | yes |
| Browser runtime/GLSL exceptions | 0 | 0 |
| Unwanted horizontal overflow | no | no |

Rain input = 0.85 and Day/Night input = 0.14 were applied through real
`input` events. Observed state converged to ~0.846 rain / ~0.144 daylight
(desktop) and ~0.848 / ~0.142 (mobile). Frame counts advanced during both
checks. Manual in-scene Pause behavior was verified by the author's weather
report and separately guarded by the source-level shared-clock tests; a new
real iPhone Safari run has **not** occurred.

- [Rainy twilight desktop screenshot](screenshots/waterfall-weather-lake-life-desktop-2026-10-22.jpg)
- [Rainy twilight mobile responsive screenshot](screenshots/waterfall-weather-lake-life-mobile-2026-10-22.jpg)

New `scripts/check_lake_life.mjs` regression runs real Three.js geometry
headlessly at both budgets: parabola apex and return height, full wet-jump
corridor, dry-land no-jump behavior, no repeated spawn at constant clock
time, actual mountain indexed geometry and bounded woodland instance counts.
It **passed** on Mac ARM with the vendored Three.js module. Earlier
`scripts/check_weather_waterfall.mjs` **passed** on the same source.

The source code and screenshots here are CODED/TESTED. Public deployment
status must be added after GitHub Actions and live HTTPS verification.

# Mountain waterfall and atmosphere controls — 2026-10-22

Implemented in the canonical checkout:
`/Users/ostino/Documents/Code/VSTOPIA-GitCollab/vstopia-team-tree-pages-organic-vegetation-texture-20261022`

Starting revision: `cab632a` on `main`. Local changes only; no push or deployment performed. Continue using this same checkout; do not create another copy to iterate on this scene.

## Preview and controls

Integrated page: http://127.0.0.1:39231/
Standalone scene: http://127.0.0.1:39231/stillwater/

Open **The atmosphere**:
- **Day / night** blends daylight, afternoon, twilight and night.
- **Weather** blends the current sky into light rain and full rain.
- **Auto day / night** runs a 240-second cycle. Moving the day slider stops the cycle.
- Existing **Pause** freezes waterfall flow, spray, rain, ripples, cloud movement and the automatic cycle through the same scene clock. Manual weather changes still work while paused.
- Existing Light, Wind, orbit, pan, quality and Return to the tree remain available.

The initial state remains daytime with the existing moving HDRI clouds and no rain. Night includes stars and a moon, with restrained ambient illumination so the tree remains readable.

## Implementation

`stillwater/mountain-waterfall.js` fits a cascade to Horizon ridge 1 near x=-570, z=-735…-681. A shelf and descending face are formed in the original mountain mesh; normals and bounds are recomputed. The water uses a flowing shader, a plunge pool, animated foam and rising spray. Instanced trees with real leaf geometry grow beside the ravine. It is visible to the left of the main tree from the initial view. The path is part of the distant landscape, not a camera-facing image.

`stillwater/atmosphere.js` owns the shared weather state and uniforms. It blends sun/moon illumination, environment intensity, exposure, fog, terrain wetness, leaf backlight and lake color. The Water shader's constant reflection brightness floor is scaled at night to prevent a glowing lake. A depth-tested sky sphere replaces only unobstructed sky pixels during transitions, so the sky does not paint over the landscape.

Rain uses one line-segment draw call and lake impact rings use one instanced draw call. Waterfall vegetation uses two instanced draw calls. All effects use the existing frame loop and clock; no second renderer, animation loop, asset service or dependency is added.

Desktop budgets: 3,800 rain streaks, 160 lake rings, 240 spray particles, 48 ravine trees / 4,800 leaves.
Mobile budgets: 1,000 rain streaks, 48 lake rings, 70 spray particles, 20 ravine trees / 1,200 leaves.
Rain and sky overlay objects are hidden at the clear-day endpoint.

The Atmosphere panel now scrolls if its expanded contents exceed the viewport. Entry-point cache tokens were advanced together. GitHub data collection, snapshots and labels are untouched.

## Validation

- `node scripts/check_weather_waterfall.mjs`: PASS. Checks light endpoints/clamping/monotonicity, actual mountain geometry and downhill cascade path, finite vertices, shared clock and mobile instance counts.
- `node scripts/check_surface_detail.mjs`: PASS. Existing bark relief, normal maps and foliage checks.
- `python3 -m unittest discover -s tests -q`: all 115 tests PASS.
- `python3 scripts/validate_public_snapshot.py snapshot.json`: PASS.
- `git diff --check`: PASS.
- Chrome desktop: visually inspected clear day, night and rain in the integrated page; inspected rainy night in standalone. Waterfall visible, rain/ripples visible, night lake no longer glows. No captured browser errors.
- Auto cycle changed daylight; Pause held shared weatherTime at 128.99 across separated reads.
- Responsive 430×930 viewport: mobile WebGL profile active, 20 waterfall plants; expanded panel measured 190×416 and fit inside the iframe (top 192, bottom 608). Rain slider worked; no captured browser errors. Viewport override reset afterward.

Limitations: rain is an efficient visual particle effect, not a physical weather simulation. The storm sky and waterfall flow are procedural. Responsive Chrome testing does not constitute a physical iPhone/Safari performance test. No live GitHub Pages deployment was performed.


## Public release verification — 22 October 2026

Original source commit: `8887ee18684fea899fb5664b3dddf36cdb586788` ("Add mountain waterfall and day-night rain controls"). This document's earlier "local only" language describes the initial test state, not the final release.

**PUSHED / MERGED / DEPLOYED / VERIFIED:** included in GitHub `main` at `bb64a50985c609edd7af7542babe64db9498eb8a`. GitHub Pages run **39828236994** completed with **success**. Live HTTP 200 checked for `atmosphere.js?v=waterfall-weather-v1`, `mountain-waterfall.js?v=waterfall-weather-v1`, root page and integrated scene.

Real browser smoke test on the public HTTPS release (Chrome desktop and mobile emulation): day slider 0.14 and rain slider 0.85 produced observed values near 0.142/0.848; water, moving clouds and scene rendered; 20 labels and 20 anchors; 48 waterfall plants desktop / 20 mobile, no captured JS/GLSL exceptions. **Physical iOS Safari not verified.**

Full scene release documentation: `docs/LAKE_LIFE_MOUNTAIN_WOODLAND_2026-10-22.md`.

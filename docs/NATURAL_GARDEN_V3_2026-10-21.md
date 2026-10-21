# VSTOPIA Team Tree — Natural Garden V3 (October 21, 2026)

## Landscape

- **Irregular lake, visibly distant from the tree:** lake center (-145, -210) world units, radius around 62×44 with irregular 3/5/9-frequency sinusoidal outline, stored as a custom triangular mesh; real bathymetric cut in the terrain with matching `lakeEdge` geometry. Official Three.js `Water.js` reflection is still active, color calibrated against the self-hosted HDRI. The lake was deliberately moved to the left after a visual inspection showed its prior right-side location was obscured by the inspector panel.
- **Wide creek to the terrain boundary:** 15 path nodes from x=-7950 near the western -8000 edge of the 16 km terrain, to the irregular lake shore. A 600-segment Catmull–Rom ribbon with an approximately 28–43 m full width, and carved matching riverbed. The far reaches progressively fade with world distance into the same HDRI to avoid an artificial straight-colored line on the photographic horizon. Water ripple phase continues in real time.
- **Non-repetitive rocks:** 220 live instances in the browser verification, made from an angular, procedurally vertex-displaced ico geometry with nonuniform random orientation, sizes and muted multi-tone PBR materials. Most are scattered throughout the meadow or irregularly beside the creek; only a few populate the lake edge. No ring of identical pebbles and no unknown third-party GLB licenses.
- **Grass:** 33,000 grouped instanced five-blade tufts (up to 165,000 individual blade triangles) on the meadow and both riverbanks, avoiding areas submerged under the water; pre-existing local grass and 28 EZ-Tree-derived bushes retained. Four randomized colors and distinct scale/rotation break repetition.

## Actual liquid glass and UI

The old **PUBLIC STATS · AGGREGATES ONLY** sidebar callout is removed; public-aggregate privacy controls stay in `.github/workflows/pages.yml`. The Three.js stage now spans the real viewport *behind* the header, explorer, inspector and metrics, with events/clicks intercepted by actual UI panels and the tree still rotatable through uncovered areas. Background alpha (header ~.12, primary panels ~.115, cards ~.17) and backdrop blur allow the actual moving scene to show beneath the UI instead of rendering opaque pale-blue blocks. The right inspector allocates height to Selected Branch, Team Supervisor and both team cards, removing nested overflow/max-height restrictions.

The header uses **one** self-hosted `@specy/liquid-glass-react@1.0.2` refraction component, with React 19 and MIT notice under `vendor/legal`. Initializing a separate WebGL refractor for every tile would be expensive alongside the reflective lake; the other components continue to use the existing MIT `rdev/liquid-glass-react` optic island and semi-transparent CSS. Reduced-motion users retain simpler glass. The app is still static GitHub Pages, with no runtime private GitHub tokens.

## Verification instructions and safety

After full DOM, HDRI and snapshot loading, wait several seconds, then use Chrome DevTools to drag-orbit left and right and wheel zoom. For each view verify `getAnchorDiagnostics()` drift below .06 CSS px; water movement via `VstopiaWaterDebug().lakeTime` and `.streamTime`; flags for rock and grass counts, lake and long creek topology; all bottom five metrics and both member cards; no nested scroll bars; no public disclaimer. Check the responsive mobile layout and fallback without WebGL separately. All screenshots committed to the public repo must show only the public app, never the owner's private desktop.

Research/source: [@specy/liquid-glass-react](https://www.npmjs.com/package/@specy/liquid-glass-react), [Specy/liquid-glass MIT project](https://github.com/Specy/liquid-glass), [official Three.js Water](https://threejs.org/docs/pages/Water.html), [Three.js InstancedMesh](https://threejs.org/docs/pages/InstancedMesh.html), [Three.js CatmullRomCurve3](https://threejs.org/docs/pages/CatmullRomCurve3.html).

## Verified captures

- [Front after complete HDRI/snapshot/glass load](screenshots/natural-garden-v3-front-2026-10-21.png)
- [Orbit left, real Chrome drag](screenshots/natural-garden-v3-orbit-left-2026-10-21.png)
- [Orbit right, real Chrome drag](screenshots/natural-garden-v3-orbit-right-2026-10-21.png)
- [Wheel zoom on the rotated scene](screenshots/natural-garden-v3-zoom-2026-10-21.png)
- [430px mobile viewport](screenshots/natural-garden-v3-mobile-2026-10-21.png)

Live-browser QA after loading: `glass=ready`, 13 snapshot projects, 12 branch labels with maximum screen-coordinate deviation <0.006 CSS px, 5 bottom statistics, 2 contributors, 0 extra inspector scrolling, moving lake and river timers, 33,000 grass tufts, 220 actual instanced rocks, and mobile width 430px without horizontal overflow. Public privacy strings are removed from header/sidebar/inspector chrome while authorized aggregate-data restrictions remain in the Actions validation.

# VSTOPIA Stillwater — photographic rocky mountains and continuous meadow

**Status:** local, tested, not pushed, merged or deployed. Branch `feat/rocky-mountains-continuous-terrain-20261022` created from `7aa7297`. Other agents' worktrees and the public GitHub Pages site are unchanged.

## Local preview

Main Mac: `http://127.0.0.1:39031/`. To restart after a reboot:

```sh
cd /Users/ostino/Documents/Code/VSTOPIA-GitCollab/vstopia-team-tree-rock-terrain-fix
python3 -m http.server 39031 --bind 127.0.0.1
```

This localhost is bound to the main Mac only. Do not push this branch without the owner's approval.

## Problem and exact fix

The source scene had an artificial pale/blue horizon band because the main meadow was a photographed grass texture over heightfield terrain, but the adjacent **RingGeometry(145,2400)** was a flat-tinted `#647263` material using a completely different elevation function (starting at Y=1). The lake's 900m reflective plane exposed the discontinuity from several angles. Placing an additional 102,000 blades in the deep distance was tested but produced strong sub-pixel black/white shimmer at the mountain foot, therefore **the experimental long-distance blades were removed** (not delivered).

`stillwater/scene.js` now uses a shared `distantMeadowHeight(x,z)` function to construct a densely tessellated, radially redistributed distant terrain mesh under the foreground plane. It transitions smoothly from near `height(x,z)-.38` to naturally undulating distant slopes, matching world-space photographed `ground.jpg` UVs **exactly** with `(x+170)*(55/340), (170-z)*(55/340)`. Shared height-driven vertex coloration, ground texture, bump map, roughness, and receiveShadow replace the old flat ring. No false bright water strip and no far-distance aliasing grass. Original near 180,000 moving grass instances plus the local ecology's 15,500 short grasses remain untouched.

`stillwater/nature.js` now projects a **CC0 scan of Poly Haven Aerial Rocks 02** onto the three ridge meshes using *triplanar mapping* in world units. A normal-weighted XYZ blend projects diffuse, OpenGL normal and roughness photos without UV stretch on steep cliffs. Two non-aligned scales with spatial domain-warping lessen repeating tiles; vertex albedo strata and muted atmospheric perspective preserve dark rock detail and depth. Implementation extends original r180 `MeshStandardMaterial` with `onBeforeCompile` instead of replacing Three.js renderer or the original mountain silhouette. No new runtime CDN.

Source assets copied locally from our previous approved research prototype, not re-downloaded: `stillwater/assets/rock-pbr/aerial-rocks-color.jpg`, `aerial-rocks-normal.jpg`, `aerial-rocks-roughness.jpg`, originally [Poly Haven — Aerial Rocks 02](https://polyhaven.com/a/aerial_rocks_02), **CC0**. Technical references: [Three.js material compiler](https://threejs.org/docs/pages/Material.html), [Three.js PBR material](https://threejs.org/docs/pages/MeshStandardMaterial.html), [Three.js InstancedMesh](https://threejs.org/docs/pages/InstancedMesh.html), [Triplanar mapping](https://docs.3dverse.com/engine/rendering/pbr-material-shaders/triplanar), [Eurographics triplanar displacement mapping](https://diglib.eg.org/server/api/core/bitstreams/b3af0317-e2d6-4e3a-8076-b415516eee87/content).

`stillwater-integration.js` no longer creates **SHOW 12 BRANCHES / SHOW SELECTED ONLY**. All 12 bark-vertex labels render permanently when their anchor falls inside the real camera's safe viewing region. Sidebar selection highlights rather than hides other project labels. It does not fake 2D static placements or detach labels during tree wind. Mobile can naturally have fewer visible labels from some camera angles if branches are outside view.

## Browser QA evidence

- [Desktop front, 12 anchored labels and rocky mountains](screenshots/stillwater-rocky-terrain-front-local-2026-10-22.jpg)
- [Real mouse orbit, texture and meadow checked from a second perspective](screenshots/stillwater-rocky-terrain-orbit-local-2026-10-22.jpg)
- [Mobile 430px, no horizontal overflow](screenshots/stillwater-rocky-terrain-mobile-local-2026-10-22.jpg)

Chromium software-WebGL test: Three.js scene loaded; zero runtime exceptions or WebGL shader compilation errors; network confirms **all three local rock PBR photos** loaded. Parent GitHub public snapshot still displays 13 projects. All 12 bark labels were visible on desktop front and after orbit. Wind=2, Light=1, cloudy sky `alpine-partly-cloudy-2k`, 28 shrubs, 15,500 short-grass tufts and 30 birds remain; no header/scene/UI replacement. Inspector scroll 0; only one source-ordered `site-unified.css` stylesheet is loaded. Mobile width 430px had no horizontal overflow. **66 unit tests PASS**, adapted older tests rather than deleting them.

### Remaining quality limitations

Photographic rocky PBR looks substantially less flat but the **mountain silhouettes and large-scale strata remain procedurally generated**, not surveyed photogrammetry. To reach a full cinematic landscape, future optional work would use photographed mesh/heightmap mountains with geologically realistic erosion and further botanical asset detail. The existing original Stillwater oak, riverless single lake, wind and optics are deliberately preserved.

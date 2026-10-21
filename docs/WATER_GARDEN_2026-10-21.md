# Garden V2 — sky lake, flowing creek, stones, grass and glass layout

## Implementation and visual QA

This public GitHub Pages app remains an independent Three.js / EZ-Tree scene, not an authenticated private-repo browser. The tree's 12 labels are still explicitly DEMO; source GitHub statistics are unchanged from the already-authorized sanitized snapshot.

1. **Landscape:** existing adaptive 16,000×16,000 terrain mesh gets higher resolution near the origin via non-linear coordinate spacing, genuine recessed carved basins around the lake and creek, and a shared `terrainElevation` function for collision-safe stone/vegetation placement. The previously calibrated HDRI, PBR roughness/normal/diffuse and stochastic anti-tiling remain intact.
2. **Lake:** official Three.js r167 `Water.js` addon, self-hosted at `vendor/addons/Water.js` under the existing Three.js MIT license. The circular/elliptical water surface at `(69,-.46,-129)` reflects the scene/celestial HDRI using a 128×128 real reflection render target (performance budget). A tileable 128px normal map is generated deterministically locally. The lake color shader is toned to preserve blue-green sky reflections without full-white clipping; it draws *after* the transparent distant ground, fixing the first-render overdraw bug.
3. **Creek:** custom small flow shader reflects color from the **same HDRI** via equirectangular sampling with a time-dependent wave phase. The spline-based ribbon winds through the field into the lake; the per-frame uniform increments real-time while the ground and HDRI remain stable. A second expensive planar reflection pass is avoided for performance. Respect `prefers-reduced-motion`.
4. **Vegetation:** existing 1,500 local grass instances + 10,000 additional **five-blade grass tufts** = about 50,000 farther grass leaves in one draw call. EZ-Tree-derived shrubs expanded to 28 grouped bushes with instanced 3D foliage. A batch of 170 rough faceted rock instances is distributed around the lakeshore and creek.
5. **Interface:** return an Inspector on the right containing Selected Branch, Team Supervisor, and two compact verified team cards. A separate bottom bar contains **only five headline metrics** (projects, commits, open issues, open PRs, merged PRs). Shared glass design uses reduced-alpha white gradients, edge glints, backdrop blur, muted champagne highlights, and the previously integrated macOS SF system font + genuine liquid-glass-react islands for supported controls.

## Referenced reusable solutions

- [Three.js official Water addon](https://threejs.org/docs/pages/Water.html) — reflection-based water shader, reused without upgrading incompatible versions of Three.js.
- [Three.js Water scene example](https://threejs.org/examples/webgl_water.html) — tested shader concepts for sky reflection and advancing the water time uniform.
- [Three.js Reflector](https://threejs.org/docs/pages/Reflector.html) — examined but not additionally instanced to avoid duplicate render passes.
- [Three.js GroundedSkybox](https://threejs.org/docs/pages/GroundedSkybox.html) — useful for matching photographed ground to HDRI, but this app continues to use its existing calibrated 3D terrain blending rather than installing a competing horizon material.
- [Poly Haven](https://polyhaven.com/) — earlier self-hosted CC0 Kloppenheim 03 HDRI and Grass Ground PBR source retained. No private files or added third-party tracking.

## Performance, privacy and validation

Water reflections are a separate GPU render pass; keep lake target at 128px, refrain from building one per stream segment. Grass/rocks are instanced; material and texture resources remain shared. Local `Water` addon source is included with upstream MIT notice already under `vendor/THREE-LICENSE.txt`.

Run `python3 -m unittest discover -s tests -v` then Chrome desktop and phone, verify scene flags for water, grass, shrubs and reflection; verify real time progression with `window.VstopiaWaterDebug()`, selected branch labels still track actual bark vertices after camera orbit/zoom, and both team members remain readable. The reference screenshots contain ONLY the public project UI. No private repository metadata, tokens, screenshots or other machine data are copied into the site.

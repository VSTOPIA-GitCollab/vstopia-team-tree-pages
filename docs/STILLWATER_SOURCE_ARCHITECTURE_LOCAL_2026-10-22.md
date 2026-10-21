# VSTOPIA × Stillwater — source architecture, exact preservation, local integration

**Status: LOCAL PROTOTYPE, not pushed, not merged, not published.** The user's superior source is preserved unchanged in `/Users/ostino/Downloads/lake-scene 2`. No modifications to source Downloads, no deploy to public GitHub Pages. Current local worktree at `/Users/ostino/Documents/Code/VSTOPIA-GitCollab/vstopia-team-tree-stillwater-integration`, branch `feat/stillwater-base-integration-local-20261021` forked from `VSTOPIA-GitCollab/vstopia-team-tree-pages` `origin/main` as of 2026-10-21.

## Immediate local use

From authorized main Mac, local static site was started as:

```sh
cd /Users/ostino/Documents/Code/VSTOPIA-GitCollab/vstopia-team-tree-stillwater-integration
python3 -m http.server 38995 --bind 127.0.0.1
```

- **Integrated VSTOPIA with our translucent liquid-glass panels + GitHub snapshot:** http://127.0.0.1:38995/
- **Original full-scene 3D view, controls and original typefaces:** http://127.0.0.1:38995/stillwater/
- **Original unmodified user folder:** `/Users/ostino/Downloads/lake-scene 2`; run `python3 serve.py` in that folder (auto-selects 8000–8010).

`localhost` is local to the Mac that runs the server, not other devices. Source scripts and textures are all self-hosted; no runtime CDN, account, remote files or tokens.

## What makes the supplied scene better

The original user-supplied project is **Stillwater — Ancient Grove v1.1**, a standalone Three.js **r180** (`public/vendor/three.module.js` and core) application with no bundler/npm install. It is architecturally *different* from our previous `@dgreenheck/ez-tree` and r167 scene; do not attempt to rebuild it by combining the old geometries.

- **`stillwater/scene.js`** is the complete original pipeline: world noise, terrain displacement, precise tree placement, PBR materials, multiple forests, 500 physically deformed shoreline stones, up to **180,000 blades of grass**, reeds, 3 distant mountain layers, a lake reflection renderer, animated physical clouds, particles, exposure and interactions. Terrain is `PlaneGeometry(340,340,300,300)` with continuous height function, shoreline ellipse disturbed by value-noise and FBM; lake reflection is **Water.js** with 1024² target, 900×900 plane at y=.015, fetched *local* normals. Shoreline topography extends into the far-distance ground ring (145–2400 m). The water is not an HDR photograph and still has limitations, but the mirrored view genuinely includes 3D trees/mountains.
- **`stillwater/nature.js`** generates the ancient sculptural tree with tapered, parallel-transport wood frames, 65 samples on an S-shaped central trunk, 11 large roots, 7 fused spiral-grain ribs, 8 articulated asymmetrical branches, fine twigs and **leaves attached to actual twig locations**. It also generates three layered distant procedural ridges, seeded noise and aerial perspective. Keep the main tree untouched for this stage; replacing it with our old EZ-Tree would regress the visual quality.
- **Sky and atmosphere:** the user's superior sky is a Three.js **physical `Sky` shader** (`turbidity=5`, `rayleigh=1.3`, `mieCoefficient=.006`, directional `.83`) — **not a photographic .hdr file**. Its clone feeds `PMREMGenerator` and `scene.environment` for consistent image-based lighting. Real sun is a DirectionalLight originally intensity 3.0, shadow map 2048² with tuned bias, and 1.8 HemisphereLight. Original tone map ACES Filmic and sRGB output. The **Light** control updates directional sun vector, turbidity, tone mapping exposure and water sun color; on change it regenerates PMREM for consistent environment reflections.
- **Winds:** one shared `uTime` / `uWind` pair in ShaderMaterial hooks (`MeshStandardMaterial.onBeforeCompile` and matching custom depth materials), with distinct `branch`, `leaf` and `grass` formulas. Bark bends spatially with height; leaves flap according to their instanced anchor and grass curves respond to gust phase. Both actual shadow depth and colored leaf meshes sway. This is why moving only their transform or substituting a different tree would look worse.
- **Native controls:** official Three.js `OrbitControls` with damping `.055`, camera FOV 46°, min/max distances 7/135m, polar bounds `.16..π*.487`, orbit `.45`, pan `.65`, zoom `.75`, autoRotate speed `.35`. Drag orbits; right-drag, Shift+left-drag or two-finger gesture pans; wheel/pinch zooms. `F` returns to home view, `H` toggles scene UI, `Space` pause, auto-orbit and fullscreen built in.
- **Native UI:** source `style.css` uses **Arial/Helvetica** for practical controls and **Georgia** for large editorial caption. We preserve this in the standalone `/stillwater/` version; integrated VSTOPIA follows its previously requested restrained **Apple/SF-style sans** to avoid the old Times-like titles. This is an intentional distinction.
- **Quality presets:** Balanced 1× DPR / fewer original grasses, High up to 1.6× DPR and 2048 shadows, Ultra up to 2× DPR and 4096 shadows. The source keeps water reflection at 1024² and compiles original shaders before removing loading UI. User requested favor quality; integration defaults to original **High** as a practical starting point, with native Quality slider still offering Ultra.

## Exact new integration model

Do **not** add two competing versions of Three.js into the same global JavaScript module context: our old code runs **r167**, the source uses **r180**. The VSTOPIA parent loads the user's source with a **same-origin iframe** (`./stillwater/index.html?embedded=1`) spanning the 3D stage behind the existing GitHub interface. This preserves the user's renderer, camera, water, natural trees and controls. VSTOPIA glass CSS and the original rdev optical glass island remain; the extra @specy header WebGL canvas was disabled **in this local branch only** to avoid running three WebGL renderers concurrently (headless browser blocked during that test). The public website remains unchanged.

Minimal source changes:

1. `stillwater/scene.js`: imports `vstopia-bridge.js`; stores reference to original `heroTree=plantTree(...)`; initializes `mountVstopiaTreeBridge` in `embedded` mode; sets source Wind slider to **2 / 2** and Light slider to **1 / 1**, triggers `input` and `change` so PMREM matches lighting; starts source Atmosphere panel **collapsed** (one click opens original sliders); invokes bridge tick in original `requestAnimationFrame` render loop. Everything else in scene rendering is preserved.
2. `stillwater/vstopia-ecology.js`: physically adds **28 small branch-model bushes**, **15,500 short-grass plants** along natural banks, and **30 individually moving birds** in three flocks. Original 180,000 blades/forest remain unchanged; these are add-ons, not replacements. No river or waterfall added.
3. `stillwater/vstopia-bridge.js`: samples actual vertices from the new ancient tree's bark BufferGeometry; chooses 12 visible bark points, projects them each frame through the **original** camera, and numerically applies the **same analytic bark sway** as the original branch shader. Sends vertex IDs and coordinates via same-origin `postMessage` to parent; all 12 retain genuine bark attachment during wind/orbit. Selected GitHub project and visibility filters travel back by same-origin messages. Pure public names and coordinates only — no private GitHub content.
4. `stillwater-integration.js`, `.css`: preserve VSTOPIA public aggregate `snapshot.json`, members, PR reviews, project list, supervisor, five key metrics and transparent glass cards. `SHOW 12 BRANCHES` reveals all 12 labels if wanted; default shows only the selected label to prioritize the reference image's uninterrupted tree and water. Clicking a label or a repository in the sidebar updates selection. CSS uses original source's `Arial` for the actual atmosphere slider panel, restrained Apple sans for site UI.
5. **Original source assets retained:** `stillwater/assets/ground.jpg`, `water-normals.jpg`; `stillwater/vendor/three.module.js`, `three.core.js`, `Sky.js`, `Water.js`, `OrbitControls.js`, Three MIT license. `stillwater/nature.js` and original `stillwater/style.css` are unchanged. See copied `stillwater/SOURCE_README.md` and `stillwater/ATTRIBUTION.md` for complete originals/license.

## QA evidence and gaps

- Verified directly in Chrome after several seconds of complete loading: original standalone scene renders unchanged (photo-like dark lake reflection); integrated iframe loaded correctly, **12 bark vertices**, up to 12 user-selectable project names, approximately 0.006 CSS-pixel difference between projected bark anchors and labels, **28 bushes**, **15,500 short grasses**, **30 birds**, Wind=2, Light=1, native Atmosphere panel collapsed but interactive, **13 GitHub projects**, 973 commit aggregation and two member cards, no missing iframe, and sidebar selection correctly highlights the corresponding tree label. Browser screenshots taken from actual Chrome frames.
- Verified mobile at **430×930**, no horizontal page overflow, bark labels projected correctly, scene, lake, tree and metrics displayed; inspector moves below scene.
- **Screenshots are evidence, not final approval:** [desktop](screenshots/stillwater-integrated-desktop-local-2026-10-22.jpg) and [mobile](screenshots/stillwater-integrated-mobile-local-2026-10-22.jpg).
- Browser navigation gesture verification at full input-device level and exact FPS profiling are not yet completed; check in normal Chrome with hardware GPU. A previous headless test blocked when the original high-detail scene, rdev glass AND a third @specy header WebGL renderer ran together; removing only the third restored functionality.
- Legacy 48-site tests hardcode old EZ-Tree renderer and must be migrated to source/bridge contracts **before approval or PR**. Preserve the test history; don't simply delete the old tests. Scoped integration contract tests are under `tests/test_stillwater_integration.py`.
- Source folder unchanged. **NO Git push, PR, merge or GitHub Pages deploy**. User explicitly wants local test and approval first.

## When approved

Only after user signs off on the visual and controls: reconcile branch to freshest `origin/main`, carefully update regression/CI checks for the r180 iframe source (including secret scan on `stillwater/**` JS and authored files), verify licenses/attributions, create review PR, merge and watch Pages deploy. Do not alter VSTOPIA-Council personal repo or other agents' worktrees. Detailed source documentation takes precedence over generic assumptions from the earlier forest prototype.

## October 22: restore VSTOPIA photographic sky (local-only follow-up)

Per user's preference, we added the **previous VSTOPIA Kloppenheim photographic HDRI** as the default **only in embedded VSTOPIA mode** while retaining the original Stillwater physical `Sky` as standalone default. Under native *The atmosphere → Sky*, the three options are **Original physical sky**, **VSTOPIA panorama HDRI (Kloppenheim)**, and **Mountain clouds HDRI (partly-cloudy-2k)**. Both HDR files are **local** assets and RGBELoader is bundled locally; there are no live network dependencies beyond localhost. The two sky sources are from Poly Haven, available under CC0 terms (see the existing project's asset attribution documents).

The old `Sky` dome and synthetic cloud plane are hidden in the photographic modes to avoid blocking the panorama. The **same equirectangular HDR texture** is bound to `scene.background` and `scene.environment` (IBL) and visible to the scene's original planar `Water.js` reflection. HDRI exposure and indirect-light intensity respond to the existing Light slider; Wind stays 2/2 at embedded startup. Returning to the physical sky restores the original Sky, clouds and PMREM, keeping the standalone source scene functional. On load failure the source sky is restored automatically.

Browser QA: 13 GitHub snapshot projects, 12 actual bark anchors, three selectable sky presets, wind 2 and light 1 confirmed from the real Chrome iframe. All three modes loaded and switched repeatedly without errors. Actual screenshot: [VSTOPIA sky test](screenshots/stillwater-restored-vstopia-hdri-local-2026-10-22.jpg). **Still no push, merge or production deploy.**

# VSTOPIA Stillwater — original Lake Scene 2 mountains, much larger terrain and precisely clipped lake

**22 October 2026. Status: local verified prototype only.** The public GitHub Pages site was NOT deployed or updated. Source original remains unchanged in `/Users/ostino/Downloads/lake-scene 2/public`. This document supersedes only the mountain material and square-water descriptions in `STILLWATER_ROCKY_MOUNTAINS_CONTINUOUS_MEADOW_2026-10-22.md`.

## Where to run

- Worktree: `/Users/ostino/Documents/Code/VSTOPIA-GitCollab/vstopia-team-tree-rock-terrain-fix`
- Branch: `feat/rocky-mountains-continuous-terrain-20261022`
- Integrated site: **http://127.0.0.1:39031/** on main Mac. If server stops: `python3 -m http.server 39031 --bind 127.0.0.1` from the worktree root.
- Original user source: `/Users/ostino/Downloads/lake-scene 2/public/nature.js` and `scene.js` (READ ONLY; not changed).

## Why the old view was wrong

The user's source has **exactly three** mountain surfaces using `PlaneGeometry(2800,570,400,100)` with `rotateX(-Math.PI/2)`, each positioned with `z=z0-940-layer*360`, domain-warped FBM, a ridged multifractal, and `y=-6+envelope*(47+n*125)*broad`. Our prior local branch had kept the geometry but substantially altered its albedo, triplanar shading and atmospheric treatment. As a result the geology and colors no longer looked like the original `lake-scene 2` reference; screenshots also revealed a strong color wash from the fog/haze at mountain distance.

**Restoration:** `stillwater/nature.js` now uses the original mountain generator, *the same numerical geometry/position/broad/ridged noise values* and original colors. The vertex colors are multiplied by `.88` (12% darker) and the per-fragment haze is limited to 27% with a dark gray-blue target rather than washing out the mountains. A final isolated mountain-only fragment brightness compensation of `.50` counteracts the current photographic sky lighting. The obsolete CC0 triplanar rock texture files remain in history for research but are **not loaded by this restored mountain renderer**; we do not delete historical art assets.

## Lake shape: remove second water outside the land

The source water was **one square `PlaneGeometry(900,900)` at `y=.015`**. Its mirror extended far outside the terrain depression, which is why water visibly continued behind the shore. It has been replaced by a **wet-footprint geometry**, created by `makeLakeOnlySurface()` in `stillwater/scene.js`:

- Sample the **same original** `height(x,z)` function used to generate the meadow, at approximately 0.58-meter grid spacing around the lake.
- Split every grid cell into triangles; clip each triangle where terrain height is at/below the water plane, with a 0.045-meter inland exclusion margin.
- Interpolate border vertices at the actual shoreline and pass the resulting unindexed surface to the **original Three.js `Water.js` shader**. Reflections, normals, ripple motion, HDRI and water controls remain unchanged.
- Browser verifies a single clipped lake mesh of **18,962 actual water triangles** instead of a 900-meter square. No river or waterfall is introduced. This eliminates outside-water geometry, rather than just hiding unwanted water behind another plane.

## Terrain size and consistent ground texture

- The original nearby ground was `PlaneGeometry(340,340,300,300)`, with `ground.jpg` repeating **55×**. The previously rebuilt transition ring ended at a 2,400-meter radius.
- Extended the far ring to **4,800 meters** using `RingGeometry(144,4800,384,210)` and radial vertex redistribution, preserving `distantMeadowHeight` to connect the meadow into undulating far slopes and keep the mountain feet grounded.
- Corrected a subtle prior double-repeat texture bug: the far UV previously multiplied by **55** even though `groundTex.repeat=(55,55)` already supplies the same repeat. The far mesh now uses **exactly the same** UV scale as the original 340-meter plane: `((x+170)/340, (170-z)/340)`. Near and distant ground therefore sample the same photo texture continuously without a 3,025× fine-scale tiling effect.
- No long-distance instanced grass reintroduced. That experiment previously produced subpixel shimmering. Original near grass, 15,500 additional short grass tufts, 28 bushes and 30 birds remain untouched.

## Browser evidence and test results

The source mountains were explicitly toggled visible/hidden in a **temporary debug build** (then the diagnostic hook was removed). Mountain silhouettes disappeared when those objects were hidden; therefore the ridges are **actual Three.js scene meshes, not baked into HDRI**. Restored final version checked from frontal camera, after actual mouse orbit and at 430-pixel mobile. No runtime JS exception or GPU shader compiler error observed. Real page loaded 13 public GitHub projects; all 12 names remained anchored/visible on desktop, 10 were within the useful mobile field of view; user sky `alpine-partly-cloudy-2k` kept; waterfall and river remained removed; full scene, light, wind and glass not altered. **68 Python regressions passed.**

- [Final desktop](screenshots/stillwater-lake-scene2-geometry-front-2026-10-22.jpg)
- [Final orbit view](screenshots/stillwater-lake-scene2-geometry-orbit-2026-10-22.jpg)
- [Final mobile](screenshots/stillwater-lake-scene2-geometry-mobile-2026-10-22.jpg)

## Workflow rule

Keep this a **local-only commit** until the owner accepts it by opening localhost. Do not deploy public GitHub Pages, update `main`, push changes or affect the untouched Downloads source. After approval, reconcile with the latest `origin/main` and other agents' worktrees before opening a review PR; GitHub privacy guard and current snapshot contract must still pass.

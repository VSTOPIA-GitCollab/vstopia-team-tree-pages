# Stillwater surface depth — local material review

22 October 2026. Extends clean commit `c3fe1bf` on `feat/organic-grass-and-stochastic-tex-20261022` in the owner-specified organic-vegetation checkout. Local implementation and browser QA; not pushed, merged or deployed.

Preview: http://127.0.0.1:39231/ (existing server in this checkout). Standalone camera/close-up review: http://127.0.0.1:39231/stillwater/ .

## Causes and corrections

- Bark previously reused its sRGB colour texture as a bump map; leaves had only an albedo texture. New `stillwater/surface-detail.js` deterministically generates separate albedo, tangent normal and packed cavity AO/roughness textures. Only albedo uses sRGB. Maps have mipmaps and repeat seamlessly for bark; mobile bark resolution is halved. These are procedural material approximations, not scanned botanical assets.
- Main-tree displacement is baked into existing vertices before the bridge chooses anchors. Amplitude is limited by branch radius, avoiding swollen twigs. The original wind, reflected geometry, depth shadow geometry and anchor vertex IDs therefore stay coherent. No parallax trick or separate undisplaced shadow mesh. Existing wood-radius attributes enable this without adding triangles.
- Leaf vein normals and roughness are supplemented by per-instance approximate canopy ambient visibility. It multiplies indirect diffuse illumination only; direct sunlight still uses animated shadow maps. Backlighting now follows the actual adjustable sun direction in view space. Leaf instances and curved geometry are retained.
- Sun shadow coverage is focused from 110m to 64m around the hero tree; resolution budgets are unchanged. Bias is reduced. Hemisphere fill is reduced from 1.8 to .72 to recover directional contrast.
- Global exponential fog density .0045 erased roughly 99.4% of contrast at 500m. It is now .00042; the one shared meadow shader uses a gentle, capped aerial-perspective curve. No constant final-colour green overlay. Near/far mesh continuity, radial organic vegetation and the stochastic turf sampling remain intact.
- Mountains again use the already-vendored CC0 Aerial Rocks 02 colour, normal and roughness maps, projected on three axes. Two colour scales and coordinate warping soften repetition. Slope-dependent vegetation, strata and small eroded gullies add variation while retaining the three original ridge footprints and main height envelope. The flat blue tint and final .50 lighting multiplier are removed. Normals are combined in world space and transformed to view space for lighting.
- Root HTML, integration and scene URLs carry the existing release version plus `-surface-depth-v1`. Nature and the new material module have explicit version queries. No UI/data/snapshot changes.

## Verified

- Actual connected Chrome: standalone wide and close-up views; integrated cloudy-sky view; no console/shader errors. Original pan/zoom and native controls remain available.
- [Integrated desktop screenshot](screenshots/surface-depth-desktop-2026-10-22.jpg).
- 430×930 viewport emulation: mobile rendering path loads, 20 bark anchors, 30 birds, width/scrollWidth both 430; no shader errors. Browser capture at that override produced a scaled compositor image, so it is not submitted as visual mobile proof. Viewport reset afterwards. Physical iOS performance is not verified.
- `python3 -m unittest discover -s tests`: **112 PASS**. Two obsolete flat-mountain assertions were updated to check the scan material and retained macro geometry, rather than retaining the explicitly superseded tint.
- `node scripts/check_surface_detail.mjs`: **PASS**, checks height-field wrap continuity, non-flat unit normals/colour spaces at both texture resolutions, finite displaced geometry, bounded displacement, canopy occlusion range and unchanged vertex/index ordering. 220,022 bark vertices; 203,666 measurably displaced; max displacement 0.03669m; 67,032 hero leaf instances.
- `python3 scripts/validate_public_snapshot.py snapshot.json`: **PASS**; snapshot untouched.
- JavaScript syntax checks pass; no new CDN, runtime dependency, renderer or downloaded asset.

## Limits and next review

The mountains remain procedural heightfields with photographed surface detail, not erosion-simulated or photogrammetric mountain meshes. Canopy AO is an approximation of local crown depth, not ray-traced GI. Review localhost before any public release. Keep existing terrain seam/scatter tests and public-data validation; do not reset another checkout or alter the Downloads source.

Sources consulted: [Three.js MeshStandardMaterial](https://threejs.org/docs/pages/MeshStandardMaterial.html), [Material shader hooks](https://threejs.org/docs/pages/Material.html), [shadow maps](https://threejs.org/manual/pages/shadows.html). Existing rock asset provenance: [Poly Haven Aerial Rocks 02](https://polyhaven.com/a/aerial_rocks_02), CC0, already present in the repository.

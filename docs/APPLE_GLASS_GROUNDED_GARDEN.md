# Apple Liquid Glass, planted 3D tree and shrub garden — October 21, 2026

## Status and intent

The requested public VSTOPIA Team Tree revision replaces the redundant LIST view with the already-present, searchable project sidebar. It preserves the public-only, preapproved GitHub aggregate data and 12 explicitly fictional DEMO branches. No private repository contents or credentials are embedded.

## Real liquid-glass-react and Apple typography

The reference is **[rdev/liquid-glass-react](https://github.com/rdev/liquid-glass-react)** (MIT). We use the actual published `liquid-glass-react@1.1.1`, together with `react@19.2.0` and `react-dom@19.2.0`, inside a small isolated React island. The rest of the application stays vanilla JS + Three.js. The npm source and lock are kept in `glass-react-source/`; `npm run build` outputs the self-hosted `vendor/vstopia-liquid-glass-island.mjs`. Production GitHub Pages does not fetch a CDN or require npm in the browser. Original license notices live under `vendor/legal/`. No font binaries are bundled.

`apple-glass.css` changes headings, labels and metrics from Georgia/Times/condensed mono to a standard `-apple-system` / SF Pro / Helvetica Neue / Arial stack. The actual glass components apply SVG optical displacement, chromatic edge effects, blur/saturation and elasticity on prominent controls; existing functional DOM and event listeners stay outside the React island. Reduced-motion users receive simpler CSS glass; Safari/Firefox may not show the full optical displacement, per upstream compatibility notes.

## Ground contact and environment

The physically modeled terrain was already 12 km across, but its opacity **faded out after only 390 world units**, making most of the visible foreground HDRI photographic ground and giving the illusion of a floating tree. Now the mesh extends **16 km × 16 km with 320×320 subdivisions** and blends from **520 to 3900 world units**, preserving the existing PBR diffuse/normal/roughness maps, four-tap stochastic anti-tiling, HDRI colors and spatial linear-sRGB calibration. Distant relief is attenuated to avoid artificial far-off hills.

The lowest world-space point of the EZ-Tree geometry is measured with `THREE.Box3`, then the complete tree is shifted vertically to physically touch the center of the terrain. Directional sunlight, cast and contact shadow remain enabled. The animation slider and instructional tooltip were moved to the side/top to make the base visible.

## Procedural 3D shrubs

`shrub-garden.js` creates **12 shrubs**, with their branch geometry cloned and shared from the original EZ-Tree oak. Each shrub uses a downward raycast onto the **world-transformed terrain mesh** for an exact contact height, with flattened branch shape and stable deterministic rotation. A single instanced foliage mesh draws **3120 tiny faceted leaf lobes** clustered irregularly; this replaced the rejected smooth green test spheres. There are no network requests for third-party 3D models or unknown content licenses. Shrubs are stationary relative to the terrain.

## QA and re-run

`python3 -m unittest discover -s tests -v` validates scene extent, fade range, actual React bundle and MIT license files, remaining sidebar, native system fonts, raycast grounding, count of shrubs and instanced leaves, and prior GitHub privacy checks. Browser QA also checks actual DOM runtime flags `data-tree-base-aligned=true`, `data-shrubs=12`, `data-shrub-canopy-instances=3120`, `data-liquid-glass=react-original` and real Three.js mode. Check mouse orbit/zoom, project selection, speed slider, public snapshot and Safari/reduced-motion fallback after deployment.

The previously published `docs/RIGHT_LIST_HDRI_COLOR_MATCH.md` remains a historical record of the now-removed LIST UI; this document supersedes that UI decision while retaining its color-calibration method.

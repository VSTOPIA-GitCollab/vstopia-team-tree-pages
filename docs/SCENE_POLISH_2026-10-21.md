# VSTOPIA Team Tree — Wide Council Garden visual pass (2026-10-21)

## Delivered changes

- **Composition**: Right-hand GitHub pulse becomes a bottom, horizontal liquid-glass panel. Five verified aggregate metrics, two collaborators with commits/pushes/merge/review/issue counts, friendly supervisor and demo node detail remain present. Desktop stage increases from the previous three-column arrangement to a wide two-column scene. Mobile stacks sections instead of shrinking the workbench.
- **Sunlight and leaves**: directional sun with soft shadows; HDRI remains environmental lighting. Corrected EZ-Tree `leaves` material detection (the old `leaf` regex never matched `leaves`), double-sided Phong foliage, restrained emissive fill and less self-shadowing. This restores visibly lit green leaves instead of dark silhouettes.
- **Ground blending**: physically based material still uses Poly Haven grass maps (color, normal, roughness). `ground-blend.js` adds world-distance alpha falloff into the *same HDRI*; the solid tree contact area transitions progressively between 190 and ~1150 world units to the panorama. This does not replace the full 3D geometry.
- **Anti-tiling**: four random decorrelated PBR albedo samples are blended smoothly per macro cell using stochastic hash offsets. Low-frequency world-space color noise breaks repeated patterns further. This is actual fragment-shader stochastic texture bombing, not blur or a CSS trick; normal/roughness maps remain part of the PBR material.
- **Motion controller**: snail and rabbit original VSTOPIA icons moved to the ends of a compact, accessible *animation speed* range slider (0–2×, default .75×). EZ-Tree's real wind-time uniform is advanced by the slider; 0 pauses motion while environment, terrain and HDRI never rotate automatically. `prefers-reduced-motion` is respected.
- **Safety**: existing public snapshot read-only aggregate data remains intact. The 12 node labels remain explicitly DEMO, and no hidden private repository details enter the public bundle.

## Mascot provenance

`VSTOPIA-GitCollab/council-task-tree-recipe` contains a separate local-first Canvas tree, not Marcello's original scene files or source for the mascots. This update uses the user-identified snail/rabbit-as-speed-endpoints behavior, but **cannot claim identical implementation to Marcello's own app** without the original source. The animals are smaller and now functional rather than decorative.

## Validation

- `python3 -m unittest discover -s tests -v`: 11 tests (including updated HDRI + user-controlled wind checks).
- Chrome 1600×1000: bottom layout, wide stage, HDRI and PBR textures, shader fade and anti-tiling, sunshine and actual EZ-Tree `leaves` mesh detected, 12 nodes, slider value propagation, search, list↔tree, and public GitHub snapshot.
- Chrome mobile 430×930: responsive stacked mobile layout, tree visible, speed slider accessible.
- Chrome WebGL disabled: original Canvas fallback retained.
- Published-site screenshot after GitHub Pages deploy to be linked once verified.

Technical background: Three.js PBR MeshStandardMaterial (`onBeforeCompile`) and the upstream EZ-Tree `Tree.update(time)` wind API. Source licenses for EZ-Tree, Three.js, Poly Haven and the sky photo are unchanged in existing repo documentation.

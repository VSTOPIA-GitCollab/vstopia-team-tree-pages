# Floating right-side LIST + multi-point HDRI ↔ meadow color matching

## User-facing interaction

The `☷ LIST` control toggles a **right-side liquid-glass drawer** containing the same searchable, filtered **demonstration-only** branch names. The 3D tree is never replaced and never destroyed when the drawer opens; an X button, the TREE control, another click on LIST, and Escape all close it. The drawer scrolls vertically and adapts to phones. Selecting a branch updates the shared tree/detail/sidebar states without hiding the list.

## Color-correction method

An earlier user screenshot showed a pronounced bright yellow-green CG ground against a darker, brown-green HDRI field. A single random `terrainMaterial.color` adjustment cannot match the entire panorama because the photographic field has varied exposure and vegetation from one horizontal location to another.

To calibrate the scene, `scripts/calibrate_ground.py` takes **six spatially separated pairs of display-sRGB aggregate color medians** (left and right HDRI fields vs corresponding PBR terrain zones). It converts both sets into **linear-sRGB** before calculating a robust per-channel median ratio, clamped to safe limits. A 12% near-camera brightness allowance avoids making the foreground look artificially flat. `assets/calibration/ground-grade.json` contains only color samples and adjustment multipliers, **not the original screenshot** (which showed unrelated private desktop UI and must never be committed).

A follow-up comparison in Chrome at 1600px screen width samples **two left and two right** HDRI/CG pairs from the first calibrated render. These yield independent left/right linear adjustment ratios, blended with 50% strength to avoid overfitting one camera angle. The fragment shader `ground-blend.js` blends the regional multipliers smoothly across screen X, using the uniform `uGroundWidth`, after applying the global per-channel calibration. This is layered over the existing four-sample stochastic anti-tiling, world-space macro variation, PBR normal/roughness maps and alpha fade to the **same equirectangular HDRI**. Image color samples were checked with Chrome screenshots, not guessed from raw diffuse-map values.

The values are authored once from screenshots and loaded from local static JSON; GitHub Pages does not access personal files or perform screenshot capture on visitors. On other camera angles the method is an approximate art-direction grade, not physically exact camera projection. For strict match-move VFX, use a matching HDRI/backplate set and shadow-catcher camera mapping instead.

Sources: [Three.js color management](https://threejs.org/manual/pages/color-management.html), [Poly Haven HDRI/backplate recommendations](https://docs.polyhaven.com/en/technical-standards/hdris), [Three.js PBR principles](https://discoverthreejs.com/book/first-steps/physically-based-rendering/).

## Test and privacy

- `python3 scripts/calibrate_ground.py` recalculates the compact public-safe numeric sample file. It has no screenshot-file dependencies.
- `python3 -m unittest discover -s tests -v` checks UI toggle wiring, spatial shader uniforms, calibration safety, WebGL foliage/sun continuity, and existing privacy/terrain protections.
- Chrome on real page: opening drawer preserves the WebGL scene; close with button, LIST toggle, TREE and Escape; filter/search, selecting nodes, 3D orbit/zoom and existing team aggregates should continue working.
- The original private screenshot is **not** part of public source. Public screenshots show only the sanitized VSTOPIA Team Tree app.

# Enchanted Council Forest — GitHub Pages visual renderer

Status: newly created procedural Canvas renderer and original SVG mascots. **This is not a byte-for-byte port of Marcello's private Council**, because original mascot and tree scene asset files were not present in the accessible `VSTOPIA-GitCollab/council-task-tree-recipe` (which supplies only a simplified canvas 2D/3D projection). Do not claim identical source provenance. Match original only after original author shares authorized source or screenshots.

## Files

- `forest-renderer.js` — procedural shaded trunk/root/bark, branch geometry, layered foliage, drifting fireflies, real selectable glow-orb nodes and canvas collision hit targets. Data-agnostic: never reads private GitHub metadata.
- `assets/council-rabbit.svg`, `assets/council-turtle.svg` — original, self-contained vector mascot illustrations.
- `style.css` — neon forest atmosphere and animated foreground characters, responsive sizes, reduced motion support.
- `app.js` — integrates the renderer with existing search, filters, 3D orbit, zoom, keyboard, auto-tour and list mode; dual-canvas compositing prevents showing incomplete draw frames.

All links, privacy boundaries and `snapshot.json` schema remain unchanged. The tree continues showing **synthetic demo node names**; aggregate team counts in the inspector come from the authorized public snapshot. No tokens, private repository titles, private URLs or repo contents are introduced.

## Smoke test

Serve locally: `python3 -m http.server 38975 --bind 127.0.0.1` from this directory. Verify the tree actually appears in Chrome, click branches, drag to rotate, wheel to zoom, switch to List and back, use search/filter/reset/auto-tour, and verify reduced-motion mode and phone viewport. Confirm both SVG mascots load and Pages `snapshot.json` continues to render GitHub counts. The original Council renderer with mascots is **not** available from the reference repository.

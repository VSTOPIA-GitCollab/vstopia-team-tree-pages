# Waterfall, three bird flocks and ONE continuous river/lake — 21 October 2026

## What was implemented

- A giant irregular reflective lake (world-space outline about 430 × 336 units) joined to the ~7.8 km river in **one actual Three.js `Water.js` mesh** and **one reflection pass**, sharing sky/HDRI reflection, wavelength, shader, and animation phase. This replaces the two independent water surfaces with a visible material mismatch. The river enters the lake within the same geometry; one water clock advances each frame.
- A 40-unit animated waterfall, with a spatially coherent darker teal sheet, vertical turbulent streak shader, diffuse foam over the pool, 340 reusable mist/spray particles, and 78 irregular cliff rocks placed **behind** the sheet. Original bug fixed: sheet's X vertices previously omitted `baseX`, placing water far away from the rocks. Reversed a mistaken rock-wall placement that hid the cascade, and removed overly periodic zebra-like streaks.
- Three looping flocks of 30 small birds total, with batched wingbeat animation and animated orbits high above the 3D forest, adapted as an original r167 implementation inspired by [jtrdev's CodePen flocking example](https://codepen.io/jtrdev/pen/yLVJogz).
- 570 flowers visible after deterministic terrain and underwater exclusion, selected from up to 1150 instances; small wildflower petals and river-edge patches, rendered efficiently in an InstancedMesh.
- The distracting clover mascot and duplicate supervisor explanation have been removed. Compact right inspector styling aims to show the two contributors, selected branch and supervisor without child scrolling.

## Technical compatibility & attribution

The [NewKrok THREE Particles MIT library](https://github.com/NewKrok/three-particles) was studied for emitters, pooling and mist, but its current npm version expects a newer Three.js than the app's pinned r167. **It was not imported**. The waterfall's reusable GPU Points + CanvasTexture emitter is our local implementation, with no incompatible runtime dependency or external network calls. The existing official r167 `Water.js` remains local and self-hosted under Three.js MIT. Other source scripts are local. This is still a public demonstration tree, not a private repository browser.

## Verification

Automated Python regression tests and syntax validation must pass, including single-water-surface assertions. Real Chrome QA must wait for the HDRI, liquid-glass and public GitHub snapshot, then check the front camera, left orbit, right orbit, wheel zoom, and 430px mobile. Confirm 12 true bark vertex anchors (sub-.07 px drift), 3 bird flocks, 340 mist sprites, 570 wildflower instances, waterfall world X, water clock progression, five bottom metrics, two member cards, no clover, and that the normal fall is **visible** in the front screenshot. Check that no private tokens/repository data are published.

## Public screenshots

- [Front](screenshots/connected-lake-waterfall-birds-front-2026-10-21.png)
- [Left orbit](screenshots/connected-lake-waterfall-birds-left-2026-10-21.png)
- [Right orbit](screenshots/connected-lake-waterfall-birds-right-2026-10-21.png)
- [Zoom](screenshots/connected-lake-waterfall-birds-zoom-2026-10-21.png)
- [Mobile](screenshots/connected-lake-waterfall-birds-mobile-2026-10-21.png)

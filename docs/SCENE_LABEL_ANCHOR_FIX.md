# Branch labels — fixed 3D attachments and simplified scene (2026-10-21)

**User request:** remove the redundant footer counts, AUTO TOUR, RESET VIEW, forest rhythm slider/mascots and all visible instructional or informational text from inside the 3D stage. Keep *only project names attached to actual branches*. Use **maximum wind speed 2×** at all times without a speed control. Bottom intelligence panels gain more vertical space; public GitHub aggregates remain there and in the sidebar.

## Root cause verified in source

Earlier labels were drawn from an invented list of 12 spherical coordinates unrelated to the generated tree geometry. Moreover the renderer clamped the labels to the viewport edges, detaching their on-screen position from the 3D points when orbiting/zooming. EZ-Tree moves **leaf vertices in its vertex shader** via `uTime` but keeps the bark mesh geometry static. Labels must be attached to actual bark points, not animated as though they were foliage.

## Implementation

`ez-tree-scene.js` now extracts real mesh vertices from `tree.branchesMesh.geometry.attributes.position`. At the initial camera view it chooses 12 visible bark-vertex locations distributed across the canopy, enforcing spacing to reduce label collisions. Each project gets an `Object3D` child attached to `tree.branchesMesh` at the exact vertex coordinate, and its clickable text-only DOM label is projected with `anchor.getWorldPosition(...).project(camera)` after updating both scene/camera world matrices. No fabricated world positions, CSS drift, interpolated spring motion, edge-clamp offsets, or decorative orb is used. Branch endpoints remain stable under wind while leaf geometry sways around them.

### Verification

1. Check `data-branch-anchors=12` and `data-anchor-type=actual-bark-vertex-object3d` in Chrome.
2. `window.VstopiaEzTree.getAnchorDiagnostics()` returns the screen projection and CSS coordinates for every label. After orbiting and zooming, every visible marker should track its projected bark vertex with a mismatch of under **0.06 CSS pixels**. Tests should exercise multiple viewport sizes and rotations.
3. `data-wind-speed=2.00` and advancing `data-wind-phase` indicate maximum wind animation; no HTML speed control exists.
4. No footer or stage instruction text remains. The inspector's approved aggregate GitHub statistics remain unchanged. WebGL fallback still uses the illustrated Canvas forest, which will be visual-only when unsupported.

The app's data is still explicitly sanitized public aggregates and demo branch names. No private repository contents were added.

**Observed real Chrome QA:** 12 unique bark vertices, all markers visible at desktop initial view, 10 visible at 430px mobile view; largest observed projection error 0.0061 CSS px after orbit/zoom (rotated positions update with camera and wind phase continues to increase), and marker click updates the selected branch. Desktop and mobile screenshots were rendered in Chrome via real-time DevTools Protocol, not recreated with generative imagery.

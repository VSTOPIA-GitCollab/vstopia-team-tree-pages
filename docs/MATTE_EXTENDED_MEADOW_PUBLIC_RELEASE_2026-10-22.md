# Extended matte mountain meadow — approved public release

The distant terrestrial terrain is now 9.6 km in radius (previously 4.8 km) with a camera far plane of 16 km, wide enough to remain continuous beyond all three original Stillwater mountain layers. The radius tessellation uses the current full radius rather than the earlier 2,400 m denominator, so no collapsed outer rings or terrain gaps occur.

The land below the mountains uses **MeshLambertMaterial** with the same photographed grass texture and elevation-dependent vertex colors as the meadow, plus a restrained meadow-green tint. Lambert's diffuse reflection has **no specular environment-map reflection**, so mountain-side grass cannot look like a second lake or a reflective surface. Fog is disabled only for this distant material to avoid washing the green into the HDRI's pale blue. The near shore terrain and original irregular Water.js lake retain their existing physically lit and reflected appearance, respectively.

The original three source `lake-scene 2` mountain shapes, positions, color treatment, central tree, breeze animation, bushes, flowers, birds, liquid glass and public-only GitHub metrics are unchanged.

Quality assurance: real Chromium WebGL desktop view and mouse orbit; 430 px mobile viewport without horizontal overflow; lake-only surface, 12 visible branch labels on desktop, 13 public projects and no shader errors. All code regressions must pass before merging. Screenshots:

- [Matte terrain, desktop](screenshots/stillwater-matte-meadow-9km-front-2026-10-22.jpg)
- [Mountain meadow after orbit](screenshots/stillwater-matte-meadow-9km-orbit-2026-10-22.jpg)
- [Responsive mobile](screenshots/stillwater-matte-meadow-9km-mobile-2026-10-22.jpg)

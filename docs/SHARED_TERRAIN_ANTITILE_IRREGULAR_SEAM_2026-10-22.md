# One continuous meadow — irregular joint and genuine texture anti-tiling

**22 October 2026 | public Three.js scene | replacement for temporary far-ground color overlay**

## Why the old solution was visibly wrong

The owner supplied overhead screenshots showing (a) a pale, square patch
around the tree and lake, (b) a visibly different terrain surface beyond
that square, and (c) recognizable repetition across the grass photograph.
Two old meshes were not designed as one terrain:

- A foreground **340×340 m square** `PlaneGeometry` with a PBR material,
  ground photograph and 55× repeating UV.
- An outer **9.6 km ring** with a different material. A late patch mixed
  `outgoingLight` to a constant `sunlitGrass` color using
  `smoothstep(165,640,r)`. This was a **bright overlay**, not true
  photographic anti-tiling and not consistent with the near terrain.
- The earlier XY→XZ RingGeometry correction was correct and is **retained**.
- An edge of the square remained geometrically visible from high orbit
  even when its green was similar to the outer green.

## Researched sources and implementation decision

- [Three.js MeshStandardMaterial](https://threejs.org/docs/pages/MeshStandardMaterial.html):
  PBR should be the same family on both near and far land, with matching
  environment, vertex colors and roughness.
- [Three.js Material.onBeforeCompile](https://threejs.org/docs/pages/Material.html):
  inject *small* enhancements into the existing WebGL shaders; avoid
  reimplementing Water.js, lighting, shadows and fog.
- [NVIDIA GPU Gems 3, Chapter 1, terrain texturing and shading](https://developer.nvidia.com/gpugems/gpugems3/part-i-geometry/chapter-1-generating-complex-procedural-terrains-using-gpu):
  world-space mapping, breaking repetition with rotated/noisy octaves,
  and blending multiple texture projections rather than a single UV repeat.
- [Blender Extensions — Procedural Tiles](https://extensions.blender.org/add-ons/proceduraltiles/):
  the idea of shader-graph mixing/noise to break periodicity and hide
  hard tile boundaries. This browser is **Three.js, not Blender**: no addon
  is installed or called; its techniques are implemented in GLSL.
- [GameDev StackExchange terrain texture blending](https://gamedev.stackexchange.com/questions/197746/how-to-create-get-good-terrain-texturing-for-an-rts-game):
  combine multiple UV scales/octaves to reduce repetition.

## Implementation

**One seam function:** `meadowSeamRadius(theta)` has four independent
low-amplitude harmonics and returns approximately **145–179 meters**,
with a visibly irregular boundary; it is periodic around a full circle.

**Two radial meshes share exactly one outer/inner contour:**

- Near radial mesh: from r=0 to `meadowSeamRadius(theta)`.
  Height interpolates smoothly from the original `height(x,z)` to
  `distantMeadowHeight(x,z)` only beyond r=115 m.
  The lake, original shoreline clipping, tree positions, rocks, bushes
  and original land surface near the lake retain the same positions.
- Far radial mesh: from that *same exact* irregular contour to
  `FAR_MEADOW_RADIUS=9600`, retaining the proven correct
  `RingGeometry.rotateX(-Math.PI/2)` orientation.
- **Important root case:** on the inner radial band `RingGeometry(0,1)`
  yields (0,0) for *every* vertex. Recover the angle from the circumferential
  **vertex index** at t=0 rather than from `atan2(0,0)`. This avoids
  collapsing the far inner border into a giant triangle fan across the lake.
- Both surfaces share the **same `MeshStandardMaterial` instance**, the
  same world-aligned texture UV basis, vertex colors, lighting and fog;
  no alpha-test/fake opacity, no polygon overdraw or hard square border.

**Actual anti-tiling for ground.jpg on BOTH surfaces:**

1. Two decorrelated, UV-rotated samples, with smooth world-space
   domain warping, on **mobile**.
2. A third rotated/scaled sample and second smoothly blended noise mask
   on **desktop**, where GPU budget allows it.
3. World-space low-frequency color modulation is small
   (`diffuseColor.rgb *= 0.94..1.06`) and occurs **before** PBR lighting.
   The old `outgoingLight = mix(..., sunlitGrass, 86%)` bright veil
   is removed entirely. No new textures/downloads or image assets.
4. The procedural color varies continuously across both meshes.
   No identical grid repeats from a single 55x texture sample.

The actual waving grass meshes use vertex colors and native wind, not
`groundTex`; they never had that photographic tiling problem and
remain unchanged. Likewise the rocky shores, 30 birds, sky HDRI,
animated water, iOS clock and published alias metrics are unchanged.

## Verified evidence and acceptance

**Runtime WebGL** in Chrome 155, using the site's vendored Three.js and
exact production scene:

- Desktop 1450px: 20 branch labels, 20 anchors, no shader/GLSL exceptions,
  moving birds and lake. Baseline vs corrected screenshots compared.
- Mobile 430×930 DPR2: `mobile-webgl`, 20 labels/anchors,
  no JavaScript/GLSL exceptions, no horizontal overflow; two-sample path.
- **Actual seam geometry proof**: desktop 449 border vertices compared
  in GPU-side geometry; max near/far vertex position separation
  **1.71e-5 metres**, max height separation **1.91e-6 metres**.
  Inner radius varies **144.906–179.094 m**, not a square/circle.
  **Zero** far-land triangles have any vertex inside r=140m.
- The overhead screenshot demonstrates a continuous irregular land
  surface with **no square patch**; lake water and bank rocks remain intact.
- Python tests: **108/108 PASS**, public snapshot validator PASS.
- WebGL test runs in headless Chrome with software rendering and does
  **not** confirm physical iPhone Safari performance. Earlier real-iOS
  animation complaint remains a separate open issue.

### Visual comparisons

- [Previous square/textured terrain](screenshots/antitile-before-desktop-2026-10-22.jpg)
- [New seamlessly connected desktop meadow](screenshots/antitile-after-desktop-2026-10-22.jpg)
- [New mobile scene](screenshots/antitile-after-mobile-2026-10-22.jpg)
- [Overhead view: no square / lake intact](screenshots/antitile-irregular-overhead-2026-10-22.jpg)
- [Low orbital view](screenshots/antitile-irregular-shallow-2026-10-22.jpg)

## Release and safety

Isolated clone/branch, no edits to other agents' checkout (including the
dirty previous Pages worktree), no changes to private alias mapping, the
private collector or auto-sync secrets. Root/iframe/scene version query
strings are advanced together to `antitile-seam-20261022` to prevent
Safari/Chrome from serving old JS after deploy.

Do not use a constant final-color overlay to conceal terrain seams again.
Future material improvements must demonstrate real texture sample
decorrelation and near/far continuity in WebGL and overhead QA before merging.

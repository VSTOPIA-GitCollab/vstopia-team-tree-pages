# Organic vegetation distribution and stochastic photographic anti-tiling

**22 October 2026 — VSTOPIA GitCollab Living Tree (public Pages renderer)**

## Context and real root cause

After PR #26 fixed the originally square near terrain mesh and introduced a
shared radial land surface, the owner's **08:41 desktop overhead screenshot**
still showed a recognizable central rectangle of thick grass and recurrent
photographic turf patterns. Source investigation confirmed the distinction:

- The terrain mesh **was no longer a plane** and the near/far border was
  watertight. Do not revert `makeMeadowGeometry`.
- The **grass blade positions**, however, were still sampled exclusively from
  `x = range(-60,60), z = range(-54,52)`, creating a separate 120×106m
  rectangular **vegetation footprint**. It remained visible from above.
- The previous anti-tiling mixed a fixed pair or trio of texture orientations
  across the *entire world*. Its static rotations and repeated 55× UV basis
  allowed distinctive photographic features to recur at many locations.

## Sources and technique

- NVIDIA *GPU Gems*, [Texture Bombing](https://developer.nvidia.com/gpugems/gpugems/part-iii-materials/chapter-20-texture-bombing):
  break repeated motifs using random placement, rotation, scaling and multiple
  independent cells/variations.
- Inigo Quilez, [Texture Repetition](https://iquilezles.org/articles/texturerepetition/):
  smoothly blend randomly shifted virtual textures, allowing a compact
  two-sample mode rather than four expensive reads on mobile.
- [Three.js Material.onBeforeCompile](https://threejs.org/docs/pages/Material.html):
  retain the existing PBR material, fog, shadow support and vertex colors
  while replacing only the diffuse texture sampling fragment.
- Blender-style domain-warp and ColorRamp inspiration is translated into
  GLSL. **No Blender addon is installed or executed** in this website.

## Changes in stillwater/scene.js

### 1 — Spatially organic foliage instead of a rectangle

The same 24,000 mobile / 180,000 desktop blades are now positioned from a
radial angle and a gamma-distributed distance, with a smoothly decaying
probability. Two blended distance populations provide a dense near field and
a sparse, gradual outer meadow — no abrupt inner/outer cutoff.

- `grassOuterLimit(angle)` adds multiple nonaligned angular harmonics and
  continuous noise to the distant cutoff (~150–600m, depending on angle).
  This cutoff is naturally sparse because vegetation density already falls
  continuously before the limit.
- `grassMeadowHeight(x,z)` uses **the same near/far height interpolation
  as the terrain surface**. Grass cannot float at the near/far boundary.
- Existing lake-floor/wet-height exclusion and slope filtering remain.
  Blade height reduces gradually at large radii to avoid pixel-scale
  shimmering at mountain distances.
- No new instance buffer budget, meshes, texture assets or network requests.

### 2 — True region-varying texture transformations

The terrain's existing PBR material and its shared near/far world-space
coordinates are preserved. The shader now uses:

- Two **randomly transformed** virtual versions of `ground.jpg`, with
  different offset, scale, quarter-turn rotation and optional mirror.
- A continuous, low-frequency noise-selected region index: when transitioning
  from random region `n` to `n+1`, the outgoing second sample is the
  incoming first sample. There is no square UV cell boundary.
- World-space domain warping curves repeating photographic patterns;
  differentiated scale and offsets reduce identical local motifs.
- On desktop, a second independent region index creates two additional
  randomized reads (**4 texture fetches total**); mobile has **2 reads**.
- Gently increased macro-albedo variation (0.88–1.12) applied **before**
  physically based lighting. No old flat `outgoingLight` color overlay.
- Mobile shader arithmetic deliberately avoids per-fragment `sin/cos`
  by using a polynomial hash and discrete rotations. iOS hardware performance
  still requires real-device QA.

### 3 — Protection and versioning

The original forest, Mystic Tree, mountains, 30 birds, native Water.js,
cloud HDRI, interactive labels, all 20 public aliases, UI and responsive
layout remain unchanged. Both terrain meshes still share one PBR material.

Bump the HTML → integration JS → iframe scene ES-module cache version to
`organic-grass-variation-20261022`; browser reload cannot silently reuse
the old shader. No private collector, GitHub Actions secrets, scheduled
refresh or unpublished repository metadata changed.

## Verification

- **112 Python tests PASS** including new grass scatter and virtual-texture
  shader regression and the previous horizon geometry, iOS and privacy tests.
- `scripts/validate_public_snapshot.py snapshot.json`: PASS.
- Real Chromium WebGL with site's vendored Three.js:
  desktop 1450px and 430×930 mobile emulation both report 20 nodes/20 bark
  anchors, original sky HDRI, no horizontal overflow and no JS/GLSL errors.
- A temporary read-only debug hook (REMOVED before commit) inspected the
  actual `InstancedMesh.instanceMatrix` entries, not theoretical sampling.
  An intermediate mobile run at 24,000 instances found **12,970 blades
  outside the previous rectangle** (~54%), with nonzero long-distance bands;
  final source slightly broadens its sparse outer tail and is not represented
  by that exact number.
- From an overhead orbit, the former straight rectangular grass boundary
  is broken up by gradual density decay and organic radial sampling.
- **Limitations:** Headless Chromium uses software WebGL and FPS samples
  varied significantly with cold initialization; no credible physical Safari
  performance number is claimed. The user's previous real-iOS animation
  problem is **NOT VERIFIED resolved** by this visual terrain change.

### Browser QA screenshots

- [Desktop, final material](screenshots/organic-stochastic-desktop-2026-10-22.jpg)
- [Mobile, final material](screenshots/organic-stochastic-mobile-2026-10-22.jpg)
- [High orbit QA of organic grass sampling](screenshots/organic-stochastic-overhead-initial-2026-10-22.jpg)

## Acceptance and rollback

Run all regression suites, browser shader compile and mobile DOM/scene checks.
Merge only when there are zero WebGL compile errors and no changes to the
public-only metrics. The previous main commit can be restored by a standard
GitHub revert PR if a real device exhibits a serious performance regression.
Avoid rewriting the legacy branches or resetting other agents' dirty checkout.

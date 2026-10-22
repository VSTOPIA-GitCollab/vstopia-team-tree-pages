# Distant meadow: Blender-style tiling, macro variation and natural color

**22 October 2026. Scope:** The black line was solved in PR #22 by orienting
RingGeometry onto XZ. The subsequent owner screenshot at 07:53 BST revealed
a separate, almost-black, sharply delineated 9.6 km meadow band below the
distant blue mountain range. The band was neither lake water nor shadow of
the living oak.

## Underlying material mismatch

- Foreground meadow uses `MeshStandardMaterial`, a photographic
  `assets/ground.jpg`, repeating UV, vertex colors and environment lighting.
- The far ring instead used `MeshLambertMaterial` with an additional
  multiplicative `color:'#d4e0d0'`, no image-based lighting and `fog:false`.
  Beyond the photographic detail's screen resolution, repeated texture mips
  average to a dark, nearly uniform green, exposing an abrupt material seam.
- The prior XY/XZ orientation bug is ALREADY fixed. Do not reverse its repair.

## Techniques analogous to Blender's shader nodes

The far ring now uses the **same physically lit Standard base material as
the near grass**, with the same world-aligned UV coordinates and existing
photographic texture. A cheap shader-node-style blend is implemented in its
`onBeforeCompile` hook:

1. **Mapping/world position:** world-space XZ drives radial distance and
   wide-scale variation, so the color does not visibly repeat at the UV
   tiling frequency or drift when the camera rotates.
2. **Noise Texture (macro variation):** three nonaligned sine waves at
   long spatial periods mix slight green-gold fluctuations.
3. **ColorRamp/Mix:** `smoothstep(165,640,r)` progressively fades the
   sub-pixel repeated photo surface to a warm sunlit meadow color. There is
   no hard seam; within the inner 165 m of the ring the normal photographed
   appearance is unchanged.
4. **PBR shading parity:** `MeshStandardMaterial` replaces the dark Lambert
   component and makes the ring compatible with the scene's existing
   sun, hemisphere and HDRI environment without making it water-like.
   `roughness:1`, `metalness:0` and modest environment contribution.
5. **Distance-only correction:** no new geometry, mesh, extra textures,
   network assets or high-cost instanced distant grass.

Conceptual references: Blender Guru's anti-tiling workflow
https://www.blenderguru.com/posts/tile-textures ; NVIDIA's world-space
terrain texture projection and low-frequency procedural color
https://developer.nvidia.com/gpugems/gpugems3/part-i-geometry/chapter-1-generating-complex-procedural-terrains-using-gpu .
This site renders in Three.js, **not Blender**; Blender add-ons cannot be
plugged into its browser material directly.

## Protected unchanged areas

The original mountains, central Mystic Tree, Water.js, 30 moving birds,
wind and iOS clock, 20 public alias navigation, liquid glass, layout and
private repo permissions are untouched.

## QA gates

Run all source/geometry tests and public JSON allowlist, then a real WebGL
browser preview at desktop and phone widths. Verify no GLSL shader errors,
that the far ring is visibly lighter, and no seam or new horizon stripe.
Only then publish via isolated task PR and check live HTTPS version.

## Browser comparison and QA evidence

Directly compared the baseline main candidate (after PR #23) with this
same-camera, same-size Chromium WebGL material change, 1450px wide:

- **Before:** a dark, abruptly bounded horizontal meadow strip is visible
  just below the distant blue mountains.
- **After:** the dark band is replaced by a light meadow-green transition;
  the distant mountains, central tree and lake remain unchanged.
- Objective sample in a green-heavy screen ROI (`x=17..71%` of image width,
  `y=44..46%` of image height): mean green channel **110 → 141**;
  fraction of those green pixels with G<95 **45% → 10%**.
  The values are visual regression QA for this exact camera only.
- Chrome 155 mobile emulation 430 × 930, DPR 2: 20 tree labels, 20 bark
  anchors, original cloudy HDR sky, `renderProfile=mobile-webgl`, no
  overflow and no JavaScript runtime exceptions.
- The previous iOS hardware freeze was separately reported by the owner.
  This visual fix is **not** a physical Safari iOS motion verification.

**Screenshots**:
- [Before (black meadow band)](screenshots/meadow-material-baseline-2026-10-22.jpg)
- [After (natural green transition)](screenshots/meadow-material-patched-2026-10-22.jpg)
- [Responsive mobile](screenshots/meadow-material-mobile-2026-10-22.jpg)

**Automated:** 103/103 Python tests, `scripts/validate_public_snapshot.py`
PASS, `git diff --check` PASS. No additional external network textures.
